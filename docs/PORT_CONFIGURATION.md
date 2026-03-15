# Port Configuration Summary
**Updated:** March 14, 2026  
**Configuration:** Frontend DISABLED, API Gateway ENABLED, Email DISABLED

---

## 🔌 Port Mapping Overview

### Docker Port Mapping Format
`HOST_PORT:CONTAINER_PORT`
- **HOST_PORT** = Port on your local machine (localhost)
- **CONTAINER_PORT** = Port inside Docker container

---

## 📊 Service Port Configuration

### Core Backend Services (Always Running)

| Service | Container Port | Host Port | Access URL | Docker Service Name |
|---------|---------------|-----------|------------|-------------------|
| **PostgreSQL** | 5432 | 5432 | localhost:5432 | postgres |
| **Auth Service** | 3001 | 3001 | localhost:3001 | auth-service |
| **User Service** | 3002 | 3002 | localhost:3002 | user-service |
| **Request Service** | 3003 | 3003 | localhost:3003 | request-service |
| **Proposal Service** | 3004 | 3004 | localhost:3004 | proposal-service |
| **Job Service** | 3005 | 3005 | localhost:3005 | job-service |
| **Payment Service** | 3006 | 3006 | localhost:3006 | payment-service |
| **Messaging Service** | 3007 | 3007 | localhost:3007 | messaging-service |
| **Notification Service** | 3008 | 3008 | localhost:3008 | notification-service |
| **Review Service** | 3009 | 3009 | localhost:3009 | review-service |
| **Admin Service** | 3010 | 3010 | localhost:3010 | admin-service |

### API Gateway (Always Running)

| Service | Container Port | Host Port | Access URL | Docker Service Name |
|---------|---------------|-----------|------------|-------------------|
| **API Gateway** | 3000 | **3500** | **http://localhost:3500** | api-gateway |

⚠️ **Important:** API Gateway container runs on port 3000 internally, but maps to port **3500** on host.

### Frontend (Profile: frontend - DISABLED)

| Service | Container Port | Host Port | Access URL | Docker Service Name |
|---------|---------------|-----------|------------|-------------------|
| **Frontend** | 3000 | 3000 | http://localhost:3000 | marketplace-frontend |

### Optional Services

| Service | Container Port | Host Port | Access URL | Profile | Status |
|---------|---------------|-----------|------------|---------|--------|
| **Analytics Service** | 3011 | 3011 | localhost:3011 | analytics | DISABLED |
| **Infrastructure Service** | 3012 | 3012 | localhost:3012 | infrastructure | DISABLED |

### External Services (Optional)

| Service | Container Port | Host Port | Access URL | Profile | Status |
|---------|---------------|-----------|------------|---------|--------|
| **Email Service** | 3500 | 4000 | localhost:4000 | email | **DISABLED** |
| **SMS Service** | 3000 | 5000 | localhost:5000 | sms | DISABLED |
| **MongoDB (Email)** | 27017 | 27018 | localhost:27018 | email | DISABLED |
| **MongoDB (SMS)** | 27017 | 27019 | localhost:27019 | sms | DISABLED |

### Infrastructure Services (Optional)

| Service | Container Port | Host Port | Access URL | Profile | Status |
|---------|---------------|-----------|------------|---------|--------|
| **Redis** | 6379 | 6379 | localhost:6379 | cache | DISABLED |
| **Kafka** | 9092 | 9092 | localhost:9092 | events | DISABLED |
| **Zookeeper** | 2181 | 2181 | localhost:2181 | events | DISABLED |

---

## 🔗 Service Communication (Docker Internal)

When services communicate with each other inside Docker, they use **container names** and **container ports**:

```bash
# Service-to-Service Communication (Docker)
AUTH_SERVICE_URL=http://auth-service:3001
USER_SERVICE_URL=http://user-service:3002
REQUEST_SERVICE_URL=http://request-service:3003
PROPOSAL_SERVICE_URL=http://proposal-service:3004
JOB_SERVICE_URL=http://job-service:3005
PAYMENT_SERVICE_URL=http://payment-service:3006
MESSAGING_SERVICE_URL=http://messaging-service:3007
NOTIFICATION_SERVICE_URL=http://notification-service:3008
REVIEW_SERVICE_URL=http://review-service:3009
ADMIN_SERVICE_URL=http://admin-service:3010
ANALYTICS_SERVICE_URL=http://analytics-service:3011
INFRASTRUCTURE_SERVICE_URL=http://infrastructure-service:3012
EMAIL_SERVICE_URL=http://email-service:3500
SMS_SERVICE_URL=http://sms-service:3000
```

---

## 🌐 External Access (From Browser/Postman)

When accessing services from your **local machine** (browser, Postman, etc.), use **localhost** and **host ports**:

### Current Configuration (Frontend DISABLED, Gateway ENABLED)

```bash
# Primary Access Point
API Gateway:        http://localhost:3500

# Direct Service Access (for debugging only)
Auth Service:       http://localhost:3001
User Service:       http://localhost:3002
Request Service:    http://localhost:3003
Proposal Service:   http://localhost:3004
Job Service:        http://localhost:3005
Payment Service:    http://localhost:3006
Notification:       http://localhost:3008
Review Service:     http://localhost:3009
Admin Service:      http://localhost:3010

# Frontend (DISABLED - not running)
Frontend:           http://localhost:3000 (NOT ACTIVE)

# Email Service (DISABLED - not running)
Email Service:      http://localhost:4000 (NOT ACTIVE)
```

---

## 📝 Configuration Flags (.env)

Current settings in `.env`:

```bash
# Service Flags
FRONTEND_ENABLED=false           # Frontend NOT running
API_GATEWAY_ENABLED=true         # API Gateway ENABLED on port 3500
EMAIL_ENABLED=false              # Email service NOT running
SMS_ENABLED=false                # SMS service NOT running

# Infrastructure Flags
CACHE_ENABLED=false              # Redis NOT running
EVENT_BUS_ENABLED=false          # Kafka NOT running
WORKERS_ENABLED=false            # Background workers disabled
ANALYTICS_ENABLED=false          # Analytics service NOT running
INFRASTRUCTURE_ENABLED=false     # Infrastructure service NOT running
MESSAGING_ENABLED=false          # Messaging service NOT running

# Ports
FRONTEND_PORT=3000               # Frontend port (when enabled)
API_GATEWAY_PORT=3500            # API Gateway host port
```

---

## 🚀 Quick Start Commands

### Start Core Services + API Gateway
```powershell
.\start.ps1
```

This starts:
- ✅ PostgreSQL (port 5432)
- ✅ All 11 core microservices (ports 3001-3010)
- ✅ API Gateway (port 3500)

### Enable Frontend
```powershell
# Edit .env file
FRONTEND_ENABLED=true

# Restart
.\start.ps1
```

### Enable Email Service
```powershell
# Edit .env file
EMAIL_ENABLED=true

# Restart
.\start.ps1
```

---

## 🔍 Testing Endpoints

### Test API Gateway (should work)
```bash
curl http://localhost:3500/health
curl http://localhost:3500/api/v1/auth/register
```

### Test Auth Service Directly
```bash
curl http://localhost:3001/health
```

### Test Frontend (when enabled)
```bash
Open browser: http://localhost:3000
```

---

## ⚠️ Common Issues

### Issue: "Cannot connect to localhost:3500"
**Cause:** API Gateway not running or profile not enabled  
**Fix:** Check that `API_GATEWAY_ENABLED=true` in `.env` and run `.\start.ps1`

### Issue: "Cannot connect to localhost:3000"
**Cause:** Frontend is disabled  
**Fix:** Set `FRONTEND_ENABLED=true` in `.env` and restart

### Issue: "Cannot connect to localhost:4000" (Email Service)
**Cause:** Email service is disabled  
**Fix:** Set `EMAIL_ENABLED=true` in `.env` and restart

### Issue: "Port already in use"
**Cause:** Another service is using that port  
**Fix:** 
```powershell
# Stop all Docker containers
docker-compose down

# Check what's using the port
netstat -ano | findstr :3500

# Kill the process or change the port in docker-compose.yml
```

---

## 📦 Docker Compose Profiles

Services are organized by profiles:

| Profile | Services Included | When to Use |
|---------|------------------|-------------|
| **None** | Core 11 services + PostgreSQL + API Gateway | MVP launch (default) |
| **frontend** | + Frontend + API Gateway | Full stack development |
| **gateway** | + API Gateway only | Backend + Gateway only |
| **email** | + Email service + MongoDB | Email notifications |
| **sms** | + SMS service + MongoDB | SMS notifications |
| **cache** | + Redis | Enable caching (Level 2) |
| **events** | + Kafka + Zookeeper | Event streaming (Level 4) |
| **analytics** | + Analytics service | Custom analytics |
| **infrastructure** | + Infrastructure service | Infrastructure tools |
| **messaging** | + Messaging service | In-app chat |

---

## ✅ Current Status Summary

**Active Services:**
- ✅ PostgreSQL Database (5432)
- ✅ 11 Core Microservices (3001-3010)
- ✅ API Gateway (3500)

**Inactive Services:**
- ❌ Frontend (3000)
- ❌ Email Service (4000)
- ❌ SMS Service (5000)
- ❌ Redis, Kafka, MongoDB
- ❌ Analytics, Infrastructure, Messaging services

**Primary Access Point:**
- **http://localhost:3500** (API Gateway)

**Frontend Access:**
- **http://localhost:3000** (Disabled - set FRONTEND_ENABLED=true to enable)

---

## 🔄 Port Synchronization Checklist

✅ **Root .env**
- FRONTEND_PORT=3000
- API_GATEWAY_PORT=3500
- FRONTEND_ENABLED=false
- API_GATEWAY_ENABLED=true
- EMAIL_ENABLED=false

✅ **docker-compose.yml**
- api-gateway: "3500:3000" (host 3500 → container 3000)
- frontend: "3000:3000" (host 3000 → container 3000)
- email-service: "4000:3500" (host 4000 → container 3500)
- sms-service: "5000:3000" (host 5000 → container 3000)

✅ **frontend/nextjs-app/Dockerfile**
- EXPOSE 3000
- ENV PORT 3000

✅ **frontend/nextjs-app/.env.local**
- NEXT_PUBLIC_API_URL=http://localhost:3500

✅ **api-gateway/.env**
- PORT=3000 (internal port)
- No profile restriction (always runs)

---

**All ports are now synchronized and configured correctly!**
