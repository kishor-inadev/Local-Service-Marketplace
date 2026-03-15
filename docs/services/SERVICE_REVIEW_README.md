# Review Service

A production-ready NestJS microservice for managing reviews and ratings in the Local Service Marketplace platform.

## Features

- **Review Management**: Create and store reviews for completed jobs
- **Provider Reviews**: List all reviews for a specific provider
- **Provider Rating**: Calculate average rating and total review count
- **Pagination Support**: Efficient pagination with limit and offset parameters
- **Rating Validation**: Ensures ratings are between 1-5
- **Database Transactions**: PostgreSQL with connection pooling
- **Structured Logging**: Winston-based logging with file and console transports
- **Input Validation**: DTO validation using class-validator
- **Error Handling**: Global exception filters with standardized responses
- **E2E Testing**: Comprehensive integration tests with Jest and Supertest
- **Docker Support**: Full containerization with Docker Compose

## Architecture

This service follows the NestJS modular architecture:

```
src/
├── common/                 # Shared infrastructure
│   ├── config/             # Winston configuration
│   ├── database/           # Database connection module
│   ├── exceptions/         # Custom exception classes
│   ├── filters/            # Global exception filters
│   └── logger/             # Logger module
├── review/                 # Review domain module
│   ├── dto/                # Data transfer objects with validation
│   ├── entities/           # Domain entities
│   ├── repositories/       # Database access layer
│   ├── services/           # Business logic
│   ├── review.controller.ts
│   └── review.module.ts
├── app.module.ts           # Root application module
└── main.ts                 # Application bootstrap
```

## Database Schema

The service owns the following table:

- **reviews**: job_id, user_id, provider_id, rating (1-5), comment, created_at

## API Endpoints

### Review Operations

- `POST /reviews` - Create a new review
- `GET /reviews/:id` - Get review by ID

### Provider Reviews

- `GET /providers/:providerId/reviews` - Get all reviews for a provider (with pagination)
- `GET /providers/:providerId/rating` - Get average rating and total review count

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 16+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your database credentials:
```env
PORT=3009
DATABASE_HOST=localhost
DATABASE_PORT=5440
DATABASE_NAME=review_service_db
DATABASE_USER=review_service_user
DATABASE_PASSWORD=review_service_password
```

4. Set up the database:
```bash
# Create database
createdb review_service_db

# Run schema
psql -d review_service_db -f init-db.sql
```

### Running the Service

#### Development Mode
```bash
npm run start:dev
```

#### Production Mode
```bash
npm run build
npm run start:prod
```

#### Docker Compose
```bash
docker-compose up --build
```

The service will be available at `http://localhost:3009`.

## Testing

### Run E2E Tests
```bash
npm run test:e2e
```

### Run Unit Tests
```bash
npm run test
```

### Test Coverage
```bash
npm run test:cov
```

## API Examples

### Create Review

```bash
curl -X POST http://localhost:3009/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "550e8400-e29b-41d4-a716-446655440001",
    "providerId": "550e8400-e29b-41d4-a716-446655440002",
    "rating": 5,
    "comment": "Excellent service! Highly recommended."
  }'
```

Response:
```json
{
  "id": "...",
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "550e8400-e29b-41d4-a716-446655440001",
  "providerId": "550e8400-e29b-41d4-a716-446655440002",
  "rating": 5,
  "comment": "Excellent service! Highly recommended.",
  "createdAt": "2026-03-12T10:30:00.000Z"
}
```

### Get Review by ID

```bash
curl http://localhost:3009/reviews/550e8400-e29b-41d4-a716-446655440000
```

### Get Provider Reviews

```bash
curl http://localhost:3009/providers/550e8400-e29b-41d4-a716-446655440002/reviews
```

Response:
```json
{
  "reviews": [
    {
      "id": "...",
      "jobId": "550e8400-e29b-41d4-a716-446655440000",
      "userId": "550e8400-e29b-41d4-a716-446655440001",
      "providerId": "550e8400-e29b-41d4-a716-446655440002",
      "rating": 5,
      "comment": "Excellent service! Highly recommended.",
      "createdAt": "2026-03-12T10:30:00.000Z"
    }
  ],
  "total": 10,
  "averageRating": 4.7
}
```

### Get Provider Reviews with Pagination

```bash
curl "http://localhost:3009/providers/550e8400-e29b-41d4-a716-446655440002/reviews?limit=10&offset=0"
```

### Get Provider Rating

```bash
curl http://localhost:3009/providers/550e8400-e29b-41d4-a716-446655440002/rating
```

Response:
```json
{
  "averageRating": 4.7,
  "totalReviews": 23
}
```

## Service Boundaries

This service **owns** the following data:
- Review records (rating, comment, timestamps)

This service **does not own**:
- User data (managed by auth-service)
- Provider data (managed by user-service)
- Job data (managed by job-service)

**Important**: Never perform cross-service database joins. Always use HTTP APIs to fetch data from other services.

## Business Logic

### Create Review
1. Validates review data (rating 1-5, all required fields present)
2. Validates UUID format for job_id, user_id, provider_id
3. Creates review record in database
4. Returns created review with generated ID and timestamp

### List Provider Reviews
1. Fetches reviews for specified provider ID
2. Orders by created_at DESC (newest first)
3. Applies pagination (limit and offset)
4. Calculates average rating and total review count
5. Returns reviews array with metadata

### Calculate Provider Rating
1. Queries all reviews for provider
2. Calculates average rating using SQL AVG function
3. Counts total number of reviews
4. Returns average rating (0-5) and total count

## Rating System

- **Rating Scale**: 1-5 stars (integer values only)
- **Validation**: Enforced at both DTO and database level
- **Calculation**: Average rating rounded to 1 decimal place
- **Display**: Typically shown as stars or numeric value

## Pagination

All list endpoints support pagination:

- **limit**: Number of records per page (default: 20)
- **offset**: Number of records to skip (default: 0)

Example:
```bash
# Page 1 (first 20 reviews)
GET /providers/{providerId}/reviews?limit=20&offset=0

# Page 2 (next 20 reviews)
GET /providers/{providerId}/reviews?limit=20&offset=20

# Page 3 (next 20 reviews)
GET /providers/{providerId}/reviews?limit=20&offset=40
```

## Logging

The service uses Winston for structured logging:

- **Console**: Colorized logs for development
- **Files**: 
  - `logs/error.log` - Error level logs
  - `logs/combined.log` - All logs

Log format includes:
- Timestamp
- Context (service/module name)
- Log level
- Message
- Metadata (request details, errors, etc.)

## Error Handling

Standardized error responses:

```json
{
  "statusCode": 404,
  "timestamp": "2026-03-12T10:30:00.000Z",
  "path": "/reviews/invalid-id",
  "method": "GET",
  "message": "Review not found"
}
```

## Validation Rules

### CreateReviewDto

- **jobId**: Required, must be valid UUID
- **userId**: Required, must be valid UUID
- **providerId**: Required, must be valid UUID
- **rating**: Required, integer between 1-5
- **comment**: Required, non-empty string

## Docker Deployment

### Build Image
```bash
docker build -t review-service .
```

### Run with Docker Compose
```bash
docker-compose up -d
```

This starts:
- Review service on port 3009
- PostgreSQL database on port 5440

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f review-service
```

## Integration with Other Services

### Auth Service
- User IDs validated against auth-service user records
- In production, implement authentication middleware

### User Service
- Provider IDs reference provider records in user-service
- Fetch provider details via user-service API when needed

### Job Service
- Job IDs reference completed jobs in job-service
- Only completed jobs should be eligible for reviews

### Event-Driven Architecture
When integrated with Kafka/Redis, reviews should be created via events:

```
Event: job.completed
  → Create review request sent to client
  → Client submits review
  → POST /reviews endpoint creates review
  → Emit review.created event
  → Update provider rating in cache
```

## Performance Considerations

- **Connection Pooling**: PostgreSQL pool with max 20 connections
- **Parameterized Queries**: Prevents SQL injection, enables query plan caching
- **Indexed Columns**: provider_id, job_id, user_id, rating, created_at
- **Pagination**: Default limit of 20 to prevent large data transfers
- **Rating Calculation**: Uses SQL AVG function for efficient aggregation

## Security

- Input validation on all endpoints
- Parameterized SQL queries prevent injection
- Password-protected database
- CORS enabled for cross-origin requests
- Error messages don't expose sensitive information

## Business Rules

### Review Eligibility
- Reviews can only be created for completed jobs
- Each user can only review a provider once per job
- Reviews cannot be edited or deleted (data integrity)
- Rating must be 1-5 stars

### Rating Display
- Average rating displayed with 1 decimal place
- Total review count displayed alongside rating
- Reviews sorted by date (newest first)

## Future Enhancements

- [ ] Review moderation and flagging
- [ ] Review responses (provider can reply)
- [ ] Review editing (within time limit)
- [ ] Review helpful votes (upvote/downvote)
- [ ] Review analytics and insights
- [ ] Review verification (verified purchase badge)
- [ ] Review photos/videos support
- [ ] Review templates and quick ratings
- [ ] Review reminders after job completion
- [ ] Review aggregation by time period
- [ ] Review sentiment analysis

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | `3009` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_HOST` | PostgreSQL host | `localhost` |
| `DATABASE_PORT` | PostgreSQL port | `5440` |
| `DATABASE_NAME` | Database name | `review_service_db` |
| `DATABASE_USER` | Database user | `review_service_user` |
| `DATABASE_PASSWORD` | Database password | `review_service_password` |

## License

MIT

## Support

For issues and questions, please contact the development team or open an issue in the repository.
