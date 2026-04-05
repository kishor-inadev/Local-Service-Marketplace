# Environment Variables Configuration Guide

This guide explains all environment variables used across the Local Service Marketplace platform.

## Quick Setup

### 1. Copy Example Files
```powershell
# Copy all .env.example to .env files
.\scripts\setup-env-files.ps1
```

### 2. Verify Configuration
```powershell
# Check if all required variables are set
.\scripts\verify-env-vars.ps1
```

### 3. Update Critical Secrets
Update these in **all relevant .env files**:

```env
# MUST be the same in api-gateway and identity-service
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# MUST be the same in api-gateway and identity-service
GATEWAY_INTERNAL_SECRET=gateway-internal-secret-change-in-production

# Different from JWT_SECRET
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-change-in-production
```

Generate secure secrets:
```bash
openssl rand -base64 48
```

---

## 🔐 Critical Security Variables

### JWT_SECRET
**Required in:** api-gateway, identity-service  
**Must match:** YES - Same value in both services  
**Purpose:** Signing and verifying JWT access tokens  
**Min length:** 32 characters  
**Generate with:** `openssl rand -base64 48`  

```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### JWT_REFRESH_SECRET
**Required in:** identity-service  
**Purpose:** Signing refresh tokens (longer-lived than access tokens)  
**Must be different:** From JWT_SECRET  

```env
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-change-in-production
```

### GATEWAY_INTERNAL_SECRET
**Required in:** api-gateway, identity-service  
**Must match:** YES - Same value in both services  
**Purpose:** Secure communication between gateway and identity service for token verification  
**New in:** Token validation feature  

```env
GATEWAY_INTERNAL_SECRET=gateway-internal-secret-change-in-production
```

---

## 🚪 API Gateway Environment Variables

**File:** `api-gateway/.env`

### Application Settings
```env
NODE_ENV=development                    # development | production | test
PORT=3700                              # Gateway port (frontend calls this)
SERVICE_NAME=api-gateway
```

### Token Validation Strategy
**New Feature:** Choose between local JWT verification or API-based validation

```env
TOKEN_VALIDATION_STRATEGY=local        # 'local' or 'api'
```

**Options:**
- **`local`** - Fast (1-5ms), gateway verifies JWT directly
  - ✅ Lower latency
  - ✅ No auth service dependency
  - ❌ Can't check user status in real-time
  - ❌ Can't revoke tokens immediately

- **`api`** - Secure (10-50ms), calls auth service to verify
  - ✅ Can check if user is blocked/deleted
  - ✅ Can implement token blacklist/revocation
  - ✅ Centralized auth logic
  - ❌ Higher latency
  - ❌ Auth service dependency

**Recommendation:** Use `local` for production unless you need real-time user status checking or token revocation.

### Microservice URLs
```env
# Local development (use localhost)
IDENTITY_SERVICE_URL=http://localhost:3001
MARKETPLACE_SERVICE_URL=http://localhost:3003
PAYMENT_SERVICE_URL=http://localhost:3006
COMMS_SERVICE_URL=http://localhost:3007
OVERSIGHT_SERVICE_URL=http://localhost:3010
INFRASTRUCTURE_SERVICE_URL=http://localhost:3012

# Docker Compose (use container names)
IDENTITY_SERVICE_URL=http://identity-service:3001
# ... etc
```

### CORS & Frontend
```env
CORS_ORIGIN=http://localhost:3000      # Frontend URL(s), comma-separated
FRONTEND_URL=http://localhost:3000     # Used for redirects
```

### Redis (Optional - for caching & rate limiting)
```env
REDIS_HOST=localhost                   # 'redis' for Docker
REDIS_PORT=6379
REDIS_PASSWORD=                        # Leave empty if no password
REDIS_URL=redis://localhost:6379       # Alternative to host/port
```

### Rate Limiting
```env
RATE_LIMIT_WINDOW_MS=60000            # 60 seconds
RATE_LIMIT_MAX_REQUESTS=100           # Max 100 requests per minute
```

---

## 🔑 Auth Service Environment Variables

**File:** `services/identity-service/.env`

### Application Settings
```env
NODE_ENV=development
PORT=3001
SERVICE_NAME=identity-service
```

### Database
```env
DATABASE_HOST=localhost                # 'postgres' for Docker
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres             # CHANGE IN PRODUCTION!
DATABASE_NAME=marketplace
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/marketplace

# Connection Pooling
DB_POOL_MAX=30
DB_POOL_MIN=5
```

### JWT Configuration
```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=15m                     # Access token lifetime
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-change-this-in-production
JWT_REFRESH_EXPIRATION=7d              # Refresh token lifetime

# Gateway Internal Secret (NEW - for /auth/verify endpoint)
GATEWAY_INTERNAL_SECRET=gateway-internal-secret-change-in-production
```

### Email & Password Reset
```env
EMAIL_FROM=noreply@marketplace.com
EMAIL_VERIFICATION_EXPIRES_IN=24h
PASSWORD_RESET_EXPIRES_IN=1h
```

### Rate Limiting
```env
MAX_LOGIN_ATTEMPTS=5
LOGIN_ATTEMPT_WINDOW=15m
```

### OAuth (Optional)
```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3700/api/v1/user/auth/google/callback

# Facebook OAuth
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_CALLBACK_URL=http://localhost:3700/api/v1/user/auth/facebook/callback
```

### Frontend URL
```env
FRONTEND_URL=http://localhost:3000     # For OAuth redirects
```

### Service Communication
```env
NOTIFICATION_SERVICE_URL=http://localhost:3007  # For sending emails/SMS
SMS_ENABLED=false                               # Enable SMS notifications
```

---

## 👤 Backend Services Environment Variables

**Files:** `services/[service-name]/.env`

All backend services (user, request, proposal, job, payment, messaging, notification, review, admin, analytics, infrastructure) share similar structure:

### Application Settings
```env
NODE_ENV=development
PORT=300X                              # Unique port for each service
SERVICE_NAME=service-name
```

### Database
```env
DATABASE_HOST=localhost                # 'postgres' for Docker
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=marketplace
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/marketplace

# Preferred pool controls
DATABASE_POOL_MAX=20
DATABASE_IDLE_TIMEOUT_MS=30000
DATABASE_CONNECTION_TIMEOUT_MS=10000
DATABASE_QUERY_TIMEOUT_MS=30000

# Legacy pool controls (still supported for max pool size)
DB_POOL_MAX=30
DB_POOL_MIN=5
```

### Pagination
```env
DEFAULT_PAGE_LIMIT=20
MAX_PAGE_LIMIT=100
```

### Redis (Optional - for caching)
```env
REDIS_HOST=localhost                   # 'redis' for Docker
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_URL=redis://localhost:6379
```

### Kafka (Optional - for event streaming)
```env
KAFKA_BROKERS=localhost:9092           # 'kafka:29092' for Docker
KAFKA_CLIENT_ID=service-name
```

### Feature Flags
```env
CACHE_ENABLED=false                    # Enable Redis caching
EVENT_BUS_ENABLED=false                # Enable Kafka events
```

### Service Communication
```env
IDENTITY_SERVICE_URL=http://localhost:3001
# ... other service URLs as needed
```

---

## 🎨 Frontend Environment Variables

**File:** `frontend/.env.local`

### API Configuration
```env
NEXT_PUBLIC_API_URL=http://localhost:3700    # API Gateway URL
```

### Application Settings
```env
NEXT_PUBLIC_APP_NAME=Local Service Marketplace
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Third-Party Services
```env
# Google Maps (for location features)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Google Analytics (optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### Environment
```env
NODE_ENV=development
```

---

## 📧 Email Service Environment Variables

**File:** `services/email-service/.env`

### SMTP Configuration
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false                     # true for port 465, false for 587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password          # Gmail App Password

DEFAULT_FROM_EMAIL=noreply@marketplace.com
DEFAULT_FROM_NAME=Local Service Marketplace
```

---

## 📱 SMS Service Environment Variables (Optional)

### SMS Provider
```env
SMS_PROVIDER=mock                      # mock, twilio, awssns, etc.
SMS_API_KEY=your-sms-api-key

OTP_LENGTH=6
OTP_EXPIRY_MINUTES=10
OTP_MAX_ATTEMPTS=5
```

### Twilio (if using)
```env
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

---

## 🐳 Docker Compose Root .env

**File:** `.env` (root directory)

Used by docker-compose.yml for container configuration:

```env
# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-change-this-in-production-min-32-chars
GATEWAY_INTERNAL_SECRET=gateway-internal-secret-change-in-production
TOKEN_VALIDATION_STRATEGY=local

# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=marketplace

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# Kafka
KAFKA_BROKERS=kafka:29092
KAFKA_CLIENT_ID=marketplace-service

# Feature Flags
CACHE_ENABLED=false
WORKERS_ENABLED=false
EVENT_BUS_ENABLED=false
ANALYTICS_ENABLED=false
MESSAGING_ENABLED=false
```

---

## 🔍 Verification Checklist

Run verification script:
```powershell
.\scripts\verify-env-vars.ps1
```

### Manual Checks:

- [ ] **JWT_SECRET** is the same in api-gateway and identity-service
- [ ] **GATEWAY_INTERNAL_SECRET** is the same in api-gateway and identity-service
- [ ] **JWT_REFRESH_SECRET** is different from JWT_SECRET
- [ ] All secrets are at least 32 characters
- [ ] No placeholder values remain in production
- [ ] **DATABASE_PASSWORD** changed from default 'postgres'
- [ ] **CORS_ORIGIN** includes your frontend domain
- [ ] **FRONTEND_URL** points to your frontend
- [ ] Port numbers don't conflict (each service has unique port)

---

## 🚀 Production Deployment

### Security Checklist:

1. **Generate strong secrets:**
   ```bash
   openssl rand -base64 48  # For JWT_SECRET
   openssl rand -base64 48  # For JWT_REFRESH_SECRET
   openssl rand -base64 48  # For GATEWAY_INTERNAL_SECRET
   ```

2. **Update all URLs** to production domains
3. **Set NODE_ENV=production** in all services
4. **Enable HTTPS** (update CORS, callback URLs)
5. **Set strong database passwords**
6. **Enable Redis password** if using Redis
7. **Configure real email/SMS providers**
8. **Add proper OAuth credentials**
9. **Set up monitoring** (if using analytics)

### Environment Variables in Production:

**Never commit .env files to git!**

Use:
- **Docker:** Pass via docker-compose.yml or environment variables
- **Kubernetes:** ConfigMaps and Secrets
- **Cloud Platforms:** AWS Secrets Manager, Azure Key Vault, etc.
- **Hosting:** Platform-specific env variable management

---

## 📚 Additional Resources

- [Token Validation Guide](api-gateway/TOKEN_VALIDATION_GUIDE.md)
- [Backend User Context Examples](docs/BACKEND_USER_CONTEXT_EXAMPLES.md)
- [API Gateway README](docs/API_GATEWAY_README.md)
- [Architecture Documentation](docs/ARCHITECTURE.md)

---

## 🆘 Troubleshooting

### "JWT verification failed"
- Verify JWT_SECRET matches in api-gateway and identity-service
- Check token hasn't expired (default: 15 minutes)
- Ensure TOKEN_VALIDATION_STRATEGY is correct

### "Token verification service unavailable"
- If using TOKEN_VALIDATION_STRATEGY=api, check identity service is running
- Verify IDENTITY_SERVICE_URL is correct
- Check GATEWAY_INTERNAL_SECRET matches in both services

### "CORS policy error"
- Add frontend URL to CORS_ORIGIN in api-gateway
- Use comma-separated list for multiple origins
- Include protocol (http:// or https://)

### Database connection errors
- Verify DATABASE_URL format
- Check database is running
- Ensure DATABASE_HOST is correct ('localhost' vs 'postgres')
- Verify credentials

### Service can't connect to другой service
- Check service URLs point to correct host:port
- For Docker: use container names
- For local: use localhost
- Verify target service is running
