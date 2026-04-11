# Quick Start

Get the platform running in 3 steps. For full documentation see [GETTING_STARTED.md](GETTING_STARTED.md).

---

## Prerequisites

- Docker Desktop 20.x+ with Docker Compose 2.x+
- 4 GB RAM minimum (8 GB recommended)

---

## Step 1 — Configure secrets

```powershell
.\scripts\setup-env-files.ps1
```

Then in `docker.env` set these three secrets (generate each with `openssl rand -base64 48`):

```env
JWT_SECRET=
JWT_REFRESH_SECRET=
GATEWAY_INTERNAL_SECRET=
```

---

## Step 2 — Start services

```powershell
# Start core services (postgres, pgbouncer, all microservices, api-gateway)
docker-compose up -d

# Start Redis (required for token blacklist + caching)
docker-compose --profile cache up -d redis
```

Wait ~60 seconds, then verify:

```
http://localhost:3700/health   -> API Gateway (JSON response)
http://localhost:3000          -> Frontend
```

---

## Step 3 — Seed sample data (optional)

```powershell
cd database; node seed.js
```

Creates 320+ users and 1000+ records across all tables.

Default credentials:
- Admin: `admin@marketplace.com` / `password123`
- Provider: `provider1@example.com` / `password123`
- Customer: `customer1@example.com` / `password123`

---

## Common Commands

```powershell
# Check status of all containers
docker-compose ps

# View logs for a service
docker-compose logs -f identity-service

# Restart a service
docker-compose restart identity-service

# Rebuild after code changes
docker-compose up -d --build

# Stop everything (keep data)
docker-compose down

# Full reset (deletes all data)
docker-compose down -v

# Seed the database
cd database; node seed.js
```

---

## Documentation

| Guide | Description |
|---|---|
| [GETTING_STARTED.md](GETTING_STARTED.md) | Full startup guide for each environment |
| [MARKETPLACE_GUIDE.md](MARKETPLACE_GUIDE.md) | Admin / Provider / Customer capabilities |
| [ENVIRONMENT_VARIABLES_GUIDE.md](ENVIRONMENT_VARIABLES_GUIDE.md) | All config options |
| [BULLMQ_CONFIGURATION_GUIDE.md](BULLMQ_CONFIGURATION_GUIDE.md) | Background job queues |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Common issues and fixes |
| [api/API_SPECIFICATION.md](api/API_SPECIFICATION.md) | API endpoint reference |
| [guides/AUTHENTICATION_WORKFLOW.md](guides/AUTHENTICATION_WORKFLOW.md) | Auth and token flow |
| [deployment/SCALING_STRATEGY.md](deployment/SCALING_STRATEGY.md) | Scaling levels and infrastructure |
