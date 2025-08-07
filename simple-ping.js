#!/usr/bin/env node

const https = require("https");
const http = require("http");
const { URL } = require("url");

// Configuration - can be set via environment variables
const WEBSITE_URLS = process.env.WEBSITE_URLS
  ? process.env.WEBSITE_URLS.split(",").map((url) => url.trim())
  : [
      "https://www.example1.com",
      "https://www.example2.com",
      "https://www.example3.com",
    ];

const REQUEST_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT) || 30000;
const PING_DELAY = parseInt(process.env.PING_DELAY) || 1000;

// Simple logging with timestamps
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// Function to ping a single website
function pingWebsite(url) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

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
          Accept: "*/*",
          Connection: "close",
        },
      };

      const req = protocol.get(options, (res) => {
        const responseTime = Date.now() - startTime;

        // Consume response data to free up memory
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          if (res.statusCode >= 200 && res.statusCode < 400) {
            log(
              `✅ ${url} | Status: ${res.statusCode} | Time: ${responseTime}ms`,
            );
            resolve({
              url,
              success: true,
              statusCode: res.statusCode,
              responseTime,
              size: data.length,
            });
          } else {
            log(
              `⚠️  ${url} | Status: ${res.statusCode} | Time: ${responseTime}ms`,
            );
            resolve({
              url,
              success: false,
              statusCode: res.statusCode,
              responseTime,
              size: data.length,
            });
          }
        });
      });

      req.on("timeout", () => {
        const responseTime = Date.now() - startTime;
        log(`⏰ ${url} | Timeout after ${REQUEST_TIMEOUT}ms`);
        req.destroy();
        reject({
          url,
          error: "Request timeout",
          responseTime,
        });
      });

      req.on("error", (error) => {
        const responseTime = Date.now() - startTime;
        log(`❌ ${url} | Error: ${error.message} | Time: ${responseTime}ms`);
        reject({
          url,
          error: error.message,
          responseTime,
        });
      });

      req.setTimeout(REQUEST_TIMEOUT);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      log(`❌ ${url} | Invalid URL: ${error.message}`);
      reject({
        url,
        error: `Invalid URL: ${error.message}`,
        responseTime,
      });
    }
  });
}

// Function to ping all websites
async function pingAllWebsites() {
  log(`🚀 Starting ping cycle for ${WEBSITE_URLS.length} websites...`);
  log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const results = [];
  let totalTime = 0;

  for (const website of WEBSITE_URLS) {
    try {
      const result = await pingWebsite(website);
      results.push(result);
      totalTime += result.responseTime;
    } catch (error) {
      results.push(error);
      if (error.responseTime) {
        totalTime += error.responseTime;
      }
    }

    // Add delay between requests to be respectful
    if (PING_DELAY > 0) {
      await new Promise((resolve) => setTimeout(resolve, PING_DELAY));
    }
  }

  // Calculate summary statistics
  const successful = results.filter((r) => r.success).length;
  const failed = results.length - successful;
  const avgResponseTime = totalTime / results.length;

  log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  log(`📊 Summary: ${successful} successful, ${failed} failed`);
  log(`⏱️  Average response time: ${Math.round(avgResponseTime)}ms`);
  log(`✅ Keep-alive ping completed successfully!`);

  return {
    successful,
    failed,
    total: results.length,
    averageResponseTime: avgResponseTime,
    results,
  };
}

// Main execution
async function main() {
  try {
    // Validate URLs
    const validUrls = WEBSITE_URLS.filter((url) => {
      try {
        new URL(url);
        return true;
      } catch {
        log(`❌ Invalid URL detected: ${url}`);
        return false;
      }
    });

    if (validUrls.length === 0) {
      log(
        "❌ No valid URLs found. Please check your WEBSITE_URLS configuration.",
      );
      process.exit(1);
    }

    if (validUrls.length !== WEBSITE_URLS.length) {
      log(
        `⚠️  ${WEBSITE_URLS.length - validUrls.length} invalid URLs were skipped.`,
      );
    }

    // Run the ping cycle
    const summary = await pingAllWebsites();

    // Exit with appropriate code
    if (summary.failed > 0) {
      log(`⚠️  ${summary.failed} websites failed to respond properly.`);
      process.exit(1);
    } else {
      log("🎉 All websites are alive and healthy!");
      process.exit(0);
    }
  } catch (error) {
    log(`💥 Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Handle process signals gracefully
process.on("SIGINT", () => {
  log("🛑 Received interrupt signal, exiting...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  log("🛑 Received termination signal, exiting...");
  process.exit(0);
});

// Run the main function
if (require.main === module) {
  main();
}

module.exports = {
  pingWebsite,
  pingAllWebsites,
  main,
};
