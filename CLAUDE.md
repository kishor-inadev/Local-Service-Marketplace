# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Local Service Marketplace** - A production-ready microservices platform connecting service providers with customers.

This is a **monorepo** containing:
- **Frontend**: Next.js application (port 3000)
- **API Gateway**: Nest.js (port 3500) - single entry point for all backend services
- **6 Backend Microservices**: All Nest.js-based
  - identity-service (port 3001)
  - marketplace-service (port 3003)
  - payment-service (port 3006)
  - comms-service (port 3007)
  - oversight-service (port 3010)
  - infrastructure-service (port 3012)
- **2 Supporting Services**: email-service, sms-service

All services communicate via **HTTP REST** (Kafka optional via `EVENT_BUS_ENABLED`), share a single PostgreSQL database (different tables per service), and use Redis for caching.

## Package Manager

**pnpm** is used throughout. Ensure pnpm >= 8.0.0 and Node >= 18.0.0.

## Common Development Commands

### Root Level (Monorepo Management)

```bash
# Install dependencies for all services
pnpm install:all

# Build all services
pnpm build:all

# Start all services in development (parallel)
pnpm start:dev

# Run API tests with Newman
pnpm test:api

# Run API tests with verbose output
pnpm test:api:verbose

# Test all services (comprehensive script)
pnpm test:services
```

### Individual Service (e.g., identity-service)

Each backend service follows the same Nest.js structure:

```bash
cd services/<service-name>

# Development with hot reload
pnpm start:dev

# Production build
pnpm build

# Lint and fix
pnpm lint

# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test:cov

# Run end-to-end tests
pnpm test:e2e

# Start production
pnpm start:prod
```

### Frontend (Next.js)

```bash
cd frontend

# Development
pnpm dev

# Build
pnpm build

# Start production
pnpm start

# Lint
pnpm lint

# Run Jest tests
pnpm test
```

### Docker Commands

```bash
# Start all services
docker-compose up -d

# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f identity-service

# Restart a service
docker-compose restart marketplace-service

# Rebuild after code changes
docker-compose up -d --build

# Stop all services
docker-compose down

# Full reset (deletes all data!)
docker-compose down -v
```

### PowerShell Scripts (Root)

A comprehensive `scripts/` directory contains utilities:

```bash
# Environment setup
.\scripts\setup-env-files.ps1

# Seed database with sample data (151 users, 1000+ records)
.\scripts\seed-database.ps1

# Run all Postman/Newman tests
.\scripts\test-all-services.ps1

# Start all services
.\scripts\start.ps1

# Stop all services
.\scripts\stop.ps1
```

## Code Architecture

### High-Level Architecture

```
Browser
  |
  v
Frontend (Next.js)          localhost:3000
  |
  v
API Gateway (NestJS)        localhost:3500
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

### Service Architecture Pattern (Nest.js)

All backend services follow this structure:

```
src/
├── main.ts                    # App bootstrap
├── app.module.ts              # Root module
├── modules/                   # Feature modules (business domains)
│   ├── auth/
│   ├── user/
│   ├── request/
│   └── ...
├── common/                    # Shared utilities
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── interfaces/
│   ├── middleware/
│   └── utils/
├── redis/                     # Redis configuration/helpers (optional)
└── kafka/                     # Kafka producers/consumers (optional)
```

### Module Structure Pattern

Each feature module typically contains:

```
modules/<feature>/
├── <feature>.controller.ts   # HTTP endpoints
├── <feature>.service.ts      # Business logic
├── <feature>.module.ts       # Nest module definition
├── dto/                      # Data transfer objects
│   ├── create-<feature>.dto.ts
│   ├── update-<feature>.dto.ts
│   └── <feature>.dto.ts
├── entities/                 # Database entities (TypeORM)
├── interfaces/               # Type definitions
├── repositories/             # Data access (optional)
└── producers/ or consumers/  # Kafka event handlers (optional)
```

### API Gateway Role

- Single entry point for all client requests
- Handles JWT validation (local or via identity-service)
- Injects `x-user-*` headers for downstream services
- Routes requests to appropriate microservices
- Rate limiting, request logging, CORS

**Token validation strategies**:
- `local` (default): Validates JWT locally using public key
- `api`: Calls identity-service `/auth/validate` endpoint

### Database Rules

- **Single PostgreSQL instance** shared across all services
- **Service-owned tables** - no cross-service joins
- Services call each other via HTTP API to fetch foreign data
- All IDs are UUIDs
- All list APIs must support pagination

### Communication Rules

1. **All notifications** (email, SMS, in-app) → go through `comms-service` only
2. **User lookups** → use `identity-service` API (never cross-DB joins)
3. **Cross-service data** → HTTP REST API calls
4. **Event-driven optional** → Kafka enabled via `EVENT_BUS_ENABLED=true`

### Response Format

All services use standardized response format (see recent commits):
```json
{
  "success": true,
  "message": "Operation description",
  "data": { ... }
}
```

## Authentication Flow

```
Client → [Bearer token] → API Gateway
  ↓
Gateway validates token
  ↓
Injects x-user-id, x-user-email, x-user-role, x-user-name headers
  ↓
Backend service reads headers (no JWT needed)
```

Token lifetimes:
- Access token: 15 minutes
- Refresh token: 7 days

## Critical Configuration

### Environment Variables

Key env vars (see `.env.example` in each service and root):

```env
# Database
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=<generate: openssl rand -base64 48>
JWT_REFRESH_SECRET=<different from JWT_SECRET>

# Gateway
GATEWAY_INTERNAL_SECRET=<generate: openssl rand -base64 48>
TOKEN_VALIDATION_STRATEGY=local|api

# Kafka (optional)
EVENT_BUS_ENABLED=false
KAFKA_BROKERS=localhost:9092

# Service ports
PORT=3001  # per service
```

### Service Dependencies

Each service lists:
- `@nestjs/*` core packages
- `pg` for PostgreSQL
- `ioredis` for Redis
- `axios` for HTTP calls to other services
- `class-validator` + `class-transformer` for DTO validation
- `nest-winston` + `winston` for logging

## Testing

### API Testing (Postman/Newman)

Collection: `docs/Local-Service-Marketplace.postman_collection.json`
Environment: `newman/newman.env.json`

```bash
# Run full API test suite
pnpm test:api

# Verbose output
pnpm test:api:verbose

# Reports generated in test-reports/ (HTML + JSON)
```

### Unit/Integration Tests (Jest)

Each service has Jest configured:

```bash
cd services/identity-service
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
pnpm test:cov          # Coverage report
pnpm test:e2e          # End-to-end tests
```

Test files: `*.spec.ts` in `src/` or `test/` directories.

## Key Files to Understand

- `README.md` - Quick start, architecture overview
- `docs/architecture/ARCHITECTURE.md` - Complete system design
- `docs/api/API_SPECIFICATION.md` - API endpoints
- `api-gateway/TOKEN_VALIDATION_GUIDE.md` - Auth details
- `docker-compose.yml` - Service definitions, networking
- `database/schema.sql` - Full DB schema (45+ tables)

## Development Workflow

1. **Start services**: `docker-compose up -d`
2. **Check environment**: `.\scripts\verify-env.ps1`
3. **Run tests**: `pnpm test:api` or service-specific tests
4. **Make changes** → rebuild if needed: `docker-compose up -d --build`
5. **Check logs**: `docker-compose logs -f <service-name>`

## Important Conventions

- **TypeScript** everywhere (strict mode)
- **Nest.js** module/controller/service pattern
- **DTOs** with class-validator for request/response validation
- **Entities** with decorators for TypeORM
- **CQRS pattern** in marketplace-service (command/query separation)
- **Standardized response format** across all endpoints
- **Environment-specific configs** via `@nestjs/config`
- **Feature flags** via `infrastructure-service` when needed

## Database Seeding

```bash
.\scripts\seed-database.ps1
```

Creates:
- 151 users (customer + provider roles)
- 1000+ sample records (requests, proposals, jobs, reviews)
- Default admin: `admin@marketplace.com` / `password123`

## Troubleshooting

### Services not starting
- Check `.env` files have correct secrets
- Ensure PostgreSQL and Redis containers are running
- Verify ports are not in use

### Tests failing
- Ensure all services are running (`docker-compose ps`)
- Check Newman env file: `newman/newman.env.json`
- Verify base URLs in Postman collection

### Build errors
- Delete `node_modules` and rebuild: `pnpm install:all`
- Ensure Node 18+, pnpm 8+
- Clear Docker cache: `docker-compose build --no-cache`

## Git Workflow

- Main branch: `master`
- Use Conventional Commits: `feat:`, `fix:`, `chore:`, etc.
- CI/CD: PR triggers build/tests; merge triggers release/deploy
- See `.github/workflows/` for CI details

## Notes

- This is a **microservices monorepo** - changes may span multiple services
- **Breaking changes** should be coordinated across services
- **API contracts** are defined in Postman collection - keep it updated
- **Database migrations** should be used for schema changes (script exists)
- All external secrets must be in `.env` files (never commit real values)

## Documentation Index

- [README.md](README.md) - Quick start guide
- [docs/00_DOCUMENTATION_INDEX.md](docs/00_DOCUMENTATION_INDEX.md) - Full docs map
- [docs/architecture/ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md) - System design
- [docs/architecture/MICROSERVICE_BOUNDARY_MAP.md](docs/architecture/MICROSERVICE_BOUNDARY_MAP.md) - Service boundaries
- [docs/api/API_SPECIFICATION.md](docs/api/API_SPECIFICATION.md) - API reference
- [docs/IMPLEMENTATION_GUIDE.md](docs/IMPLEMENTATION_GUIDE.md) - Development patterns
- [docs/guides/AUTHENTICATION_WORKFLOW.md](docs/guides/AUTHENTICATION_WORKFLOW.md) - Auth flows
- [docs/guides/KAFKA_INTEGRATION.md](docs/guides/KAFKA_INTEGRATION.md) - Event streaming
- [docs/DATABASE_SEEDING.md](docs/DATABASE_SEEDING.md) - Seeding guide
- [docs/deployment/SCALING_STRATEGY.md](docs/deployment/SCALING_STRATEGY.md) - Scaling levels
- [frontend/README.md](frontend/README.md) - Frontend specifics
- [frontend/PROJECT_SUMMARY.md](frontend/PROJECT_SUMMARY.md) - Frontend architecture
- [frontend/TOKEN_REFRESH_GUIDE.md](frontend/TOKEN_REFRESH_GUIDE.md) - Token handling
- [api-gateway/TOKEN_VALIDATION_GUIDE.md](api-gateway/TOKEN_VALIDATION_GUIDE.md) - Gateway auth
