# Platform Startup Guide

## Docker Compose (Recommended)

### Prerequisites

- Docker Desktop 20.x+ with Docker Compose 2.x+
- 4 GB RAM minimum (8 GB recommended)

### 1. Configure Environment

```powershell
copy .env.example docker.env
```

Edit `docker.env` and set:
- `DATABASE_URL` (or individual `DATABASE_*` vars)
- `JWT_SECRET` — generate with `openssl rand -base64 48`
- `JWT_REFRESH_SECRET` — different from JWT_SECRET
- `GATEWAY_INTERNAL_SECRET` — generate with `openssl rand -base64 48`
- `MONGO_ROOT_PASSWORD` — for email/sms services

### 2. Start Services

```powershell
docker-compose up -d
```

Wait 1–2 minutes for health checks. Verify:

```powershell
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### Services Started

| Container | Port | Role |
|-----------|------|------|
| api-gateway | 3700 | Single entry point for all API calls |
| identity-service | 3001 | Auth, users, providers |
| marketplace-service | 3003 | Requests, proposals, jobs, reviews |
| payment-service | 3006 | Payments, refunds |
| comms-service | 3007 | Notifications (email + SMS gateway) |
| oversight-service | 3010 | Admin, analytics |
| marketplace-postgres | 5432 | PostgreSQL database |

Optional services (enabled via Docker profiles):
- `infrastructure-service` (3012) — profile: `infrastructure`
- `email-service` (4000) — profile: `email`
- `sms-service` (5000) — profile: `sms`

### Access Points

| URL | Description |
|-----|-------------|
| http://localhost:3700/health | API Gateway health check |
| http://localhost:3000 | Frontend (if running locally) |

---

## Frontend (Local Development)

The frontend runs outside Docker for hot reload:

```powershell
cd frontend
copy .env.example .env.local
pnpm install
pnpm dev
```

Set in `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3700
AUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
```

---

## Docker Commands

```powershell
# View logs
docker-compose logs -f comms-service

# Restart a service
docker-compose restart identity-service

# Rebuild after code changes
docker-compose up -d --build

# Stop (keeps data)
docker-compose down

# Full reset (deletes all data)
docker-compose down -v

# Enable optional services
docker-compose --profile email --profile sms up -d
```

---

## Local Development (Without Docker)

### 1. Start Database Only

```powershell
docker-compose up -d postgres
```

### 2. Start Backend Services

```powershell
# In separate terminals:
cd services/identity-service && pnpm install && pnpm start:dev
cd services/marketplace-service && pnpm install && pnpm start:dev
cd services/payment-service && pnpm install && pnpm start:dev
cd services/comms-service && pnpm install && pnpm start:dev
cd services/oversight-service && pnpm install && pnpm start:dev
cd api-gateway && pnpm install && pnpm start:dev
```

### 3. Start Frontend

```powershell
cd frontend && pnpm install && pnpm dev
```

---

## Troubleshooting

### Services not starting

```powershell
docker-compose logs                     # Check for errors
docker-compose down -v && docker-compose up -d --build  # Full reset
```

### Port conflicts

```powershell
netstat -ano | findstr :3700           # Check what's using the port
```

### Database connection issues

```powershell
docker exec -it marketplace-postgres psql -U postgres -d marketplace
```

### Out of memory

Increase Docker Desktop resources: Settings → Resources → Memory → 8 GB.

---

## Verify Installation

```powershell
# Health check
curl http://localhost:3700/health

# Run API tests
pnpm test:api
```

Then open http://localhost:3000, sign up, and create a service request.

---

## 🎯 Production Deployment

For production deployment:

1. **Update Environment Variables**
   ```bash
   # Generate secure JWT secret
   openssl rand -base64 32
   ```

2. **Update .env file**
   - Change JWT_SECRET
   - Update database credentials
   - Set NODE_ENV=production

3. **Use Docker Swarm or Kubernetes**
   - See docs/SCALING_STRATEGY.md

4. **Set up SSL/TLS**
   - Use reverse proxy (Nginx/Traefik)
   - Configure SSL certificates

---

## 📈 Monitoring

### View Service Metrics
```powershell
# Container stats
docker stats

# Disk usage
docker system df

# View container resource usage
docker-compose top
```

### Access Logs
```powershell
# Follow logs in real-time
docker-compose logs -f

# Export logs to file
docker-compose logs > logs.txt
```

---

## 🧹 Cleanup

### Remove All Containers
```powershell
docker-compose down
```

### Remove All Data (CAUTION)
```powershell
docker-compose down -v
```

### Remove Unused Docker Resources
```powershell
docker system prune -a
```

---

## 📞 Need Help?

1. Check logs: `docker-compose logs -f`
2. Review documentation in `/docs` folder
3. Check individual service README files
4. Ensure all prerequisites are installed

---

## 🎉 Success!

If you can access http://localhost:3001 and see the homepage, congratulations! The entire Local Service Marketplace platform is running successfully.

**Next Steps:**
1. Create a test account
2. Explore the features
3. Review the API documentation
4. Start developing!

---

## 📚 Additional Resources

- [Architecture Guide](../architecture/ARCHITECTURE.md)
- [API Specification](../api/API_SPECIFICATION.md)
- [Implementation Guide](../IMPLEMENTATION_GUIDE.md)
- [Scaling Strategy](SCALING_STRATEGY.md)
- [Frontend README](../../frontend/README.md)

---

**Last Updated**: March 2026
