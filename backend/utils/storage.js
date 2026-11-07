// Image storage for complaint photographs.
// - If S3_BUCKET is set in .env  -> images go to Amazon S3 (used on AWS/EC2).
// - Otherwise                    -> images are saved in backend/uploads (local development).
// The database only stores the object key (for example "complaints/abc123.jpg").

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");

const EXTENSIONS = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp"
};

let s3Client = null;

function useS3() {
  return Boolean(process.env.S3_BUCKET);
}

function getS3Client() {
  if (!s3Client) {
    const { S3Client } = require("@aws-sdk/client-s3");
    // No access keys here: on EC2 the SDK automatically uses the instance IAM role.
    s3Client = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });
  }
  return s3Client;
}

// Checks the real file signature (not only the file name or the browser's claim).
function detectImageType(buffer) {
  if (!buffer || buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buffer.slice(0, 4).toString("ascii") === "RIFF" && buffer.slice(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return null;
}

async function saveImage(file) {
  const type = detectImageType(file.buffer);
  if (!type) {
    const error = new Error("Only real JPG, PNG or WEBP images are allowed");
    error.status = 400;
    throw error;
  }

  const key = `complaints/${crypto.randomUUID()}${EXTENSIONS[type]}`;

  if (useS3()) {
    const { PutObjectCommand } = require("@aws-sdk/client-s3");
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: type
      })
    );
  } else {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    fs.writeFileSync(path.join(UPLOAD_DIR, path.basename(key)), file.buffer);
  }

  return key;
}

async function getImageUrl(key) {
  if (!key) return null;

  if (useS3()) {
    const { GetObjectCommand } = require("@aws-sdk/client-s3");
    const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
    // The bucket stays private. This link works for 1 hour only.
    return getSignedUrl(
      getS3Client(),
      new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }),
      { expiresIn: 3600 }
    );
  }

  const base = process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 5000}`;
  return `${base}/uploads/${path.basename(key)}`;
}

async function deleteImage(key) {
  if (!key) return;

  try {
    if (useS3()) {
      const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
      await getS3Client().send(
        new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key })
      );
    } else {
      fs.unlinkSync(path.join(UPLOAD_DIR, path.basename(key)));
    }
  } catch (error) {
    console.error("Could not delete image:", error.message);
  }
}

module.exports = { saveImage, getImageUrl, deleteImage, detectImageType, UPLOAD_DIR };
