# Payment Service

A production-ready NestJS microservice for handling payments, refunds, webhooks, and coupon management in the Local Service Marketplace platform.

## Features

- **Payment Processing**: Create and manage payments for completed jobs
- **Refund Management**: Process full or partial refunds
- **Webhook Handling**: Receive and process payment gateway webhooks
- **Coupon System**: Validate and apply discount coupons
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
├── payment/                # Payment domain module
│   ├── dto/                # Data transfer objects with validation
│   ├── entities/           # Domain entities
│   ├── repositories/       # Database access layer
│   ├── services/           # Business logic
│   ├── payment.controller.ts
│   └── payment.module.ts
├── app.module.ts           # Root application module
└── main.ts                 # Application bootstrap
```

## Database Schema

The service owns the following tables:

- **payments**: Payment records with job reference, amount, status
- **payment_webhooks**: Webhook events from payment gateways
- **refunds**: Refund records linked to payments
- **coupons**: Discount coupon definitions
- **coupon_usage**: Tracks coupon usage by users

## API Endpoints

### Payment Operations

- `POST /payments` - Create a new payment
- `GET /payments/:id` - Get payment by ID
- `GET /payments/job/:jobId` - Get all payments for a job
- `POST /payments/:id/refund` - Process a refund
- `GET /payments/:id/refunds` - Get all refunds for a payment

### Webhook Management

- `POST /payments/webhook` - Handle payment gateway webhook
- `GET /payments/webhooks/unprocessed` - Get unprocessed webhooks

### Coupon Management

- `POST /payments/coupons/validate` - Validate a coupon code

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
PORT=3006
DATABASE_HOST=localhost
DATABASE_PORT=5437
DATABASE_NAME=payment_service_db
DATABASE_USER=payment_service_user
DATABASE_PASSWORD=payment_service_password
```

4. Set up the database:
```bash
# Create database
createdb payment_service_db

# Run schema
psql -d payment_service_db -f init-db.sql
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

The service will be available at `http://localhost:3006`.

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

### Create Payment

```bash
curl -X POST http://localhost:3006/payments \
  -H "Content-Type: application/json" \
  -H "x-user-id: user-123" \
  -d '{
    "jobId": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 100.00,
    "currency": "USD",
    "couponCode": "SAVE10"
  }'
```

### Get Payment

```bash
curl http://localhost:3006/payments/550e8400-e29b-41d4-a716-446655440000
```

### Process Refund

```bash
curl -X POST http://localhost:3006/payments/550e8400-e29b-41d4-a716-446655440000/refund \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50.00
  }'
```

### Handle Webhook

```bash
curl -X POST http://localhost:3006/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "gateway": "stripe",
    "payload": {
      "paymentId": "550e8400-e29b-41d4-a716-446655440000",
      "status": "completed",
      "transactionId": "txn_123456"
    }
  }'
```

### Validate Coupon

```bash
curl -X POST http://localhost:3006/payments/coupons/validate \
  -H "Content-Type: application/json" \
  -d '{
    "couponCode": "SAVE10"
  }'
```

## Service Boundaries

This service **owns** the following data:
- Payment records
- Refund records
- Payment webhooks
- Coupon definitions
- Coupon usage tracking

This service **does not own**:
- Job data (managed by job-service)
- User data (managed by auth-service)
- Request/Proposal data (managed by request-service/proposal-service)

**Important**: Never perform cross-service database joins. Always use HTTP APIs to fetch data from other services.

## Business Logic

### Payment Creation
1. Validates job exists (external call to job-service in production)
2. Applies coupon discount if provided
3. Creates payment record with "pending" status
4. Simulates payment gateway integration
5. Updates payment status to "completed"
6. Records coupon usage if coupon was applied

### Refund Processing
1. Validates payment exists and is in "completed" status
2. Calculates refund amount (full or partial)
3. Validates refund doesn't exceed original payment
4. Creates refund record
5. Updates payment status to "refunded" if fully refunded

### Webhook Handling
1. Stores webhook payload in database
2. Processes webhook asynchronously
3. Updates payment status based on webhook data
4. Marks webhook as processed

### Coupon Validation
1. Verifies coupon exists and is not expired
2. Checks if user has already used the coupon
3. Records coupon usage
4. Returns discount percentage for application

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
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/payments/invalid-id",
  "method": "GET",
  "message": "Payment not found"
}
```

## Docker Deployment

### Build Image
```bash
docker build -t payment-service .
```

### Run with Docker Compose
```bash
docker-compose up -d
```

This starts:
- Payment service on port 3006
- PostgreSQL database on port 5437

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f payment-service
```

## Integration with Other Services

### Job Service
- Payment service requires job ID when creating payments
- In production, validate job exists via HTTP call to job-service

### Auth Service
- User ID passed via `x-user-id` header
- In production, implement authentication middleware

### Notification Service
- Payment status changes should trigger notifications
- Implement event publishing when Kafka/Redis is available

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Service port | `3006` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_HOST` | PostgreSQL host | `localhost` |
| `DATABASE_PORT` | PostgreSQL port | `5437` |
| `DATABASE_NAME` | Database name | `payment_service_db` |
| `DATABASE_USER` | Database user | `payment_service_user` |
| `DATABASE_PASSWORD` | Database password | `payment_service_password` |

## Performance Considerations

- **Connection Pooling**: PostgreSQL pool with max 20 connections
- **Parameterized Queries**: Prevents SQL injection, enables query plan caching
- **Indexed Columns**: job_id, status, payment_id, user_id, coupon_code
- **Async Processing**: Webhooks can be processed asynchronously in production

## Security

- Input validation on all endpoints
- Parameterized SQL queries prevent injection
- Password-protected database
- CORS enabled for cross-origin requests
- Error messages don't expose sensitive information

## Future Enhancements

- [ ] Integrate with real payment gateways (Stripe, PayPal, Square)
- [ ] Implement background job processing for webhooks
- [ ] Add payment retry logic for failed transactions
- [ ] Implement idempotency keys for duplicate prevention
- [ ] Add support for multiple currencies with conversion
- [ ] Implement payment analytics and reporting
- [ ] Add support for subscription-based payments
- [ ] Implement fraud detection mechanisms

## License

MIT

## Support

For issues and questions, please contact the development team or open an issue in the repository.
