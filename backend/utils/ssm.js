const { SSMClient, GetParametersCommand } = require("@aws-sdk/client-ssm");

const REGION = process.env.AWS_REGION || "us-east-1";

/**
 * Loads database credentials and JWT secret from AWS Systems Manager Parameter Store.
 * Activates when USE_SSM=true or running in AWS production.
 */
async function loadSSMParameters() {
  if (process.env.USE_SSM !== "true") {
    return;
  }

  const prefix = process.env.SSM_PREFIX || "/greencity/prod";
  console.log(`[SSM] Fetching runtime secrets from AWS SSM Parameter Store prefix: ${prefix}...`);

  try {
    const ssm = new SSMClient({ region: REGION });
    const paramNames = [
      `${prefix}/db_host`,
      `${prefix}/db_user`,
      `${prefix}/db_password`,
      `${prefix}/db_name`,
      `${prefix}/db_port`,
      `${prefix}/jwt_secret`,
      `${prefix}/s3_bucket`
    ];

    const command = new GetParametersCommand({
      Names: paramNames,
      WithDecryption: true
    });

    const response = await ssm.send(command);

    if (response.Parameters && response.Parameters.length > 0) {
      for (const param of response.Parameters) {
        const key = param.Name.split("/").pop();
        switch (key) {
          case "db_host":
            process.env.DB_HOST = param.Value;
            break;
          case "db_user":
            process.env.DB_USER = param.Value;
            break;
          case "db_password":
            process.env.DB_PASSWORD = param.Value;
            break;
          case "db_name":
            process.env.DB_NAME = param.Value;
            break;
          case "db_port":
            process.env.DB_PORT = param.Value;
            break;
          case "jwt_secret":
            process.env.JWT_SECRET = param.Value;
            break;
          case "s3_bucket":
            process.env.S3_BUCKET = param.Value;
            break;
        }
      }
      console.log(`[SSM] Successfully initialized ${response.Parameters.length} parameters from SSM Parameter Store.`);
    }

    if (response.InvalidParameters && response.InvalidParameters.length > 0) {
      console.warn(`[SSM] Missing optional parameters in SSM: ${response.InvalidParameters.join(", ")}`);
    }
  } catch (error) {
    console.warn(`[SSM] Notice: Could not read SSM parameters (${error.message}). Falling back to local configuration.`);
  }
}

module.exports = { loadSSMParameters };
