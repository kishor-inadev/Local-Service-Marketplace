# Getting Started — Local Service Marketplace

This guide covers every way to run the platform: local development, Docker (recommended), and production deployment.

---

## Table of Contents

1. [System Requirements](#1-system-requirements)
2. [Project Structure](#2-project-structure)
3. [Environment: Local Development (no Docker)](#3-environment-local-development-no-docker)
4. [Environment: Docker (recommended)](#4-environment-docker-recommended)
5. [Environment: Production](#5-environment-production)
6. [Per-Service Reference](#6-per-service-reference)
7. [Feature Flags](#7-feature-flags)
8. [First-Time Setup Checklist](#8-first-time-setup-checklist)
9. [Common Commands](#9-common-commands)
10. [Troubleshooting Startup](#10-troubleshooting-startup)

---

## 1. System Requirements

| Requirement | Minimum | Recommended |
|---|---|---|
| Docker Desktop | 20.x+ | Latest |
| Docker Compose | 2.x+ | Latest |
| Node.js | 18.0+ | 20 LTS |
| pnpm | 8.0+ | Latest |
| RAM | 4 GB | 8 GB |
| Disk | 5 GB free | 10 GB |

> **Windows users**: Use PowerShell 5.1+ or Windows Terminal. All scripts use `.ps1`.

---

## 2. Project Structure

```
Local-Service-Marketplace/
├── api-gateway/               # NestJS — single entry point (port 3700)
├── services/
│   ├── identity-service/      # Auth + Users + Providers (port 3001)
│   ├── marketplace-service/   # Requests + Proposals + Jobs + Reviews (port 3003)
│   ├── payment-service/       # Payments + Refunds (port 3006)
│   ├── comms-service/         # Notifications — Email + SMS + Push (port 3007)
│   ├── oversight-service/     # Admin + Analytics (port 3010)
│   └── infrastructure-service/# Events + Background Jobs + Feature Flags (port 3012)
├── frontend/                  # Next.js application (port 3000)
├── database/                  # Schema + migrations + seed
├── docker-compose.yml         # Core services
├── docker-compose.prod.yml    # Production overrides
├── docker.env                 # Docker environment variables (not committed)
├── scripts/                   # PowerShell utility scripts
└── docs/                      # Documentation
```

---

## 3. Environment: Local Development (no Docker)

Run each service independently with hot-reload. Requires PostgreSQL and Redis installed locally or via Docker.

### 3.1 Start Infrastructure Only via Docker

```powershell
# Start only database + redis (not the application services)
docker run -d --name marketplace-postgres `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=marketplace `
  -p 5432:5432 postgres:16-alpine

docker run -d --name marketplace-redis `
  -p 6379:6379 redis:7-alpine
```

### 3.2 Install Dependencies

```powershell
# From repo root — installs all services and frontend
pnpm install:all
```

Or per service:
```powershell
cd services/identity-service ; pnpm install
cd services/marketplace-service ; pnpm install
# ... repeat for each service
cd frontend ; pnpm install
```

### 3.3 Configure Each Service

Each service has a `.env.example` file. Copy it to `.env`:

```powershell
# Run from repo root
Get-ChildItem -Path "services" -Filter ".env.example" -Recurse | ForEach-Object {
    $dest = Join-Path $_.DirectoryName ".env"
    if (-not (Test-Path $dest)) { Copy-Item $_.FullName $dest }
}
Copy-Item frontend/.env.example frontend/.env.local
```

Critical values to set in every service `.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/marketplace
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=marketplace

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=<generate: openssl rand -base64 48>
JWT_REFRESH_SECRET=<different from JWT_SECRET>
GATEWAY_INTERNAL_SECRET=<generate: openssl rand -base64 48>
```

> **Important**: `JWT_SECRET` and `GATEWAY_INTERNAL_SECRET` must be **identical** across `api-gateway/.env` and `services/identity-service/.env`.

### 3.4 Load Database Schema

```powershell
cd database
node migrate.js
```

### 3.5 Start Services

Open a terminal per service, or use a tool like `concurrently`:

```powershell
# Terminal 1 — identity-service
cd services/identity-service ; pnpm start:dev

# Terminal 2 — marketplace-service
cd services/marketplace-service ; pnpm start:dev

# Terminal 3 — payment-service
cd services/payment-service ; pnpm start:dev

# Terminal 4 — comms-service
cd services/comms-service ; pnpm start:dev

# Terminal 5 — oversight-service
cd services/oversight-service ; pnpm start:dev

# Terminal 6 — api-gateway
cd api-gateway ; pnpm start:dev

# Terminal 7 — frontend
cd frontend ; pnpm dev
```

### 3.6 Verify

```
http://localhost:3700/health         → API Gateway
http://localhost:3001/health         → identity-service
http://localhost:3003/health         → marketplace-service
http://localhost:3006/health         → payment-service
http://localhost:3007/health         → comms-service
http://localhost:3010/health         → oversight-service
http://localhost:3000                → Frontend
```

---

## 4. Environment: Docker (Recommended)

All services run as containers sharing one network. This is the standard local dev and staging environment.

### 4.1 Clone and Configure

```powershell
git clone <repo-url>
cd Local-Service-Marketplace

# Auto-create docker.env with secure generated secrets
.\scripts\setup-env-files.ps1
```

Or manually:
```powershell
Copy-Item .env.example docker.env
```

Edit `docker.env` and set:

```env
# These MUST be changed — do not use defaults in production
JWT_SECRET=<openssl rand -base64 48>
JWT_REFRESH_SECRET=<openssl rand -base64 48>
GATEWAY_INTERNAL_SECRET=<openssl rand -base64 48>

# Database credentials
DATABASE_PASSWORD=<strong password>

# External services (set to empty string to disable)
EMAIL_SERVICE_URL=https://your-email-service.vercel.app
SMS_SERVICE_URL=https://your-sms-service.vercel.app
```

### 4.2 Start Core Services

```powershell
docker-compose up -d
```

This starts:
- `postgres` — PostgreSQL 16
- `redis` — Redis 7
- `api-gateway` — port 3700
- `identity-service` — port 3001
- `marketplace-service` — port 3003
- `payment-service` — port 3006
- `comms-service` — port 3007
- `oversight-service` — port 3010

Wait ~60 seconds for all health checks to pass.

### 4.3 Verify All Services

```powershell
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

All containers should show `(healthy)`. Then:

```powershell
# Gateway health (includes all upstream services)
Invoke-RestMethod http://localhost:3700/health
Invoke-RestMethod http://localhost:3700/health/services
```

### 4.4 Start Frontend

The frontend runs outside Docker for hot-reload during development:

```powershell
cd frontend
Copy-Item .env.example .env.local
pnpm install
pnpm dev
```

Set in `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3700
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=<openssl rand -base64 32>
```

Frontend: http://localhost:3000

### 4.5 Start Optional Services

```powershell
# Infrastructure service (events, feature flags, background jobs)
docker-compose --profile infrastructure up -d infrastructure-service

# Email service (local SMTP relay)
docker-compose --profile email up -d email-service

# SMS service (local SMS relay)
docker-compose --profile sms up -d sms-service

# All optional services
docker-compose --profile infrastructure --profile email --profile sms up -d
```

### 4.6 Seed Sample Data

```powershell
# Creates 151 users, 1000+ records across all services
.\scripts\seed-database.ps1
```

Default accounts created:
| Email | Password | Role |
|---|---|---|
| `admin@marketplace.com` | `password123` | Admin |
| `provider1@example.com` | `password123` | Provider |
| `customer1@example.com` | `password123` | Customer |

### 4.7 Enable Background Workers

Workers process async jobs (emails, notifications, payment retries, cron tasks).

```env
# In docker.env
WORKERS_ENABLED=true
WORKER_CONCURRENCY=5
```

Then restart:
```powershell
docker-compose up -d
```

---

## 5. Environment: Production

### 5.1 Prerequisites

- A cloud VPS or managed container service (Render, Railway, AWS ECS, etc.)
- Managed PostgreSQL (RDS, Supabase, Neon, etc.)
- Managed Redis (Upstash, Redis Cloud, ElastiCache)
- Domain name with SSL certificate

### 5.2 Generate Production Secrets

```powershell
.\scripts\generate-production-secrets.ps1
```

Or manually (Linux/Mac):
```bash
openssl rand -base64 48  # JWT_SECRET
openssl rand -base64 48  # JWT_REFRESH_SECRET
openssl rand -base64 48  # GATEWAY_INTERNAL_SECRET
openssl rand -base64 32  # AUTH_SECRET (frontend)
```

### 5.3 Production docker-compose

```powershell
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

`docker-compose.prod.yml` enables:
- `WORKERS_ENABLED=true` — background job processing
- Stricter resource limits
- No development overrides

### 5.4 Production Environment Variables

Set these variables in your hosting platform's secret store:

**Required on ALL backend services:**
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@your-db-host:5432/marketplace
DATABASE_SSL=true
REDIS_URL=redis://:your-redis-pass@your-redis-host:6379
GATEWAY_INTERNAL_SECRET=<strong-secret>
```

**api-gateway only:**
```env
JWT_SECRET=<same as identity-service>
TOKEN_VALIDATION_STRATEGY=local
RATE_LIMIT_MAX_REQUESTS=100
```

**identity-service only:**
```env
JWT_SECRET=<same as api-gateway>
JWT_REFRESH_SECRET=<different from JWT_SECRET>
```

**comms-service only:**
```env
EMAIL_SERVICE_URL=https://your-email-service.com
EMAIL_ENABLED=true
SMS_ENABLED=true        # if you have SMS configured
WORKERS_ENABLED=true
```

**payment-service only:**
```env
PAYMENT_GATEWAY=stripe   # or razorpay, paypal, payu, instamojo
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
WORKERS_ENABLED=true
```

**Worker pods (separate container from API pods):**
```env
WORKERS_ENABLED=true
WORKER_CONCURRENCY=10
```

### 5.5 Database Migration

Run once before starting services:
```powershell
cd database
node migrate.js
```

Or via Docker:
```powershell
docker run --rm `
  -e DATABASE_URL=postgresql://... `
  -v ${PWD}/database:/app `
  node:20-alpine node /app/migrate.js
```

### 5.6 Health Check URLs

After deploying, verify each service:
```
https://your-domain.com/health              → API Gateway
https://your-domain.com/health/services     → All upstream services
```

---

## 6. Per-Service Reference

### api-gateway (port 3700)

**Purpose**: Single entry point. Validates JWT, injects user context headers, routes to backend services.

**Key env vars**:
```env
PORT=3700
JWT_SECRET=                    # Must match identity-service
GATEWAY_INTERNAL_SECRET=       # Must match all backend services
TOKEN_VALIDATION_STRATEGY=local  # or 'api'
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
REDIS_RATE_LIMIT_ENABLED=false   # true for multi-replica deployments
```

**Start (dev)**:
```powershell
cd api-gateway ; pnpm start:dev
```

---

### identity-service (port 3001)

**Purpose**: User registration, login, JWT issuing, provider profiles, OAuth, 2FA, password reset.

**Key env vars**:
```env
PORT=3001
JWT_SECRET=                    # Must match api-gateway
JWT_REFRESH_SECRET=
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRATION=7d
MAX_LOGIN_ATTEMPTS=5
NOTIFICATION_SERVICE_URL=http://comms-service:3007
WORKERS_ENABLED=false          # true to run cleanup/notification workers
```

**Start (dev)**:
```powershell
cd services/identity-service ; pnpm start:dev
```

---

### marketplace-service (port 3003)

**Purpose**: Service requests lifecycle, proposals, jobs, reviews, service categories.

**Key env vars**:
```env
PORT=3003
USER_SERVICE_URL=http://identity-service:3001
NOTIFICATION_SERVICE_URL=http://comms-service:3007
WORKERS_ENABLED=false          # true to run rating/cleanup workers
```

**Start (dev)**:
```powershell
cd services/marketplace-service ; pnpm start:dev
```

---

### payment-service (port 3006)

**Purpose**: Payment processing, refunds, webhooks, saved cards, coupons.

**Key env vars**:
```env
PORT=3006
PAYMENT_GATEWAY=mock           # mock | stripe | razorpay | paypal | payu | instamojo
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
WORKERS_ENABLED=false          # true to process refunds, webhooks, subscription expiry
```

**Start (dev)**:
```powershell
cd services/payment-service ; pnpm start:dev
```

---

### comms-service (port 3007)

**Purpose**: All notifications — email (via email-service), SMS (via sms-service), push, in-app. No service calls email-service directly — everything goes through comms-service.

**Key env vars**:
```env
PORT=3007
EMAIL_SERVICE_URL=http://email-service:3500
EMAIL_ENABLED=true
SMS_SERVICE_URL=http://sms-service:3000
SMS_ENABLED=false
WORKERS_ENABLED=false          # true to run email/SMS/digest worker queues
```

**Start (dev)**:
```powershell
cd services/comms-service ; pnpm start:dev
```

---

### oversight-service (port 3010)

**Purpose**: Admin user management, dispute resolution, audit logs, analytics/metrics.

**Key env vars**:
```env
PORT=3010
AUTH_SERVICE_URL=http://identity-service:3001
ANALYTICS_ENABLED=true
WORKERS_ENABLED=false          # true to run audit log + metrics workers
```

**Start (dev)**:
```powershell
cd services/oversight-service ; pnpm start:dev
```

---

### infrastructure-service (port 3012) — Optional

**Purpose**: Feature flags, rate limiting, background job registry, event logging. Only needed at scale.

**Key env vars**:
```env
PORT=3012
CACHE_ENABLED=false
RATE_LIMITING_ENABLED=true
FEATURE_FLAGS_ENABLED=true
BACKGROUND_JOBS_ENABLED=false
WORKERS_ENABLED=false
```

**Start (dev)**:
```powershell
cd services/infrastructure-service ; pnpm start:dev
```

Enable in Docker with:
```powershell
docker-compose --profile infrastructure up -d infrastructure-service
```

---

### frontend (port 3000)

**Purpose**: Next.js user interface for customers, providers, and admins.

**Key env vars** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3700
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=<openssl rand -base64 32>
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=    # optional
```

**Start (dev)**:
```powershell
cd frontend ; pnpm dev
```

**Build for production**:
```powershell
cd frontend ; pnpm build ; pnpm start
```

---

## 7. Feature Flags

All infrastructure features are opt-in via environment variables. Start with all disabled (Level 1) and enable progressively.

| Flag | Default | Effect |
|---|---|---|
| `CACHE_ENABLED=true` | false | Redis response caching for GET endpoints |
| `WORKERS_ENABLED=true` | false | BullMQ background job processors activate |
| `WORKER_CONCURRENCY=10` | 5 | Jobs processed simultaneously per worker |
| `EVENT_BUS_ENABLED=true` | false | Kafka event streaming between services |
| `EMAIL_ENABLED=true` | false | Email delivery via email-service |
| `SMS_ENABLED=true` | false | SMS delivery via sms-service |
| `PUSH_NOTIFICATIONS_ENABLED=true` | false | Browser/mobile push (requires FCM) |
| `RATE_LIMITING_ENABLED=false` | true | API rate limiting at gateway |
| `REDIS_RATE_LIMIT_ENABLED=true` | false | Shared rate limit counter across gateway replicas |
| `ANALYTICS_ENABLED=true` | false | Custom analytics tracking |
| `FEATURE_FLAGS_ENABLED=true` | true | infrastructure-service feature flag system |

### Scaling Levels

```
Level 1 (default)     — All flags off — up to 350 users
Level 2 — CACHE_ENABLED=true — up to 1,000 users
Level 3 — WORKERS_ENABLED=true — up to 2,000 users
Level 4 — EVENT_BUS_ENABLED=true (Kafka) — up to 10,000 users
Level 5 — Kubernetes + CDN + read replicas — 50,000+ users
```

---

## 8. First-Time Setup Checklist

```
□ Docker Desktop is running
□ Cloned the repository
□ Ran setup-env-files.ps1 OR manually created docker.env
□ Set JWT_SECRET (min 32 chars, base64)
□ Set JWT_REFRESH_SECRET (different from JWT_SECRET)
□ Set GATEWAY_INTERNAL_SECRET (min 32 chars)
□ docker-compose up -d completed successfully
□ All containers show (healthy) in docker ps
□ http://localhost:3700/health returns { "status": "ok" }
□ frontend/.env.local created with NEXT_PUBLIC_API_URL
□ pnpm install run in frontend/
□ (Optional) seed-database.ps1 run for sample data
```

---

## 9. Common Commands

### Docker

```powershell
# Start all services
docker-compose up -d

# Stop (preserves data)
docker-compose down

# Full reset — DELETES ALL DATA
docker-compose down -v

# View all logs (live)
docker-compose logs -f

# View one service logs
docker-compose logs -f identity-service

# Restart one service
docker-compose restart marketplace-service

# Rebuild after code change
docker-compose up -d --build payment-service

# Open shell in a container
docker exec -it identity-service sh
```

### Database

```powershell
# Connect to PostgreSQL
docker exec -it marketplace-postgres psql -U postgres -d marketplace

# Run schema migration
cd database ; node migrate.js

# Seed sample data
.\scripts\seed-database.ps1

# Verify seed
cd database ; node verify-seed.js
```

### Individual Services (dev mode)

```powershell
cd services/<service-name>
pnpm start:dev     # Hot reload
pnpm build         # Compile TypeScript
pnpm test          # Unit tests
pnpm test:cov      # Coverage report
pnpm test:e2e      # End-to-end tests
pnpm lint          # ESLint
```

### Root Scripts

```powershell
pnpm install:all       # Install deps for all services
pnpm build:all         # Build all services
pnpm start:dev         # Start all services in parallel (dev)
pnpm test:api          # Run Postman/Newman API test suite
pnpm test:api:verbose  # Verbose API tests with reports
```

---

## 10. Troubleshooting Startup

### Service exits immediately

```powershell
docker logs identity-service --tail 100
```

Common causes:
- Missing env var → check required vars in service `.env.example`
- Wrong `DATABASE_URL` → verify host is `postgres` (Docker) or `localhost` (local dev)
- Port conflict → change host port in `docker-compose.yml`

### "Cannot connect to Docker daemon"

Open Docker Desktop and wait until it shows as running, then retry.

### Database connection errors

```powershell
# Verify postgres is healthy
docker ps | findstr postgres

# Test connection
docker exec -it marketplace-postgres psql -U postgres -c "\l"
```

If the database doesn't have the `marketplace` db:
```powershell
docker exec -it marketplace-postgres psql -U postgres -c "CREATE DATABASE marketplace;"
cd database ; node migrate.js
```

### Services fail health check loop

```powershell
# Inspect a specific service
docker inspect --format='{{json .State.Health}}' marketplace-service | ConvertFrom-Json

# Usually means it's still starting — wait 60 seconds
Start-Sleep 60
docker ps
```

### BullMQ workers not processing jobs

1. Verify `WORKERS_ENABLED=true` is set
2. Verify Redis is reachable: `docker exec -it marketplace-redis redis-cli ping`
3. Check worker logs: `docker-compose logs -f comms-service | Select-String "Worker"`

### Port already in use

```powershell
# Find what's using the port
netstat -ano | findstr :3700

# Kill the process
taskkill /PID <PID> /F
```

---

> For more detail on each topic see:
> - [Environment Variables Guide](ENVIRONMENT_VARIABLES_GUIDE.md)
> - [Background Jobs Guide](guides/BACKGROUND_JOBS_GUIDE.md)
> - [Authentication Workflow](guides/AUTHENTICATION_WORKFLOW.md)
> - [Marketplace Guide](MARKETPLACE_GUIDE.md)
> - [Troubleshooting](TROUBLESHOOTING.md)
