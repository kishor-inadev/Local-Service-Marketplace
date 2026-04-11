# 🚀 Quick Reference Guide
**Local Service Marketplace Platform**

---

## 📋 Essential Commands

### 🔐 Secrets Management

```powershell
# Generate new production secrets
.\scripts\generate-production-secrets.ps1

# Apply secrets to all services
.\scripts\apply-secrets.ps1
```

**Important:** Always generate fresh secrets for production!

---

### Database

```powershell
# Seed database with test data (1000+ records)
cd database; node seed.js

# Connect to database manually
docker exec -it marketplace-postgres psql -U postgres -d marketplace

# Check database tables
docker exec marketplace-postgres psql -U postgres -d marketplace -c "\dt"

# View user count
docker exec marketplace-postgres psql -U postgres -d marketplace -c "SELECT COUNT(*) FROM users;"

# Apply schema to fresh database
Get-Content database\schema.sql | docker exec -i marketplace-postgres psql -U postgres -d marketplace
```

---

### Docker Services

```powershell
# Start core services
docker-compose up -d

# Start Redis (required for token blacklist + caching)
docker-compose --profile cache up -d redis

# Stop all services
docker-compose down

# View running services and health
docker-compose ps

# View logs
docker-compose logs -f [service-name]

# Restart specific service
docker-compose restart identity-service

# Rebuild and restart
docker-compose up -d --build
```

---

### Frontend

```powershell
# Start development server
cd frontend
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run tests
pnpm test
```

---

### Health Checks

```powershell
# Check all containers
docker-compose ps

# Check API Gateway
curl http://localhost:3700/health -UseBasicParsing

# Check all services
curl http://localhost:3001/health -UseBasicParsing  # identity-service
curl http://localhost:3003/health -UseBasicParsing  # marketplace-service
curl http://localhost:3006/health -UseBasicParsing  # payment-service
curl http://localhost:3007/health -UseBasicParsing  # comms-service
curl http://localhost:3010/health -UseBasicParsing  # oversight-service

# Check Redis
docker exec marketplace-redis redis-cli ping
```

---

### 🧪 Testing

```powershell
# Test user registration
$body = @{ name = 'Test User'; email = 'test@example.com'; phone = '+1234567890'; password = 'Test123!@#'; role = 'customer' } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:3700/api/v1/user/auth/signup" -Method POST -Headers @{'Content-Type'='application/json'} -Body $body

# Test user login
$body = @{ email = 'test@example.com'; password = 'Test123!@#' } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:3700/api/v1/user/auth/login" -Method POST -Headers @{'Content-Type'='application/json'} -Body $body
```

---

## 📂 Project Structure

```
Local-Service-Marketplace/
├── api-gateway/          # API Gateway (Port 3700)
├── services/             # Microservices
│   ├── identity-service/     # Port 3001 (Auth + Users + Providers)
│   ├── marketplace-service/  # Port 3003 (Requests + Proposals + Jobs + Reviews)
│   ├── payment-service/      # Port 3006
│   ├── comms-service/        # Port 3007 (Notifications + Messaging)
│   ├── oversight-service/    # Port 3010 (Admin + Analytics)
│   ├── infrastructure-service/ # Port 3012
│   ├── email-service/        # Internal 3500
│   └── sms-service/          # Internal 3000
├── frontend/             # Next.js Frontend (Port 3000)
├── database/             # Schema and seeding
├── docs/                 # Documentation
│   ├── api/
│   ├── architecture/
│   ├── deployment/
│   └── guides/
├── docker-compose.yml    # Docker orchestration
└── scripts/              # Utility scripts
```

---

## 🔑 Environment Files

### Root Directory:
- `secrets.env` - Generated secrets (DO NOT COMMIT)
- `docker.env` - Docker environment (DO NOT COMMIT)
- `.env` - General environment variables

### Backend Services:
- `services/*/\.env` - Service-specific configuration

### Frontend:
- `frontend/.env.local` - Frontend configuration (DO NOT COMMIT)

---

## 🌐 Service Ports

| Service | Port | URL |
|---------|------|-----|
| API Gateway | 3700 | http://localhost:3700 |
| Frontend | 3000 | http://localhost:3000 |
| identity-service | 3001 | http://localhost:3001 |
| marketplace-service | 3003 | http://localhost:3003 |
| payment-service | 3006 | http://localhost:3006 |
| comms-service | 3007 | http://localhost:3007 |
| oversight-service | 3010 | http://localhost:3010 |
| infrastructure-service | 3012 | http://localhost:3012 |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 (when enabled) |

---

### Default Credentials

Admin user (after seeding):
```
Email: admin@marketplace.com
Password: password123
```

Test users (after seeding):
```
provider1@example.com / password123
customer1@example.com / password123
```

---

## 🔧 Troubleshooting

### Port Already in Use:
```powershell
# Find process on port 3000
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess

# Kill specific process
Stop-Process -Id [PROCESS_ID] -Force
```

### Database Connection Issues:
```powershell
# Check if PostgreSQL is running
docker ps | Select-String postgres

# Restart PostgreSQL
docker-compose restart postgres

# View PostgreSQL logs
docker-compose logs postgres
```

### Service Not Responding:
```powershell
# Check service logs
docker-compose logs [service-name]

# Restart service
docker-compose restart [service-name]

# Rebuild service
docker-compose up -d --build [service-name]
```

### Clear Docker Volumes:
```powershell
# Stop all services
docker-compose down

# Remove volumes (WARNING: Deletes all data!)
docker-compose down -v

# Or remove specific volume
docker volume rm local-service-marketplace_postgres_data

# Start fresh
docker-compose up -d
```

---

## Documentation

| Doc | Purpose |
|-----|---------|
| [QUICK_START.md](QUICK_START.md) | 3-step startup |
| [GETTING_STARTED.md](GETTING_STARTED.md) | Full setup for all environments |
| [MARKETPLACE_GUIDE.md](MARKETPLACE_GUIDE.md) | Roles, workflows, capabilities |
| [ENVIRONMENT_VARIABLES_GUIDE.md](ENVIRONMENT_VARIABLES_GUIDE.md) | All env vars explained |
| [BULLMQ_CONFIGURATION_GUIDE.md](BULLMQ_CONFIGURATION_GUIDE.md) | Background job queues |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Common issues and fixes |
| [api/API_SPECIFICATION.md](api/API_SPECIFICATION.md) | API endpoint reference |
| [guides/AUTHENTICATION_WORKFLOW.md](guides/AUTHENTICATION_WORKFLOW.md) | Auth flow |
| [guides/KAFKA_INTEGRATION.md](guides/KAFKA_INTEGRATION.md) | Event-driven setup |
| [deployment/SCALING_STRATEGY.md](deployment/SCALING_STRATEGY.md) | Scaling levels |

---

## Quick Start from Scratch

```powershell
# 1. Configure secrets
.\scripts\setup-env-files.ps1
# Edit docker.env with your JWT_SECRET, JWT_REFRESH_SECRET, GATEWAY_INTERNAL_SECRET

# 2. Start core services
docker-compose up -d

# 3. Start Redis
docker-compose --profile cache up -d redis

# 4. Wait for all services to be healthy
docker-compose ps

# 5. Apply database schema
Get-Content database\schema.sql | docker exec -i marketplace-postgres psql -U postgres -d marketplace

# 6. Seed database
cd database; node seed.js

# 7. Start frontend
cd frontend
pnpm dev

# 8. Open browser
start http://localhost:3000
```

---

## 🔒 Security Checklist

- [ ] Generated production secrets
- [ ] Applied secrets to all services
- [ ] Verified .gitignore excludes secrets
- [ ] Changed default passwords
- [ ] Configured OAuth providers
- [ ] Set up SMTP for emails
- [ ] Configured payment gateway
- [ ] Enabled HTTPS in production
- [ ] Set up monitoring

---

## 🆘 Need Help?

1. Check [Troubleshooting Guide](docs/TROUBLESHOOTING.md)
2. Review [Integration Status](docs/INTEGRATION_STATUS_REPORT.md)
3. See [Documentation Index](docs/00_DOCUMENTATION_INDEX.md)
4. Check service-specific README in [docs/services/](docs/services/)

---

**Keep this file handy for quick reference!** 📌
