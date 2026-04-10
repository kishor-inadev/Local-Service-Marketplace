# Marketplace Guide

Complete reference for every role on the Local Service Marketplace platform — what each user type can do and how the platform works end-to-end.

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [User Roles](#2-user-roles)
3. [Customer — Full Capabilities](#3-customer--full-capabilities)
4. [Provider — Full Capabilities](#4-provider--full-capabilities)
5. [Admin — Full Capabilities](#5-admin--full-capabilities)
6. [How a Service Transaction Works](#6-how-a-service-transaction-works)
7. [Payment System](#7-payment-system)
8. [Notification System](#8-notification-system)
9. [Review & Rating System](#9-review--rating-system)
10. [API Reference by Role](#10-api-reference-by-role)

---

## 1. Platform Overview

The Local Service Marketplace connects **customers** who need services (plumbing, cleaning, tutoring, etc.) with **providers** who offer them, managed by **admins** who keep the platform trustworthy.

```
Customer                          Provider
   |                                 |
   | Posts service request           |
   |  ↓                              |
   |  [Request Created]              |
   |       ↓                         |
   |       | ← Provider submits proposal
   |       |                         |
   | Reviews proposals               |
   | Accepts one                     |
   |  ↓                              |
   |  [Job Created]                  |
   |       ↓ ← Provider does work    |
   |       | ← Provider marks complete
   |       ↓                         |
   | Confirms completion             |
   | Pays via payment gateway        |
   | Leaves review                   |
   |                                 |
Admin monitors all activity, handles disputes, manages users
```

---

## 2. User Roles

| Role | Description | Created by |
|---|---|---|
| **Customer** | Posts service requests, hires providers, pays for jobs | Self-registration |
| **Provider** | Lists services, submits proposals, completes jobs, receives payments | Self-registration + profile setup |
| **Admin** | Manages users, resolves disputes, views analytics, configures platform | Seeded or promoted by another admin |

A user has a single account but can hold both the `customer` and `provider` role simultaneously.

---

## 3. Customer — Full Capabilities

### 3.1 Account Management

| Action | Endpoint | Notes |
|---|---|---|
| Register | `POST /api/v1/user/auth/register` | Email + password |
| Verify email | `POST /api/v1/user/auth/verify-email` | Token from email |
| Login | `POST /api/v1/user/auth/login` | Returns access + refresh tokens |
| Login with Google | `GET /api/v1/user/auth/google` | OAuth 2.0 |
| Login with Facebook | `GET /api/v1/user/auth/facebook` | OAuth 2.0 |
| Login with phone | `POST /api/v1/user/auth/phone/send-otp` | SMS OTP |
| Refresh token | `POST /api/v1/user/auth/refresh` | Sliding session |
| Logout | `POST /api/v1/user/auth/logout` | Invalidates session |
| Forgot password | `POST /api/v1/user/auth/forgot-password` | Sends reset email |
| Reset password | `POST /api/v1/user/auth/reset-password` | Token from email |
| View profile | `GET /api/v1/user/users/me` | Own profile |
| Update profile | `PATCH /api/v1/user/users/me` | Name, bio, phone, address |
| Upload avatar | `POST /api/v1/user/users/me/profile-picture` | Multipart upload |
| Enable 2FA | `POST /api/v1/user/auth/2fa/enable` | TOTP authenticator app |
| Delete account | `DELETE /api/v1/user/auth/account` | Soft delete, 30-day grace |

### 3.2 Service Request Lifecycle

A **service request** is how customers describe work they need done.

| Action | Endpoint | Notes |
|---|---|---|
| Create request | `POST /api/v1/requests` | Title, description, category, budget, location |
| View my requests | `GET /api/v1/requests?mine=true` | Paginated list |
| View request detail | `GET /api/v1/requests/:id` | Includes proposals count |
| Update request | `PATCH /api/v1/requests/:id` | Only if still `open` |
| Cancel request | `PATCH /api/v1/requests/:id` | Changes status to `cancelled` |
| View proposals on request | `GET /api/v1/proposals?requestId=:id` | All provider proposals |

**Request statuses:**
```
open → in_progress → completed
     ↘ cancelled
     ↘ expired     (auto after 30 days with no activity)
```

### 3.3 Browsing Providers

| Action | Endpoint | Notes |
|---|---|---|
| Search providers | `GET /api/v1/user/providers` | Filter by category, location, rating |
| View provider profile | `GET /api/v1/user/providers/:id` | Services, ratings, reviews |
| View provider reviews | `GET /api/v1/reviews/provider/:providerId` | Paginated |
| View provider rating | `GET /api/v1/reviews/provider/:providerId/rating` | Aggregate stats |
| View provider trust badge | `GET /api/v1/aggregates/provider/:providerId/trust-badge` | Bronze/Silver/Gold |
| Save as favourite | `POST /api/v1/user/favorites/:providerId` | Saved to account |
| Remove favourite | `DELETE /api/v1/user/favorites/:providerId` | |
| List favourites | `GET /api/v1/user/favorites` | |

### 3.4 Managing Proposals

After posting a request, providers submit proposals. The customer reviews and accepts one.

| Action | Endpoint | Notes |
|---|---|---|
| View all proposals | `GET /api/v1/proposals?requestId=:id` | For a specific request |
| View proposal detail | `GET /api/v1/proposals/:id` | Provider, price, timeline |
| Accept proposal | `POST /api/v1/proposals/:id/accept` | Creates a job automatically |
| Reject proposal | `POST /api/v1/proposals/:id/reject` | Provider notified |
| Counter-propose | `PATCH /api/v1/proposals/:id` | Negotiate price/timeline |

When a proposal is accepted:
1. All other proposals on that request are automatically rejected
2. The request status changes to `in_progress`
3. A **Job** is created
4. Both parties receive a notification

### 3.5 Jobs

A **job** is the active work contract created when a proposal is accepted.

| Action | Endpoint | Notes |
|---|---|---|
| View my jobs | `GET /api/v1/jobs/my` | As customer or provider |
| View job detail | `GET /api/v1/jobs/:id` | Status, timeline, photos |
| Confirm job complete | `POST /api/v1/jobs/:id/complete` | Customer confirms provider's work |
| Raise dispute | `POST /api/v1/admin/disputes` | If work is unsatisfactory |

**Job statuses:**
```
pending → in_progress → completed
        ↘ cancelled
        ↘ disputed
```

### 3.6 Payments

| Action | Endpoint | Notes |
|---|---|---|
| Pay for job | `POST /api/v1/payments` | After job completion |
| View payment history | `GET /api/v1/payments` | Own payments |
| View payment detail | `GET /api/v1/payments/:id` | |
| Apply coupon | Include `couponCode` in payment body | |
| Request refund | `POST /api/v1/refunds` | Only on eligible payments |
| View refunds | `GET /api/v1/refunds` | Own refunds |
| Save payment method | `POST /api/v1/payment-methods` | Card tokenized by gateway |
| View saved cards | `GET /api/v1/payment-methods` | |
| Delete saved card | `DELETE /api/v1/payment-methods/:id` | |

### 3.7 Reviews

Reviews can only be submitted after a job is completed.

| Action | Endpoint | Notes |
|---|---|---|
| Submit review | `POST /api/v1/reviews` | 1–5 stars + comment |
| View review | `GET /api/v1/reviews/:id` | |
| Mark review helpful | `POST /api/v1/reviews/:id/helpful` | |

### 3.8 Notifications

| Action | Endpoint | Notes |
|---|---|---|
| View notifications | `GET /api/v1/notifications` | In-app, paginated |
| Mark as read | `PATCH /api/v1/notifications/:id/read` | |
| Mark all as read | `PATCH /api/v1/notifications/read-all` | |
| Notification preferences | `GET/PATCH /api/v1/notifications/preferences` | Email/SMS/push opt-in |
| Unsubscribe from email | `POST /api/v1/notifications/unsubscribe` | |

---

## 4. Provider — Full Capabilities

Providers can do everything a customer can (they share the same account system), plus the provider-specific actions below.

### 4.1 Becoming a Provider

| Action | Endpoint | Notes |
|---|---|---|
| Create provider profile | `POST /api/v1/user/providers` | Bio, categories, location |
| Update provider profile | `PATCH /api/v1/user/providers/:id` | Services offered, pricing |
| Upload provider photo | `POST /api/v1/user/providers/:id/profile-picture` | |
| Set services offered | `PATCH /api/v1/user/providers/:id/services` | List of service categories |
| Set availability | `PATCH /api/v1/user/providers/:id/availability` | Working hours/days |

A provider profile must be created and approved (depending on platform config) before submitting proposals.

### 4.2 Finding Work

| Action | Endpoint | Notes |
|---|---|---|
| Browse open requests | `GET /api/v1/requests` | Filter by category, location, budget |
| Search requests | `GET /api/v1/requests?search=plumbing&categoryId=...` | Full-text search |
| View request detail | `GET /api/v1/requests/:id` | Customer info visible after accepted |

### 4.3 Submitting Proposals

| Action | Endpoint | Notes |
|---|---|---|
| Submit proposal | `POST /api/v1/proposals` | Price, message, estimated timeline |
| Update proposal | `PATCH /api/v1/proposals/:id` | Only if still `pending` |
| Withdraw proposal | `DELETE /api/v1/proposals/:id` | Before customer accepts |
| View my proposals | `GET /api/v1/proposals?mine=true` | All submitted proposals |

**Proposal statuses:**
```
pending → accepted → (job created)
        ↘ rejected
        ↘ withdrawn
        ↘ countered
```

### 4.4 Managing Jobs

| Action | Endpoint | Notes |
|---|---|---|
| View my jobs | `GET /api/v1/jobs/my` | Active and past jobs |
| Update job status | `PATCH /api/v1/jobs/:id/status` | in_progress, etc. |
| Mark job complete | `POST /api/v1/jobs/:id/complete` | Triggers customer confirmation |
| Upload job photos | `POST /api/v1/jobs/:id/photos` | Before/after proof |
| View provider reviews | `GET /api/v1/reviews/provider/:providerId` | Own reviews |

### 4.5 Payments & Earnings

| Action | Endpoint | Notes |
|---|---|---|
| View received payments | `GET /api/v1/payments` | Filtered by receivedBy |
| Payment statistics | `GET /api/v1/payments/stats` | Earnings summary |
| Subscribe to plan | `POST /api/v1/subscriptions` | Provider subscription tiers |
| View subscription | `GET /api/v1/subscriptions/provider/:id` | Current plan, expiry |
| Upgrade plan | `POST /api/v1/subscriptions/provider/:id/upgrade` | |
| View active plan | `GET /api/v1/subscriptions/provider/:id/active` | |

### 4.6 Responding to Reviews

| Action | Endpoint | Notes |
|---|---|---|
| Respond to review | `POST /api/v1/reviews/:id/respond` | Public reply to customer review |

### 4.7 Provider Subscription Tiers

Providers can subscribe to plans that unlock features or increase visibility:

| Tier | Benefits |
|---|---|
| **Free** | Basic listing, limited proposals per month |
| **Standard** | Increased proposal limit, priority in search, badge |
| **Premium** | Unlimited proposals, featured placement, analytics dashboard |

Plans are configured by admin in the pricing plans table and charged via the connected payment gateway.

---

## 5. Admin — Full Capabilities

Admins access additional endpoints all under `/api/v1/admin/*` and `/api/v1/analytics/*`. Admin role is required — the API gateway enforces role-based access.

### 5.1 User Management

| Action | Endpoint | Notes |
|---|---|---|
| List all users | `GET /api/v1/user/users` | Paginated, filterable |
| View user | `GET /api/v1/user/users/:id` | Full profile including status |
| Update user | `PATCH /api/v1/user/users/:id` | Name, email, role |
| Suspend user | `PATCH /api/v1/user/users/:id/suspend` | Prevents login |
| Activate user | `PATCH /api/v1/user/users/:id/activate` | Re-enables suspended account |
| Reset user password | `PATCH /api/v1/user/users/:id/reset-password` | Sends reset email |
| Restore deleted user | `PATCH /api/v1/user/users/:id/restore` | Reverses soft-delete |
| Hard delete user | `DELETE /api/v1/user/users/:id` | Permanent |
| View user stats | `GET /api/v1/user/users/stats` | Totals by role, registration trend |

### 5.2 Provider Management

| Action | Endpoint | Notes |
|---|---|---|
| List all providers | `GET /api/v1/user/providers` | Filterable by status, category |
| View provider | `GET /api/v1/user/providers/:id` | Full profile |
| Update provider | `PATCH /api/v1/user/providers/:id` | Services, status, verification |
| Delete provider | `DELETE /api/v1/user/providers/:id` | |

### 5.3 Dispute Management

Customers or providers can raise disputes on jobs. Admins resolve them.

| Action | Endpoint | Notes |
|---|---|---|
| View all disputes | `GET /api/v1/admin/disputes` | Paginated, filter by status |
| View dispute stats | `GET /api/v1/admin/disputes/stats` | Open/resolved counts |
| View dispute detail | `GET /api/v1/admin/disputes/:id` | Full history |
| Update dispute | `PATCH /api/v1/admin/disputes/:id` | Resolve, reject, escalate |

**Dispute statuses:**
```
open → under_review → resolved
                    ↘ rejected
                    ↘ escalated
```

When a dispute is raised:
1. The related job is frozen (no payments processed)
2. Admin is notified
3. Admin reviews evidence from both parties
4. Admin resolves — may trigger refund or release payment

### 5.4 Audit Logs

Every sensitive action is logged automatically. Admins can query the audit trail.

| Action | Endpoint | Notes |
|---|---|---|
| List audit logs | `GET /api/v1/admin/audit-logs` | Paginated, filterable by user/date |
| Logs for entity | `GET /api/v1/admin/audit-logs/entity/:entity/:id` | e.g. all actions on a payment |

Logged events include: user suspension, password resets, admin actions, payment creation, dispute updates, system settings changes.

### 5.5 System Settings

| Action | Endpoint | Notes |
|---|---|---|
| List all settings | `GET /api/v1/admin/settings` | Key-value configuration |
| Get setting | `GET /api/v1/admin/settings/:key` | |
| Update setting | `PATCH /api/v1/admin/settings/:key` | Platform-wide config |

Settings examples:
- `platform.commission_rate` — percentage taken from each payment
- `request.max_proposals` — max proposals per request
- `provider.auto_verify` — auto-approve provider registrations

### 5.6 Analytics & Metrics

| Action | Endpoint | Notes |
|---|---|---|
| Daily metrics | `GET /api/v1/analytics/metrics` | Users, requests, payments |
| Metric by date | `GET /api/v1/analytics/metrics/:date` | Specific day (YYYY-MM-DD) |
| User activity | `GET /api/v1/analytics/user-activity` | Activity log |
| User activity detail | `GET /api/v1/analytics/user-activity/:userId` | Per-user actions |
| Activity by action | `GET /api/v1/analytics/user-activity/action/:action` | e.g. `login`, `payment` |
| Run today aggregation | `POST /api/v1/analytics/workers/aggregate-today` | Manual trigger |
| Run yesterday aggregation | `POST /api/v1/analytics/workers/aggregate-yesterday` | |
| Backfill date range | `POST /api/v1/analytics/workers/backfill` | Recompute historical data |

**Metrics tracked daily:**
- New user registrations (by role)
- New service requests
- Proposals submitted and accepted
- Jobs created, completed, disputed
- Payments processed (volume + count)
- Reviews submitted
- Average provider rating

### 5.7 Payment Admin

| Action | Endpoint | Notes |
|---|---|---|
| View all payments | `GET /api/v1/payments` | Platform-wide (admin only) |
| View payment stats | `GET /api/v1/payments/stats` | Revenue, volume, gateway breakdown |
| Initiate refund | `POST /api/v1/refunds` | On behalf of customer |
| View all refunds | `GET /api/v1/refunds` | |
| Create pricing plan | `POST /api/v1/pricing-plans` | Provider subscription tiers |
| View pricing plans | `GET /api/v1/pricing-plans` | |
| Update pricing plan | `PATCH /api/v1/pricing-plans/:id` | |
| Create coupon | `POST /api/v1/coupons` | Discount codes |
| List coupons | `GET /api/v1/coupons` | |
| Deactivate coupon | `PATCH /api/v1/coupons/:id` | |

### 5.8 Service Categories

Admins manage the taxonomy of services available on the platform.

| Action | Endpoint | Notes |
|---|---|---|
| Create category | `POST /api/v1/categories` | Name, description, icon |
| List categories | `GET /api/v1/categories` | Public (cached) |
| Get category | `GET /api/v1/categories/:id` | |
| Update category | `PATCH /api/v1/categories/:id` | Admin only |
| Delete category | `DELETE /api/v1/categories/:id` | Admin only |

### 5.9 Content Moderation

| Action | Endpoint | Notes |
|---|---|---|
| View all reviews | `GET /api/v1/reviews` | Platform-wide |
| Delete review | `DELETE /api/v1/reviews/:id` | Remove inappropriate content |
| View all requests | `GET /api/v1/requests` | Platform-wide view |

---

## 6. How a Service Transaction Works

### Step-by-Step Flow

```
1. CUSTOMER: registers and verifies email
      ↓
2. CUSTOMER: posts a service request
   - Title: "Need kitchen deep clean"
   - Category: Cleaning
   - Budget: $100–150
   - Location: 123 Main St
   - Urgency: This weekend
      ↓
3. PROVIDERS: browse open requests
   - Can search by category, location, budget range
      ↓
4. PROVIDER: submits a proposal
   - Price: $120
   - Message: "5 years experience, includes supplies"
   - Estimated duration: 3 hours
      ↓
5. CUSTOMER: reviews proposals
   - Views provider profiles, ratings, past reviews
   - May negotiate (counter-propose)
      ↓
6. CUSTOMER: accepts a proposal
   → Request status: open → in_progress
   → Job is created (status: pending)
   → All other proposals auto-rejected
   → Both parties notified
      ↓
7. PROVIDER: performs the service
   - Updates job status to in_progress
   - Uploads photos (optional proof)
      ↓
8. PROVIDER: marks job as complete
   → Customer notified to confirm
      ↓
9. CUSTOMER: confirms completion
   → Job status: completed
   → Payment prompt triggered
      ↓
10. CUSTOMER: pays
    - Selects payment method
    - Applies coupon (optional)
    - Payment processed via gateway (Stripe/Razorpay/etc.)
    → Provider notified of payment
      ↓
11. CUSTOMER: leaves review
    - 1–5 stars + written review
    → Provider rating recalculated
      ↓
12. PROVIDER: responds to review (optional)
    - Public reply visible on profile
```

### What Happens If Something Goes Wrong

| Scenario | Resolution |
|---|---|
| Provider doesn't show up | Customer cancels job, no charge |
| Work is unsatisfactory | Customer raises dispute — admin mediates |
| Payment fails | BullMQ retries automatically (3 attempts, exponential backoff) |
| Provider disappears mid-job | Customer raises dispute, admin can initiate refund |
| Customer refuses to pay | Admin can force-resolve dispute |

---

## 7. Payment System

### Supported Payment Gateways

Set `PAYMENT_GATEWAY` env var to switch gateways:

| Gateway | `PAYMENT_GATEWAY` value | Regions |
|---|---|---|
| Mock (testing) | `mock` | All (fake, no real charges) |
| Stripe | `stripe` | Global |
| Razorpay | `razorpay` | India |
| PayPal | `paypal` | Global |
| PayUbiz | `payu` | India |
| Instamojo | `instamojo` | India |

### Payment Flow

```
Customer initiates payment
       ↓
Payment Service validates job + amount
       ↓
Coupon applied (if provided)
       ↓
Payment Gateway processes charge
       ↓
Webhook received from gateway → async processed by PaymentWorker
       ↓
Payment status updated in DB
       ↓
Notification sent to both parties (async via BullMQ)
       ↓
Analytics tracked (async via BullMQ)
```

### Refund Policy

Refunds are processed through the same gateway as the original payment:
- Refund request created → status: `pending`
- `RefundWorker` processes via gateway API (async, with retries)
- Customer notified on success or failure
- Full or partial refunds supported

### Coupon Codes

- Created by admin with a discount amount or percentage
- One-time use or multi-use (configurable)
- Expiry date support
- `CleanupWorker` auto-expires stale coupons weekly

---

## 8. Notification System

All notifications route through **comms-service** — no other service contacts the email or SMS APIs directly.

### Notification Events

| Event | Who receives | Channels |
|---|---|---|
| Registration | Customer/Provider | Email (welcome) |
| Email verification | Customer/Provider | Email |
| Password reset | Customer/Provider | Email |
| Proposal received | Customer | In-app, Email |
| Proposal accepted | Provider | In-app, Email |
| Proposal rejected | Provider | In-app |
| Job created | Both | In-app, Email |
| Job completed | Customer | In-app, Email |
| Payment received | Provider | In-app, Email |
| Payment failed | Customer | In-app, Email |
| Refund processed | Customer | In-app, Email |
| Review received | Provider | In-app |
| Dispute raised | Admin | In-app, Email |
| Dispute resolved | Both | In-app, Email |
| Daily digest | Both | Email (if enabled) |
| Card expiring soon | Customer/Provider | Email |
| Account suspended | User | Email |
| Account deactivated | User | Email |

### Delivery Channels

| Channel | Enabled by | Default |
|---|---|---|
| Email | `EMAIL_ENABLED=true` | Enabled |
| SMS | `SMS_ENABLED=true` | Disabled (costs) |
| Push | `PUSH_NOTIFICATIONS_ENABLED=true` | Disabled (requires FCM) |
| In-app | `IN_APP_NOTIFICATIONS_ENABLED=true` | Disabled |

### Unsubscribe

Users can opt out of email at any time:
- `POST /api/v1/notifications/unsubscribe` — adds to suppression list
- Comms-service checks suppression before every delivery
- Admin cannot override unsubscribe (CAN-SPAM compliance)

---

## 9. Review & Rating System

### How Ratings Work

- Reviews are submitted by customers after job completion
- Each review: 1–5 stars + written comment
- Provider's rating is the weighted average of all reviews
- **Rating recalculation** is async (triggered via BullMQ `marketplace.rating` queue after each new review)
- Full nightly refresh runs at 3AM via repeatable job

### Rating Aggregates

For each provider, the platform maintains:
- Overall average rating
- Total review count
- Star distribution (1★ count, 2★ count, ... 5★ count)
- Trust badge: Bronze (10+ reviews, 4.0+), Silver (25+ reviews, 4.3+), Gold (50+ reviews, 4.7+)

### Review Visibility

| Endpoint | Public? |
|---|---|
| `GET /api/v1/reviews/provider/:id` | Yes — visible to all |
| `GET /api/v1/reviews/:id` | Yes — visible to all |
| Provider aggregate | `GET /api/v1/aggregates/provider/:id` | Yes |
| Top-rated providers | `GET /api/v1/aggregates/top-rated` | Yes |

### Provider Response

Providers can post one public reply per review. The reply appears below the customer review on the provider's profile.

---

## 10. API Reference by Role

All requests go through the API Gateway at `http://localhost:3700` (or your production domain).

### Authentication

All protected endpoints require:
```http
Authorization: Bearer <access_token>
```

Tokens are obtained at login (`POST /api/v1/user/auth/login`) and refreshed via `POST /api/v1/user/auth/refresh`.

Access token lifetime: **15 minutes**
Refresh token lifetime: **7 days**

### Role-Accessible Endpoints Summary

| Prefix | Who can access |
|---|---|
| `POST /api/v1/user/auth/*` | Public (no auth required) |
| `GET /api/v1/categories` | Public |
| `GET /api/v1/user/providers` | Public |
| `GET /api/v1/reviews/provider/*` | Public |
| `/api/v1/user/users/me` | Authenticated user (own data) |
| `/api/v1/requests` | All authenticated |
| `/api/v1/proposals` | All authenticated |
| `/api/v1/jobs` | All authenticated |
| `/api/v1/payments` | All authenticated (own data) |
| `/api/v1/notifications` | All authenticated (own data) |
| `PATCH /api/v1/user/users/:id/suspend` | Admin only |
| `/api/v1/admin/*` | Admin only |
| `/api/v1/analytics/*` | Admin only |
| `POST /api/v1/pricing-plans` | Admin only |
| `POST /api/v1/coupons` | Admin only |

### Pagination

All list endpoints support cursor-based pagination:
```http
GET /api/v1/requests?limit=20&cursor=eyJpZCI6IjEyMyJ9
```

Response includes:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "nextCursor": "eyJpZCI6IjE0MyJ9",
    "hasMore": true,
    "limit": 20
  }
}
```

### Standard Response Format

```json
{
  "success": true,
  "message": "Operation description",
  "data": { ... }
}
```

Error response:
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": { ... }
  }
}
```

### Common HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Bad request / validation error |
| 401 | Missing or invalid token |
| 403 | Authenticated but insufficient role |
| 404 | Resource not found |
| 409 | Conflict (e.g. already exists) |
| 429 | Rate limit exceeded |
| 500 | Server error |

---

> See also:
> - [Getting Started](GETTING_STARTED.md) — How to run the platform
> - [API Specification](api/API_SPECIFICATION.md) — Full endpoint list
> - [Authentication Workflow](guides/AUTHENTICATION_WORKFLOW.md) — Token flow details
> - [Background Jobs Guide](guides/BACKGROUND_JOBS_GUIDE.md) — Async processing
> - [Environment Variables Guide](ENVIRONMENT_VARIABLES_GUIDE.md) — All config options
