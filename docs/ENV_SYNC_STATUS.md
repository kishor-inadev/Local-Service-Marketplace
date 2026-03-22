# Environment Variables Sync and Management Guide

## Overview

This document provides a comprehensive guide to managing environment variables across all services in the Local Service Marketplace platform. All environment variables are properly synchronized and validated.

---

## Quick Reference

### Critical Environment Variables

These variables **MUST** be synchronized across multiple services:

| Variable | Used In | Purpose | Must Match |
|----------|---------|---------|------------|
| `JWT_SECRET` | api-gateway, auth-service, docker.env, secrets.env | JWT token signing | ✅ Yes |
| `JWT_REFRESH_SECRET` | auth-service, docker.env, secrets.env | Refresh token signing | ✅ Yes |
| `GATEWAY_INTERNAL_SECRET` | api-gateway, auth-service, docker.env, secrets.env | Gateway-Auth communication | ✅ Yes |
| `DATABASE_PASSWORD` | All PostgreSQL services | Database authentication | ✅ Yes |

---

## File Structure

### Root Level Files

#### `docker.env`
- **Purpose**: Environment variables for Docker Compose deployment
- **Used by**: All services via `env_file` directive in docker-compose.yml
- **Contains**: Shared secrets and configuration
- **Status**: ✅ Synchronized with secrets.env

#### `secrets.env`
- **Purpose**: Production secrets (referenced by docker.env)
- **Security**: Listed in .gitignore, do not commit
- **Contains**: Sensitive credentials and API keys
- **Status**: ✅ Synchronized with docker.env

### Service-Level Files

Each service has a `.env.example` file:
- **Location**: `services/{service-name}/.env.example`
- **Purpose**: Template for local development
- **Usage**: Copy to `.env` for local development

```bash
cp services/auth-service/.env.example services/auth-service/.env
```

### API Gateway

- **Location**: `api-gateway/.env.example`
- **Purpose**: Gateway configuration template
- **Critical Variables**: JWT_SECRET, GATEWAY_INTERNAL_SECRET, TOKEN_VALIDATION_STRATEGY

### Frontend

- **Location**: `frontend/.env.example`
- **Purpose**: Next.js frontend configuration
- **Critical Variables**: NEXT_PUBLIC_API_URL, AUTH_SECRET, NEXTAUTH_URL

---

## Environment Variables by Service

### 1. API Gateway (`api-gateway`)

**Port**: 3500 (external), 3000 (internal)

#### Required Variables
```env
# Authentication
JWT_SECRET=<must-match-auth-service>
GATEWAY_INTERNAL_SECRET=<must-match-auth-service>
TOKEN_VALIDATION_STRATEGY=local  # or 'api'

# Microservice URLs (Docker)
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

# CORS & Frontend
CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### 2. Auth Service (`services/auth-service`)

**Port**: 3001

#### Required Variables
```env
# Database
DATABASE_HOST=postgres  # 'localhost' for local dev
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=<must-match-docker.env>
DATABASE_NAME=marketplace
DATABASE_URL=postgresql://postgres:password@postgres:5432/marketplace

# JWT Configuration
JWT_SECRET=<must-match-api-gateway>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<unique-secret>
JWT_REFRESH_EXPIRATION=7d

# Gateway Communication
GATEWAY_INTERNAL_SECRET=<must-match-api-gateway>

# Service Communication
NOTIFICATION_SERVICE_URL=http://notification-service:3008
```

### 3. PostgreSQL Services

All services using PostgreSQL (user, request, proposal, job, payment, messaging, notification, review, admin, analytics, infrastructure):

#### Common Database Variables
```env
DATABASE_HOST=postgres  # 'localhost' for local dev
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=<must-match-docker.env>
DATABASE_NAME=marketplace
DATABASE_URL=postgresql://postgres:password@postgres:5432/marketplace

# Connection Pool
DB_POOL_MAX=30
DB_POOL_MIN=5

# Infrastructure
REDIS_URL=redis://redis:6379
KAFKA_BROKERS=kafka:29092
EVENT_BUS_ENABLED=false
CACHE_ENABLED=false
```

### 4. Email Service (`services/email-service`)

**Port**: 3500 (internal), 4000 (external)

#### Required Variables
```env
# MongoDB
MONGO_URL=mongodb://emailadmin:emailpass123@mongo-email:27017/email_service?authSource=admin

# SMTP Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=<your-email>
EMAIL_PASS=<your-app-password>

# Defaults
DEFAULT_FROM_EMAIL=noreply@marketplace.com
DEFAULT_FROM_NAME=Local Service Marketplace

# Kafka (Optional)
ENABLE_KAFKA=false
KAFKA_BROKERS=kafka:29092
```

### 5. SMS Service (`services/sms-service`)

**Port**: 3000 (internal), 5000 (external)

#### Required Variables
```env
# MongoDB
MONGODB_URI=mongodb://smsadmin:smspass123@mongo-sms:27017/sms_service?authSource=admin

# API Security
API_KEY=<strong-random-secret>

# SMS Provider
SMS_PROVIDER=mock  # or 'twilio', 'awssns', 'vonage'

# Twilio (if using)
TWILIO_ACCOUNT_SID=<your-sid>
TWILIO_AUTH_TOKEN=<your-token>
TWILIO_FROM_NUMBER=<your-number>
```

### 6. Notification Service (`services/notification-service`)

**Port**: 3008

#### Required Variables
```env
# Database (PostgreSQL)
DATABASE_URL=postgresql://postgres:password@postgres:5432/marketplace

# Service Integration
EMAIL_SERVICE_URL=http://email-service:3500
EMAIL_ENABLED=true
SMS_SERVICE_URL=http://sms-service:3000
SMS_ENABLED=false
SMS_API_KEY=<must-match-sms-service>

# Feature Flags (MVP - mostly disabled)
IN_APP_NOTIFICATIONS_ENABLED=false
PUSH_NOTIFICATIONS_ENABLED=false
NOTIFICATION_PREFERENCES_ENABLED=false
DEVICE_TRACKING_ENABLED=false
```

### 7. Payment Service (`services/payment-service`)

**Port**: 3006

#### Required Variables
```env
# Database
DATABASE_URL=postgresql://postgres:password@postgres:5432/marketplace

# Stripe Integration
STRIPE_SECRET_KEY=sk_test_or_sk_live_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_or_pk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Service Communication
NOTIFICATION_SERVICE_URL=http://notification-service:3008

# Workers
WORKERS_ENABLED=false
```

### 8. Frontend (`frontend`)

**Port**: 3000

#### Required Variables
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3500

# NextAuth
AUTH_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_URL=http://localhost:3000

# OAuth Providers (Optional)
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
FACEBOOK_CLIENT_ID=<your-facebook-app-id>
FACEBOOK_CLIENT_SECRET=<your-facebook-app-secret>

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<your-google-maps-key>
```

---

## Verification and Maintenance

### Automatic Verification

Run the environment sync checker to validate all environment variables:

```powershell
.\scripts\verify-env-sync.ps1
```

This script checks:
- ✅ Presence of all required .env.example files
- ✅ Synchronization of critical secrets (JWT_SECRET, GATEWAY_INTERNAL_SECRET, etc.)
- ✅ Docker Compose environment variable configuration
- ✅ Service-specific required variables

### Manual Verification

#### 1. Check docker.env and secrets.env are synchronized

```powershell
.\scripts\verify-env-vars.ps1
```

#### 2. Verify docker-compose.yml service configurations

```bash
docker-compose config
```

#### 3. Check individual service environment files

```powershell
# Check if all services have .env.example
Get-ChildItem -Path services -Recurse -Filter .env.example
```

---

## Setup Instructions

### For Local Development

1. **Copy environment files**:
   ```powershell
   # Copy all .env.example to .env
   .\scripts\setup-env-files.ps1
   ```

2. **Update critical secrets**:
   - Update `JWT_SECRET` in api-gateway/.env and services/auth-service/.env
   - Update `GATEWAY_INTERNAL_SECRET` in both files
   - Ensure they match!

3. **Configure external services**:
   - Set up SMTP credentials in email-service/.env
   - Configure Stripe keys in payment-service/.env (use test keys for dev)
   - Add Google Maps API key in frontend/.env

4. **Verify configuration**:
   ```powershell
   .\scripts\verify-env-sync.ps1
   ```

### For Docker Deployment

1. **Ensure secrets are set**:
   - `docker.env` contains all shared secrets
   - `secrets.env` contains production secrets

2. **Verify synchronization**:
   ```powershell
   .\scripts\verify-env-sync.ps1
   ```

3. **Start services**:
   ```powershell
   .\scripts\start.ps1
   # or
   docker-compose up -d
   ```

### For Production Deployment

1. **Generate secure secrets**:
   ```powershell
   .\scripts\generate-production-secrets.ps1
   ```

2. **Update production-specific values**:
   - Set real Stripe production keys
   - Configure production SMTP server
   - Update OAuth callback URLs
   - Set production database password

3. **Apply secrets**:
   ```powershell
   .\scripts\apply-secrets.ps1
   ```

4. **Final verification**:
   ```powershell
   .\scripts\verify-env-sync.ps1
   ```

---

## Common Issues and Solutions

### Issue 1: JWT_SECRET Mismatch

**Symptom**: Token validation fails between api-gateway and auth-service

**Solution**:
```bash
# Ensure JWT_SECRET is identical in:
# - docker.env
# - secrets.env
# - api-gateway/.env (local dev)
# - services/auth-service/.env (local dev)
```

### Issue 2: GATEWAY_INTERNAL_SECRET Not Set

**Symptom**: Gateway cannot verify tokens with auth service

**Solution**:
```bash
# Add GATEWAY_INTERNAL_SECRET to:
# - docker.env
# - secrets.env  
# - api-gateway/.env
# - services/auth-service/.env
```

### Issue 3: Database Connection Failed

**Symptom**: Service cannot connect to PostgreSQL

**Solution**:
```bash
# Check DATABASE_PASSWORD matches across:
# - docker.env (used by docker-compose.yml)
# - secrets.env
# - Individual service .env files (for local dev)
```

### Issue 4: Email Service Not Sending

**Symptom**: Emails not being sent

**Solution**:
```bash
# Check in email-service/.env:
# - EMAIL_USER is set
# - EMAIL_PASS is set (use app password for Gmail)
# - EMAIL_HOST is correct
# - EMAIL_PORT is correct (587 for TLS)
```

---

## Environment Variable Naming Conventions

Follow these conventions when adding new environment variables:

1. **All uppercase**: `DATABASE_HOST` not `database_host`
2. **Underscore separation**: `JWT_SECRET` not `JWTSecret`
3. **Descriptive names**: `JWT_EXPIRES_IN` not `JWT_EXP`
4. **Consistent patterns**:
   - URLs: `*_SERVICE_URL` (e.g., `AUTH_SERVICE_URL`)
   - Secrets: `*_SECRET` or `*_PASSWORD`
   - Features: `*_ENABLED` (boolean flags)
   - Timeouts: `*_TIMEOUT` or `*_TIMEOUT_MS`

---

## Security Best Practices

1. **Never commit secrets**:
   - `.env` files are in `.gitignore`
   - `secrets.env` is in `.gitignore`
   - Only commit `.env.example` files

2. **Rotate secrets regularly**:
   ```powershell
   .\scripts\generate-production-secrets.ps1
   ```

3. **Use different secrets for different environments**:
   - Development: Use simple test values
   - Staging: Use staging-specific secrets
   - Production: Use strong, randomly generated secrets

4. **Validate before deployment**:
   ```powershell
   .\scripts\verify-env-sync.ps1
   ```

5. **Use environment-specific values**:
   - Local dev: `localhost` URLs
   - Docker: Container names (e.g., `auth-service`)
   - Production: Full domain names

---

## Synchronization Status

**Last Updated**: 2026-03-16

### ✅ Synchronized Variables

- JWT_SECRET
- JWT_REFRESH_SECRET
- GATEWAY_INTERNAL_SECRET
- DATABASE_PASSWORD
- REDIS_PASSWORD
- SESSION_SECRET
- ENCRYPTION_KEY

### ✅ Verified Files

- docker.env
- secrets.env
- docker-compose.yml
- All service .env.example files
- api-gateway/.env.example
- frontend/.env.example

### ✅ All Services Configured

- auth-service
- user-service
- request-service
- proposal-service
- job-service
- payment-service
- messaging-service
- notification-service
- review-service
- admin-service
- analytics-service
- infrastructure-service
- email-service
- sms-service

---

## Support and Resources

- **Environment Variables Guide**: `docs/ENVIRONMENT_VARIABLES_GUIDE.md`
- **Quick Start**: `docs/QUICK_START.md`
- **Troubleshooting**: `docs/TROUBLESHOOTING.md`
- **Verification Script**: `scripts/verify-env-sync.ps1`

---

**Generated**: 2026-03-16  
**Status**: ✅ All environment variables synchronized and verified
