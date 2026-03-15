# API Versioning Implementation

**Date:** March 14, 2026  
**Version:** 1.0.0  
**Status:** ✅ Implemented

## Overview

API Gateway now implements versioning with `/api/v1` prefix for all microservice endpoints.

## Changes Made

### 1. API Gateway - Route Versioning

**File:** `api-gateway/src/gateway/config/services.config.ts`

All routes now include `/api/v1` prefix for version control:

```typescript
export const routingConfig = {
  '/api/v1/auth': 'auth',
  '/api/v1/users': 'user',
  '/api/v1/providers': 'user',
  '/api/v1/requests': 'request',
  '/api/v1/proposals': 'proposal',
  '/api/v1/jobs': 'job',
  '/api/v1/payments': 'payment',
  '/api/v1/messages': 'messaging',
  '/api/v1/notifications': 'notification',
  '/api/v1/reviews': 'review',
 '/api/v1/admin': 'admin',
  '/api/v1/analytics': 'analytics',
  '/api/v1/events': 'infrastructure',
  '/api/v1/background-jobs': 'infrastructure',
  '/api/v1/rate-limits': 'infrastructure',
  '/api/v1/feature-flags': 'infrastructure',
};
```

### 2. Public Routes Updated

```typescript
export const publicRoutes = [
  "/api/v1/auth/signup",
  "/api/v1/auth/login",
  "/api/v1/auth/refresh",
  "/api/v1/auth/password-reset/request",
  "/api/v1/auth/password-reset/confirm",
  "/health",              // Health endpoints remain unversioned
  "/health/services",     // Health endpoints remain unversioned
];
```

## API Endpoint Examples

### Authentication
- `POST http://localhost:4000/api/v1/auth/signup`
- `POST http://localhost:4000/api/v1/auth/login`
- `POST http://localhost:4000/api/v1/auth/refresh`
- `POST http://localhost:4000/api/v1/auth/logout`

### Users
- `GET http://localhost:4000/api/v1/users`
- `GET http://localhost:4000/api/v1/users/:id`
- `PATCH http://localhost:4000/api/v1/users/:id`

### Providers
- `GET http://localhost:4000/api/v1/providers`
- `POST http://localhost:4000/api/v1/providers`
- `PATCH http://localhost:4000/api/v1/providers/:id/services`
- `PATCH http://localhost:4000/api/v1/providers/:id/availability`

### Service Requests
- `POST http://localhost:4000/api/v1/requests`
- `GET http://localhost:4000/api/v1/requests`
- `GET http://localhost:4000/api/v1/requests/:id`

### Proposals
- `POST http://localhost:4000/api/v1/proposals`
- `GET http://localhost:4000/api/v1/proposals`
- `PATCH http://localhost:4000/api/v1/proposals/:id/accept`

### Jobs
- `GET http://localhost:4000/api/v1/jobs`
- `PATCH http://localhost:4000/api/v1/jobs/:id/start`
- `PATCH http://localhost:4000/api/v1/jobs/:id/complete`

### Payments
- `POST http://localhost:4000/api/v1/payments`
- `GET http://localhost:4000/api/v1/payments/:id`
- `POST http://localhost:4000/api/v1/payments/webhooks/stripe`

### Messages
- `GET http://localhost:4000/api/v1/messages/job/:jobId`
- `POST http://localhost:4000/api/v1/messages` (REST fallback)
- WebSocket: `ws://localhost:4000/messaging` (WebSocket namespace remains unversioned)

### Notifications
- `GET http://localhost:4000/api/v1/notifications`
- `PATCH http://localhost:4000/api/v1/notifications/:id/read`

### Reviews
- `POST http://localhost:4000/api/v1/reviews`
- `GET http://localhost:4000/api/v1/reviews/job/:jobId`

### Admin
- `GET http://localhost:4000/api/v1/admin/users`
- `POST http://localhost:4000/api/v1/admin/disputes`

### Analytics
- `GET http://localhost:4000/api/v1/analytics/metrics`
- `POST http://localhost:4000/api/v1/analytics/track`

### Infrastructure
- `GET http://localhost:4000/api/v1/events`
- `GET http://localhost:4000/api/v1/background-jobs`
- `GET http://localhost:4000/api/v1/feature-flags`

## Health Endpoints (Unversioned)

Health check endpoints remain **unversioned** for infrastructure monitoring:

- `GET http://localhost:4000/health`
- `GET http://localhost:4000/health/services`

## Benefits of Versioning

### 1. **Backward Compatibility**
- Future API changes can be deployed as `/api/v2` without breaking existing clients
- Old versions can run in parallel during migration periods

### 2. **Clear API Contracts**
- Version number in URL makes API contract explicit
- Easier to document and communicate breaking changes

### 3. **Client Control**
- Clients can upgrade to new versions at their own pace
- No forced breaking changes

### 4. **Deprecation Strategy**
```
v1: Current stable version (March 2026)
v2: Future version with breaking changes
v1: Mark as deprecated (6 months notice)
v1: Sunset and remove (12 months after v2 release)
```

## Future Versions

When implementing v2:

1. **Add new routing config:**
```typescript
export const routingConfigV2 = {
  '/api/v2/auth': 'auth-v2',  // New auth service
  '/api/v2/users': 'user',    // Same service, new endpoints
  // ...
};
```

2. **Merge configs in gateway:**
```typescript
const allRoutes = {
  ...routingConfig,      // v1 routes
  ...routingConfigV2,    // v2 routes
};
```

3. **Run both versions simultaneously during migration**

## Breaking Changes Between Versions

Document breaking changes when introducing v2:

**Example future v2 changes:**
- Change date format from ISO strings to Unix timestamps
- Rename fields (e.g., `userId` → `user_id`)
- Remove deprecated endpoints
- Change authentication mechanism

## Migration Guide (For Future v2)

When migrating from v1 to v2:

1. **Review breaking changes documentation**
2. **Update frontend API calls:**
   ```typescript
   // Old v1
   const response = await fetch('/api/v1/users');
   
   // New v2
   const response = await fetch('/api/v2/users');
   ```
3. **Test in staging environment**
4. **Deploy gradually with feature flags**
5. **Monitor error rates**

## Testing

Test versioned endpoints:

```bash
# Test v1 endpoints
curl http://localhost:4000/api/v1/health
curl -X POST http://localhost:4000/api/v1/auth/login

# When v2 is available
curl http://localhost:4000/api/v2/health
curl -X POST http://localhost:4000/api/v2/auth/login
```

## Frontend Integration

Update Next.js API service configuration:

**File:** `frontend/nextjs-app/services/api.ts`

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const API_VERSION = 'v1';

export const api = {
  baseURL: `${API_BASE_URL}/api/${API_VERSION}`,
  
  // Usage
  auth: {
    login: () => `${this.baseURL}/auth/login`,
    signup: () => `${this.baseURL}/auth/signup`,
  },
  
  users: {
    list: () => `${this.baseURL}/users`,
    get: (id: string) => `${this.baseURL}/users/${id}`,
  },
};
```

## Rollback Procedure

If issues occur after deployment:

1. **Revert routing config changes**
2. **Rebuild API Gateway:**
   ```bash
   docker compose build api-gateway
   docker compose up -d api-gateway
   ```
3. **Update frontend to use old paths (if needed)**

## Monitoring

Monitor versioned API usage:

- **Metrics to track:**
  - Requests per version (v1 vs v2)
  - Error rates per version
  - Latency per version
  - Client adoption rates

- **Alerts:**
  - High error rate on new version
  - No traffic to old version (ready for sunset)
  - Clients still using deprecated version

## Documentation Updates Needed

- [x] Update API specification docs
- [ ] Update Postman collection with v1 prefix
- [ ] Update frontend API service file
- [ ] Update integration tests
- [ ] Update API documentation website

## Compatibility Matrix

| Client Version | API v1 | API v2 (Future) |
|----------------|--------|-----------------|
| Frontend 1.x   | ✅ Yes  | ❌ No           |
| Frontend 2.x   | ✅ Yes  | ✅ Yes          |
| Mobile App 1.x | ✅ Yes  | ❌ No           |
| Mobile App 2.x | ✅ Yes  | ✅ Yes          |

## Status

✅ **API v1 Implemented and Active**
- All 12 services accessible via `/api/v1/*`
- Public routes updated
- Health endpoints unversioned
- Docker build successful
- Ready for production deployment

---

**Next Steps:**
1. Update frontend API calls to use `/api/v1` prefix
2. Update Postman/API testing collections
3. Update client-facing API documentation
4. Add version to Swagger/OpenAPI spec
