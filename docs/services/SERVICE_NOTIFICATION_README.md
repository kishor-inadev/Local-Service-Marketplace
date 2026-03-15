# Notification Service

A production-ready NestJS microservice for handling notifications and delivery tracking in the Local Service Marketplace platform.

## Features

- **Notification Management**: Create and store notifications for users
- **Mark as Read**: Track read/unread notification status
- **Multi-Channel Delivery**: Support for email, push, and SMS notifications
- **Delivery Tracking**: Monitor delivery status across channels
- **Worker Services**: Background processing for email and push notifications
- **Unread Count**: Query unread notification counts per user
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
├── notification/           # Notification domain module
│   ├── dto/                # Data transfer objects with validation
│   ├── entities/           # Domain entities
│   ├── repositories/       # Database access layer
│   ├── services/           # Business logic + worker services
│   ├── notification.controller.ts
│   └── notification.module.ts
├── app.module.ts           # Root application module
└── main.ts                 # Application bootstrap
```

## Database Schema

The service owns the following tables:

- **notifications**: User notifications with type, message, read status
- **notification_deliveries**: Delivery tracking across channels (email, push, sms)

## API Endpoints

### Notification Operations

- `GET /notifications` - Get notifications for a user (with unread count)
- `GET /notifications/:id` - Get notification by ID
- `PATCH /notifications/:id/read` - Mark notification as read

### Worker Endpoints

- `POST /notifications/workers/process-emails` - Process pending email deliveries
- `POST /notifications/workers/process-push` - Process pending push notifications

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
PORT=3008
DATABASE_HOST=localhost
DATABASE_PORT=5439
DATABASE_NAME=notification_service_db
DATABASE_USER=notification_service_user
DATABASE_PASSWORD=notification_service_password
```

4. Set up the database:
```bash
# Create database
createdb notification_service_db

# Run schema
psql -d notification_service_db -f init-db.sql
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

The service will be available at `http://localhost:3008`.

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

### Get User Notifications

```bash
curl http://localhost:3008/notifications \
  -H "x-user-id: 550e8400-e29b-41d4-a716-446655440000"
```

Response:
```json
{
  "notifications": [
    {
      "id": "...",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "type": "job_accepted",
      "message": "Your job proposal has been accepted",
      "read": false,
      "createdAt": "2026-03-12T10:30:00.000Z"
    }
  ],
  "unreadCount": 5
}
```

### Get User Notifications with Limit

```bash
curl "http://localhost:3008/notifications?limit=10" \
  -H "x-user-id: 550e8400-e29b-41d4-a716-446655440000"
```

### Get Notification by ID

```bash
curl http://localhost:3008/notifications/550e8400-e29b-41d4-a716-446655440000
```

### Mark Notification as Read

```bash
curl -X PATCH http://localhost:3008/notifications/550e8400-e29b-41d4-a716-446655440000/read
```

### Process Email Queue (Worker)

```bash
curl -X POST http://localhost:3008/notifications/workers/process-emails
```

### Process Push Notification Queue (Worker)

```bash
curl -X POST http://localhost:3008/notifications/workers/process-push
```

## Service Boundaries

This service **owns** the following data:
- Notification records
- Notification delivery tracking records

This service **does not own**:
- User data (managed by auth-service)
- Job/Request/Proposal data (managed by respective services)

**Important**: Never perform cross-service database joins. Always use HTTP APIs to fetch data from other services.

## Business Logic

### Notification Creation
1. Creates notification record with user ID, type, and message
2. Sets read status to false by default
3. Creates delivery records for email and push channels with pending status
4. Returns created notification

### Mark as Read
1. Validates notification exists
2. Updates read status to true (idempotent operation)
3. Returns updated notification

### Email Worker
1. Fetches pending email deliveries from database
2. Processes each delivery (simulated in development, integrates with SendGrid/AWS SES in production)
3. Updates delivery status to 'sent' or 'failed'
4. Logs all operations for monitoring

### Push Notification Worker
1. Fetches pending push notification deliveries from database
2. Processes each delivery (simulated in development, integrates with FCM/APNs in production)
3. Updates delivery status to 'sent' or 'failed'
4. Logs all operations for monitoring

## Notification Types

Common notification types in the marketplace:

- `job_accepted` - Job proposal accepted
- `job_completed` - Job marked as complete
- `payment_received` - Payment processed successfully
- `new_proposal` - New proposal received on request
- `message_received` - New message in job conversation
- `review_submitted` - New review received

## Worker Services

Worker services are designed to process notification deliveries asynchronously:

### Email Worker
- **Purpose**: Send email notifications via external email service
- **Trigger**: Scheduled (cron job) or manual via API endpoint
- **Integration**: SendGrid, AWS SES, Mailgun, etc.
- **Error Handling**: Failed deliveries marked as 'failed' for retry logic

### Push Worker
- **Purpose**: Send push notifications to mobile devices
- **Trigger**: Scheduled (cron job) or manual via API endpoint
- **Integration**: Firebase Cloud Messaging (FCM), Apple Push Notification Service (APNs)
- **Error Handling**: Failed deliveries marked as 'failed' for retry logic

### Production Setup

In production, workers should be triggered by:
1. **Cron Jobs**: Scheduled to run every minute/few minutes
2. **Message Queue**: Triggered by Kafka/Redis events
3. **Kubernetes CronJob**: Scheduled pod execution

Example cron job setup:
```bash
# Run every minute
* * * * * curl -X POST http://notification-service:3008/notifications/workers/process-emails
* * * * * curl -X POST http://notification-service:3008/notifications/workers/process-push
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
  "path": "/notifications/invalid-id",
  "method": "GET",
  "message": "Notification not found"
}
```

## Docker Deployment

### Build Image
```bash
docker build -t notification-service .
```

### Run with Docker Compose
```bash
docker-compose up -d
```

This starts:
- Notification service on port 3008
- PostgreSQL database on port 5439

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f notification-service
```

## Integration with Other Services

### Auth Service
- User ID passed via `x-user-id` header
- In production, implement authentication middleware

### Event-Driven Architecture
When integrated with Kafka/Redis, notifications should be created via events:

```
Event: job.accepted
  → Create notification (type: 'job_accepted')
  → Create delivery records
  → Workers process deliveries

Event: message.received
  → Create notification (type: 'message_received')
  → Create delivery records
  → Workers process deliveries
```

### External Integrations

**Email Services:**
- SendGrid
- AWS SES
- Mailgun
- Postmark

**Push Notification Services:**
- Firebase Cloud Messaging (FCM) - Android/iOS
- Apple Push Notification Service (APNs) - iOS
- OneSignal - Multi-platform

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | `3008` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_HOST` | PostgreSQL host | `localhost` |
| `DATABASE_PORT` | PostgreSQL port | `5439` |
| `DATABASE_NAME` | Database name | `notification_service_db` |
| `DATABASE_USER` | Database user | `notification_service_user` |
| `DATABASE_PASSWORD` | Database password | `notification_service_password` |

## Performance Considerations

- **Connection Pooling**: PostgreSQL pool with max 20 connections
- **Parameterized Queries**: Prevents SQL injection, enables query plan caching
- **Indexed Columns**: user_id, read, created_at, channel, status
- **Batch Processing**: Workers process up to 100 deliveries per run
- **Notification Limit**: Default 50 notifications per request to prevent large data transfers

## Security

- Input validation on all endpoints
- Parameterized SQL queries prevent injection
- Password-protected database
- CORS enabled for cross-origin requests
- Error messages don't expose sensitive information
- User ID authentication via headers

## Future Enhancements

- [ ] Integrate with real email service (SendGrid, AWS SES)
- [ ] Integrate with real push notification service (FCM, APNs)
- [ ] Implement SMS notifications via Twilio
- [ ] Add notification preferences per user
- [ ] Implement retry logic for failed deliveries
- [ ] Add notification templates
- [ ] Support for in-app notifications
- [ ] Notification grouping and batching
- [ ] Rich notification content (images, actions)
- [ ] Notification scheduling for delayed delivery
- [ ] Analytics and reporting dashboard

## License

MIT

## Support

For issues and questions, please contact the development team or open an issue in the repository.
