const { CloudWatchClient, PutMetricDataCommand } = require("@aws-sdk/client-cloudwatch");
const {
  CloudWatchLogsClient,
  PutLogEventsCommand,
  CreateLogGroupCommand,
  CreateLogStreamCommand,
  DescribeLogStreamsCommand
} = require("@aws-sdk/client-cloudwatch-logs");

const REGION = process.env.AWS_REGION || "us-east-1";
const LOG_GROUP = process.env.CLOUDWATCH_LOG_GROUP || "/greencity/backend";
const METRIC_NAMESPACE = "GreenCity/Application";

let cwClient = null;
let cwlClient = null;
let logStreamInitialized = false;
let logStreamName = `backend-${new Date().toISOString().slice(0, 10)}`;
let nextSequenceToken = null;

function getCWClient() {
  if (!cwClient && (process.env.AWS_REGION || process.env.ENABLE_CLOUDWATCH === "true")) {
    try {
      cwClient = new CloudWatchClient({ region: REGION });
    } catch (e) {
      console.warn("Could not init CloudWatch client:", e.message);
    }
  }
  return cwClient;
}

function getCWLClient() {
  if (!cwlClient && (process.env.AWS_REGION || process.env.ENABLE_CLOUDWATCH === "true")) {
    try {
      cwlClient = new CloudWatchLogsClient({ region: REGION });
    } catch (e) {
      console.warn("Could not init CloudWatch Logs client:", e.message);
    }
  }
  return cwlClient;
}

/**
 * Emit a CloudWatch custom metric (e.g. ComplaintSubmissions, APIErrors, etc.)
 */
async function recordMetric(metricName, value = 1, unit = "Count", dimensions = []) {
  try {
    const client = getCWClient();
    if (!client || process.env.ENABLE_CLOUDWATCH !== "true") {
      return;
    }

    const command = new PutMetricDataCommand({
      Namespace: METRIC_NAMESPACE,
      MetricData: [
        {
          MetricName: metricName,
          Value: value,
          Unit: unit,
          Dimensions: dimensions,
          Timestamp: new Date()
        }
      ]
    });

    await client.send(command);
  } catch (err) {
    if (process.env.DEBUG_CLOUDWATCH === "true") {
      console.warn(`[CloudWatch Metric Failed] ${metricName}: ${err.message}`);
    }
  }
}

/**
 * Send structured log event to CloudWatch Logs
 */
async function logToCloudWatch(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const logObj = { timestamp, level: level.toUpperCase(), message, ...meta };
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, Object.keys(meta).length ? JSON.stringify(meta) : "");

  try {
    const client = getCWLClient();
    if (!client || process.env.ENABLE_CLOUDWATCH !== "true") {
      return;
    }

    if (!logStreamInitialized) {
      try {
        await client.send(new CreateLogGroupCommand({ logGroupName: LOG_GROUP }));
      } catch (e) {
        // Group may already exist
      }
      try {
        await client.send(new CreateLogStreamCommand({ logGroupName: LOG_GROUP, logStreamName }));
      } catch (e) {
        // Stream may already exist
      }
      logStreamInitialized = true;
    }

    const params = {
      logGroupName: LOG_GROUP,
      logStreamName,
      logEvents: [
        {
          message: JSON.stringify(logObj),
          timestamp: Date.now()
        }
      ]
    };
    if (nextSequenceToken) {
      params.sequenceToken = nextSequenceToken;
    }

    const res = await client.send(new PutLogEventsCommand(params));
    nextSequenceToken = res.nextSequenceToken;
  } catch (err) {
    if (process.env.DEBUG_CLOUDWATCH === "true") {
      console.warn(`[CloudWatch Log Failed]: ${err.message}`);
    }
  }
}

module.exports = {
  recordMetric,
  logToCloudWatch
};
