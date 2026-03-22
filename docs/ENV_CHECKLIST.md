# Environment Variables Quick Checklist

## Pre-Deployment Checklist

### ✅ Step 1: Verify All Files Exist
```powershell
.\scripts\verify-env-sync.ps1
```

Expected output: All checks pass ✅

---

### ✅ Step 2: Critical Secrets Synchronized

Ensure these match in **docker.env** and **secrets.env**:
- [ ] JWT_SECRET
- [ ] JWT_REFRESH_SECRET  
- [ ] GATEWAY_INTERNAL_SECRET
- [ ] DATABASE_PASSWORD

---

### ✅ Step 3: Service-Specific Configuration

#### auth-service & api-gateway
- [ ] JWT_SECRET matches in both
- [ ] GATEWAY_INTERNAL_SECRET matches in both
- [ ] JWT_REFRESH_SECRET set in auth-service

#### payment-service
- [ ] STRIPE_SECRET_KEY (use `sk_test_` for dev, `sk_live_` for prod)
- [ ] STRIPE_WEBHOOK_SECRET

#### email-service
- [ ] EMAIL_USER set
- [ ] EMAIL_PASS set (use app password for Gmail)
- [ ] EMAIL_HOST correct (smtp.gmail.com for Gmail)

#### notification-service
- [ ] EMAIL_SERVICE_URL matches email-service port
- [ ] SMS_SERVICE_URL matches sms-service port (if enabled)

---

### ✅ Step 4: Environment-Specific URLs

#### For Docker Deployment:
```env
DATABASE_HOST=postgres
AUTH_SERVICE_URL=http://auth-service:3001
REDIS_URL=redis://redis:6379
```

#### For Local Development:
```env
DATABASE_HOST=localhost
AUTH_SERVICE_URL=http://localhost:3001
REDIS_URL=redis://localhost:6379
```

---

### ✅ Step 5: Frontend Configuration

- [ ] NEXT_PUBLIC_API_URL=http://localhost:3500 (points to API Gateway)
- [ ] AUTH_SECRET generated (run: `openssl rand -base64 32`)
- [ ] NEXTAUTH_URL=http://localhost:3000

---

### ✅ Step 6: Optional Features

#### Enable Caching:
```env
CACHE_ENABLED=true
REDIS_URL=redis://localhost:6379  # or redis://redis:6379 for Docker
```

#### Enable Event Bus:
```env
EVENT_BUS_ENABLED=true
KAFKA_BROKERS=localhost:9092  # or kafka:29092 for Docker
```

#### Enable SMS:
```env
SMS_ENABLED=true
SMS_API_KEY=your-strong-secret
# Configure SMS provider credentials in sms-service/.env
```

---

## Quick Commands

### Setup Environment Files
```powershell
.\scripts\setup-env-files.ps1
```

### Verify Configuration
```powershell
.\scripts\verify-env-sync.ps1
```

### Generate Production Secrets
```powershell
.\scripts\generate-production-secrets.ps1
```

### Start Services
```powershell
# Development
.\scripts\start.ps1

# Docker
docker-compose up -d

# With specific profile
docker-compose --profile email up -d
```

---

## Port Reference

| Service | Port (External) | Port (Internal) |
|---------|----------------|-----------------|
| Frontend | 3000 | 3000 |
| API Gateway | 3500 | 3000 |
| auth-service | 3001 | 3001 |
| user-service | 3002 | 3002 |
| request-service | 3003 | 3003 |
| proposal-service | 3004 | 3004 |
| job-service | 3005 | 3005 |
| payment-service | 3006 | 3006 |
| messaging-service | 3007 | 3007 |
| notification-service | 3008 | 3008 |
| review-service | 3009 | 3009 |
| admin-service | 3010 | 3010 |
| analytics-service | 3011 | 3011 |
| infrastructure-service | 3012 | 3012 |
| email-service | 4000 | 3500 |
| sms-service | 5000 | 3000 |
| PostgreSQL | 5432 | 5432 |
| Redis | 6379 | 6379 |
| Kafka | 9092 | 9092 |
| MongoDB (email) | 27018 | 27017 |
| MongoDB (sms) | 27019 | 27017 |

---

## Common Issues

### Issue: JWT validation fails
**Solution**: Ensure JWT_SECRET matches in api-gateway and auth-service

### Issue: Service can't connect to database
**Solution**: Check DATABASE_PASSWORD matches across docker.env and services

### Issue: Email not sending
**Solution**: 
1. Check EMAIL_USER and EMAIL_PASS in email-service/.env
2. For Gmail, use app password, not regular password
3. Verify EMAIL_HOST=smtp.gmail.com and EMAIL_PORT=587

### Issue: Service communication fails
**Solution**: Check service URLs use correct names (container names for Docker, localhost for local)

---

## Production Checklist

- [ ] Generated strong secrets with `.\scripts\generate-production-secrets.ps1`
- [ ] Updated JWT_SECRET everywhere (min 32 chars)
- [ ] Updated GATEWAY_INTERNAL_SECRET everywhere
- [ ] Set production DATABASE_PASSWORD
- [ ] Configured Stripe live keys (`sk_live_`, `pk_live_`)
- [ ] Set production SMTP credentials
- [ ] Updated OAuth callback URLs to production domain
- [ ] Verified with `.\scripts\verify-env-sync.ps1`
- [ ] Set NODE_ENV=production in docker.env
- [ ] Disabled unnecessary services (analytics, messaging if not needed)

---

**Last Updated**: March 16, 2026  
**Status**: ✅ All services validated
