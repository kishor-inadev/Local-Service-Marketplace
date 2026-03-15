# Frontend-Backend API Alignment - Quick Reference

**Overall Sync Score: 78%**

## Critical Issues (Must Fix Immediately) 🔴

| Issue | Frontend | Backend | Impact | Fix |
|-------|----------|---------|--------|-----|
| Job Payments Route | `GET /jobs/:jobId/payments` | `GET /payments/job/:jobId` | ❌ Cannot fetch job payments | Update frontend path |
| Job Messages Route | `GET /jobs/:jobId/messages` | `GET /messages/jobs/:jobId/messages` | ❌ Cannot fetch job messages | Update frontend path |
| Provider Services GET | `GET /providers/:id/services` | ❌ Not implemented | ❌ Cannot list services | Add backend endpoint |
| Update Proposal | `PATCH /proposals/:id` | ❌ Not implemented | ❌ Cannot update proposals | Add backend endpoint |
| Provider Services Method | `PUT /providers/:id/services` | `PATCH /providers/:id/services` | ⚠️ Method mismatch | Change frontend to PATCH |

## Missing Backend Endpoints 🟡

| Endpoint | Method | Service | Frontend Location | Required |
|----------|--------|---------|-------------------|----------|
| `/auth/profile` | GET | auth-service | auth-service.ts:62 | Yes |
| `/auth/verify-email` | POST | auth-service | auth-service.ts:77 | Yes |
| `/proposals/:id` | PATCH | proposal-service | proposal-service.ts:61 | Yes |
| `/jobs/:jobId/review` | GET | review-service | review-service.ts:65 | Yes |
| `/messages/:id/read` | PATCH | messaging-service | message-service.ts:64 | Yes |
| `/notifications/read-all` | PATCH | notification-service | notification-service.ts:40 | Optional |
| `/notifications/unread-count` | GET | notification-service | notification-service.ts:47 | Optional |
| `/notifications/:id` | DELETE | notification-service | notification-service.ts:52 | Optional |
| `/admin/users/:id/activate` | PATCH | admin-service | admin-service.ts:64 | Yes |
| `/admin/stats` | GET | admin-service | admin-service.ts:97 | Yes |
| `/payments/:id/status` | GET | payment-service | payment-service.ts:69 | Optional |

## Missing API Gateway Routes 🟠

| Route Prefix | Target Service | Impact |
|-------------|----------------|--------|
| `/categories` | request-service | May not work correctly |
| `/favorites` | user-service | May not work correctly |

## Service-by-Service Status

| Service | Aligned | Missing | Mismatches | Score |
|---------|---------|---------|------------|-------|
| Auth | 6 | 2 | 0 | 75% |
| User | 8 | 0 | 2 | 80% |
| Request | 7 | 0 | 0 | 100% ✅ |
| Proposal | 6 | 1 | 0 | 85% |
| Job | 5 | 0 | 1 | 90% |
| Payment | 13 | 1 | 1 | 70% |
| Review | 4 | 1 | 0 | 80% |
| Messaging | 2 | 1 | 1 | 65% |
| Notification | 7 | 3 | 0 | 70% |
| Admin | 6 | 2 | 0 | 75% |
| Favorites | 3 | 0 | 0 | 100% ✅ |

## Route Mapping Issues

### Payment Service Routes
```
Frontend:    GET /jobs/:jobId/payments
Backend:     GET /payments/job/:jobId
Fix:         Update frontend to /payments/job/:jobId
```

### Messaging Service Routes
```
Frontend:    GET /jobs/:jobId/messages
Backend:     GET /messages/jobs/:jobId/messages
Fix:         Update frontend to /messages/jobs/:jobId/messages
```

### Job Service Routes  
```
Frontend:    GET /jobs?status=completed
Backend:     GET /jobs/status/:status
Fix:         Backend should accept query param instead
```

## Type Mismatches

1. **Review Aggregates:** ✅ Fixed via backend transformation
2. **Provider Services Response:** ⚠️ API client handles unwrapping
3. **Pagination:** ⚠️ Inconsistent (cursor vs offset)
4. **Response Wrapping:** ⚠️ Inconsistent across services

## Quick Fixes Checklist

### Frontend Tasks
- [ ] Change `/jobs/:jobId/payments` → `/payments/job/:jobId`
- [ ] Change `/jobs/:jobId/messages` → `/messages/jobs/:jobId/messages` 
- [ ] Change `PUT` → `PATCH` for `/providers/:id/services`
- [ ] Update job filtering to use path param OR wait for backend fix
- [ ] Handle missing endpoint errors gracefully

### Backend Tasks
- [ ] Add `GET /providers/:id/services`
- [ ] Add `PATCH /proposals/:id`
- [ ] Add `GET /jobs/:jobId/review`
- [ ] Add `PATCH /messages/:id/read`
- [ ] Add `GET /auth/profile` (or document to use `/users/me`)
- [ ] Add `POST /auth/verify-email`
- [ ] Add notification bulk/delete endpoints
- [ ] Add admin activate and stats endpoints
- [ ] Consider changing `GET /jobs/status/:status` to accept query param

### API Gateway Tasks
- [ ] Add `/categories` → request-service route
- [ ] Add `/favorites` → user-service route
- [ ] (Optional) Add route aliases for backward compatibility

### Documentation Tasks
- [ ] Update API_SPECIFICATION.md with all endpoints
- [ ] Document OAuth endpoints
- [ ] Document subscription/payment-method endpoints
- [ ] Document notification preferences
- [ ] Add request/response examples

## Standardization Needed

### Response Format
**Standardize all responses:**
```typescript
// List responses
{ data: [...], total: 100, cursor: "next_token" }

// Single item
{ data: {...} }

// Operations
{ success: true, message: "Done", data: {...} }

// Errors
{ success: false, error: { code: "...", message: "..." } }
```

### Pagination
**Use cursor-based everywhere:**
```typescript
?limit=20&cursor=xyz
Response: { data: [...], hasMore: true, nextCursor: "abc" }
```

### Naming Conventions
- Dates: `created_at`, `updated_at` (snake_case)
- IDs: `user_id`, `provider_id` (with `_id` suffix)
- Booleans: `is_verified`, `has_active` (with prefix)

## Testing Priority

1. **High:** Payment and messaging workflows (route mismatches)
2. **Medium:** Proposal updates, review fetching
3. **Low:** Admin functions, notification bulk operations

## See Also

- [Full Report](FRONTEND_BACKEND_API_ALIGNMENT_REPORT.md)
- [API Specification](docs/API_SPECIFICATION.md)
- [Architecture Docs](docs/ARCHITECTURE.md)
