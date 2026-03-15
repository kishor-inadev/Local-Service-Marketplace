# Analytics Service

The **Analytics Service** tracks user activity and aggregates daily platform metrics for the Local Service Marketplace.

## Features

- **User Activity Tracking**: Log and retrieve user actions across the platform
- **Daily Metrics Aggregation**: Collect and aggregate daily statistics (users, requests, jobs, payments)
- **Background Job Processing**: Scheduled metrics aggregation via worker endpoints
- **Historical Data**: Support for backfilling historical metrics
- **Flexible Querying**: Filter by date range, user, action, and more

## Technology Stack

- **Framework**: NestJS 10.3.0
- **Database**: PostgreSQL 15
- **Logging**: Winston 3.11.0
- **Validation**: class-validator 0.14.0
- **Testing**: Jest 29.7.0 + Supertest 6.3.3
- **Containerization**: Docker

## Database Schema

### Tables Owned

1. **user_activity_logs**
   - Tracks individual user actions
   - Fields: id, user_id, action, metadata (JSONB), ip_address, created_at
   - Indexed on: user_id, action, created_at

2. **daily_metrics**
   - Stores aggregated daily platform metrics
   - Fields: date (PK), total_users, total_requests, total_jobs, total_payments
   - Indexed on: date

## API Endpoints

### Activity Tracking

- **POST /analytics/activity**
  - Track user activity
  - Body: `{ userId, action, metadata?, ipAddress? }`

### Activity Retrieval

- **GET /analytics/user-activity**
  - Retrieve all user activity logs
  - Query params: `limit`, `offset`

- **GET /analytics/user-activity/:userId**
  - Retrieve activity for a specific user
  - Query params: `limit`, `offset`

- **GET /analytics/user-activity/action/:action**
  - Retrieve activity logs by action type
  - Query params: `limit`

### Metrics

- **GET /analytics/metrics**
  - Retrieve daily metrics
  - Query params: `startDate`, `endDate`, `limit`

- **GET /analytics/metrics/:date**
  - Retrieve metric for a specific date

### Background Workers

- **POST /analytics/workers/aggregate-today**
  - Aggregate metrics for today

- **POST /analytics/workers/aggregate-yesterday**
  - Aggregate metrics for yesterday

- **POST /analytics/workers/aggregate/:date**
  - Aggregate metrics for a specific date

- **POST /analytics/workers/backfill**
  - Backfill metrics for a date range
  - Body: `{ startDate, endDate }`

## Environment Variables

```env
NODE_ENV=development
PORT=3011

# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5442
DATABASE_USER=analytics_user
DATABASE_PASSWORD=analytics_password
DATABASE_NAME=analytics_service_db
```

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your configuration
```

## Running the Service

### Development

```bash
npm run start:dev
```

### Production

```bash
npm run build
npm run start:prod
```

### Docker

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f analytics-service

# Stop services
docker-compose down
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Architecture

### Layered Structure

```
src/
├── analytics/
│   ├── controllers/       # HTTP request handlers
│   ├── services/          # Business logic
│   ├── repositories/      # Database access
│   ├── entities/          # Data models
│   ├── dto/              # Data transfer objects
│   └── analytics.module.ts
├── common/
│   ├── config/           # Configuration files
│   ├── database/         # Database connection
│   ├── logger/           # Logging module
│   ├── filters/          # Exception filters
│   └── exceptions/       # Custom exceptions
├── app.module.ts
└── main.ts
```

### Background Job Pattern

The service uses a worker pattern for background processing:

1. **Worker Endpoints**: Special endpoints prefixed with `/workers/` for scheduled tasks
2. **Metrics Aggregation**: Runs daily to compute platform statistics
3. **Scheduler Integration**: Can be called by external cron jobs or task schedulers

### Cross-Service Communication

For metrics aggregation, the service queries tables from other services:
- **users** (Auth Service)
- **service_requests** (Request Service)
- **jobs** (Job Service)
- **payments** (Payment Service)

> **Note**: In a production microservices architecture, use APIs instead of direct database access.

## Usage Examples

### Track User Activity

```bash
curl -X POST http://localhost:3011/analytics/activity \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "action": "service_request_created",
    "metadata": { "category": "plumbing" },
    "ipAddress": "192.168.1.1"
  }'
```

### Get Daily Metrics

```bash
curl http://localhost:3011/analytics/metrics?startDate=2024-01-01&endDate=2024-01-31&limit=30
```

### Trigger Metrics Aggregation

```bash
curl -X POST http://localhost:3011/analytics/workers/aggregate-yesterday
```

### Backfill Historical Metrics

```bash
curl -X POST http://localhost:3011/analytics/workers/backfill \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  }'
```

## Scheduled Jobs

For production, set up cron jobs or a task scheduler to call worker endpoints:

```bash
# Daily at 1 AM - Aggregate yesterday's metrics
0 1 * * * curl -X POST http://localhost:3011/analytics/workers/aggregate-yesterday

# Every hour - Aggregate today's metrics for real-time dashboards
0 * * * * curl -X POST http://localhost:3011/analytics/workers/aggregate-today
```

## Monitoring

The service logs all operations using Winston:
- **Console logs**: Colorized output in development
- **File logs**: 
  - `logs/error.log` - Error-level logs
  - `logs/combined.log` - All logs

## Security Considerations

- **Rate Limiting**: Implement rate limiting on public endpoints
- **Authentication**: Add JWT authentication for production
- **IP Tracking**: Store IP addresses for security auditing
- **Sensitive Data**: Avoid storing PII in metadata fields

## Performance Optimization

- **Pagination**: All list endpoints support pagination
- **Indexes**: Database indexes on frequently queried columns
- **Connection Pool**: Max 20 concurrent database connections
- **Background Processing**: Heavy aggregation runs asynchronously

## Troubleshooting

### Database Connection Issues

```bash
# Check database is running
docker-compose ps

# View database logs
docker-compose logs analytics-db
```

### Missing Metrics

```bash
# Backfill missing dates
curl -X POST http://localhost:3011/analytics/workers/backfill \
  -H "Content-Type: application/json" \
  -d '{"startDate": "2024-01-01", "endDate": "2024-01-31"}'
```

## Contributing

Follow the project's microservices architecture principles:
- Each service owns its database tables
- No cross-service database joins
- Use pagination for large queries
- Include logging and validation
- Write comprehensive tests

## License

Part of the Local Service Marketplace platform.
