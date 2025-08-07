# Universal HTTP Ping Service

A lightweight Node.js service for sending periodic HTTP requests to multiple endpoints. Configurable scheduling, comprehensive logging, and multiple deployment options.

## 🎯 Overview

This service sends HTTP requests to configured URLs at regular intervals, providing detailed logging of response times, status codes, and connection health. Perfect for monitoring, testing, or any scenario requiring periodic HTTP requests.

## ✨ Features

- 🌐 **Multi-endpoint support** - Monitor unlimited URLs simultaneously
- ⏱️ **Flexible scheduling** - Configurable intervals from 1 minute to any custom timing (GitHub Actions minimum: 5 minutes, self-hosted: no limits)
- 📊 **Detailed logging** - Response times, status codes, and comprehensive metrics
- 🔒 **Privacy options** - Multiple privacy modes for sensitive deployments
- 🛠️ **Platform agnostic** - Deploy anywhere that supports Node.js
- 🔧 **Environment-based configuration** - Easy setup with environment variables
- 🔄 **Retry logic** - Automatic retry handling for failed requests
- 📈 **Success tracking** - Built-in success/failure reporting

## 🚀 Quick Start

### Method 1: GitHub Actions

1. **Fork this repository**
2. **Add URL configuration:**
   - Go to **Settings → Secrets and variables → Actions**
   - Create secret: `WEBSITE_URLS`
   - Value: `https://www.example1.com,https://www.example2.com,https://www.example3.com`
3. **Enable workflow:**
   - Navigate to **Actions** tab
   - Enable workflows
   - Service will start automatically

### Method 2: Local Development

```bash
# Clone repository
git clone https://github.com/kamilcollu/universal-http-ping-service.git
cd universal-http-ping-service

# Install dependencies
npm install

# Configure URLs in index.js or use environment variables
export WEBSITE_URLS="https://www.example1.com,https://www.example2.com,https://www.example3.com"

# Start service
npm start
```

### Method 3: Docker

```bash
# Build image
docker build -t http-ping-service .

# Run container
docker run -e WEBSITE_URLS="https://www.example1.com,https://www.example2.com" http-ping-service
```

### Method 4: Server Deployment

Deploy to any Node.js hosting platform:
- Configure environment variables
- Set up as background service or scheduled task
- Customize execution intervals as needed

## ⚙️ Configuration

### Environment Variables

```bash
# Required: Comma-separated URLs to ping
WEBSITE_URLS=https://www.example1.com,https://www.example2.com,https://www.example3.com

# Optional: Schedule in cron format (default: every 15 minutes)
PING_INTERVAL=*/5 * * * *

# Optional: Request timeout in milliseconds (default: 60000)
REQUEST_TIMEOUT=30000

# Optional: Delay between requests in milliseconds (default: 1000)
PING_DELAY=2000

# Optional: Privacy mode for sensitive URLs (default: false)
PRIVACY_MODE=true

# Optional: Logging level - info, warn, error (default: info)
LOG_LEVEL=info
```

### Direct Code Configuration

Update the URLs array in `index.js`:

```javascript
const WEBSITE_URLS = [
  "https://www.example1.com",
  "https://www.example2.com", 
  "https://www.example3.com"
];
```

### Schedule Customization

```bash
# Every 5 minutes
PING_INTERVAL="*/5 * * * *"

# Every 10 minutes
PING_INTERVAL="*/10 * * * *"

# Every hour
PING_INTERVAL="0 * * * *"

# Twice daily at 9 AM and 5 PM
PING_INTERVAL="0 9,17 * * *"

# Custom intervals supported
PING_INTERVAL="*/7 * * * *"
```

## 📊 Output Examples

### Standard Mode
```
🚀 HTTP Ping Service starting...
📋 URLs to monitor:
   1. https://www.example1.com
   2. https://www.example2.com
   3. https://www.example3.com
⏱️  Schedule: Every 5 minutes
🎯 Starting scheduled pings...

🔄 Starting ping cycle...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ https://www.example1.com - Status: 200, Time: 145ms
✅ https://www.example2.com - Status: 200, Time: 203ms
✅ https://www.example3.com - Status: 200, Time: 187ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Summary: 3 successful, 0 failed
⏰ Next cycle in 5 minutes
```

### Privacy Mode
```
🚀 Private HTTP Ping Service starting...
🎯 Monitoring 3 configured endpoints
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Endpoint 1: Response 200 - 145ms
✅ Endpoint 2: Response 200 - 203ms  
⚠️ Endpoint 3: Response 404 - 187ms
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Results: 3/3 endpoints contacted
🎯 Cycle completed successfully
```

## 🔒 Privacy Features

### Ultra-Private Mode
- URLs completely hidden from logs
- Only displays endpoint numbers (Endpoint 1, 2, 3)
- Ideal for public repositories or shared environments
- **Activation:** Use the `private-keepalive.yml` workflow file

### URL Masking Mode
- Partial URL obfuscation (example.com → exa***com)
- Maintains context while protecting sensitive information
- **Activation:** Set environment variable `PRIVACY_MODE=true`

### Privacy Configuration Options

#### Method 1: GitHub Actions (Ultra-Private)
```bash
# Use the private-keepalive.yml workflow file
# This automatically enables ultra-private mode
# Shows only: "Endpoint 1: Response 200 - 145ms"
```

#### Method 2: Environment Variable (URL Masking)
```bash
# Set privacy mode for partial URL masking
PRIVACY_MODE=true

# This shows: "exa***com - Status: 200, Time: 145ms"
```

#### Method 3: Code Configuration
```javascript
// In index.js, set privacy mode directly
const PRIVACY_MODE = true; // Enable URL masking
```

### Secret Management
- Environment variable-based configuration
- GitHub Actions secret integration
- No sensitive data in code or logs

## 🔐 How to Activate Privacy Features

### Option 1: Ultra-Private Mode (Recommended for Public Repos)

**Step 1:** Use the private workflow file
```bash
# Ensure you're using .github/workflows/private-keepalive.yml
# Delete any other workflow files if present
```

**Step 2:** Configure your secrets
```bash
# Go to GitHub repo: Settings → Secrets and variables → Actions
# Add secret: WEBSITE_URLS
# Value: https://www.example1.com,https://www.example2.com,https://www.example3.com
```

**Result:** Logs will show:
```
✅ Endpoint 1: Response 200 - 145ms
✅ Endpoint 2: Response 200 - 203ms  
✅ Endpoint 3: Response 200 - 187ms
```

### Option 2: URL Masking Mode

**For GitHub Actions:**
```bash
# Add another secret: PRIVACY_MODE = true
# This works with any workflow file
```

**For Self-Hosted:**
```bash
# Set environment variable
export PRIVACY_MODE=true
npm start
```

**For Docker:**
```bash
docker run -e PRIVACY_MODE=true -e WEBSITE_URLS="..." http-ping-service
```

**Result:** Logs will show:
```
✅ exa***com - Status: 200, Time: 145ms
✅ exa***com - Status: 200, Time: 203ms
```

### Option 3: Direct Code Configuration

Edit `index.js`:
```javascript
// Find this line and change to true
const PRIVACY_MODE = true; // Enable URL masking
```

## 🛠️ Advanced Configuration

### Custom Headers

```javascript
const options = {
  method: 'GET',
  headers: {
    'User-Agent': 'Custom-HTTP-Ping-Service/1.0',
    'Accept': 'application/json, text/plain, */*',
    'Authorization': 'Bearer your-token-here' // If needed
  }
};
```

### Different HTTP Methods

```javascript
// GET requests (default)
method: 'GET'

// POST requests  
method: 'POST'

// HEAD requests (lightweight)
method: 'HEAD'
```

### Custom Endpoints

```javascript
const endpoints = [
  "https://api.example.com/health",    // API health check
  "https://app.example.com/status",    // Status endpoint
  "https://service.example.com/ping",  // Custom ping endpoint
  "https://website.example.com"        // Main website
];
```

## 🧪 Testing & Development

### Manual Testing
```bash
# Test single run
node simple-ping.js

# Test with custom URLs
WEBSITE_URLS="https://httpbin.org/status/200,https://httpbin.org/delay/2" node index.js

# Test privacy mode
PRIVACY_MODE=true WEBSITE_URLS="https://example.com" npm start
```

### Development Mode
```bash
# Install development dependencies
npm install

# Run with detailed logging
LOG_LEVEL=info npm start

# Test different intervals
PING_INTERVAL="*/1 * * * *" npm start  # Every minute (for testing)
```

## 📦 Dependencies

- **cron**: ^3.1.6 - Task scheduling and cron job management
- **Built-in Node.js modules**: http, https, url - No external HTTP client dependencies

## 🚀 Deployment Options

### GitHub Actions
- Serverless execution
- Built-in secret management  
- Configurable schedules
- Zero server maintenance

### Container Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]
```

### Process Management
```bash
# Using PM2
npm install -g pm2
pm2 start index.js --name "http-ping-service"
pm2 startup && pm2 save

# Using systemd
sudo systemctl enable http-ping-service
sudo systemctl start http-ping-service
```

### Cloud Platforms
- Works with any Node.js hosting service
- Environment variable configuration
- Cron job or background service deployment
- Scalable and lightweight

## 🔧 Customization

### Response Handling
```javascript
// Custom success criteria
if (res.statusCode >= 200 && res.statusCode < 300) {
  console.log('✅ Success');
} else if (res.statusCode >= 400 && res.statusCode < 500) {
  console.log('⚠️ Client error');
} else {
  console.log('❌ Server error');
}
```

### Timeout Configuration
```javascript
// Per-request timeout
REQUEST_TIMEOUT=10000  // 10 seconds

// Connection timeout
const options = {
  timeout: 5000,  // 5 seconds
  // ... other options
};
```

## 📈 Monitoring & Metrics

### Built-in Metrics
- Response time tracking
- Success/failure rates
- HTTP status code distribution
- Connection error logging

### Log Formats
- Human-readable console output
- Structured JSON logging available
- Timestamp inclusion
- Configurable log levels

## ⚡ Performance

### Optimizations
- Lightweight HTTP client usage
- Configurable concurrent request limits  
- Memory-efficient response handling
- Minimal CPU usage

### Resource Usage
- Low memory footprint (~20-50 MB)
- Minimal network bandwidth
- CPU usage spikes only during ping cycles
- Suitable for free hosting tiers

## 🤝 Contributing

We welcome contributions to improve this HTTP ping service:

- Bug fixes and improvements
- New deployment methods
- Enhanced privacy features
- Documentation updates
- Performance optimizations

### Development Guidelines
- Maintain backward compatibility
- Follow existing code style
- Add appropriate tests
- Update documentation

## 📄 License

MIT License - Free for personal and commercial use.

## 📞 Support

For questions, issues, or feature requests, please use the GitHub Issues page.

---

**Note**: This is a general-purpose HTTP request service. Users are responsible for ensuring their usage complies with target website terms of service and applicable rate limiting policies.