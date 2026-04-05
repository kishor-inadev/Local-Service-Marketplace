# Quick Start Guide

Get the Local Service Marketplace running locally in 5 minutes.

---

## Prerequisites

- **Docker Desktop** 20.x+ with Docker Compose 2.x+
- **Node.js** 18+ and **pnpm** 8+
- 4 GB RAM minimum (8 GB recommended)

---

## Step 1: Configure Environment

```powershell
# Copy environment template
copy .env.example docker.env

# Generate secure secrets
openssl rand -base64 48   # → paste as JWT_SECRET
openssl rand -base64 48   # → paste as JWT_REFRESH_SECRET
openssl rand -base64 48   # → paste as GATEWAY_INTERNAL_SECRET
```

Edit `docker.env` and set `DATABASE_URL` (or the individual `DATABASE_*` vars), plus the three secrets above.

---

## Step 2: Start Backend Services

```powershell
docker-compose up -d
```

Wait 1–2 minutes, then verify:

```powershell
docker ps --format "table {{.Names}}\t{{.Status}}"
```

You should see these containers healthy:

| Container | Port | Role |
|-----------|------|------|
| api-gateway | 3700 | Single entry point |
| identity-service | 3001 | Auth + Users |
| marketplace-service | 3003 | Requests + Proposals + Jobs + Reviews |
| payment-service | 3006 | Payments + Refunds |
| comms-service | 3007 | Notifications |
| oversight-service | 3010 | Admin + Analytics |
| marketplace-postgres | 5432 | Database |

Health check: http://localhost:3700/health

---

## Step 3: Start Frontend

```powershell
cd frontend
copy .env.example .env.local
pnpm install
pnpm dev
```

Set these in `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3700
AUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
```

Frontend: http://localhost:3000

---

## Step 4: Seed Sample Data (Optional)

```powershell
.\scripts\seed-database.ps1
```

Creates 151 users and 1000+ sample records.
Default admin: `admin@marketplace.com` / `password123`

---

## Test the Platform

1. Go to http://localhost:3000/signup and create an account
2. Create a service request from the dashboard
3. Run API tests: `pnpm test:api`

---

## Common Commands

```powershell
docker-compose logs -f comms-service    # View service logs
docker-compose restart identity-service # Restart a service
docker-compose up -d --build            # Rebuild after code changes
docker-compose down                     # Stop everything
docker-compose down -v                  # Full reset (deletes data)
```

For full documentation see [README.md](../README.md).

### Database Access

```powershell
# Connect to PostgreSQL
docker exec -it marketplace-postgres psql -U postgres -d marketplace

# Run SQL queries
SELECT * FROM users LIMIT 5;

# Exit
\q
```

---

## 📚 Next Steps

Now that you're up and running:

### Learn the Architecture
- 📖 [architecture/ARCHITECTURE.md](architecture/ARCHITECTURE.md) - System design and microservices
- 📖 [architecture/MICROSERVICE_BOUNDARY_MAP.md](architecture/MICROSERVICE_BOUNDARY_MAP.md) - Service responsibilities
- 📖 [api/API_SPECIFICATION.md](api/API_SPECIFICATION.md) - Complete API reference

### Explore Features
- 📖 [GOOGLE_MAPS_SETUP.md](GOOGLE_MAPS_SETUP.md) - Google Maps integration
- 📖 [guides/AUTHENTICATION_WORKFLOW.md](guides/AUTHENTICATION_WORKFLOW.md) - Auth system
- 📖 [guides/OAUTH_INTEGRATION_GUIDE.md](guides/OAUTH_INTEGRATION_GUIDE.md) - Google/Facebook login

### Configure Optional Services
- 📖 [guides/EMAIL_SMS_INTEGRATION_GUIDE.md](guides/EMAIL_SMS_INTEGRATION_GUIDE.md) - Email/SMS setup
- 📖 [services/SERVICE_PAYMENT_README.md](services/SERVICE_PAYMENT_README.md) - Stripe integration

### Troubleshooting
- 📖 [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues & solutions

---

## 🔥 Quick Troubleshooting

### Issue: Services not starting
```powershell
# Check Docker is running
docker --version

# Restart Docker Desktop
# Then: .\scripts\start.ps1
```

### Issue: "Cannot connect to database"
```powershell
# Check postgres is running
docker ps | grep postgres

# Restart postgres
docker-compose restart marketplace-postgres
```

### Issue: "CORS error" in browser
```powershell
# Restart API Gateway
docker-compose restart api-gateway

# Clear browser cache (Ctrl+Shift+Delete)
```

### Issue: "Google Maps not loading"
```
1. Check .env.local has NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
2. Verify API key is valid in Google Cloud Console
3. Ensure Maps JavaScript API is enabled
4. Restart frontend: npm run dev
```

### Issue: "401 Unauthorized" errors
```
1. Clear localStorage in browser (DevTools → Application → Clear)
2. Log out and log in again
3. Check JWT_SECRET matches in all backend services
```

---

## 📞 Get Help

If you're stuck:

1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Review service logs: `docker logs [service-name]`
3. Check the [Documentation Index](00_DOCUMENTATION_INDEX.md)

---

## ✅ Success Checklist

After completing this guide, you should have:

- [x] All 14 Docker containers running
- [x] Frontend accessible at http://localhost:3000
- [x] API Gateway responding at http://localhost:3700
- [x] Google Maps API key configured
- [x] Able to sign up and log in
- [x] Created your first service request with location
- [x] Browsed providers list

**🎉 Congratulations! You're ready to develop!**

---

## 🚀 Performance Tips

- **Frontend Hot Reload**: Changes auto-refresh (no restart needed)
- **Backend Changes**: Rebuild container: `docker-compose up -d --build [service-name]`
- **Database Changes**: Run migrations after schema changes
- **Clear Cache**: `docker system prune` (use carefully)

---

**Time to Complete:** ~5-7 minutes  
**Difficulty:** Easy  
**Support:** See TROUBLESHOOTING.md for help

---

[← Back to Documentation Index](00_DOCUMENTATION_INDEX.md) | [Architecture Overview →](architecture/ARCHITECTURE.md)
