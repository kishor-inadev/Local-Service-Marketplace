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

### 🗄️ Database

```powershell
# Seed database with test data (1000+ records)
.\scripts\seed-database.ps1

# Connect to database manually
docker exec -it marketplace-postgres psql -U postgres -d marketplace

# Check database tables
docker exec marketplace-postgres psql -U postgres -d marketplace -c "\dt"

# View user count
docker exec marketplace-postgres psql -U postgres -d marketplace -c "SELECT COUNT(*) FROM users;"
```

---

### 🐳 Docker Services

```powershell
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View running services
docker ps

# View logs
docker-compose logs -f [service-name]

# Restart specific service
docker-compose restart identity-service

# Rebuild and restart
docker-compose up -d --build
```

---

### 💻 Frontend

```powershell
# Start development server
cd frontend
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test
```

---

### 🔍 Health Checks

```powershell
# Check API Gateway
Invoke-WebRequest -Uri "http://localhost:3700/health"

# Check specific service
Invoke-WebRequest -Uri "http://localhost:3001/health"  # identity-service
Invoke-WebRequest -Uri "http://localhost:3003/health"  # marketplace-service
Invoke-WebRequest -Uri "http://localhost:3006/health"  # payment-service

# Check all services
.\scripts\verify-integration.ps1
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

## 📝 Default Credentials

### Admin User (after seeding):
```
Email: admin@marketplace.com
Password: password123
```

### Test Users (after seeding):
```
Password: password123
(All generated users use the same password)
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

## 📚 Documentation

### Essential Docs:
- [Quick Start](docs/QUICK_START.md)
- [Integration Status](docs/INTEGRATION_STATUS_REPORT.md)
- [Documentation Index](docs/00_DOCUMENTATION_INDEX.md)
- [Cleanup Summary](docs/DOCUMENTATION_CLEANUP_SUMMARY.md)

### By Category:
- **API:** [docs/api/](docs/api/)
- **Architecture:** [docs/architecture/](docs/architecture/)
- **Services:** [docs/services/](docs/services/)
- **Deployment:** [docs/deployment/](docs/deployment/)
- **Guides:** [docs/guides/](docs/guides/)

---

## ⚡ Quick Start from Scratch

```powershell
# 1. Generate and apply secrets
.\scripts\generate-production-secrets.ps1
.\scripts\apply-secrets.ps1

# 2. Start Docker services
docker-compose up -d

# 3. Wait for services to be ready (30 seconds)
Start-Sleep -Seconds 30

# 4. Seed database
.\scripts\seed-database.ps1

# 5. Start frontend
cd frontend
npm run dev

# 6. Open browser
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
