# Messaging Service

A production-ready NestJS microservice for handling real-time messaging and file attachments in the Local Service Marketplace platform.

## Features

- **Message Management**: Send and retrieve messages within job conversations
- **Attachment Support**: Upload and manage file attachments for any entity
- **Pagination**: Efficient pagination for message history
- **Job Conversations**: Thread messages by job ID for organized communication
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
├── messaging/              # Messaging domain module
│   ├── dto/                # Data transfer objects with validation
│   ├── entities/           # Domain entities
│   ├── repositories/       # Database access layer
│   ├── services/           # Business logic
│   ├── messaging.controller.ts
│   └── messaging.module.ts
├── app.module.ts           # Root application module
└── main.ts                 # Application bootstrap
```

## Database Schema

The service owns the following tables:

- **messages**: Conversation messages linked to jobs
- **attachments**: Generic file attachments for any entity (messages, proposals, etc.)

## API Endpoints

### Message Operations

- `POST /messages` - Send a message
- `GET /messages/:id` - Get message by ID
- `GET /messages/jobs/:jobId/messages` - Get job conversation with pagination

### Attachment Operations

- `POST /messages/attachments` - Upload an attachment
- `GET /messages/attachments/:id` - Get attachment by ID
- `GET /messages/attachments/:entityType/:entityId` - Get attachments for an entity

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
PORT=3007
DATABASE_HOST=localhost
DATABASE_PORT=5438
DATABASE_NAME=messaging_service_db
DATABASE_USER=messaging_service_user
DATABASE_PASSWORD=messaging_service_password
```

4. Set up the database:
```bash
# Create database
createdb messaging_service_db

# Run schema
psql -d messaging_service_db -f init-db.sql
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

The service will be available at `http://localhost:3007`.

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

### Send Message

```bash
curl -X POST http://localhost:3007/messages \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "550e8400-e29b-41d4-a716-446655440000",
    "senderId": "660e8400-e29b-41d4-a716-446655440001",
    "message": "Hello, when can you start the job?"
  }'
```

### Get Job Conversation (with pagination)

```bash
curl "http://localhost:3007/messages/jobs/550e8400-e29b-41d4-a716-446655440000/messages?page=1&limit=20"
```

Response:
```json
{
  "data": [
    {
      "id": "...",
      "jobId": "550e8400-e29b-41d4-a716-446655440000",
      "senderId": "660e8400-e29b-41d4-a716-446655440001",
      "message": "Hello, when can you start the job?",
      "createdAt": "2026-03-12T10:30:00.000Z"
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 20,
  "hasMore": false
}
```

### Get Message by ID

```bash
curl http://localhost:3007/messages/550e8400-e29b-41d4-a716-446655440000
```

### Upload Attachment

```bash
curl -X POST http://localhost:3007/messages/attachments \
  -H "Content-Type: application/json" \
  -d '{
    "entityType": "message",
    "entityId": "550e8400-e29b-41d4-a716-446655440000",
    "fileUrl": "https://s3.amazonaws.com/bucket/file.pdf"
  }'
```

### Get Attachments for Entity

```bash
curl http://localhost:3007/messages/attachments/message/550e8400-e29b-41d4-a716-446655440000
```

## Service Boundaries

This service **owns** the following data:
- Message records
- Attachment records (generic for all entity types)

This service **does not own**:
- Job data (managed by job-service)
- User data (managed by auth-service)
- Request/Proposal data (managed by request-service/proposal-service)

**Important**: Never perform cross-service database joins. Always use HTTP APIs to fetch data from other services.

## Business Logic

### Message Creation
1. Validates job ID and sender ID (UUIDs)
2. Validates message content is not empty
3. Creates message record with timestamp
4. Returns created message

### Message Retrieval (Job Conversation)
1. Validates job ID exists
2. Counts total messages for the job
3. Retrieves paginated messages ordered by creation time (ASC for chronological order)
4. Returns paginated response with metadata (total, page, limit, hasMore)

### Attachment Management
1. Attachments are generic and can link to any entity (messages, proposals, jobs, etc.)
2. Uses `entity_type` and `entity_id` for flexible linking
3. Stores file URL (actual file storage handled by external service like S3)
4. Supports querying attachments by entity type and ID

## Pagination

All list endpoints support pagination:

- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Items per page

Response includes:
- `data`: Array of items
- `total`: Total count
- `page`: Current page
- `limit`: Items per page
- `hasMore`: Boolean indicating if more pages exist

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
  "path": "/messages/invalid-id",
  "method": "GET",
  "message": "Message not found"
}
```

## Docker Deployment

### Build Image
```bash
docker build -t messaging-service .
```

### Run with Docker Compose
```bash
docker-compose up -d
```

This starts:
- Messaging service on port 3007
- PostgreSQL database on port 5438

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f messaging-service
```

## Integration with Other Services

### Job Service
- Messages are grouped by job ID
- In production, validate job exists via HTTP call to job-service

### Auth Service
- Sender ID references users from auth-service
- In production, authenticate and authorize users via auth-service

### Notification Service
- New messages should trigger notifications
- Implement event publishing when Kafka/Redis is available

### File Storage Service
- Attachments store URLs to files hosted externally (S3, Azure Blob, etc.)
- Actual file upload/download handled by separate service

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | `3007` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_HOST` | PostgreSQL host | `localhost` |
| `DATABASE_PORT` | PostgreSQL port | `5438` |
| `DATABASE_NAME` | Database name | `messaging_service_db` |
| `DATABASE_USER` | Database user | `messaging_service_user` |
| `DATABASE_PASSWORD` | Database password | `messaging_service_password` |

## Performance Considerations

- **Connection Pooling**: PostgreSQL pool with max 20 connections
- **Parameterized Queries**: Prevents SQL injection, enables query plan caching
- **Indexed Columns**: job_id, sender_id, created_at, entity_type+entity_id
- **Pagination**: Default limit of 20 messages prevents large data transfers
- **Message Ordering**: ASC order for chronological conversation flow

## Security

- Input validation on all endpoints
- Parameterized SQL queries prevent injection
- Password-protected database
- CORS enabled for cross-origin requests
- Error messages don't expose sensitive information
- URL validation for attachment file URLs

## Future Enhancements

- [ ] Real-time messaging with WebSockets
- [ ] Message read receipts and status tracking
- [ ] Message editing and deletion
- [ ] Rich text message formatting support
- [ ] Direct file upload endpoint (currently stores URLs only)
- [ ] Message search and filtering
- [ ] Typing indicators
- [ ] Message reactions and emoji support
- [ ] Conversation archival and export
- [ ] Message encryption for sensitive data

## License

MIT

## Support

For issues and questions, please contact the development team or open an issue in the repository.
