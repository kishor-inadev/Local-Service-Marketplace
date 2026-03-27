# Automated API Testing Guide

This document describes the automated testing setup for the Local Service Marketplace using [Postman](https://www.postman.com/) and [Newman](https://github.com/postmanlabs/newman).

## Overview

The platform uses a comprehensive Postman collection (`docs/Local-Service-Marketplace.postman_collection.json`) that contains all API endpoints across all microservices. The collection has been enhanced with automated test assertions using the Postman test scripting API.

### What's Being Tested

The automated tests cover:

- ✅ **Health Checks** - All services (API Gateway, Identity, Marketplace, Payment, Comms, Oversight, Infrastructure)
- ✅ **Authentication** - Signup, Login, Refresh Token, Logout, Token validation
- ✅ **User Management** - Get My Profile, Update Profile
- ✅ **Service Requests** - Create, List, Get by ID, Get My
- ✅ **Categories** - List, Search
- ✅ **Proposals** - Submit, Get for Request, Accept, Reject
- ✅ **Jobs** - Create, Get My, Get by ID, Update Status, Complete
- ✅ **Reviews** - Submit, Get by ID, Get for Job, Get Provider Reviews, Respond
- ✅ **Payments** - Create, Get My, Get for Job, Get Status, Request Refund
- ✅ **Messages** - Send, Get Job Messages, Get My Conversations
- ✅ **Notifications** - Get My, Get Unread Count, Mark as Read, Send Notification
- ✅ **Admin Operations** - Platform stats, user management, disputes, audit logs
- ✅ **Analytics** - Activity tracking, metrics, user activity logs
- ✅ **Infrastructure** - Events, Background Jobs, Feature Flags, Rate Limits
- ✅ **Error Handling** - 401 Unauthorized, 404 Not Found, 422 Validation, 429 Rate Limited

### Test Assertions

Each endpoint test verifies:
- **Status Code** - The HTTP response code matches expectations (200, 201, 401, 404, etc.)
- **Response Structure** - The standardized format `{ success, statusCode, message, data }` is used correctly
- **Data Types** - Fields have expected types (string, number, array, etc.)
- **Required Fields** - All mandatory fields are present in the response
- **Business Logic** - Specific values like job status, rating ranges, etc.
- **Data Consistency** - IDs from created resources are captured and reused

---

## Quick Start

### 1. Prerequisites

- **Docker Desktop** 20.x+ (with Docker Compose 2.x+)
- **Node.js** 18+ and **pnpm** 8+
- **PowerShell** 5+ (Windows) or **bash** (Linux/Mac)

### 2. Install Dependencies

From the project root:

```bash
pnpm install
```

This installs Newman and all required dependencies.

### 3. Start All Services

```powershell
# PowerShell
.\scripts\test-all-services.ps1
```

Or if services are already running, just run tests:

```powershell
.\scripts\run-postman-tests.ps1
```

### 4. View Results

After tests complete:

- **CLI** - Shows real-time pass/fail with emoji indicators
- **HTML Report** - Open `test-reports/report_<timestamp>.html` in a browser for detailed view
- **JSON Report** - `test-reports/report_<timestamp>.json` for machine processing

---

## Running Tests

There are several ways to run the tests depending on your needs.

### Option 1: Full Orchestration (Start + Test)

Starts all services, waits for them to be healthy, optionally seeds the database, then runs tests.

**PowerShell (Windows):**
```powershell
.\scripts\test-all-services.ps1
```

**Options:**
- `-SkipStart` - Skip starting services (assume they're already running)
- `-SkipSeed` - Skip database seeding
- `-DockerComposeFile <path>` - Use a different docker-compose file

**Example:**
```powershell
# Services already running, just test
.\scripts\test-all-services.ps1 -SkipStart
```

### Option 2: Direct Newman Runner

Run tests directly against already-running services.

**PowerShell:**
```powershell
.\scripts\run-postman-tests.ps1
```

**Options:**
- `-CollectionPath <path>` - Override collection path
- `-EnvironmentPath <path>` - Override environment path
- `-OutputDir <dir>` - Output directory for reports (default: test-reports)
- `-WaitForServices` - Wait for health checks before running tests
- `-BaseUrl <url>` - Override base URL (e.g., for staging environment)

**Example:**
```powershell
# Test against a different environment
.\scripts\run-postman-tests.ps1 -BaseUrl "http://staging.example.com/api/v1" -WaitForServices
```

**Bash (Linux/macOS):**
```bash
bash scripts/run-postman-tests.sh
```

**Bash Options:**
- `-c <path>` - Collection path
- `-e <path>` - Environment path
- `-o <dir>` - Output directory
- `-w` - Wait for services
- `-u <url>` - Override base URL
- `-h` - Show help

**Example:**
```bash
bash scripts/run-postman-tests.sh -w
```

### Option 3: Via npm scripts

From project root:

```bash
# Run tests (services must be running)
pnpm test:api

# Verbose output
pnpm test:api:verbose

# Full orchestration (start + test)
pnpm test:services
```

---

## Environment Configuration

The Newman environment file (`newman/newman.env.json`) defines test variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `base_url` | API Gateway base URL | `http://localhost:3500/api/v1` |
| `identity_url` | Identity service direct URL | `http://localhost:3001` |
| `marketplace_url` | Marketplace service direct URL | `http://localhost:3003` |
| `payment_url` | Payment service direct URL | `http://localhost:3006` |
| `comms_url` | Comms service direct URL | `http://localhost:3007` |
| `oversight_url` | Oversight service direct URL | `http://localhost:3010` |
| `infrastructure_url` | Infrastructure service direct URL | `http://localhost:3012` |
| `test_email` | Test user email | `test.automation@example.com` |
| `test_password` | Test user password | `TestPassword123!` |
| `token` | JWT token (auto-populated) | - |
| `user_id` | Test user ID (auto-populated) | - |
| `provider_id` | Test provider ID (auto-populated) | - |
| `request_id` | Test request ID (auto-populated) | - |
| `proposal_id` | Test proposal ID (auto-populated) | - |
| `job_id` | Test job ID (auto-populated) | - |
| `payment_id` | Test payment ID (auto-populated) | - |

**Note:** The `token`, `user_id`, and other resource IDs are automatically captured during test execution by the Signup and subsequent requests.

---

## Understanding the Postman Collection

### Structure

The collection is organized by service and functionality:

```
🏥 Health
  ├─ API Gateway Health
  ├─ All Services Health
🔑 Auth
  ├─ Signup
  ├─ Login
  ├─ Refresh Token
  ├─ Logout
  ...
👤 Users
  ├─ Get My Profile
  ├─ Update My Profile
  ...
📋 Service Requests
  ├─ Create Request
  ├─ List Requests
  ├─ Get Request by ID
  ...
📝 Proposals
  ├─ Submit Proposal
  ├─ Get My Proposals
  ...
💼 Jobs
  ├─ Create Job
  ├─ Get My Jobs
  ...
💳 Payments
  ├─ Create Payment
  ├─ Get My Payments
  ...
💬 Messages
  ├─ Send Message
  ├─ Get Job Messages
  ...
🔔 Notifications
  ├─ Get My Notifications
  ├─ Send Notification
  ...
🛡️ Admin
  ├─ Get Platform Stats
  ├─ List Users
  ...
📊 Analytics
  ├─ Track User Activity
  ├─ Get Daily Metrics
  ...
⚙️ Infrastructure
  ├─ Events
  ├─ Background Jobs
  ├─ Feature Flags
  ├─ Rate Limits
```

### Test Scripts

Each request can have "Tests" scripts that run after the response is received. Tests use the Postman `pm` API:

```javascript
// Basic test
pm.test('Description', function () {
    pm.response.to.have.status(200);
});

// JSON response validation
const jsonData = pm.response.json();
pm.expect(jsonData.success).to.be.true;
pm.expect(jsonData.data).to.be.an('object');

// Extract data for later requests
if (jsonData.data && jsonData.data.id) {
    pm.collectionVariables.set('user_id', jsonData.data.id);
}
```

---

## Adding New Tests

### To an Existing Endpoint

1. Open the collection in Postman
2. Select the request you want to enhance
3. Go to the **Tests** tab
4. Add test scripts using `pm.test()`
5. Save the collection (File → Save)

**Example:** Adding a test to verify response structure

```javascript
pm.test('Response has standardized structure', function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
    pm.expect(jsonData).to.have.property('statusCode');
    pm.expect(jsonData).to.have.property('message');
    pm.expect(jsonData).to.have.property('data');
});
```

### Creating a New Test-Only Request

If you want to add a specific test scenario (e.g., error case), you can:

1. Duplicate an existing request (right-click → Duplicate)
2. Modify the request for the test case
3. Add test assertions
4. Rename it with a `[TEST]` prefix to indicate it's for automated testing

**Example:** Testing 404 Not Found

```
Name: [TEST] Get Non-existent Request
Method: GET
URL: {{base_url}}/requests/00000000-0000-0000-0000-000000000000
Tests:
  pm.test('Status is 404', function () {
      pm.response.to.have.status(404);
  });
  pm.test('Error response structure', function () {
      const jsonData = pm.response.json();
      pm.expect(jsonData.success).to.be.false;
      pm.expect(jsonData.statusCode).to.eql(404);
      pm.expect(jsonData.error).to.be.an('object');
  });
```

---

## Test Data Strategy

### Unique Data Per Run

To ensure tests are idempotent (can run multiple times), tests use:

1. **Dynamic values** in request bodies:
   ```json
   {
     "email": "test.automation.+{{$timestamp}}@example.com"
   }
   ```
   (Postman can generate dynamic values with `{{$timestamp}}`)

2. **Collection variables** to link related resources:
   - Signup → sets `user_id`, `token`
   - Create Request → sets `request_id`
   - Submit Proposal → needs `request_id`, sets `proposal_id`
   - Create Job → needs `request_id`, `proposal_id`, sets `job_id`

3. **Cleanup**: Some test data accumulates in the database. This is acceptable for development environments. For clean CI runs, consider:
   - Resetting the database between runs
   - Adding cleanup requests that delete created resources
   - Using a separate test database that gets wiped

### Test Credentials

The default test credentials in `newman.env.json` are:

- **Email:** `test.automation@example.com`
- **Password:** `TestPassword123!`

These work with the seeded database. If you change them, ensure:
- Password meets validation rules (min length, complexity)
- The user exists in the database (run seeder if needed)

---

## Troubleshooting

### "Newman not found"

**Problem:** `pnpm newman` command fails.

**Solution:**
```bash
pnpm install
```
Ensure Node.js 18+ and pnpm 8+ are installed.

---

### "Services not responding"

**Problem:** Tests fail with connection errors or timeouts.

**Solution:**
1. Check if services are running:
   ```powershell
   docker-compose ps
   ```
2. Check service logs:
   ```powershell
   docker-compose logs <service-name>
   ```
3. Restart services:
   ```powershell
   docker-compose restart
   ```
4. Verify ports are not in use by other processes:
   ```powershell
   netstat -an | findstr :3500
   ```

---

### "Authentication fails (401)"

**Problem:** Tests that require authentication fail because there's no token.

**Solution:**
- Ensure the Signup request runs **before** authenticated requests (order matters)
- Verify the `token` collection variable is set (check Newman run output)
- Check that `test_email` matches an existing user (seed the database)

---

### "Database seeded, but user not found"

**Problem:** Signup fails with "email already exists" or tests can't find seeded user.

**Solution:**
- The seeder creates specific users: `admin@marketplace.com` / `password123`
- The automated tests use: `test.automation@example.com` / `TestPassword123!`
- If you modified the seeder or `.env` database settings, ensure consistency
- Re-seed: `.\scripts\seed-database.ps1`

---

### "Port already in use"

**Problem:** Docker fails to start a service because the port is occupied.

**Solution:**
1. Find what's using the port:
   ```powershell
   netstat -ano | findstr :<port>
   ```
2. Stop the conflicting service, or
3. Change port in `.env` file:
   ```env
   PORT=3001
   # Change to
   PORT=30011
   ```
4. Update `newman.env.json` and Postman collection accordingly

---

### "HTML report not generated"

**Problem:** Tests run but no HTML report appears.

**Solution:**
- Ensure `test-reports/` directory is writable
- Check Newman output for reporter errors
- Verify `newman-reporter-html` is installed:
  ```bash
  pnpm list newman-reporter-html
  ```

---

### "Tests are flaky (sometimes pass, sometimes fail)"

**Problem:** Non-deterministic test results.

**Solution:**
- Check for race conditions: use `pm.collectionVariables.set()` to ensure data is available
- Add delays if needed (`setTimeout` in test scripts) but use sparingly
- Ensure services have fully started (use `-WaitForServices` flag)
- Avoid using hardcoded IDs; always create fresh resources
- Check for timing issues in async operations (Kafka events, background jobs) - may need to poll or wait

---

## CI/CD Integration

To integrate these tests into GitHub Actions or other CI:

```yaml
name: API Tests

on:
  push:
    branches: [main]
  pull_request:

jobs:
  api-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:17-alpine
        env:
          POSTGRES_PASSWORD: postgres_dev_only
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      mongo:
        image: bitnami/mongodb:latest
        env:
          MONGO_INITDB_ROOT_PASSWORD: mongopass123
        options: >-
          --health-cmd "mongosh --eval 'db.adminCommand(\"ping\")'"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install dependencies
        run: pnpm install

      - name: Start infrastructure services
        run: docker-compose -f docker-compose.override.yml up -d postgres redis mongo kafka zookeeper

      - name: Start all services
        run: docker-compose up -d

      - name: Wait for services
        run: |
          # Wait for API Gateway health
          timeout 120 bash -c 'until curl -f http://localhost:3500/health; do sleep 5; done'

      - name: Seed database
        run: ./scripts/seed-database.ps1  # or ./seed-database.sh if available

      - name: Run API tests
        run: pnpm test:api

      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: newman-report
          path: test-reports/
```

---

## Coverage Goals

The automated tests aim to cover:

- [x] All service health endpoints
- [x] Authentication flows (signup, login, logout, refresh)
- [x] CRUD operations for major resources (requests, proposals, jobs, payments, reviews)
- [x] Error scenarios (401, 404, 422, 429)
- [x] Admin endpoints (user management, disputes, analytics)
- [x] Infrastructure services (feature flags, rate limits, events)
- [x] Messaging (messages, notifications)
- [ ] Full negative test coverage for all endpoints (ongoing)
- [ ] Performance/load testing (future enhancement)

Current coverage: **20+ endpoints** with full assertion suites.

---

## Tips for Effective Testing

1. **Run tests in order** - Postman respects folder/request order. Auth must run first to obtain tokens.
2. **Use environment variables** - Keep secrets and URLs out of the collection.
3. **Keep tests independent** - Each test should pass regardless of previous failures where possible.
4. **Validate both success and error paths** - Include tests for 400/401/404/422/429 responses.
5. **Check response times** - Add performance thresholds if needed (using `pm.response.responseTime`).
6. **Clean up test data** - If tests create persistent data, add teardown requests or cleanup scripts.
7. **Review Newman logs** - Verbose mode (`--verbose`) shows request/response details for debugging.

---

## Additional Resources

- [Postman Test Scripting Documentation](https://learning.postman.com/docs/writing-scripts/test-scripts/)
- [Newman Documentation](https://github.com/postmanlabs/newman)
- [Postman Collection v2.1 Spec](https://schema.getpostman.com/json/collection/v2.1.0/collection.json)
- [Project README](../README.md) - Setup and architecture overview

---

## Support

If you encounter issues:

1. Check this guide's Troubleshooting section
2. Review service logs: `docker-compose logs <service>`
3. Inspect the HTML report for specific failing requests
4. Run tests in verbose mode: `pnpm test:api:verbose`
5. Open an issue in the repository with:
   - Newman version
   - OS and Docker version
   - Error messages and logs
   - Screenshot of HTML report (if applicable)

---

**Happy Testing!** 🧪
