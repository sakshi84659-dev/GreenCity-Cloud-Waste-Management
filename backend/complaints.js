const express = require("express");
const multer = require("multer");
const db = require("./db");
const { saveImage, getImageUrl, deleteImage } = require("./utils/storage");
const { recordMetric, logToCloudWatch } = require("./utils/cloudwatch");

const router = express.Router();

const CATEGORIES = [
  "Garbage Collection",
  "Overflowing Dustbin",
  "Street Cleaning",
  "Waste Disposal",
  "Other"
];
const STATUSES = ["Pending", "In Progress", "Resolved"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error("Only JPG, PNG or WEBP images are allowed");
      error.status = 400;
      cb(error);
    }
  }
});

// Runs multer and turns upload problems into clean 400 responses.
function handleUpload(req, res, next) {
  upload.single("image")(req, res, (error) => {
    if (!error) return next();
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "Image is too large. Maximum size is 5 MB." });
    }
    return res.status(error.status || 400).json({ message: error.message });
  });
}

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function withImageUrl(row) {
  return { ...row, image_url: await getImageUrl(row.image_key) };
}

// GET /api/complaints?search=&category=&status=
router.get("/", async (req, res) => {
  try {
    const { search = "", category = "", status = "" } = req.query;
    const where = [];
    const params = [];

    if (typeof search === "string" && search.trim()) {
      const term = `%${search.trim()}%`;
      where.push("(name LIKE ? OR location LIKE ? OR description LIKE ? OR CAST(id AS CHAR) LIKE ?)");
      params.push(term, term, term, term);
    }
    if (typeof category === "string" && category) {
      where.push("category = ?");
      params.push(category);
    }
    if (typeof status === "string" && status) {
      if (!STATUSES.includes(status)) {
        return res.status(400).json({ message: "Invalid status filter" });
      }
      where.push("status = ?");
      params.push(status);
    }

    const sql =
      "SELECT * FROM complaints" +
      (where.length ? ` WHERE ${where.join(" AND ")}` : "") +
      " ORDER BY created_at DESC, id DESC";

    const [rows] = await db.query(sql, params);
    res.json(await Promise.all(rows.map(withImageUrl)));
  } catch (error) {
    console.error("LIST COMPLAINTS ERROR:", error.message);
    res.status(500).json({ message: "Could not load complaints" });
  }
});

// GET /api/complaints/stats/summary  (must stay above "/:id")
router.get("/stats/summary", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
         COUNT(*) AS total,
         COALESCE(SUM(status = 'Pending'), 0) AS pending,
         COALESCE(SUM(status = 'In Progress'), 0) AS inProgress,
         COALESCE(SUM(status = 'Resolved'), 0) AS resolved
       FROM complaints`
    );
    const r = rows[0];
    res.json({
      total: Number(r.total),
      pending: Number(r.pending),
      inProgress: Number(r.inProgress),
      resolved: Number(r.resolved)
    });
  } catch (error) {
    console.error("COMPLAINT STATS ERROR:", error.message);
    res.status(500).json({ message: "Could not load complaint statistics" });
  }
});

// GET /api/complaints/:id
router.get("/:id", async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid complaint id" });

    const [rows] = await db.query("SELECT * FROM complaints WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ message: "Complaint not found" });

    res.json(await withImageUrl(rows[0]));
  } catch (error) {
    console.error("GET COMPLAINT ERROR:", error.message);
    res.status(500).json({ message: "Could not load complaint" });
  }
});

// POST /api/complaints  (JSON, or multipart/form-data with an optional "image" file)
router.post("/", handleUpload, async (req, res) => {
  let imageKey = null;

  try {
    const body = req.body || {};
    const name = String(body.name || "").trim();
    const location = String(body.location || "").trim();
    const category = String(body.category || "").trim();
    const description = String(body.description || "").trim();

    if (!name || !location || !category || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (name.length > 100) return res.status(400).json({ message: "Name must be 100 characters or less" });
    if (location.length > 255) return res.status(400).json({ message: "Location must be 255 characters or less" });
    if (description.length > 2000) return res.status(400).json({ message: "Description must be 2000 characters or less" });
    if (!CATEGORIES.includes(category)) return res.status(400).json({ message: "Invalid category" });

    if (req.file) imageKey = await saveImage(req.file);

    const [result] = await db.query(
      "INSERT INTO complaints (name, location, category, description, image_key) VALUES (?, ?, ?, ?, ?)",
      [name, location, category, description, imageKey]
    );

    recordMetric("ComplaintSubmissions", 1);
    logToCloudWatch("info", "New complaint submitted", { id: result.insertId, category, location });

    res.status(201).json({
      message: "Complaint submitted successfully",
      id: result.insertId
    });
  } catch (error) {
    if (imageKey) await deleteImage(imageKey);
    if (error.status === 400) return res.status(400).json({ message: error.message });
    console.error("CREATE COMPLAINT ERROR:", error.message);
    res.status(500).json({ message: "Could not submit complaint" });
  }
});

// PATCH /api/complaints/:id/status
router.patch("/:id/status", async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid complaint id" });

    const { status } = req.body || {};
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const [result] = await db.query("UPDATE complaints SET status = ? WHERE id = ?", [status, id]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "Complaint not found" });

    if (status === "Resolved") {
      recordMetric("ComplaintResolutions", 1);
    }
    logToCloudWatch("info", "Complaint status updated", { id, status });

    res.json({ message: "Complaint status updated successfully" });
  } catch (error) {
    console.error("UPDATE STATUS ERROR:", error.message);
    res.status(500).json({ message: "Could not update status" });
  }
});

// DELETE /api/complaints/:id
router.delete("/:id", async (req, res) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid complaint id" });

    const [rows] = await db.query("SELECT image_key FROM complaints WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ message: "Complaint not found" });

    await db.query("DELETE FROM complaints WHERE id = ?", [id]);
    await deleteImage(rows[0].image_key);

    logToCloudWatch("info", "Complaint deleted", { id });

    res.json({ message: "Complaint deleted successfully" });
  } catch (error) {
    console.error("DELETE COMPLAINT ERROR:", error.message);
    res.status(500).json({ message: "Could not delete complaint" });
  }
});

module.exports = router;
