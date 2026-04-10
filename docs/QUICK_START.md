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
docker-compose up -d
```

Wait ~60 seconds, then verify:

```
http://localhost:3700/health   ? API Gateway
http://localhost:3000          ? Frontend
```

---

## Step 3 — Seed sample data (optional)

```powershell
.\scripts\seed-database.ps1
```

Creates 151 users and 1000+ records.
Default credentials: `admin@marketplace.com` / `password123`, also `provider1@example.com` / `password123` and `customer1@example.com` / `password123`

---

## Common Commands

```powershell
# View logs
docker-compose logs -f <service-name>

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

## Documentation

| Guide | Description |
|---|---|
| [GETTING_STARTED.md](GETTING_STARTED.md) | Full startup guide for each environment |
| [MARKETPLACE_GUIDE.md](MARKETPLACE_GUIDE.md) | Admin / Provider / Customer capabilities |
| [ENVIRONMENT_VARIABLES_GUIDE.md](ENVIRONMENT_VARIABLES_GUIDE.md) | All config options |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Common issues and fixes |
| [api/API_SPECIFICATION.md](api/API_SPECIFICATION.md) | API endpoint reference |
| [guides/AUTHENTICATION_WORKFLOW.md](guides/AUTHENTICATION_WORKFLOW.md) | Auth and token flow |
