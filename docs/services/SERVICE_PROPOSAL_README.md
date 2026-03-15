# Proposal Service

Production-grade microservice for managing service proposals in the Local Service Marketplace platform.

## Overview

The Proposal Service handles the submission, retrieval, acceptance, and rejection of proposals from service providers responding to customer requests.

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

- `proposals` - Proposal records from providers

## API Endpoints

### Proposals

- `POST /proposals` - Submit a new proposal
- `GET /requests/:requestId/proposals` - Get all proposals for a specific request
- `POST /proposals/:id/accept` - Accept a proposal
- `POST /proposals/:id/reject` - Reject a proposal
- `GET /proposals/:id` - Get proposal by ID

## Request/Response Examples

### Submit Proposal

**Request:**
```json
POST /proposals
{
  "request_id": "123e4567-e89b-12d3-a456-426614174000",
  "provider_id": "123e4567-e89b-12d3-a456-426614174001",
  "price": 150,
  "message": "I can complete this job within 2 days with high quality work"
}
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174002",
  "request_id": "123e4567-e89b-12d3-a456-426614174000",
  "provider_id": "123e4567-e89b-12d3-a456-426614174001",
  "price": 150,
  "message": "I can complete this job within 2 days with high quality work",
  "status": "pending",
  "created_at": "2026-03-12T10:30:00.000Z"
}
```

### Get Proposals for Request

**Request:**
```
GET /requests/123e4567-e89b-12d3-a456-426614174000/proposals
```

**Response:**
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174002",
      "request_id": "123e4567-e89b-12d3-a456-426614174000",
      "provider_id": "123e4567-e89b-12d3-a456-426614174001",
      "price": 150,
      "message": "I can complete this job within 2 days with high quality work",
      "status": "pending",
      "created_at": "2026-03-12T10:30:00.000Z"
    }
  ],
  "nextCursor": null,
  "hasMore": false
}
```

### Accept Proposal

**Request:**
```
POST /proposals/123e4567-e89b-12d3-a456-426614174002/accept
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174002",
  "request_id": "123e4567-e89b-12d3-a456-426614174000",
  "provider_id": "123e4567-e89b-12d3-a456-426614174001",
  "price": 150,
  "message": "I can complete this job within 2 days with high quality work",
  "status": "accepted",
  "created_at": "2026-03-12T10:30:00.000Z"
}
```

### Reject Proposal

**Request:**
```
POST /proposals/123e4567-e89b-12d3-a456-426614174002/reject
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174002",
  "request_id": "123e4567-e89b-12d3-a456-426614174000",
  "provider_id": "123e4567-e89b-12d3-a456-426614174001",
  "price": 150,
  "message": "I can complete this job within 2 days with high quality work",
  "status": "rejected",
  "created_at": "2026-03-12T10:30:00.000Z"
}
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
NODE_ENV=development
PORT=3004

DATABASE_HOST=localhost
DATABASE_PORT=5435
DATABASE_NAME=proposal_service_db
DATABASE_USER=proposal_service_user
DATABASE_PASSWORD=proposal_service_password
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
docker-compose logs -f proposal-service

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
    └── proposal/
        ├── controllers/       # HTTP controllers
        ├── services/          # Business logic
        ├── repositories/      # Database operations
        ├── dto/              # Data transfer objects
        ├── entities/         # Database entities
        └── proposal.module.ts # Proposal module
```

## Validation Rules

### Create Proposal DTO

- `request_id`: Must be a valid UUID
- `provider_id`: Must be a valid UUID
- `price`: Must be a positive number (integer)
- `message`: Minimum 10 characters

### Business Rules

- A provider can only submit one proposal per request (enforced at database level)
- Only proposals with status `pending` can be accepted or rejected
- Proposal status values: `pending`, `accepted`, `rejected`

## Error Handling

The service uses custom exceptions with proper HTTP status codes:

- `BadRequestException` (400): Validation errors, invalid operations
- `NotFoundException` (404): Proposal not found
- `ConflictException` (409): Duplicate proposal from same provider
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

## Pagination

Cursor-based pagination for optimal performance:

- Default limit: 20
- Maximum limit: 100
- Cursor based on `created_at` timestamp
- Returns `nextCursor` and `hasMore` flags

## Service Boundaries

This service **owns** the following tables:
- `proposals`

Do **not** perform direct database joins with other services. Use API calls instead.

## Features

### Duplicate Prevention

The service prevents providers from submitting multiple proposals for the same request using:
- Database unique constraint on `(request_id, provider_id)`
- Application-level validation in the service layer

### Status Management

Proposals follow a simple state machine:
- `pending` → `accepted` ✓
- `pending` → `rejected` ✓
- `accepted` → Cannot change
- `rejected` → Cannot change

### Query Capabilities

- Get all proposals for a specific request
- Filter by provider ID
- Filter by status
- Cursor-based pagination for large result sets

## Health Check

```bash
# Check if service is running
curl http://localhost:3004/proposals

# Check database connection
docker-compose exec postgres psql -U proposal_service_user -d proposal_service_db -c "SELECT 1"
```

## Docker Ports

- Service: `3004`
- PostgreSQL: `5435` (host) -> `5432` (container)

## Integration with Other Services

### Request Service
- Proposal references `request_id` from the Request Service
- Should validate request exists via API call (not implemented in basic version)

### Provider Service (User Service)
- Proposal references `provider_id` from the User Service
- Should validate provider exists via API call (not implemented in basic version)

### Job Service
- When a proposal is accepted, the Job Service should create a job
- Communication via API call or event (not implemented in basic version)

## Contributing

1. Follow NestJS module architecture
2. Use parameterized SQL queries to prevent SQL injection
3. Validate all inputs with DTOs
4. Log all operations with context
5. Write tests for new features
6. Follow the repository patterns

## License

ISC
