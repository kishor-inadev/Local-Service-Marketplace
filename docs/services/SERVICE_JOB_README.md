# Job Service

Production-grade microservice for managing jobs in the Local Service Marketplace platform.

## Overview

The Job Service handles the lifecycle of jobs created when proposals are accepted. It tracks job status from creation through completion.

## Architecture

Built using **NestJS** framework following microservices principles:

- **Controllers**: Handle HTTP requests and responses
- **Services**: Contain business logic and validation
- **Repositories**: Manage database operations with parameterized queries
- **DTOs**: Validate and transform request/response data
- **Entities**: Represent database models

## Technology Stack

- **Framework**: NestJS 10.3.0
- **Runtime**: Node.js 20
- **Database**: PostgreSQL 16
- **Logging**: Winston 3.11.0
- **Validation**: class-validator 0.14.0
- **Testing**: Jest 29.7.0, Supertest 6.3.3
- **Containerization**: Docker

## Database Tables

The service owns and manages:

- `jobs` - Job records tracking work assignments

## API Endpoints

### Jobs

- `POST /jobs` - Create a new job (when proposal accepted)
- `GET /jobs/:id` - Get job by ID
- `PATCH /jobs/:id/status` - Update job status
- `POST /jobs/:id/complete` - Mark job as completed
- `GET /jobs/provider/:providerId` - Get all jobs for a provider
- `GET /jobs/status/:status` - Get jobs by status

## Request/Response Examples

### Create Job

**Request:**
```json
POST /jobs
{
  "request_id": "123e4567-e89b-12d3-a456-426614174000",
  "provider_id": "123e4567-e89b-12d3-a456-426614174001"
}
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174002",
  "request_id": "123e4567-e89b-12d3-a456-426614174000",
  "provider_id": "123e4567-e89b-12d3-a456-426614174001",
  "status": "pending",
  "started_at": "2026-03-12T10:30:00.000Z",
  "completed_at": null
}
```

### Get Job by ID

**Request:**
```
GET /jobs/123e4567-e89b-12d3-a456-426614174002
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174002",
  "request_id": "123e4567-e89b-12d3-a456-426614174000",
  "provider_id": "123e4567-e89b-12d3-a456-426614174001",
  "status": "pending",
  "started_at": "2026-03-12T10:30:00.000Z",
  "completed_at": null
}
```

### Update Job Status

**Request:**
```json
PATCH /jobs/123e4567-e89b-12d3-a456-426614174002/status
{
  "status": "in_progress"
}
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174002",
  "request_id": "123e4567-e89b-12d3-a456-426614174000",
  "provider_id": "123e4567-e89b-12d3-a456-426614174001",
  "status": "in_progress",
  "started_at": "2026-03-12T10:30:00.000Z",
  "completed_at": null
}
```

### Complete Job

**Request:**
```
POST /jobs/123e4567-e89b-12d3-a456-426614174002/complete
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174002",
  "request_id": "123e4567-e89b-12d3-a456-426614174000",
  "provider_id": "123e4567-e89b-12d3-a456-426614174001",
  "status": "completed",
  "started_at": "2026-03-12T10:30:00.000Z",
  "completed_at": "2026-03-12T14:30:00.000Z"
}
```

### Get Jobs by Provider

**Request:**
```
GET /jobs/provider/123e4567-e89b-12d3-a456-426614174001
```

**Response:**
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174002",
    "request_id": "123e4567-e89b-12d3-a456-426614174000",
    "provider_id": "123e4567-e89b-12d3-a456-426614174001",
    "status": "completed",
    "started_at": "2026-03-12T10:30:00.000Z",
    "completed_at": "2026-03-12T14:30:00.000Z"
  }
]
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
NODE_ENV=development
PORT=3005

DATABASE_HOST=localhost
DATABASE_PORT=5436
DATABASE_NAME=job_service_db
DATABASE_USER=job_service_user
DATABASE_PASSWORD=job_service_password
```

## Installation

```bash
# Install dependencies
npm install
```

## Running the Service

### Development Mode

```bash
npm run start:dev
```

### Production Mode

```bash
npm run build
npm run start:prod
```

### Using Docker

```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f job-service

# Stop containers
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

## Project Structure

```
src/
├── main.ts                    # Application entry point
├── app.module.ts              # Root module
├── common/                    # Shared modules
│   ├── config/
│   │   └── winston.config.ts  # Logger configuration
│   ├── database/
│   │   └── database.module.ts # Database connection
│   ├── filters/
│   │   └── http-exception.filter.ts # Global exception handler
│   ├── exceptions/
│   │   └── http.exceptions.ts # Custom exceptions
│   └── logger/
│       └── logger.module.ts   # Logger module
└── modules/
    └── job/
        ├── controllers/       # HTTP controllers
        ├── services/          # Business logic
        ├── repositories/      # Database operations
        ├── dto/              # Data transfer objects
        ├── entities/         # Database entities
        └── job.module.ts     # Job module
```

## Validation Rules

### Create Job DTO

- `request_id`: Must be a valid UUID
- `provider_id`: Must be a valid UUID

### Update Job Status DTO

- `status`: Must be one of: pending, in_progress, completed, cancelled

### Business Rules

- A job can only be created once per request (enforced at database level)
- Completed jobs cannot be updated
- Cancelled jobs cannot be updated
- Completing a job sets the `completed_at` timestamp automatically

## Job Lifecycle

Jobs follow this lifecycle:

```
pending → in_progress → completed
         ↓
      cancelled
```

Valid transitions:
- `pending` → `in_progress` ✓
- `pending` → `cancelled` ✓
- `in_progress` → `completed` ✓
- `in_progress` → `cancelled` ✓
- `completed` → Cannot change ✗
- `cancelled` → Cannot change ✗

## Error Handling

The service uses custom exceptions with proper HTTP status codes:

- `BadRequestException` (400): Validation errors, invalid status transitions
- `NotFoundException` (404): Job not found
- `ConflictException` (409): Job already exists for request
- `UnauthorizedException` (401): Authentication errors
- `ForbiddenException` (403): Authorization errors

All errors are logged with context using Winston logger.

## Logging

Structured logging with Winston:

- Console output (colored, development)
- File output (JSON format, production)
- Log levels: error, warn, info, debug
- Request context included in logs

## Database Connection

PostgreSQL connection pool configuration:

- Max connections: 20
- Idle timeout: 30 seconds
- Connection timeout: 2 seconds
- Health check on initialization

## Service Boundaries

This service **owns** the following tables:
- `jobs`

Do **not** perform direct database joins with other services. Use API calls instead.

## Features

### Automatic Timestamp Management

- `started_at` - Set automatically when job is created
- `completed_at` - Set automatically when job is completed

### Duplicate Prevention

The service prevents creating multiple jobs for the same request using:
- Database unique constraint on `request_id`
- Application-level validation in the service layer

### Status Tracking

Full job lifecycle tracking with status validation to prevent invalid state transitions.

### Query Capabilities

- Get job by ID
- Get all jobs for a provider
- Get all jobs by status
- Ordered by start date (most recent first)

## Health Check

```bash
# Check if service is running
curl http://localhost:3005/jobs

# Check database connection
docker-compose exec postgres psql -U job_service_user -d job_service_db -c "SELECT 1"
```

## Docker Ports

- Service: `3005`
- PostgreSQL: `5436` (host) -> `5432` (container)

## Integration with Other Services

### Request Service
- Job references `request_id` from the Request Service
- Should validate request exists via API call (not implemented in basic version)

### Provider Service (User Service)
- Job references `provider_id` from the User Service
- Should validate provider exists via API call (not implemented in basic version)

### Proposal Service
- Jobs are typically created when a proposal is accepted
- Should receive notification from Proposal Service (not implemented in basic version)

### Payment Service
- Payment should be processed when job is completed
- Should notify Payment Service on completion (not implemented in basic version)

## Repository Methods

The JobRepository implements the following methods:

- `createJob(dto)` - Create new job with pending status
- `getJobById(id)` - Retrieve job by ID
- `updateJobStatus(id, status)` - Update job status
- `completeJob(id)` - Mark job as completed with timestamp
- `getJobByRequestId(requestId)` - Find job by request
- `getJobsByProvider(providerId)` - List provider's jobs
- `getJobsByStatus(status)` - Filter jobs by status

## Contributing

1. Follow NestJS module architecture
2. Use parameterized SQL queries to prevent SQL injection
3. Validate all inputs with DTOs
4. Log all operations with context
5. Write tests for new features
6. Follow the repository patterns

## License

ISC
