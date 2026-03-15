# Request Service

Production-grade microservice for managing service requests in the Local Service Marketplace platform.

## Overview

The Request Service handles the lifecycle of service requests, including creation, retrieval, updates, and deletion. It manages service categories and provides pagination support for large datasets.

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

- `service_requests` - Service request records
- `service_categories` - Available service categories
- `service_request_search` - Full-text search vectors

## API Endpoints

### Requests

- `POST /requests` - Create a new service request
- `GET /requests` - Get paginated list of requests (with filters)
- `GET /requests/:id` - Get request by ID
- `PATCH /requests/:id` - Update a request
- `DELETE /requests/:id` - Delete a request
- `GET /requests/user/:userId` - Get all requests for a specific user

### Categories

- `GET /categories` - Get all service categories
- `GET /categories/:id` - Get category by ID
- `POST /categories` - Create a new category

## Request/Response Examples

### Create Request

**Request:**
```json
POST /requests
{
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "category_id": "123e4567-e89b-12d3-a456-426614174001",
  "location_id": "123e4567-e89b-12d3-a456-426614174002",
  "description": "Need a plumber to fix a leaky faucet in the kitchen",
  "budget": 100
}
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174003",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "category_id": "123e4567-e89b-12d3-a456-426614174001",
  "location_id": "123e4567-e89b-12d3-a456-426614174002",
  "description": "Need a plumber to fix a leaky faucet in the kitchen",
  "budget": 100,
  "status": "pending",
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

### Get Requests (Paginated)

**Request:**
```
GET /requests?user_id=123e4567-e89b-12d3-a456-426614174000&limit=20&status=pending
```

**Response:**
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174003",
      "user_id": "123e4567-e89b-12d3-a456-426614174000",
      "category_id": "123e4567-e89b-12d3-a456-426614174001",
      "description": "Need a plumber to fix a leaky faucet",
      "budget": 100,
      "status": "pending",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "nextCursor": "123e4567-e89b-12d3-a456-426614174003",
  "hasMore": false
}
```

### Update Request

**Request:**
```json
PATCH /requests/123e4567-e89b-12d3-a456-426614174003
{
  "status": "in_progress",
  "budget": 150
}
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174003",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "category_id": "123e4567-e89b-12d3-a456-426614174001",
  "description": "Need a plumber to fix a leaky faucet",
  "budget": 150,
  "status": "in_progress",
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
NODE_ENV=development
PORT=3003

DATABASE_HOST=localhost
DATABASE_PORT=5434
DATABASE_NAME=request_service_db
DATABASE_USER=request_service_user
DATABASE_PASSWORD=request_service_password
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
docker-compose logs -f request-service

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
    └── request/
        ├── controllers/       # HTTP controllers
        ├── services/          # Business logic
        ├── repositories/      # Database operations
        ├── dto/              # Data transfer objects
        ├── entities/         # Database entities
        └── request.module.ts # Request module
```

## Validation Rules

### Create Request DTO

- `user_id`: Must be a valid UUID
- `category_id`: Must be a valid UUID and exist in database
- `location_id`: Optional, must be a valid UUID if provided
- `description`: Minimum 10 characters
- `budget`: Must be a positive number

### Update Request DTO

- All fields are optional
- Same validation rules as Create Request DTO when provided
- `status`: Must be one of: pending, in_progress, completed, cancelled

### Request Query DTO

- `user_id`: Optional UUID filter
- `category_id`: Optional UUID filter
- `status`: Optional status filter
- `limit`: Between 1 and 100 (default: 20)
- `cursor`: Optional cursor for pagination

## Error Handling

The service uses custom exceptions with proper HTTP status codes:

- `BadRequestException` (400): Validation errors
- `NotFoundException` (404): Resource not found
- `ConflictException` (409): Resource conflicts
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
- `service_requests`
- `service_categories`
- `service_request_search`

Do **not** perform direct database joins with other services. Use API calls instead.

## Health Check

```bash
# Check if service is running
curl http://localhost:3003/requests

# Check database connection
docker-compose exec postgres psql -U request_service_user -d request_service_db -c "SELECT 1"
```

## Docker Ports

- Service: `3003`
- PostgreSQL: `5434` (host) -> `5432` (container)

## Contributing

1. Follow NestJS module architecture
2. Use parameterized SQL queries to prevent SQL injection
3. Validate all inputs with DTOs
4. Log all operations with context
5. Write tests for new features
6. Follow the repository patterns

## License

ISC
