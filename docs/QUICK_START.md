# 🚀 Quick Start Guide (5 Minutes)

**Local Service Marketplace** - Get up and running in 5 minutes!

---

## Prerequisites

Before you begin, ensure you have installed:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop/))
- **Git** ([Download](https://git-scm.com/downloads))

---

## Step 1: Clone & Start Services (2 minutes)

```powershell
# Clone the repository
cd "c:\workSpace\Projects\Application"
cd "Local Service Marketplace"

# Start all services with Docker
.\scripts\start.ps1

# Wait for all containers to start (30-60 seconds)
# You should see: "✅ All services are healthy"
```

### Verify Services Running

```powershell
docker ps --format "table {{.Names}}\t{{.Status}}"
```

You should see 14 services running:
- ✅ api-gateway (port 3500)
- ✅ auth-service (port 3001)
- ✅ user-service (port 3002)
- ✅ request-service (port 3003)
- ✅ And 10 more services...
- ✅ marketplace-postgres (port 5432)

---

## Step 2: Configure Frontend (2 minutes)

```powershell
# Navigate to frontend
cd frontend\nextjs-app

# Copy environment template
cp .env.example .env.local

# Edit .env.local and add your credentials
```

### Required Environment Variables

```bash
# .env.local

# API Gateway URL (already configured)
NEXT_PUBLIC_API_URL=http://localhost:3500

# Google Maps API Key (REQUIRED for location features)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Optional: Stripe for payments
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
```

### Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or select existing)
3. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Create credentials → API Key
5. Copy the key and paste it in `.env.local`

---

## Step 3: Start Frontend (1 minute)

```powershell
# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

Wait for:
```
✓ Ready in 3.2s
○ Local:   http://localhost:3000
```

---

## Step 4: Access the Platform (30 seconds)

### Frontend
**URL:** http://localhost:3000

**Test Accounts:**
```
Email: test@example.com
Password: Test123!@#
```

Or create a new account (instant signup, no email verification needed).

### API Gateway
**URL:** http://localhost:3500

**Health Check:** http://localhost:3500/api/v1/health

### API Documentation
All endpoints use the `/api/v1` prefix:
- `POST /api/v1/auth/login`
- `GET /api/v1/users`
- `POST /api/v1/requests`
- See [api/API_SPECIFICATION.md](api/API_SPECIFICATION.md) for complete list

---

## 🎯 Test the Platform (2 minutes)

### 1. Sign Up
1. Go to http://localhost:3000/signup
2. Enter email, password, select role (Customer or Provider)
3. Click "Sign Up"
4. You're automatically logged in!

### 2. Create a Service Request
1. Go to **Requests** → **Create Request**
2. Fill in details:
   - Description: "Need plumbing work"
   - Budget: $500
   - Category: Select from dropdown
   - **Location**: Click the map or search for an address
3. Click "Create Request"
4. ✅ Request created with pinpoint location!

### 3. Browse Providers
1. Go to **Providers**
2. Use filters (service type, location, availability)
3. Click on a provider to see their profile
4. See their availability calendar

### 4. Real-time Notifications
1. Watch the notification bell icon in top-right
2. Badge shows unread count (updated every 30 seconds)
3. Click to view all notifications

---

## 🛠️ Common Commands

### Docker Management

```powershell
# Start all services
.\scripts\start.ps1

# Stop all services
.\scripts\stop.ps1

# Restart a specific service
docker-compose restart auth-service

# View logs
docker logs auth-service --tail 50

# Check service health
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### Frontend Development

```powershell
cd frontend\nextjs-app

# Development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Check for linting errors
npm run lint
```

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
- [x] API Gateway responding at http://localhost:3500
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
