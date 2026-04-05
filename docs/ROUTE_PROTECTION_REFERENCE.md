# API Gateway Route Protection Reference

This document provides a comprehensive overview of **which routes are public vs protected** in the Local Service Marketplace platform.

**Last Updated:** March 15, 2026

---

## Table of Contents

1. [Frontend Route Protection](#frontend-route-protection)
2. [Backend API Route Protection](#backend-api-route-protection)
3. [Quick Reference Table](#quick-reference-table)
4. [Testing Guide](#testing-guide)

---

## Frontend Route Protection

**Configured in:** `frontend/middleware.ts`

### ✅ **Public Frontend Routes** (No Authentication Required)

| Route | Description |
|-------|-------------|
| `/` | Homepage |
| `/about` | About us page |
| `/contact` | Contact form |
| `/help` | Help center |
| `/faq` | Frequently asked questions |
| `/pricing` | Pricing plans |
| `/terms` | Terms of service |
| `/privacy` | Privacy policy |
| `/cookies` | Cookie policy |
| `/careers` | Career opportunities |
| `/how-it-works` | How it works guide |
| `/login` | Login page |
| `/signup` | Signup page |
| `/forgot-password` | Forgot password page |
| `/reset-password` | Reset password page |
| `/auth/callback` | OAuth callback handler |
| `/auth/error` | Auth error page |
| `/requests` | Browse service requests (public marketplace) |
| `/requests/[id]` | View request details |
| `/providers` | Browse provider directory |
| `/providers/[id]` | View provider profile |
| `/unsubscribe` | Email unsubscribe page |

### 🔒 **Protected Frontend Routes** (Authentication Required)

All routes under `/dashboard` require authentication:

| Route | Description | Role Required |
|-------|-------------|---------------|
| `/dashboard` | User dashboard homepage | User/Provider |
| `/dashboard/profile` | User profile view | User/Provider |
| `/dashboard/profile/edit` | Edit user profile | User/Provider |
| `/dashboard/settings` | Account settings | User/Provider |
| `/dashboard/settings/password` | Change password | User/Provider |
| `/dashboard/settings/notifications` | Notification preferences | User/Provider |
| `/dashboard/settings/payment-methods` | Payment methods | User/Provider |
| `/dashboard/settings/subscription` | Subscription management | Provider |
| `/dashboard/requests` | User's service requests | Customer |
| `/dashboard/requests/[id]` | Request details | Customer |
| `/dashboard/browse-requests` | Browse available requests | Provider |
| `/dashboard/my-proposals` | Provider's proposals | Provider |
| `/dashboard/jobs` | Active jobs | User/Provider |
| `/dashboard/jobs/[id]` | Job details | User/Provider |
| `/dashboard/messages` | Messages/chat | User/Provider |
| `/dashboard/notifications` | Notifications center | User/Provider |
| `/dashboard/reviews/submit` | Submit review | User/Provider |
| `/dashboard/payments/history` | Payment history | User/Provider |
| `/dashboard/earnings` | Provider earnings | Provider |
| `/dashboard/availability` | Set availability | Provider |
| `/dashboard/provider` | Provider profile management | Provider |
| `/dashboard/admin` | Admin dashboard | Admin |
| `/dashboard/admin/users` | Manage users | Admin |
| `/dashboard/admin/disputes` | Manage disputes | Admin |
| `/dashboard/admin/settings` | Admin settings | Admin |
| `/requests/create` | Create new request | Customer |

**Auto-Redirects:**
- Logged-in users visiting `/login` or `/signup` → Redirected to `/dashboard`
- Non-logged-in users visiting `/dashboard` → Redirected to `/login`

---

## Backend API Route Protection

**Configured in:** `api-gateway/src/gateway/config/services.config.ts`  
**Middleware:** `api-gateway/src/gateway/middlewares/jwt-auth.middleware.ts`

### ✅ **Public API Routes** (All HTTP Methods - No JWT Required)

#### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/signup` | Create new account |
| POST | `/api/v1/auth/login` | Email + password login |
| POST | `/api/v1/auth/refresh` | Refresh JWT token |
| POST | `/api/v1/auth/password-reset/request` | Request password reset |
| POST | `/api/v1/auth/password-reset/confirm` | Confirm password reset |
| POST | `/api/v1/auth/email/verify` | Verify email address |
| POST | `/api/v1/auth/check-identifier` | Check if email/phone exists |

#### OAuth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/auth/google` | Initiate Google OAuth |
| GET | `/api/v1/auth/google/callback` | Google OAuth callback |
| GET | `/api/v1/auth/facebook` | Initiate Facebook OAuth |
| GET | `/api/v1/auth/facebook/callback` | Facebook OAuth callback |

#### Phone Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/phone/login` | Phone + password login |
| POST | `/api/v1/auth/phone/otp/request` | Request OTP via SMS |
| POST | `/api/v1/auth/phone/otp/verify` | Verify OTP code |
| POST | `/api/v1/auth/email/otp/request` | Request OTP via email |
| POST | `/api/v1/auth/email/otp/verify` | Verify email OTP |

#### Payment Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/payments/webhook` | Payment provider webhooks |

#### Public Information

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/admin/contact` | Contact form submission |
| GET | `/api/v1/service-categories` | List service categories |

#### Health & Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | API Gateway health |
| GET | `/api/v1/health/services` | All services health |
| GET | `/health` | Health check (no prefix) |
| GET | `/health/services` | Services health (no prefix) |

---

### 🔓 **Public GET-Only Routes** (POST/PATCH/DELETE Require JWT)

| HTTP Method | Endpoint | Public? | Description |
|-------------|----------|---------|-------------|
| GET | `/api/v1/requests` | ✅ Yes | Browse service requests |
| GET | `/api/v1/requests/:id` | ✅ Yes | View request details |
| POST | `/api/v1/requests` | ❌ No (JWT) | Create request |
| PATCH | `/api/v1/requests/:id` | ❌ No (JWT) | Update request |
| DELETE | `/api/v1/requests/:id` | ❌ No (JWT) | Delete request |
|||
| GET | `/api/v1/providers` | ✅ Yes | Browse providers |
| GET | `/api/v1/providers/:id` | ✅ Yes | View provider profile |
| POST | `/api/v1/providers` | ❌ No (JWT) | Create provider profile |
| PATCH | `/api/v1/providers/:id` | ❌ No (JWT) | Update provider profile |
|||
| GET | `/api/v1/reviews` | ✅ Yes | Browse reviews |
| GET | `/api/v1/providers/:id/reviews` | ✅ Yes | View provider reviews |
| POST | `/api/v1/reviews` | ❌ No (JWT) | Submit review |
|||
| GET | `/api/v1/pricing-plans` | ✅ Yes | View pricing tiers |

---

### 🔒 **Protected API Routes** (JWT Required for ALL Methods)

#### User Profile

| Method | Endpoint | Description | Auth Level |
|--------|----------|-------------|------------|
| GET | `/api/v1/users/me` | Get current user profile | User |
| PATCH | `/api/v1/users/me` | Update profile | User |
| POST | `/api/v1/users/avatar` | Upload avatar | User |

#### Logout

| Method | Endpoint | Description | Auth Level |
|--------|----------|-------------|------------|
| POST | `/api/v1/auth/logout` | Logout (invalidate token) | User |

#### Provider Management

| Method | Endpoint | Description | Auth Level |
|--------|----------|-------------|------------|
| GET | `/api/v1/providers/:id/services` | List provider services | Provider |
| PUT | `/api/v1/providers/:id/services` | Update offered services | Provider |
| PATCH | `/api/v1/providers/:id/availability` | Set availability | Provider |

#### Proposals

| Method | Endpoint | Description | Auth Level |
|--------|----------|-------------|------------|
| POST | `/api/v1/proposals` | Submit proposal | Provider |
| GET | `/api/v1/requests/:id/proposals` | List proposals for request | Customer |
| POST | `/api/v1/proposals/:id/accept` | Accept proposal | Customer |
| POST | `/api/v1/proposals/:id/reject` | Reject proposal | Customer |

#### Jobs

| Method | Endpoint | Description | Auth Level |
|--------|----------|-------------|------------|
| GET | `/api/v1/jobs` | List user's jobs | User/Provider |
| GET | `/api/v1/jobs/:id` | Get job details | User/Provider |
| POST | `/api/v1/jobs` | Create job (auto after proposal accept) | System |
| PATCH | `/api/v1/jobs/:id/status` | Update job status | User/Provider |
| POST | `/api/v1/jobs/:id/complete` | Mark job complete | Provider |

#### Payments

| Method | Endpoint | Description | Auth Level |
|--------|----------|-------------|------------|
| POST | `/api/v1/payments` | Create payment | Customer |
| GET | `/api/v1/payments/:id` | Get payment details | User/Provider |
| POST | `/api/v1/payments/:id/refund` | Request refund | Customer |
| GET | `/api/v1/payments/history` | Payment history | User/Provider |

#### Messages

| Method | Endpoint | Description | Auth Level |
|--------|----------|-------------|------------|
| POST | `/api/v1/messages` | Send message | User/Provider |
| GET | `/api/v1/jobs/:id/messages` | Get conversation | User/Provider |
| POST | `/api/v1/attachments` | Upload attachment | User/Provider |

#### Notifications

| Method | Endpoint | Description | Auth Level |
|--------|----------|-------------|------------|
| GET | `/api/v1/notifications` | List notifications | User |
| PATCH | `/api/v1/notifications/:id/read` | Mark as read | User |
| GET | `/api/v1/notification-preferences` | Get preferences | User |
| PATCH | `/api/v1/notification-preferences` | Update preferences | User |

#### Admin (Admin Only)

| Method | Endpoint | Description | Auth Level |
|--------|----------|-------------|------------|
| GET | `/api/v1/admin/users` | List all users | Admin |
| PATCH | `/api/v1/admin/users/:id/suspend` | Suspend user | Admin |
| GET | `/api/v1/admin/disputes` | List disputes | Admin |
| PATCH | `/api/v1/admin/disputes/:id` | Resolve dispute | Admin |
| GET | `/api/v1/admin/audit-logs` | View audit logs | Admin |

#### Analytics (Provider/Admin)

| Method | Endpoint | Description | Auth Level |
|--------|----------|-------------|------------|
| GET | `/api/v1/analytics/metrics` | Platform metrics | Admin |
| GET | `/api/v1/analytics/user-activity` | User activity logs | Admin |
| GET | `/api/v1/analytics/earnings` | Provider earnings | Provider |

---

## Quick Reference Table

### Frontend → Backend Mapping

| Frontend Route | Backend API Called | Auth Required | HTTP Method |
|----------------|-------------------|---------------|-------------|
| `/` | None (static) | ❌ No | - |
| `/login` | `POST /api/v1/auth/login` | ❌ No | POST |
| `/signup` | `POST /api/v1/auth/signup` | ❌ No | POST |
| `/requests` | `GET /api/v1/requests` | ❌ No | GET |
| `/requests/[id]` | `GET /api/v1/requests/:id` | ❌ No | GET |
| `/providers` | `GET /api/v1/providers` | ❌ No | GET |
| `/providers/[id]` | `GET /api/v1/providers/:id` | ❌ No | GET |
| `/requests/create` | `POST /api/v1/requests` | ✅ Yes | POST |
| `/dashboard` | `GET /api/v1/users/me` | ✅ Yes | GET |
| `/dashboard/profile` | `GET /api/v1/users/me` | ✅ Yes | GET |
| `/dashboard/requests` | `GET /api/v1/requests` | ✅ Yes | GET |
| `/dashboard/jobs` | `GET /api/v1/jobs` | ✅ Yes | GET |
| `/dashboard/messages` | `GET /api/v1/messages` | ✅ Yes | GET |
| `/dashboard/notifications` | `GET /api/v1/notifications` | ✅ Yes | GET |
| `/dashboard/settings` | `PATCH /api/v1/users/me` | ✅ Yes | PATCH |

---

## Testing Guide

### Test Public Access (No JWT Token)

```bash
# ✅ Should work (public)
curl http://localhost:3700/api/v1/requests
curl http://localhost:3700/api/v1/providers
curl http://localhost:3700/api/v1/requests/123
curl http://localhost:3700/health

# ❌ Should fail (401 Unauthorized)
curl -X POST http://localhost:3700/api/v1/requests
curl http://localhost:3700/api/v1/users/me
curl http://localhost:3700/api/v1/jobs
```

### Test Protected Access (With JWT Token)

```bash
# Get JWT token first
TOKEN=$(curl -X POST http://localhost:3700/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"password123"}' \
  | jq -r '.accessToken')

# ✅ Should work with token
curl http://localhost:3700/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN"

curl -X POST http://localhost:3700/api/v1/requests \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"category_id":"123","description":"Test","budget":100}'
```

### Test Method-Based Protection

```bash
# ✅ GET without auth (public)
curl http://localhost:3700/api/v1/requests

# ❌ POST without auth (should fail)
curl -X POST http://localhost:3700/api/v1/requests \
  -H "Content-Type: application/json" \
  -d '{"description":"Test"}'

# ✅ POST with auth (should work)
curl -X POST http://localhost:3700/api/v1/requests \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description":"Test"}'
```

---

## Security Summary

### ✅ **What's Public** (No Auth Required)

1. **Browsing** - Anyone can view requests, providers, reviews
2. **Authentication** - Signup, login, password reset, OAuth
3. **Information** - Contact form, health checks, pricing
4. **Webhooks** - Payment provider callbacks

### 🔒 **What's Protected** (JWT Required)

1. **Creating** - New requests, proposals, reviews, messages
2. **Updating** - Profile changes, settings, job status
3. **User Data** - Personal info, payment methods, earnings
4. **Actions** - Accept/reject proposals, mark complete, refunds
5. **Admin** - User management, disputes, analytics

### 🔓 **What's Partially Public** (GET Only)

1. **Marketplace** - Browse requests (GET public, POST protected)
2. **Providers** - View profiles (GET public, POST/PATCH protected)
3. **Reviews** - Read reviews (GET public, POST protected)
4. **Pricing** - View plans (GET public, subscribe protected)

---

## Configuration Files

| File | Purpose |
|------|---------|
| `frontend/middleware.ts` | Frontend route protection |
| `api-gateway/src/gateway/config/services.config.ts` | Backend route configuration |
| `api-gateway/src/gateway/middlewares/jwt-auth.middleware.ts` | JWT validation middleware |
| `frontend/auth.config.ts` | NextAuth configuration |

---

**Related Documentation:**
- [API Specification](./API_SPECIFICATION.md)
- [Authentication Workflow](./AUTHENTICATION_WORKFLOW.md)
- [API Gateway README](./API_GATEWAY_README.md)
- [Microservice Boundary Map](./MICROSERVICE_BOUNDARY_MAP.md)

---

**Last Updated:** March 15, 2026  
**Version:** 1.0
