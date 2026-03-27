# Newman Automated Testing Setup

This directory contains configuration files for running automated API tests using Newman (Postman CLI).

## Files

- `newman.env.json` - Newman environment variables with service URLs and test data
- (Optional) `newman-globals.json` - Global variables for test data persistence

## Prerequisites

- Node.js 18+ and pnpm installed
- Docker services running (`docker-compose up -d`)
- Newman installed (automatically via root `pnpm install`)

## Running Tests

### Quick Start

From the project root:

```bash
# Install dependencies (including Newman)
pnpm install

# Run all API tests
pnpm test:api

# Run with verbose output
pnpm test:api:verbose

# Or use the orchestration script (starts services + runs tests)
pnpm test:services
```

### PowerShell Scripts

```powershell
# Run tests only (services must already be running)
.\scripts\run-postman-tests.ps1

# Start all services and then run tests
.\scripts\test-all-services.ps1
```

### Bash/Linux/Mac

```bash
# Run tests
bash scripts/run-postman-tests.sh

# Full orchestration
bash scripts/test-all-services.sh
```

## Test Reports

After running tests, reports are generated in the `test-reports/` directory:

- `report.html` - Human-readable HTML report with detailed request/response data
- `report.json` - Machine-readable JSON report for integration with other tools
- CLI output shows real-time test results with ✅/❌ indicators

## Environment Variables

The `newman.env.json` file defines:

- Service URLs (base_url, identity_url, etc.)
- Test credentials (test_email, test_password)
- Dynamic variables (token, user_id, provider_id, etc.) - these are populated during test execution

You can modify the test credentials in `newman.env.json` if needed, but ensure they meet your service's validation rules.

## Test Data Strategy

Tests use a combination of:

1. **Static test data** from environment variables (email, password)
2. **Dynamic data** generated during tests (timestamps, random suffixes) to ensure idempotency
3. **Collection variables** to pass IDs between requests (e.g., create user → use user_id in subsequent requests)
4. **Cleanup**: Some tests create resources that are not deleted (acceptable for dev environment). For production CI, consider adding cleanup scripts.

## Adding New Tests

1. Open `docs/Local-Service-Marketplace.postman_collection.json` in Postman
2. Add test scripts in the "Tests" tab for each request
3. Use `pm.test()` with descriptive names
4. Use `pm.collectionVariables.set()` to export IDs for later requests
5. Ensure tests validate both success and error cases

Example test script:

```javascript
// Test response status
pm.test("Status is 201", function () {
    pm.response.to.have.status(201);
});

// Test response structure
pm.test("Response has standardized structure", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success', true);
    pm.expect(jsonData).to.have.property('statusCode', 201);
    pm.expect(jsonData).to.have.property('message');
    pm.expect(jsonData).to.have.property('data');
});

// Extract data for later requests
if (pm.response.code === 201) {
    const jsonData = pm.response.json();
    if (jsonData.data && jsonData.data.id) {
        pm.collectionVariables.set("user_id", jsonData.data.id);
    }
}
```

## Troubleshooting

### "Service not responding" errors
- Ensure all services are running: `docker-compose ps`
- Check service health: `docker-compose logs <service-name>`
- Verify ports are not in use by other processes

### Authentication failures
- Check that `test_email` and `test_password` in `newman.env.json` are valid
- The collection automatically handles token extraction after signup/login
- If re-running tests, you may need to clear the token variable or use a fresh email

### Newman not found
- Run `pnpm install` in the project root to install dev dependencies
- Or install Newman globally: `npm install -g newman`

### Port conflicts
- Default ports: API Gateway (3500), Identity (3001), Marketplace (3003), etc.
- Check `.env` file for any custom port configurations

## Continuous Integration

To integrate into GitHub Actions:

```yaml
- name: Install dependencies
  run: pnpm install

- name: Start services
  run: docker-compose up -d

- name: Wait for services
  run: ./scripts/wait-for-services.ps1  # or bash script

- name: Run API tests
  run: pnpm test:api
```

## Coverage Goals

Target coverage:
- ✅ All health check endpoints
- ✅ Authentication flows (signup, login, logout, refresh, password reset)
- ✅ User & Provider CRUD operations
- ✅ Service request lifecycle
- ✅ Proposal submission and management
- ✅ Job creation and status updates
- ✅ Payment processing
- ✅ Review submission
- ✅ Admin operations
- ✅ Error scenarios (404, 401, 422, 429)
- ✅ Analytics tracking
