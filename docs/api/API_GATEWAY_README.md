# API Gateway Service

Production-grade API Gateway for the Local Service Marketplace platform. Acts as a single entry point routing requests to 12 microservices with JWT authentication, rate limiting, and comprehensive logging.

---

## Architecture

The API Gateway serves as the unified entry point for all client requests, providing:

- **Intelligent Routing**: Path-based routing to 12 microservices
- **JWT Authentication**: Validates tokens before forwarding requests
- **Rate Limiting**: 100 requests/minute per user or IP
- **Request Logging**: Comprehensive request/response logging
- **Security Headers**: helmet.js for production security
- **CORS Support**: Configurable cross-origin requests
- **Health Checks**: Gateway and microservices health monitoring

---

## Technology Stack

- **Framework**: NestJS 10.3.0
- **HTTP Client**: Axios 1.6.5 + @nestjs/axios 3.0.1
- **Authentication**: jsonwebtoken 9.0.2
- **Rate Limiting**: express-rate-limit 7.1.5
- **Security**: helmet 7.1.0
- **Logging**: Winston 3.11.0 + nest-winston 1.9.4
- **Validation**: class-validator 0.14.0, class-transformer 0.5.1
- **Testing**: Jest 29.7.0, Supertest 6.3.3

---

## Routing Configuration

### Service Routes

| Path Prefix | Microservice | Port |
|-------------|--------------|------|
| `/auth/*` | auth-service | 3001 |
| `/users/*` | user-service | 3002 |
| `/providers/*` | user-service | 3002 |
| `/requests/*` | request-service | 3003 |
| `/proposals/*` | proposal-service | 3004 |
| `/jobs/*` | job-service | 3005 |
| `/payments/*` | payment-service | 3006 |
| `/messages/*` | messaging-service | 3007 |
| `/notifications/*` | notification-service | 3008 |
| `/reviews/*` | review-service | 3009 |
| `/admin/*` | admin-service | 3010 |
| `/analytics/*` | analytics-service | 3011 |
| `/events/*` | infrastructure-service | 3012 |
| `/background-jobs/*` | infrastructure-service | 3012 |
| `/rate-limits/*` | infrastructure-service | 3012 |
| `/feature-flags/*` | infrastructure-service | 3012 |

### Public Routes (No JWT Required)

- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/password-reset/request`
- `POST /auth/password-reset/confirm`

All other routes require a valid JWT token in the `Authorization: Bearer <token>` header.

---

## Middleware Stack

Middleware is applied in the following order:

1. **LoggingMiddleware**: Logs all incoming requests and responses with timing
2. **JwtAuthMiddleware**: Validates JWT tokens (bypasses public routes)
3. **RateLimitMiddleware**: Enforces rate limits (100 req/min per user/IP)
4. **GatewayService**: Forwards requests to appropriate microservice

---

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Server Configuration
NODE_ENV=development
PORT=3000

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production

# Microservice URLs
AUTH_SERVICE_URL=http://localhost:3001
USER_SERVICE_URL=http://localhost:3002
REQUEST_SERVICE_URL=http://localhost:3003
PROPOSAL_SERVICE_URL=http://localhost:3004
JOB_SERVICE_URL=http://localhost:3005
PAYMENT_SERVICE_URL=http://localhost:3006
MESSAGING_SERVICE_URL=http://localhost:3007
NOTIFICATION_SERVICE_URL=http://localhost:3008
REVIEW_SERVICE_URL=http://localhost:3009
ADMIN_SERVICE_URL=http://localhost:3010
ANALYTICS_SERVICE_URL=http://localhost:3011
INFRASTRUCTURE_SERVICE_URL=http://localhost:3012

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Installation

```bash
# Install dependencies
npm install

# Generate .env file
cp .env.example .env

# Update .env with your configuration
```

---

## Running the Gateway

### Development Mode

```bash
npm run start:dev
```

### Production Mode

```bash
# Build
npm run build

# Start
npm run start:prod
```

### Docker

```bash
# Build image
docker build -t api-gateway .

# Run container
docker run -p 3000:3000 --env-file .env api-gateway

# Using docker-compose
docker-compose up -d
```

---

## API Examples

### Authentication Required

```bash
# Get user profile
curl -X GET http://localhost:3000/users/me \
  -H "Authorization: Bearer <your-jwt-token>"

# Create service request
curl -X POST http://localhost:3000/requests \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "categoryId": "uuid",
    "description": "Need a plumber",
    "budget": 150
  }'
```

### Public Routes

```bash
# Signup
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "name": "John Doe",
    "role": "customer"
  }'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

---

## Health Checks

### Gateway Health

```bash
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-20T10:00:00.000Z",
  "gateway": "api-gateway",
  "uptime": 3600
}
```

### Microservices Health

```bash
GET /health/services
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-20T10:00:00.000Z",
  "services": {
    "auth": {
      "status": "healthy",
      "url": "http://localhost:3001",
      "responseTime": "35ms"
    },
    "user": {
      "status": "healthy",
      "url": "http://localhost:3002",
      "responseTime": "42ms"
    }
  }
}
```

---

## Rate Limiting

The gateway enforces rate limits to prevent abuse:

- **Window**: 60 seconds (1 minute)
- **Max Requests**: 100 per window
- **Key**: Authenticated users by `userId`, anonymous by IP address

**Response when rate limit exceeded:**

```json
{
  "statusCode": 429,
  "message": "Too many requests, please try again later.",
  "timestamp": "2025-01-20T10:00:00.000Z"
}
```

**Headers:**
- `RateLimit-Limit`: Maximum requests allowed
- `RateLimit-Remaining`: Requests remaining in current window
- `RateLimit-Reset`: Time when limit resets

---

## Error Handling

The gateway provides standardized error responses:

### Service Unavailable (503)

```json
{
  "statusCode": 503,
  "message": "Service temporarily unavailable",
  "timestamp": "2025-01-20T10:00:00.000Z",
  "path": "/users/me"
}
```

### Gateway Timeout (504)

```json
{
  "statusCode": 504,
  "message": "Service request timeout",
  "timestamp": "2025-01-20T10:00:00.000Z",
  "path": "/requests"
}
```

### Unauthorized (401)

```json
{
  "statusCode": 401,
  "message": "Invalid or missing token",
  "timestamp": "2025-01-20T10:00:00.000Z"
}
```

---

## Logging

The gateway uses Winston for structured logging:

- **Console**: Colorized output for development
- **Files**: 
  - `logs/error.log`: Error-level logs
  - `logs/combined.log`: All logs

**Log Format:**

```
2025-01-20 10:00:00 [info]: POST /requests 201 - 145ms - User: user-uuid - IP: 192.168.1.1
2025-01-20 10:00:05 [warn]: Rate limit exceeded for User: user-uuid - IP: 192.168.1.1
2025-01-20 10:00:10 [error]: Error forwarding request: ECONNREFUSED
```

---

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

---

## Security

The gateway implements several security measures:

1. **Helmet**: Sets security headers (XSS protection, CSP, etc.)
2. **CORS**: Configurable cross-origin resource sharing
3. **JWT Validation**: All routes (except public) require valid tokens
4. **Rate Limiting**: Protection against brute force and DoS attacks
5. **Input Validation**: DTO validation with class-validator
6. **Header Sanitization**: Removes sensitive headers before forwarding

---

## Performance

- **Timeout**: 30 seconds for microservice requests
- **Connection Pooling**: Axios HTTP client with connection reuse
- **Non-blocking**: Asynchronous request forwarding
- **Graceful Degradation**: Continues operating even if some services are down

---

## Deployment

### Docker Deployment

```bash
# Build
docker build -t api-gateway:latest .

# Run
docker run -d \
  --name api-gateway \
  -p 3000:3000 \
  --env-file .env \
  api-gateway:latest
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: api-gateway:latest
        ports:
        - containerPort: 3000
        env:
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: api-gateway-secrets
              key: jwt-secret
```

---

## Monitoring

Monitor the gateway with:

- **Health Endpoint**: `/health` and `/health/services`
- **Logs**: Winston logs in `logs/` directory
- **Metrics**: Request duration, status codes, error rates
- **APM Tools**: Compatible with New Relic, Datadog, etc.

---

## Architecture Diagram

```
Client
  ↓
API Gateway (Port 3000)
  ├── LoggingMiddleware
  ├── JwtAuthMiddleware
  ├── RateLimitMiddleware
  └── GatewayService (Request Forwarding)
        ↓
  ┌───────────────────────────────────┐
  ├── auth-service (3001)
  ├── user-service (3002)
  ├── request-service (3003)
  ├── proposal-service (3004)
  ├── job-service (3005)
  ├── payment-service (3006)
  ├── messaging-service (3007)
  ├── notification-service (3008)
  ├── review-service (3009)
  ├── admin-service (3010)
  ├── analytics-service (3011)
  └── infrastructure-service (3012)
```

---

## Troubleshooting

### Service Connection Errors

**Error**: `ECONNREFUSED`

**Solution**: Ensure all microservices are running and URLs are correct in `.env`

### JWT Validation Errors

**Error**: `Invalid or missing token`

**Solution**: Verify JWT_SECRET matches across gateway and auth-service

### Rate Limit Issues

**Error**: `429 Too Many Requests`

**Solution**: Implement exponential backoff in client or increase rate limits

---

## License

MIT

---

## Support

For issues or questions, contact the development team or open an issue on GitHub.
