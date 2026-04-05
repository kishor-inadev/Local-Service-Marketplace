# API Gateway

Single entry point for all client requests. Routes to 6 backend microservices with JWT authentication, rate limiting, and structured logging.

**Port:** 3700 (external) → 3000 (internal container)

---

## Routing Table

| Path Prefix | Service | Port |
|-------------|---------|------|
| `/user/auth/*` | identity-service | 3001 |
| `/users/*` | identity-service | 3001 |
| `/providers/*` | identity-service | 3001 |
| `/requests/*` | marketplace-service | 3003 |
| `/proposals/*` | marketplace-service | 3003 |
| `/jobs/*` | marketplace-service | 3003 |
| `/reviews/*` | marketplace-service | 3003 |
| `/categories/*` | marketplace-service | 3003 |
| `/payments/*` | payment-service | 3006 |
| `/messages/*` | comms-service | 3007 |
| `/notifications/*` | comms-service | 3007 |
| `/admin/*` | oversight-service | 3010 |
| `/analytics/*` | oversight-service | 3010 |
| `/events/*` | infrastructure-service | 3012 |
| `/feature-flags/*` | infrastructure-service | 3012 |

All routes are prefixed with `/api/v1`.

### Public Routes (No JWT Required)

- `POST /api/v1/user/auth/signup`
- `POST /api/v1/user/auth/login`
- `POST /api/v1/user/auth/refresh`
- `POST /api/v1/user/auth/password-reset/request`
- `POST /api/v1/user/auth/password-reset/confirm`
- `GET /api/v1/user/auth/google` (+ callback)
- `GET /api/v1/user/auth/facebook` (+ callback)

All other routes require `Authorization: Bearer <token>`.

---

## Middleware Stack

1. **LoggingMiddleware** — Logs requests/responses with timing
2. **JwtAuthMiddleware** — Validates JWT tokens (bypasses public routes)
3. **RateLimitMiddleware** — 100 requests/minute per user or IP
4. **GatewayService** — Forwards to target microservice

---

## Token Validation

Two strategies (set via `TOKEN_VALIDATION_STRATEGY`):

- **`local`** (default) — Validates JWT locally using `JWT_SECRET`. Faster, no network call.
- **`api`** — Calls identity-service `/auth/validate`. Can check account status.

After validation, the gateway injects headers for downstream services:
- `x-user-id`, `x-user-email`, `x-user-role`, `x-user-name`, `x-user-phone`

---

## Environment Variables

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=<required>
GATEWAY_INTERNAL_SECRET=<required>
TOKEN_VALIDATION_STRATEGY=local

# Service URLs (Docker defaults shown)
AUTH_SERVICE_URL=http://identity-service:3001
REQUEST_SERVICE_URL=http://marketplace-service:3003
PAYMENT_SERVICE_URL=http://payment-service:3006
MESSAGING_SERVICE_URL=http://comms-service:3007
ADMIN_SERVICE_URL=http://oversight-service:3010
INFRASTRUCTURE_SERVICE_URL=http://infrastructure-service:3012

RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## API Examples

```bash
# Login
curl -X POST http://localhost:3700/api/v1/user/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "SecurePass123!"}'

# Get user profile (authenticated)
curl http://localhost:3700/api/v1/users/me \
  -H "Authorization: Bearer <token>"

# Create service request (authenticated)
curl -X POST http://localhost:3700/api/v1/requests \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"categoryId": "uuid", "description": "Need a plumber", "budget": 150}'
```

---

## Health Check

```
GET http://localhost:3700/health
```

---

## Rate Limiting

- **Window:** 60 seconds
- **Max:** 100 requests per window
- **Key:** Authenticated users by `userId`, anonymous by IP

Response headers: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`

---

## Running

```bash
pnpm install
pnpm start:dev        # Development
pnpm build && pnpm start:prod  # Production
pnpm test             # Unit tests
```

See [TOKEN_VALIDATION_GUIDE.md](../../api-gateway/TOKEN_VALIDATION_GUIDE.md) for detailed auth configuration.
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
  ├── identity-service (3001)
  ├── marketplace-service (3003)
  ├── payment-service (3006)
  ├── comms-service (3007)
  ├── oversight-service (3010)
  └── infrastructure-service (3012)
```

---

## Troubleshooting

### Service Connection Errors

**Error**: `ECONNREFUSED`

**Solution**: Ensure all microservices are running and URLs are correct in `.env`

### JWT Validation Errors

**Error**: `Invalid or missing token`

**Solution**: Verify JWT_SECRET matches across gateway and identity-service

### Rate Limit Issues

**Error**: `429 Too Many Requests`

**Solution**: Implement exponential backoff in client or increase rate limits

---

## License

MIT

---

## Support

For issues or questions, contact the development team or open an issue on GitHub.
