# User Service

Production-grade user and provider management microservice for the Local Service Marketplace platform.

## Features

- ✅ Create provider profiles
- ✅ Update provider profiles
- ✅ Get provider by ID
- ✅ List providers with pagination
- ✅ Manage provider service categories
- ✅ Manage provider availability schedules
- ✅ Save favorite providers
- ✅ Get user favorites
- ✅ Location management
- ✅ Cursor-based pagination
- ✅ Search and filtering
- ✅ Structured logging with Winston
- ✅ DTO validation with class-validator
- ✅ Repository pattern for database operations
- ✅ Global exception handling
- ✅ PostgreSQL database with UUID primary keys
- ✅ Docker and Docker Compose support
- ✅ Integration tests with Jest and Supertest

## Technology Stack

- **Framework**: NestJS
- **Database**: PostgreSQL
- **Logging**: Winston
- **Validation**: class-validator
- **Testing**: Jest, Supertest
- **Containerization**: Docker

## Architecture

```
src/
├── common/
│   ├── config/
│   │   └── winston.config.ts
│   ├── database/
│   │   └── database.module.ts
│   ├── exceptions/
│   │   └── http.exceptions.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   └── logger/
│       └── logger.module.ts
├── modules/
│   └── user/
│       ├── controllers/
│       │   ├── provider.controller.ts
│       │   └── favorite.controller.ts
│       ├── dto/
│       │   ├── create-provider.dto.ts
│       │   ├── update-provider.dto.ts
│       │   ├── provider-query.dto.ts
│       │   ├── create-favorite.dto.ts
│       │   ├── provider-response.dto.ts
│       │   └── paginated-response.dto.ts
│       ├── entities/
│       │   ├── provider.entity.ts
│       │   ├── provider-service.entity.ts
│       │   ├── provider-availability.entity.ts
│       │   ├── favorite.entity.ts
│       │   └── location.entity.ts
│       ├── repositories/
│       │   ├── provider.repository.ts
│       │   ├── provider-service.repository.ts
│       │   ├── provider-availability.repository.ts
│       │   ├── favorite.repository.ts
│       │   └── location.repository.ts
│       ├── services/
│       │   ├── provider.service.ts
│       │   └── favorite.service.ts
│       └── user.module.ts
├── app.module.ts
└── main.ts
```

## Database Tables Owned

- `providers`
- `provider_services`
- `provider_availability`
- `favorites`
- `locations`

## API Endpoints

### Provider Management

#### POST /providers

Create a new provider profile.

**Request Body:**
```json
{
  "user_id": "uuid",
  "business_name": "Joe's Plumbing",
  "description": "Professional plumbing services",
  "service_categories": ["uuid-1", "uuid-2"],
  "availability": [
    {
      "day_of_week": 1,
      "start_time": "09:00",
      "end_time": "17:00"
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "business_name": "Joe's Plumbing",
  "description": "Professional plumbing services",
  "rating": null,
  "services": [...],
  "availability": [...],
  "created_at": "2026-03-12T10:00:00Z"
}
```

#### GET /providers/:id

Get a provider by ID.

**Response:** `200 OK`

#### GET /providers

List providers with pagination.

**Query Parameters:**
- `limit` (optional): Number of results (default: 20, max: 100)
- `cursor` (optional): Cursor for pagination
- `category_id` (optional): Filter by service category
- `search` (optional): Search by business name or description
- `location_id` (optional): Filter by location

**Response:** `200 OK`
```json
{
  "data": [...],
  "pagination": {
    "limit": 20,
    "nextCursor": "uuid",
    "hasMore": true
  }
}
```

#### PATCH /providers/:id

Update a provider profile.

**Request Body:**
```json
{
  "business_name": "Updated Name",
  "description": "Updated description",
  "service_categories": ["uuid-1"],
  "availability": [...]
}
```

**Response:** `200 OK`

#### DELETE /providers/:id

Delete a provider profile.

**Response:** `204 No Content`

### Favorites Management

#### POST /favorites

Save a favorite provider.

**Request Body:**
```json
{
  "user_id": "uuid",
  "provider_id": "uuid"
}
```

**Response:** `201 Created`

#### GET /favorites

Get user's favorite providers.

**Query Parameters:**
- `user_id`: User ID

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "provider_id": "uuid",
    "provider_name": "Joe's Plumbing",
    "provider_description": "...",
    "provider_rating": 4.5,
    "created_at": "2026-03-12T10:00:00Z"
  }
]
```

#### DELETE /favorites/:provider_id

Remove a favorite provider.

**Query Parameters:**
- `user_id`: User ID

**Response:** `204 No Content`

## Installation

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Docker & Docker Compose (optional)

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Create database:**
   ```bash
   createdb marketplace_user
   psql marketplace_user < ../../database/schema.sql
   ```

4. **Run in development mode:**
   ```bash
   npm run start:dev
   ```

### Using Docker

1. **Build and run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

   This will start both PostgreSQL and the user service.

2. **Run in detached mode:**
   ```bash
   docker-compose up -d
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f user-service
   ```

4. **Stop services:**
   ```bash
   docker-compose down
   ```

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:e2e
```

### Test Coverage
```bash
npm run test:cov
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | `development` |
| `PORT` | Service port | `3002` |
| `DATABASE_HOST` | PostgreSQL host | `localhost` |
| `DATABASE_PORT` | PostgreSQL port | `5432` |
| `DATABASE_USER` | Database user | `postgres` |
| `DATABASE_PASSWORD` | Database password | `postgres` |
| `DATABASE_NAME` | Database name | `marketplace_user` |
| `DEFAULT_PAGE_LIMIT` | Default pagination limit | `20` |
| `MAX_PAGE_LIMIT` | Maximum pagination limit | `100` |
| `AUTH_SERVICE_URL` | Auth service URL | `http://localhost:3001` |

## Pagination

This service uses **cursor-based pagination** for efficient data retrieval:

- Use `limit` parameter to control page size
- Use `cursor` parameter (provider ID) to fetch next page
- Response includes `nextCursor` and `hasMore` indicators

**Example:**
```bash
# First page
GET /providers?limit=20

# Next page
GET /providers?limit=20&cursor=<nextCursor from previous response>
```

## Search and Filtering

Providers can be filtered by:
- **Category**: `category_id`
- **Location**: `location_id`
- **Search**: `search` (searches in business name and description)

**Example:**
```bash
GET /providers?category_id=abc123&search=plumbing&limit=10
```

## Architecture Patterns

- **Layered Architecture**: Controllers → Services → Repositories
- **Repository Pattern**: Database abstraction layer
- **DTO Validation**: Input validation with class-validator
- **Parameterized Queries**: SQL injection protection
- **No Cross-Service Joins**: Follow microservice boundaries
- **Structured Logging**: Contextual logging with Winston
- **Global Exception Handling**: Centralized error responses

## Service Boundaries

This service **owns** the following tables:
- providers
- provider_services
- provider_availability
- favorites
- locations

**Never directly query tables from other services**. Use HTTP APIs instead.

## Production Considerations

1. **Database Indexes**: Add indexes on frequently queried columns
2. **Connection Pooling**: Already configured (max: 20 connections)
3. **Rate Limiting**: Implement at API gateway level
4. **Caching**: Consider Redis for frequently accessed data
5. **Monitoring**: Set up health checks and metrics
6. **Database Backups**: Regular automated backups
7. **Logging**: Centralize logs (e.g., ELK stack)

## License

MIT
