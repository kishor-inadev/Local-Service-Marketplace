# 🚀 Local Service Marketplace - Complete Platform Startup Guide

## Quick Start - Run Everything with Docker Compose

### Prerequisites

1. **Docker Desktop** installed and running
   - Download from: https://www.docker.com/products/docker-desktop
   - Minimum: Docker 20.x, Docker Compose 2.x
   - Ensure enough resources: 4GB RAM minimum, 8GB recommended

2. **Git** (to clone/navigate the repository)

---

## 🎯 One-Command Startup (Recommended)

```powershell
# 1. Navigate to project root
cd "c:\workSpace\Projects\Application\Local Service Marketplace"

# 2. Create environment file (first time only)
copy .env.example .env

# 3. Start all services
docker-compose up -d

# 4. Watch logs (optional)
docker-compose logs -f
```

That's it! The entire platform will start:
- ✅ PostgreSQL Database (port 5432)
- ✅ Redis Cache (port 6379)
- ✅ 12 Microservices (ports 3001-3012)
- ✅ API Gateway (port 3000)
- ✅ Frontend (port 3001)

---

## 🌐 Access the Application

Once all services are running (takes 2-3 minutes for first build):

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3001 | Main web application |
| **API Gateway** | http://localhost:3000 | Backend API endpoint |
| **PostgreSQL** | localhost:5432 | Database (use DB client) |
| **Redis** | localhost:6379 | Cache/Queue |

---

## 📋 Service Ports Map

| Service | Port | Container Name |
|---------|------|----------------|
| Auth Service | 3001 | auth-service |
| User Service | 3002 | user-service |
| Request Service | 3003 | request-service |
| Proposal Service | 3004 | proposal-service |
| Job Service | 3005 | job-service |
| Payment Service | 3006 | payment-service |
| Messaging Service | 3007 | messaging-service |
| Notification Service | 3008 | notification-service |
| Review Service | 3009 | review-service |
| Admin Service | 3010 | admin-service |
| Analytics Service | 3011 | analytics-service |
| Infrastructure Service | 3012 | infrastructure-service |

---

## 🛠️ Docker Commands

### Start Services
```powershell
# Start all services (detached mode)
docker-compose up -d

# Start specific services only
docker-compose up -d postgres redis api-gateway frontend

# Start and rebuild (after code changes)
docker-compose up -d --build

# Start with live logs
docker-compose up
```

### Stop Services
```powershell
# Stop all services (keeps data)
docker-compose stop

# Stop and remove containers (keeps volumes/data)
docker-compose down

# Stop and remove everything including volumes (CAUTION: deletes database)
docker-compose down -v
```

### View Logs
```powershell
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api-gateway
docker-compose logs -f frontend
docker-compose logs -f auth-service

# Last 100 lines
docker-compose logs --tail=100 -f
```

### Check Status
```powershell
# List running containers
docker-compose ps

# Check service health
docker-compose ps
```

### Restart Services
```powershell
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart api-gateway
docker-compose restart frontend
```

### Rebuild After Changes
```powershell
# Rebuild specific service
docker-compose build auth-service
docker-compose up -d auth-service

# Rebuild everything
docker-compose build
docker-compose up -d
```

---

## 🔍 Troubleshooting

### Services not starting?

1. **Check Docker is running**
   ```powershell
   docker --version
   docker-compose --version
   ```

2. **Check logs for errors**
   ```powershell
   docker-compose logs
   ```

3. **Ensure ports are not in use**
   ```powershell
   # Check what's using port 3000
   netstat -ano | findstr :3000
   
   # Kill process if needed
   taskkill /PID <PID> /F
   ```

4. **Reset everything**
   ```powershell
   docker-compose down -v
   docker-compose up -d --build
   ```

### Database connection issues?

```powershell
# Check PostgreSQL is healthy
docker-compose ps postgres

# Connect to PostgreSQL directly
docker exec -it marketplace-postgres psql -U postgres -d marketplace

# View database tables
\dt
```

### Frontend can't connect to API?

1. Check API Gateway is running:
   ```powershell
   docker-compose ps api-gateway
   curl http://localhost:3000/health
   ```

2. Check frontend environment:
   ```powershell
   docker-compose logs frontend | findstr API_URL
   ```

### Service taking too long to start?

Services start in order due to health checks. Wait 3-5 minutes for first startup.

```powershell
# Watch startup progress
docker-compose logs -f
```

### Out of memory errors?

Increase Docker Desktop resources:
1. Docker Desktop → Settings → Resources
2. Increase Memory to 8GB
3. Increase CPUs to 4
4. Apply & Restart

---

## 🧪 Alternative: Development Mode (Without Docker)

If you prefer to run services locally without Docker:

### 1. Start Database & Redis
```powershell
docker-compose up -d postgres redis
```

### 2. Start Backend Services (in separate terminals)

```powershell
# Terminal 1: Auth Service
cd services/auth-service
npm install
npm run start:dev

# Terminal 2: User Service
cd services/user-service
npm install
npm run start:dev

# ... repeat for all 12 services
```

### 3. Start API Gateway
```powershell
cd api-gateway
npm install
npm run start:dev
```

### 4. Start Frontend
```powershell
cd frontend/nextjs-app
npm install
npm run dev
```

---

## 📊 Verify Installation

Once everything is running, verify the installation:

### 1. Check Services Health
```powershell
# API Gateway health
curl http://localhost:3000/health

# Frontend
curl http://localhost:3001
```

### 2. Create Test User
Open browser to http://localhost:3001 and:
1. Click "Sign Up"
2. Create a customer account
3. Login

### 3. Test Core Features
- ✅ Create a service request
- ✅ Browse requests
- ✅ View dashboard
- ✅ Check notifications

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
