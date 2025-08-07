const cron = require("cron");
const https = require("https");
const http = require("http");
const { URL } = require("url");

// Load environment variables (if .env file exists)
try {
  require("dotenv").config();
} catch (e) {
  // dotenv not installed or .env file doesn't exist, use defaults
}

// Configuration from environment variables with fallbacks
const WEBSITE_URLS = process.env.WEBSITE_URLS
  ? process.env.WEBSITE_URLS.split(",").map((url) => url.trim())
  : [
      "https://www.example1.com",
      "https://www.example2.com",
      "https://www.example3.com",
    ];

const PING_INTERVAL = process.env.PING_INTERVAL || "*/15 * * * *";
const PING_DELAY = parseInt(process.env.PING_DELAY) || 1000;
const REQUEST_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT) || 60000;
const LOG_LEVEL = process.env.LOG_LEVEL || "info";
const PRIVACY_MODE = process.env.PRIVACY_MODE === "true" || false;

// Logging functions
function logInfo(message) {
  if (["info", "warn", "error"].includes(LOG_LEVEL)) {
    console.log(message);
  }
}

function logWarn(message) {
  if (["warn", "error"].includes(LOG_LEVEL)) {
    console.warn(message);
  }
}

function logError(message) {
  if (LOG_LEVEL === "error") {
    console.error(message);
  }
}

// Function to mask URLs for privacy
function maskUrl(url) {
  if (!PRIVACY_MODE) return url;

  try {
    const parsed = new URL(url);
    const domain = parsed.hostname;
    const maskedDomain =
      domain.length > 6
        ? domain.substring(0, 3) + "***" + domain.substring(domain.length - 3)
        : "***";
    return `https://${maskedDomain}${parsed.pathname}`;
  } catch {
    return "https://***";
  }
}

// Function to ping a single website
function pingWebsite(url, index) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const displayUrl = PRIVACY_MODE ? `Endpoint ${index + 1}` : maskUrl(url);

    try {
      const parsedUrl = new URL(url);
      const protocol = parsedUrl.protocol === "https:" ? https : http;

      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === "https:" ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: "GET",
        timeout: REQUEST_TIMEOUT,
        headers: {
          "User-Agent": "Universal-HTTP-Ping-Service/1.0",
        },
      };

      const req = protocol.get(options, (res) => {
        const responseTime = Date.now() - startTime;

        // Consume response data to free up memory
        res.on("data", () => {});
        res.on("end", () => {});

        if (res.statusCode >= 200 && res.statusCode < 400) {
          logInfo(`✅ Ping successful for ${displayUrl}`);
          logInfo(
            `   Status: ${res.statusCode}, Response Time: ${responseTime}ms`,
          );
          logInfo(`   Time: ${new Date().toLocaleTimeString()}`);
          resolve({
            url,
            success: true,
            statusCode: res.statusCode,
            responseTime,
          });
        } else {
          logWarn(`⚠️ Ping failed for ${displayUrl}`);
          logWarn(
            `   Status: ${res.statusCode}, Response Time: ${responseTime}ms`,
          );
          logWarn(`   Time: ${new Date().toLocaleTimeString()}`);
          resolve({
            url,
            success: false,
            statusCode: res.statusCode,
            responseTime,
          });
        }
      });

      req.on("timeout", () => {
        const responseTime = Date.now() - startTime;
        logError(`⏰ Timeout for ${displayUrl} after ${REQUEST_TIMEOUT}ms`);
        req.destroy();
        reject({ url, error: "Request timeout", responseTime });
      });

      req.on("error", (error) => {
        const responseTime = Date.now() - startTime;
        logError(`❌ Ping error for ${displayUrl}:`, error.message);
        logError(`   Response Time: ${responseTime}ms`);
        logError(`   Time: ${new Date().toLocaleTimeString()}`);
        reject({ url, error: error.message, responseTime });
      });

      req.setTimeout(REQUEST_TIMEOUT);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logError(`❌ Invalid URL ${displayUrl}:`, error.message);
      reject({ url, error: error.message, responseTime });
    }
  });
}

// Function to ping all websites
async function pingAllWebsites() {
  logInfo("\n🔄 Starting ping cycle...");
  logInfo(`📅 ${new Date().toISOString()}`);
  logInfo("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const results = [];

  for (let i = 0; i < WEBSITE_URLS.length; i++) {
    try {
      const result = await pingWebsite(WEBSITE_URLS[i], i);
      results.push(result);
    } catch (error) {
      results.push(error);
    }

    // Delay between requests to be respectful
    if (PING_DELAY > 0) {
      await new Promise((resolve) => setTimeout(resolve, PING_DELAY));
    }
  }

  // Summary
  const successful = results.filter((r) => r.success).length;
  const failed = results.length - successful;

  logInfo("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  logInfo(`📊 Ping Summary: ${successful} successful, ${failed} failed`);
  logInfo(`⏰ Next ping in 15 minutes\n`);

  return results;
}

// Validate website URLs
function validateWebsites() {
  const validUrls = [];
  const invalidUrls = [];

  for (const url of WEBSITE_URLS) {
    try {
      new URL(url);
      validUrls.push(url);
    } catch (error) {
      invalidUrls.push(url);
      logError(`❌ Invalid URL: ${url}`);
    }
  }

  if (invalidUrls.length > 0) {
    logError(
      `Found ${invalidUrls.length} invalid URLs. Please check your configuration.`,
    );
  }

  return validUrls;
}

// Create the cron job
function createCronJob() {
  const validWebsites = validateWebsites();

  if (validWebsites.length === 0) {
    logError("❌ No valid websites to monitor. Exiting...");
    process.exit(1);
  }

  const job = new cron.CronJob(PING_INTERVAL, async function () {
    try {
      await pingAllWebsites();
    } catch (error) {
      logError("💥 Error in cron job:", error);
    }
  });

  return job;
}

// Main execution
function main() {
  logInfo("🚀 Cronjob service starting...");
  logInfo("📋 Websites to monitor:");
  if (PRIVACY_MODE) {
    logInfo(
      `   ${WEBSITE_URLS.length} endpoints configured (URLs hidden for privacy)`,
    );
  } else {
    WEBSITE_URLS.forEach((site, index) => {
      logInfo(`   ${index + 1}. ${maskUrl(site)}`);
    });
  }
  logInfo(`⏱️  Schedule: ${PING_INTERVAL}`);
  logInfo(`🔧 Request timeout: ${REQUEST_TIMEOUT}ms`);
  logInfo(`⏳ Delay between pings: ${PING_DELAY}ms`);
  logInfo("🎯 Starting cron job...\n");

  const job = createCronJob();
  job.start();

  // Run an initial ping when the service starts
  logInfo("🔥 Running initial ping...");
  pingAllWebsites().catch((error) => {
    logError("💥 Error in initial ping:", error);
  });

  return job;
}

// Start the service
const cronJob = main();

// Graceful shutdown handling
process.on("SIGINT", () => {
  logInfo("\n🛑 Received SIGINT, stopping cronjob...");
  cronJob.stop();
  process.exit(0);
});

process.on("SIGTERM", () => {
  logInfo("\n🛑 Received SIGTERM, stopping cronjob...");
  cronJob.stop();
  process.exit(0);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logError("💥 Uncaught Exception:", error);
  cronJob.stop();
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logError("💥 Unhandled Rejection at:", promise, "reason:", reason);
  cronJob.stop();
  process.exit(1);
});

// Keep the process alive
logInfo("✨ Cronjob service is running and will keep your apps alive!");
