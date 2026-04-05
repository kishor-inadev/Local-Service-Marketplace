# Local Service Marketplace

A production-ready microservices platform connecting service providers with customers.

---

## Quick Start

### Prerequisites

- Docker Desktop 20.x+ with Docker Compose 2.x+
- 4 GB RAM minimum (8 GB recommended)

### 1. Configure Environment

```powershell
.\scripts\setup-env-files.ps1
```

Update these secrets before starting:

```env
JWT_SECRET=<generate with: openssl rand -base64 48>
JWT_REFRESH_SECRET=<different from JWT_SECRET>
GATEWAY_INTERNAL_SECRET=<generate with: openssl rand -base64 48>
```

### 2. Start the Platform

```powershell
docker-compose up -d
```

| URL | Service |
|-----|---------|
| http://localhost:3000 | Frontend (Next.js) |
| http://localhost:3700 | API Gateway |
| http://localhost:3700/health | Health check |

### 3. Seed Sample Data (Optional)

```powershell
.\scripts\seed-database.ps1
```

Creates 151 users, 1000+ records. Default admin: `admin@marketplace.com` / `password123`

---

## Architecture

```
Browser
  |
  v
Frontend (Next.js)          localhost:3000
  |
  v
API Gateway (NestJS)        localhost:3700
  |
  +---> identity-service    localhost:3001   Auth + User profiles
  +---> marketplace-service localhost:3003   Requests + Proposals + Jobs + Reviews
  +---> payment-service     localhost:3006   Payments + Refunds
  +---> comms-service       localhost:3007   Notifications (Email + SMS gateway)
  +---> oversight-service   localhost:3010   Admin + Analytics
  +---> infrastructure-svc  localhost:3012   Events + Background jobs + Feature flags

comms-service
  +---> email-service        internal:3500  (local: localhost:4000)
  +---> sms-service          internal:3000  (local: localhost:5000)
```

### Communication Rules

- All notifications (email, SMS, in-app) go through **comms-service only**
- No service calls email-service or sms-service directly
- User lookups use **identity-service** API (never cross-DB joins)
- Services communicate via HTTP REST (Kafka available when `EVENT_BUS_ENABLED=true`)

---

## Services

### Backend Services

| Service | Port | Responsibilities |
|---------|------|-----------------|
| identity-service | 3001 | Authentication, JWT, OAuth (Google/Facebook), user profiles, provider management |
| marketplace-service | 3003 | Service requests, proposals, jobs, reviews, ratings |
| payment-service | 3006 | Payment processing (Stripe/Razorpay), refunds, escrow |
| comms-service | 3007 | Email delivery, SMS/OTP, in-app notifications |
| oversight-service | 3010 | Admin operations, dispute resolution, platform analytics |
| infrastructure-service | 3012 | Feature flags, rate limits, background jobs, event store |

### Supporting Services

| Service | Docker Port | Local Port |
|---------|-------------|------------|
| api-gateway | 3700 | 3700 |
| frontend | 3000 | 3000 |
| PostgreSQL | 5432 | 5432 |
| Redis | 6379 | 6379 |
| email-service | 3500 (internal) | 4000 |
| sms-service | 3000 (internal) | 5000 |

---

## Authentication

The API Gateway supports two token validation strategies:

```env
# Faster - validates JWT locally (default)
TOKEN_VALIDATION_STRATEGY=local

# More secure - calls identity-service to check account status
TOKEN_VALIDATION_STRATEGY=api
```

### Request Flow

```
Client  --[Bearer token]-->  API Gateway
                                 |
                          validates token
                                 |
                    injects x-user-* headers
                                 |
                          backend service
                    (reads headers, no JWT needed)
```

Headers forwarded to every service:
- `x-user-id`
- `x-user-email`
- `x-user-role`
- `x-user-name`
- `x-user-phone`

### Token Lifetimes

| Token | Expiry |
|-------|--------|
| Access token | 15 minutes |
| Refresh token | 7 days |

---

## Business Flows

### Customer: Post a Job

```
1. Register / Login              POST /api/v1/auth/login
2. Create service request        POST /api/v1/requests
3. Receive proposals             GET  /api/v1/proposals?requestId=X
4. Accept a proposal             PATCH /api/v1/proposals/{id}/accept
5. Job created automatically     (marketplace-service)
6. Track job progress            GET  /api/v1/jobs/{id}
7. Pay on completion             POST /api/v1/payments
8. Leave review                  POST /api/v1/reviews
```

### Provider: Win Work

```
1. Register as provider          POST /api/v1/auth/signup
2. Browse requests               GET  /api/v1/requests
3. Submit proposal               POST /api/v1/proposals
4. Execute job, update status    PATCH /api/v1/jobs/{id}
5. Get paid after review         (payment-service releases funds)
```

### Notification Flow

```
Any service  -->  comms-service:3007  -->  email-service (emails)
                                      -->  sms-service   (OTP / SMS)
```

---

## Event-Driven (Kafka)

When `EVENT_BUS_ENABLED=true`, services publish and consume events:

| Event | Producer | Consumers |
|-------|----------|-----------|
| `request.created` | marketplace-service | comms-service |
| `proposal.accepted` | marketplace-service | comms-service, payment-service |
| `job.completed` | marketplace-service | payment-service, comms-service |
| `payment.completed` | payment-service | marketplace-service, comms-service |

Kafka is **optional** — all services work without it using direct HTTP calls.

---

## Automated Testing

The platform includes comprehensive API tests using **Postman** and **Newman**.

### Quick Test Run

```powershell
# Start all services and run full test suite
.\scripts\test-all-services.ps1

# Or, if services are already running:
pnpm test:api
```

Tests cover all 8 services including health checks, authentication, CRUD operations, error handling, and critical business flows.

### Test Reports

After running tests:

- **CLI output** - Real-time pass/fail indicators
- **HTML report** - Interactive detailed report in `test-reports/`
- **JSON report** - Machine-readable results for CI/CD

See [docs/TESTING_GUIDE.md](docs/TESTING_GUIDE.md) for complete documentation.

### Collection

All API endpoints are documented in:

```
docs/Local-Service-Marketplace.postman_collection.json
```

Import into Postman for manual testing or use Newman for automation.

---

## Database

- Single PostgreSQL instance shared across services
- Each service owns specific tables — **no cross-service joins**
- Services call each other via HTTP API to fetch foreign data

| Service | Owns Tables |
|---------|-------------|
| identity-service | users, sessions, tokens, oauth_accounts |
| marketplace-service | service_requests, proposals, jobs, reviews |
| payment-service | payments, refunds, coupons |
| comms-service | notifications, messages |
| oversight-service | admin_actions, disputes, audit_logs, analytics |
| infrastructure-service | events, feature_flags, rate_limits, background_jobs |

---

## CI/CD

### Pull Request

Every PR to `main` triggers `.github/workflows/pr.yml`:
1. Frontend lint + test + build
2. All 6 backend services build (parallel)
3. API gateway build
4. Vercel preview deployment — URL posted as PR comment

### Merge to Main

Every merge to `main` triggers `.github/workflows/release.yml`:
1. Auto-generates semantic version tag (`vX.Y.Z`)
2. Creates GitHub Release with changelog
3. Deploys frontend to Vercel production
4. Triggers all Render deploy hooks

**Conventional Commit** tag bumping:
- `feat:` -> minor bump (v1.**1**.0)
- `fix:` / `chore:` -> patch bump (v1.0.**1**)
- `BREAKING CHANGE` / `major:` -> major bump (**v2**.0.0)

### Required GitHub Secrets

| Secret | Source |
|--------|--------|
| `VERCEL_TOKEN` | Vercel Account Settings -> Tokens |
| `VERCEL_ORG_ID` | `vercel link` -> `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | `vercel link` -> `.vercel/project.json` |
| `RENDER_DEPLOY_HOOK_IDENTITY` | Render -> identity-service -> Deploy Hook |
| `RENDER_DEPLOY_HOOK_MARKETPLACE` | Render -> marketplace-service -> Deploy Hook |
| `RENDER_DEPLOY_HOOK_PAYMENT` | Render -> payment-service -> Deploy Hook |
| `RENDER_DEPLOY_HOOK_COMMS` | Render -> comms-service -> Deploy Hook |
| `RENDER_DEPLOY_HOOK_OVERSIGHT` | Render -> oversight-service -> Deploy Hook |
| `RENDER_DEPLOY_HOOK_INFRASTRUCTURE` | Render -> infrastructure-service -> Deploy Hook |
| `RENDER_DEPLOY_HOOK_API_GATEWAY` | Render -> api-gateway -> Deploy Hook |

---

## Common Commands

```powershell
# Start all services
docker-compose up -d

# View logs (all)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f comms-service

# Restart a service
docker-compose restart identity-service

# Rebuild after code changes
docker-compose up -d --build

# Stop everything
docker-compose down

# Full reset (deletes all data)
docker-compose down -v
```

---

## Security Checklist (Production)

- [ ] Change all default DB passwords
- [ ] Generate unique `JWT_SECRET` (32+ chars)
- [ ] Generate unique `JWT_REFRESH_SECRET` (different from JWT_SECRET)
- [ ] Generate unique `GATEWAY_INTERNAL_SECRET`
- [ ] Set `NODE_ENV=production` in all services
- [ ] Set `CORS_ORIGIN` to production domain only
- [ ] Enable HTTPS/TLS
- [ ] Configure real email provider (SMTP or SendGrid)
- [ ] Configure real SMS provider
- [ ] Set up OAuth credentials (Google, Facebook)
- [ ] Enable rate limiting (`RATE_LIMITING_ENABLED=true`)
- [ ] Configure database backups

---

## Documentation

| Topic | File |
|-------|------|
| Architecture detail | [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) |
| API specification | [docs/api/API_SPECIFICATION.md](docs/api/API_SPECIFICATION.md) |
| Service boundaries | [docs/architecture/MICROSERVICE_BOUNDARY_MAP.md](docs/architecture/MICROSERVICE_BOUNDARY_MAP.md) |
| Environment variables | [docs/ENVIRONMENT_VARIABLES_GUIDE.md](docs/ENVIRONMENT_VARIABLES_GUIDE.md) |
| Implementation guide | [docs/IMPLEMENTATION_GUIDE.md](docs/IMPLEMENTATION_GUIDE.md) |
| Token validation | [api-gateway/TOKEN_VALIDATION_GUIDE.md](api-gateway/TOKEN_VALIDATION_GUIDE.md) |
| Authentication flow | [docs/guides/AUTHENTICATION_WORKFLOW.md](docs/guides/AUTHENTICATION_WORKFLOW.md) |
| Database seeding | [docs/DATABASE_SEEDING.md](docs/DATABASE_SEEDING.md) |
| Kafka integration | [docs/guides/KAFKA_INTEGRATION.md](docs/guides/KAFKA_INTEGRATION.md) |
| Scaling strategy | [docs/deployment/SCALING_STRATEGY.md](docs/deployment/SCALING_STRATEGY.md) |
| Troubleshooting | [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) |