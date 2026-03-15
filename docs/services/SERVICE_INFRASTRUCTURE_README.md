# Infrastructure Service

The **Infrastructure Service** provides core infrastructure capabilities for the Local Service Marketplace platform, including event storage, background job management, rate limiting, and feature flags.

## Features

- **Event Storage**: Store and retrieve system events for audit trails and analytics
- **Background Jobs**: Queue-based job processing with Redis/Bull integration
- **Rate Limiting**: Protect APIs from abuse with configurable rate limits
- **Feature Flags**: Enable/disable features dynamically with gradual rollout support

## Technology Stack

- **Framework**: NestJS 10.3.0
- **Database**: PostgreSQL 15
- **Cache/Queue**: Redis 7 + Bull
- **Logging**: Winston 3.11.0
- **Validation**: class-validator 0.14.0
- **Testing**: Jest 29.7.0 + Supertest 6.3.3
- **Containerization**: Docker

## Database Schema

### Tables Owned

1. **events**
   - System events log
   - Fields: id, event_type, payload (JSONB), created_at
   - Indexed on: event_type, created_at

2. **background_jobs**
   - Background job queue
   - Fields: id, job_type, payload (JSONB), status, attempts
   - Indexed on: status, job_type

3. **rate_limits**
   - Rate limiting state
   - Fields: id, key (unique), request_count, window_start
   - Indexed on: key, window_start

4. **feature_flags**
   - Feature flag configuration
   - Fields: key (PK), enabled, rollout_percentage
   - Indexed on: enabled

## API Endpoints

### Events

- **POST /events**
  - Create a system event
  - Body: `{ eventType, payload? }`

- **GET /events**
  - Retrieve all events with pagination
  - Query params: `limit`, `offset`

- **GET /events/:id**
  - Retrieve event by ID

- **GET /events/type/:eventType**
  - Retrieve events by type
  - Query params: `limit`

### Background Jobs

- **POST /background-jobs**
  - Create a background job
  - Body: `{ jobType, payload? }`

- **GET /background-jobs**
  - Retrieve all jobs with pagination
  - Query params: `limit`, `offset`

- **GET /background-jobs/:id**
  - Retrieve job by ID

- **GET /background-jobs/status/:status**
  - Retrieve jobs by status (pending, processing, completed, failed)

- **GET /background-jobs/stats**
  - Get queue statistics

- **PATCH /background-jobs/:id/status**
  - Update job status
  - Body: `{ status }`

- **DELETE /background-jobs/:id**
  - Delete a background job

### Rate Limits

- **POST /rate-limits/check**
  - Check rate limit for a key
  - Body: `{ key }`
  - Returns: `{ allowed, remaining, resetAt }`

- **DELETE /rate-limits/:key**
  - Reset rate limit for a key

- **POST /rate-limits/cleanup**
  - Cleanup expired rate limits

### Feature Flags

- **POST /feature-flags**
  - Create a feature flag
  - Body: `{ key, enabled, rolloutPercentage }`

- **GET /feature-flags**
  - Retrieve all feature flags

- **GET /feature-flags/:key**
  - Retrieve feature flag by key

- **GET /feature-flags/:key/enabled**
  - Check if feature is enabled
  - Query params: `userId` (optional, for gradual rollout)

- **PATCH /feature-flags/:key**
  - Update feature flag
  - Body: `{ enabled?, rolloutPercentage? }`

- **DELETE /feature-flags/:key**
  - Delete a feature flag

## Environment Variables

```env
NODE_ENV=development
PORT=3012

# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5443
DATABASE_USER=infrastructure_user
DATABASE_PASSWORD=infrastructure_password
DATABASE_NAME=infrastructure_service_db

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

## Installation

```bash
cd services/infrastructure-service

# Install dependencies
npm install

# Set up environment
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
# Build and start all services (app + PostgreSQL + Redis)
docker-compose up -d

# View logs
docker-compose logs -f infrastructure-service

# Stop services
docker-compose down
```

**Service URL:** http://localhost:3012

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
├── infrastructure/
│   ├── controllers/       # HTTP request handlers
│   ├── services/          # Business logic
│   ├── repositories/      # Database access
│   ├── entities/          # Data models
│   ├── dto/              # Data transfer objects
│   └── infrastructure.module.ts
├── redis/
│   ├── redis.service.ts  # Redis/Bull queue management
│   └── redis.module.ts
├── common/
│   ├── config/           # Configuration files
│   ├── database/         # Database connection
│   ├── logger/           # Logging module
│   ├── filters/          # Exception filters
│   └── exceptions/       # Custom exceptions
├── app.module.ts
└── main.ts
```

### Redis Integration

The service uses Redis for:
1. **Job Queues**: Bull library for background job processing
2. **Rate Limiting**: Fast lookups with TTL expiration
3. **Feature Flag Caching**: 5-minute cache for feature flags

## Usage Examples

### Store System Event

```bash
curl -X POST http://localhost:3012/events \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "user_registered",
    "payload": { "userId": "user123", "email": "user@example.com" }
  }'
```

### Create Background Job

```bash
curl -X POST http://localhost:3012/background-jobs \
  -H "Content-Type: application/json" \
  -d '{
    "jobType": "send_email",
    "payload": { "to": "user@example.com", "template": "welcome" }
  }'
```

### Check Rate Limit

```bash
curl -X POST http://localhost:3012/rate-limits/check \
  -H "Content-Type: application/json" \
  -d '{ "key": "api:user123" }'
```

Response:
```json
{
  "statusCode": 200,
  "message": "Rate limit checked successfully",
  "data": {
    "allowed": true,
    "remaining": 99,
    "resetAt": "2026-03-12T10:30:00.000Z"
  }
}
```

### Create Feature Flag

```bash
curl -X POST http://localhost:3012/feature-flags \
  -H "Content-Type: application/json" \
  -d '{
    "key": "new_dashboard",
    "enabled": true,
    "rolloutPercentage": 25
  }'
```

### Check Feature Enabled

```bash
# Check without user (global check)
curl http://localhost:3012/feature-flags/new_dashboard/enabled

# Check with user for gradual rollout
curl "http://localhost:3012/feature-flags/new_dashboard/enabled?userId=user123"
```

## Background Job Processing

The service integrates with Bull for job queue management:

### Job Processing Example

```typescript
import { RedisService } from './redis/redis.service';

// Add job to queue
await redisService.addJob('background-jobs', 'send_email', {
  to: 'user@example.com',
  template: 'welcome'
});

// Process jobs
redisService.processQueue('background-jobs', async (job) => {
  console.log(`Processing job ${job.id}:`, job.data);
  // Perform job work here
});
```

### Job States

- **pending**: Job created, waiting to be processed
- **processing**: Job is currently being processed
- **completed**: Job finished successfully
- **failed**: Job failed after retries

## Rate Limiting

### Configuration

Default settings (customizable per endpoint):
- **Window**: 60 seconds
- **Max Requests**: 100 per window

### Rate Limit Response

```json
{
  "allowed": false,
  "remaining": 0,
  "resetAt": "2026-03-12T10:31:00.000Z"
}
```

### Implementation in Other Services

```typescript
// Check rate limit before processing request
const rateLimit = await checkRateLimit(`api:${userId}`);

if (!rateLimit.allowed) {
  throw new HttpException('Rate limit exceeded', 429);
}
```

## Feature Flags

### Gradual Rollout

Feature flags support gradual rollout based on user ID:

- `rolloutPercentage: 0` - Feature disabled for all users
- `rolloutPercentage: 50` - Feature enabled for ~50% of users (consistent hashing)
- `rolloutPercentage: 100` - Feature enabled for all users

### Consistent Hashing

Users with the same ID will always get the same result during rollout, ensuring consistent experience.

## Monitoring

The service logs all operations using Winston:
- **Console logs**: Colorized output in development
- **File logs**:
  - `logs/error.log` - Error-level logs
  - `logs/combined.log` - All logs

## Performance Optimization

- **Redis Caching**: Feature flags cached for 5 minutes
- **Connection Pooling**: Max 20 concurrent database connections
- **Indexed Queries**: All tables have appropriate indexes
- **Pagination**: All list endpoints support pagination

## Security Considerations

- **Rate Limiting**: Protect all public endpoints
- **Authentication**: Add JWT authentication in production
- **Input Validation**: All DTOs use class-validator
- **SQL Injection**: Parameterized queries prevent SQL injection

## Troubleshooting

### Redis Connection Issues

```bash
# Check Redis is running
docker-compose ps infrastructure-redis

# View Redis logs
docker-compose logs infrastructure-redis

# Connect to Redis CLI
docker exec -it infrastructure-redis redis-cli
```

### Job Queue Issues

```bash
# Check queue stats
curl http://localhost:3012/background-jobs/stats

# View pending jobs
curl http://localhost:3012/background-jobs/status/pending

# View failed jobs
curl http://localhost:3012/background-jobs/status/failed
```

### Database Issues

```bash
# Check database is running
docker-compose ps infrastructure-db

# View database logs
docker-compose logs infrastructure-db
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
