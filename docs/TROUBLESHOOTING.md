# 🔧 Troubleshooting Guide

Common issues and solutions for the Local Service Marketplace platform.

---

## Table of Contents

1. [Docker & Service Issues](#docker--service-issues)
2. [Frontend Issues](#frontend-issues)
3. [Backend API Issues](#backend-api-issues)
4. [Database Issues](#database-issues)
5. [Authentication Issues](#authentication-issues)
6. [Google Maps Issues](#google-maps-issues)
7. [Notification Issues](#notification-issues)
8. [Performance Issues](#performance-issues)

---

## Docker & Service Issues

### ❌ Services Won't Start

**Error:** `Cannot connect to Docker daemon`

**Solution:**
```powershell
# 1. Check Docker Desktop is running
docker --version

# 2. Start Docker Desktop
# (Open Docker Desktop app)

# 3. Wait for Docker to be ready, then:
.\scripts\start.ps1
```

---

### ❌ Container Exits Immediately

**Error:** `Container identity-service exited with code 1`

**Solution:**
```powershell
# 1. Check logs for error details
docker logs identity-service --tail 50

# 2. Common causes:
# - Missing environment variables
# - Database not ready
# - Port already in use

# 3. Restart with fresh build
docker-compose stop identity-service
docker-compose build --no-cache identity-service
docker-compose up -d identity-service

# 4. Check if it's running
docker ps | grep identity-service
```

---

### ❌ Port Already in Use

**Error:** `Bind for 0.0.0.0:3700 failed: port is already allocated`

**Solution:**
```powershell
# 1. Find what's using the port
netstat -ano | findstr :3700

# 2. Kill the process (replace PID with actual number)
taskkill /PID <PID> /F

# 3. Or change the port in docker-compose.yml
# Change: "3700:3000" to "3701:3000"

# 4. Restart services
.\scripts\start.ps1
```

---

### ❌ Database Connection Failed

**Error:** `ECONNREFUSED 127.0.0.1:5432`

**Solution:**
```powershell
# 1. Check if postgres is running
docker ps | grep postgres

# 2. Check postgres health
docker exec marketplace-postgres pg_isready

# 3. If not running, start it
docker-compose up -d marketplace-postgres

# 4. Wait 10 seconds for postgres to be ready

# 5. Restart the service that failed
docker-compose restart marketplace-service
```

---

##Frontend Issues

###❌ CORS Error

**Error:** `Access to XMLHttpRequest has been blocked by CORS policy`

**Solution:**
```powershell
# 1. Check API Gateway is running
docker ps | grep api-gateway

# 2. Restart API Gateway
docker-compose restart api-gateway

# 3. Clear browser cache
# Press Ctrl+Shift+Delete → Clear cache

# 4. Hard refresh browser
# Press Ctrl+Shift+R

# 5. Verify CORS headers in Network tab:
# Access-Control-Allow-Origin should be http://localhost:3000
# NOT *
```

**Root Cause:** Backend services had `app.enableCors()` enabled. Only the API Gateway should handle CORS.

**Permanent Fix:** Already applied - all backend services have CORS disabled.

---

### ❌ White Screen / Blank Page

**Error:** Page loads but shows nothing

**Solution:**
```powershell
# 1. Check browser console (F12) for errors

# 2. Common causes:
# - JavaScript error (check console)
# - API endpoint not responding
# - Missing environment variables

# 3. Check .env.local exists
ls frontend\nextjs-app\.env.local

# 4. If missing, create it
cp frontend\nextjs-app\.env.example .env.local

# 5. Restart dev server
cd frontend\nextjs-app
npm run dev
```

---

### ❌ Module Not Found Error

**Error:** `Cannot find module '@/components/...'`

**Solution:**
```powershell
# 1. Install dependencies
cd frontend\nextjs-app
npm install

# 2. Clear Next.js cache
rm -r .next

# 3. Restart dev server
npm run dev

# 4. If still failing, check tsconfig.json paths are correct
```

---

## Backend API Issues

### ❌ 401 Unauthorized

**Error:** All API requests return 401

**Solution:**
```powershell
# Option 1: Clear storage and re-login
# 1. Open DevTools (F12) → Application → Local Storage
# 2. Delete 'access_token' and 'refresh_token'
# 3. Go to /login and log in again

# Option 2: Check token is being sent
# 1. Open DevTools (F12) → Network tab
# 2. Click any API request
# 3. Check Headers → Request Headers
# 4. Should see: Authorization: Bearer eyJhbG...

# If missing, clear localStorage and re-login
```

**Root Cause:** Token not stored or not sent in Authorization header.

**Recent Fix:** Updated `api-client.ts` to send `Authorization: Bearer <token>` header.

---

### ❌ 404 Not Found

**Error:** `Cannot GET /api/users`

**Solution:**
```
# Endpoints now use /api/v1 prefix

# Wrong: http://localhost:3700/api/auth/login
# Correct: http://localhost:3700/api/v1/user/auth/login

# Update your requests to include /api/v1
```

**Root Cause:** API versioning was added. All endpoints now require `/api/v1` prefix.

**Fix Applied:** All frontend services updated to use `/api/v1`.

---

### ❌ 500 Internal Server Error

**Error:** API returns 500

**Solution:**
```powershell
# 1. Check backend logs
docker logs [service-name] --tail 100

# 2. Common causes:
# - Database query error
# - Missing environment variable
# - Null reference error

# 3. Check database connection
docker exec marketplace-postgres psql -U postgres -d marketplace -c "SELECT 1"

# 4. Restart the failing service
docker-compose restart [service-name]
```

---

## Database Issues

### ❌ Database Schema Out of Sync

**Error:** `column "xyz" does not exist`

**Solution:**
```powershell
# 1. Connect to database
docker exec -it marketplace-postgres psql -U postgres -d marketplace

# 2. Check table schema
\d users

# 3. If column missing, run migrations
# (Migrations are in database/schema.sql)

# 4. Drop and recreate database (CAUTION: loses data)
DROP DATABASE marketplace;
CREATE DATABASE marketplace;
\c marketplace
\i /docker-entrypoint-initdb.d/schema.sql

# 5. Exit
\q

# 6. Restart all services
.\scripts\stop.ps1
.\scripts\start.ps1
```

---

### ❌ Too Many Connections

**Error:** `sorry, too many clients already`

**Solution:**
```powershell
# 1. Restart postgres
docker-compose restart marketplace-postgres

# 2. Check connection count
docker exec marketplace-postgres psql -U postgres -c "SELECT count(*) FROM pg_stat_activity"

# 3. If high, kill idle connections
docker exec marketplace-postgres psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle'"

# 4. Increase max_connections in postgres config (if needed)
```

---

## Authentication Issues

###❌ Cannot Log In

**Error:** "Invalid credentials" but password is correct

**Solution:**
```powershell
# 1. Check user exists in database
docker exec marketplace-postgres psql -U postgres -d marketplace -c "SELECT email, email_verified FROM users WHERE email='test@example.com'"

# 2. If user doesn't exist, sign up first
# Go to /signup

# 3. If email_verified is false
# Check email in console logs (development mode):
docker logs identity-service | grep "verification"

# 4. Or update database directly (dev only):
docker exec marketplace-postgres psql -U postgres -d marketplace -c "UPDATE users SET email_verified=true WHERE email='test@example.com'"
```

---

### ❌ JWT Token Invalid

**Error:** "Invalid token" or "Token expired"

**Solution:**
```powershell
# 1. Clear localStorage
# DevTools (F12) → Application → Local Storage → Clear

# 2. Log in again to get new token

# 3. Check JWT_SECRET matches across services
docker exec identity-service printenv JWT_SECRET
docker exec api-gateway printenv JWT_SECRET
# Should be identical

# 4. If different, update docker-compose.yml and restart
```

---

### ❌ Infinite Redirect Loop

**Error:** Page keeps redirecting between /login and /dashboard

**Solution:**
```tsx
// Check middleware.ts and auth guards

// 1. Clear localStorage
localStorage.clear()

// 2. Refresh page (Ctrl+Shift+R)

// 3. Check auth state in DevTools:
console.log(useAuthStore.getState())

// 4. Should show: { isAuthenticated: false, user: null }
```

---

## Google Maps Issues

### ❌ Map Not Loading

**Error:** `Google Maps JavaScript API error: InvalidKeyMapError`

**Solution:**
```powershell
# 1. Check API key is set in .env.local
cat frontend\nextjs-app\.env.local | Select-String "GOOGLE_MAPS"

# 2. If missing, add it:
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here

# 3. Restart dev server
npm run dev

# 4. Verify APIs are enabled in Google Cloud Console:
# - Maps JavaScript API ✅
# - Places API ✅
# - Geocoding API ✅

# 5. Check API key restrictions
# - Should allow localhost:3000 or no restrictions (dev)
```

---

### ❌ Geocoding Not Working

**Error:** Address search doesn't return results

**Solution:**
```
1. Check Places API is enabled
2. Check Geocoding API is enabled
3. Verify API key has no IP restrictions (dev mode)
4. Check daily quota hasn't been exceeded
5. Try with a well-known address (e.g., "1600 Amphitheatre Parkway")
```

---

### ❌ Map Shows Gray Box

**Error:** Map container is gray/blank

**Solution:**
```tsx
// 1. Check height is set on map container
<div style={{ height: '400px', width: '100%' }}>
  <LocationPicker />
</div>

// 2. Verify Google Maps script loaded
console.log(window.google)
// Should show object, not undefined

// 3. Wait for script to load before rendering
useEffect(() => {
  const interval = setInterval(() => {
    if (window.google?.maps) {
      initMap()
      clearInterval(interval)
    }
  }, 100)
}, [])
```

---

## Notification Issues

### ❌ NotificationBadge Not Updating

**Error:** Badge shows 0 but there are unread notifications

**Solution:**
```tsx
// 1. Check useNotifications hook is polling
// Should fetch every 30 seconds

// 2. Manually trigger update
const { refetch } = useNotifications()
refetch()

// 3. Check API endpoint
fetch('http://localhost:3700/api/v1/notifications/unread-count', {
  headers: { Authorization: `Bearer ${token}` }
})

// 4. Verify comms service is running
docker ps | grep comms-service
```

---

### ❌ Emails Not Sending

**Error:** User signed up but no email received

**Solution:**
```powershell
# 1. Check email-service logs
docker logs email-service --tail 50

# 2. Email provider NOT configured in MVP
# Emails will show in logs but not actually send

# 3. To configure (production):
# Add to docker-compose.yml:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your_app_password

# 4. Restart email-service
docker-compose restart email-service
```

---

## Performance Issues

### ❌ Slow API Responses

**Error:** Requests take 5+ seconds

**Solution:**
```powershell
# 1. Check database query performance
docker exec marketplace-postgres psql -U postgres -d marketplace

# Enable query logging
SET log_statement = 'all';
SET log_duration = on;

# Run slow query and check execution time
EXPLAIN ANALYZE SELECT * FROM service_requests;

# 2. Add indexes if needed
CREATE INDEX idx_requests_user_id ON service_requests(user_id);

# 3. Check for N+1 queries in backend logs
docker logs marketplace-service | grep "query"

# 4. Enable caching (Redis) for frequently accessed data
```

---

### ❌ Frontend Slow to Load

**Error:** Page takes 10+ seconds to load

**Solution:**
```tsx
// 1. Check bundle size
npm run build
// Look for large bundles in output

// 2. Add loading skeletons (already implemented)
{isLoading ? <SkeletonCard /> : <RealContent />}

// 3. Enable React Query caching
queryClient.setDefaultOptions({
  queries: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  }
})

// 4. Lazy load heavy components
const HeavyComponent = dynamic(() => import('./Heavy'), { ssr: false })
```

---

### ❌ High Memory Usage

**Error:** Docker uses 8GB+ RAM

**Solution:**
```powershell
# 1. Check container memory usage
docker stats

# 2. Limit memory per service in docker-compose.yml
services:
  identity-service:
    mem_limit: 512m
    memswap_limit: 512m

# 3. Restart containers
docker-compose down
docker-compose up -d

# 4. Clean up unused images/volumes
docker system prune -a
```

---

## Still Having Issues?

### Check These Resources:

1. **Service Logs:**
   ```powershell
   docker logs [service-name] --tail 100 --follow
   ```

2. **Health Checks:**
   ```powershell
   curl http://localhost:3700/api/v1/health
   ```

3. **Database Status:**
   ```powershell
   docker exec marketplace-postgres pg_isready
   ```

4. **Network Issues:**
   ```powershell
   docker network inspect localservicemarketplace_marketplace-network
   ```

### Get More Help:

- 📖 [00_DOCUMENTATION_INDEX.md](00_DOCUMENTATION_INDEX.md) - All docs
- 📖 [QUICK_START.md](QUICK_START.md) - Setup guide
- 📖 [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- 📖 [API_SPECIFICATION.md](API_SPECIFICATION.md) - API reference

---

**Last Updated:** March 14, 2026  
**Platform Version:** 1.0  
**Status:** Production Ready
