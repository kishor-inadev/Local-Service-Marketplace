# Marketplace Guide

Complete reference for every role on the Local Service Marketplace platform — what each user type can do, every page they can access, and how the platform works end-to-end.

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [User Roles](#2-user-roles)
3. [Customer — Full Capabilities](#3-customer--full-capabilities)
4. [Provider — Full Capabilities](#4-provider--full-capabilities)
5. [Admin — Full Capabilities](#5-admin--full-capabilities)
6. [How a Service Transaction Works](#6-how-a-service-transaction-works)
7. [Payment System](#7-payment-system)
8. [Dispute System](#8-dispute-system)
9. [Notification System](#9-notification-system)
10. [Review & Rating System](#10-review--rating-system)
11. [Frontend Pages Reference](#11-frontend-pages-reference)
12. [API Reference by Role](#12-api-reference-by-role)

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
   |   (optionally files dispute)    |
   |                                 |
Admin monitors all activity, resolves disputes, manages users & categories
```

---

## 2. User Roles

| Role | Description | Created by |
|---|---|---|
| **Customer** | Posts service requests, hires providers, pays for jobs | Self-registration |
| **Provider** | Lists services, submits proposals, completes jobs, receives payments | Self-registration + onboarding |
| **Admin** | Manages users, resolves disputes, views analytics, configures platform | Seeded or promoted by another admin |

> A single account can hold both the `customer` and `provider` role simultaneously.

---

## 3. Customer — Full Capabilities

### 3.1 Account Management

| Action | Frontend Page | Endpoint |
|---|---|---|
| Register | `/signup` | `POST /api/v1/user/auth/register` |
| Verify email | `/verify-email` | `POST /api/v1/user/auth/verify-email` |
| Login (email/password) | `/login` | `POST /api/v1/user/auth/login` |
| Login with phone OTP | `/phone-login` | `POST /api/v1/user/auth/phone/send-otp` |
| Login with Google/Facebook | `/login` (OAuth buttons) | `GET /api/v1/user/auth/google` |
| Forgot password | `/forgot-password` | `POST /api/v1/user/auth/forgot-password` |
| Reset password | `/reset-password` | `POST /api/v1/user/auth/reset-password` |
| View / edit profile | `/dashboard/profile`, `/dashboard/profile/edit` | `GET/PATCH /api/v1/user/users/me` |
| Change password | `/dashboard/settings/password` | `PATCH /api/v1/user/auth/change-password` |
| Notification preferences | `/dashboard/settings/notifications` | `GET/PATCH /api/v1/notifications/preferences` |
| Saved payment methods | `/dashboard/settings/payment-methods` | `GET/POST/DELETE /api/v1/payment-methods` |
| Subscription settings | `/dashboard/settings/subscription` | `GET /api/v1/subscriptions/provider/:id` |
| Logout | (header button) | `POST /api/v1/user/auth/logout` |

### 3.2 Browsing the Marketplace

| Action | Frontend Page | Notes |
|---|---|---|
| Browse service categories | `/categories` | Public page — grid/list view, search |
| Search providers | `/search` | Filter by category, location, rating |
| View provider public profile | `/providers/:id` | Services, ratings, reviews, availability |
| View all providers | `/providers` | Public listing |

### 3.3 Creating & Managing Service Requests

A **service request** describes work a customer needs done.

| Action | Frontend Page | Endpoint |
|---|---|---|
| Create request | `/requests/create` | `POST /api/v1/requests` |
| View my requests | `/dashboard/requests` | `GET /api/v1/requests?mine=true` |
| View request detail + proposals | `/dashboard/requests/:id` | `GET /api/v1/requests/:id` |
| Edit request | `/dashboard/requests/:id/edit` | `PATCH /api/v1/requests/:id` |
| Cancel request | (button in request detail) | `PATCH /api/v1/requests/:id` (`status: cancelled`) |

**Request statuses:**
```
open → in_progress → completed
     ↘ cancelled
     ↘ expired  (auto after 30 days with no activity)
```

### 3.4 Managing Proposals

| Action | Frontend Page | Endpoint |
|---|---|---|
| View proposals for a request | `/dashboard/requests/:id` | `GET /api/v1/proposals?requestId=:id` |
| Accept proposal | (button in request detail) | `POST /api/v1/proposals/:id/accept` |
| Reject proposal | (button in request detail) | `POST /api/v1/proposals/:id/reject` |

When a proposal is accepted:
1. All other proposals on the request are automatically rejected
2. The request status changes to `in_progress`
3. A **Job** is created
4. Both parties receive a notification

### 3.5 Jobs

A **job** is the active work contract created when a proposal is accepted.

| Action | Frontend Page | Endpoint |
|---|---|---|
| View my jobs | `/dashboard/jobs` | `GET /api/v1/jobs/my` |
| View job detail | `/dashboard/jobs/:id` | `GET /api/v1/jobs/:id` |
| Confirm job complete | (button in job detail, status=`completed`) | `POST /api/v1/jobs/:id/complete` |
| Pay for completed job | `/checkout?jobId=:id` | `POST /api/v1/payments` |
| File a dispute | `/dashboard/disputes/file?jobId=:id` | `POST /api/v1/disputes` |

**Job statuses:**
```
pending → scheduled → in_progress → completed
                    ↘ cancelled
                    ↘ disputed
```

### 3.6 Payments

| Action | Frontend Page | Endpoint |
|---|---|---|
| Pay for job | `/checkout?jobId=:id` | `POST /api/v1/payments` |
| View payment history | `/dashboard/payments/history` | `GET /api/v1/payments` |
| Request refund | (button in payment history) | `POST /api/v1/refunds` |
| Save payment method | `/dashboard/settings/payment-methods` | `POST /api/v1/payment-methods` |
| Remove payment method | `/dashboard/settings/payment-methods` | `DELETE /api/v1/payment-methods/:id` |

### 3.7 Reviews

Reviews can only be submitted after a job is completed.

| Action | Frontend Page | Endpoint |
|---|---|---|
| Submit review | `/dashboard/reviews/submit?jobId=:id` | `POST /api/v1/reviews` |
| View my reviews | `/dashboard/reviews` | `GET /api/v1/reviews?mine=true` |

### 3.8 Disputes

| Action | Frontend Page | Endpoint |
|---|---|---|
| File a dispute | `/dashboard/disputes/file` | `POST /api/v1/disputes` |
| View my disputes | `/dashboard/disputes` | `GET /api/v1/disputes/my` |
| View dispute detail | `/dashboard/disputes/:id` | `GET /api/v1/disputes/:id` |

**Dispute statuses:**
```
open → investigating → resolved
                     ↘ closed
```
When a dispute is filed:
- Payment for the related job is paused
- Admin is notified and reviews the case
- Resolution may trigger a refund or payment release

### 3.9 Messaging & Notifications

| Action | Frontend Page | Endpoint |
|---|---|---|
| View conversations | `/dashboard/messages` | `GET /api/v1/messages/conversations` |
| Send message | (inline in messages page) | `POST /api/v1/messages` |
| View notifications | `/dashboard/notifications` | `GET /api/v1/notifications` |
| Mark notification read | (click in notification list) | `PATCH /api/v1/notifications/:id/read` |

### 3.10 Favourites

| Action | Frontend Page | Endpoint |
|---|---|---|
| Save provider as favourite | `/providers/:id` or `/dashboard/favorites` | `POST /api/v1/user/favorites/:providerId` |
| View saved favourites | `/dashboard/favorites` | `GET /api/v1/user/favorites` |
| Remove favourite | (button in favourites list) | `DELETE /api/v1/user/favorites/:providerId` |

---

## 4. Provider — Full Capabilities

Providers share the same account system as customers and can do everything in Section 3, plus the following.

### 4.1 Onboarding

New providers go through a guided setup at `/onboarding`:

| Step | What happens |
|---|---|
| **Welcome** | Role-aware intro screen |
| **Business Profile** | Set business name, phone, description → `POST /api/v1/user/providers` |
| **Services** | Select service categories offered → `POST /api/v1/user/providers/:id/services` |
| **Availability** | Set weekly working hours (days + start/end times) → `POST /api/v1/user/providers/:id/availability` |
| **Complete** | Redirects to Browse Requests or Provider Dashboard |

### 4.2 Provider Profile Management

| Action | Frontend Page | Endpoint |
|---|---|---|
| Edit business profile | `/dashboard/provider` | `PATCH /api/v1/user/providers/:id` |
| Manage services offered | `/dashboard/provider/services` | `GET/POST/DELETE /api/v1/user/providers/:id/services` |
| Manage portfolio (photos) | `/dashboard/provider/portfolio` | `POST /api/v1/user/providers/:id/portfolio` |
| Upload verification documents | `/dashboard/provider/documents` | `POST /api/v1/user/providers/:id/documents` |
| View reviews received | `/dashboard/provider/reviews` | `GET /api/v1/reviews/provider/:id` |
| Respond to a review | (inline in reviews page) | `POST /api/v1/reviews/:id/respond` |
| Manage availability | `/dashboard/availability` | `GET/POST /api/v1/user/providers/:id/availability` |

### 4.3 Finding Work

| Action | Frontend Page | Endpoint |
|---|---|---|
| Browse open requests | `/dashboard/browse-requests` | `GET /api/v1/requests?status=open` |
| Filter by category/location | (filters on browse page) | `GET /api/v1/requests?categoryId=&location=` |

### 4.4 Submitting Proposals

| Action | Frontend Page | Endpoint |
|---|---|---|
| Submit proposal | Modal on `/dashboard/browse-requests` | `POST /api/v1/proposals` |
| View my proposals | `/dashboard/my-proposals` | `GET /api/v1/proposals?mine=true` |
| Withdraw proposal | (button in my-proposals) | `DELETE /api/v1/proposals/:id` |

**Proposal statuses:**
```
pending → accepted → (job created)
        ↘ rejected
        ↘ withdrawn
```

### 4.5 Managing Jobs

| Action | Frontend Page | Endpoint |
|---|---|---|
| View my jobs | `/dashboard/jobs` | `GET /api/v1/jobs/my` |
| View job detail | `/dashboard/jobs/:id` | `GET /api/v1/jobs/:id` |
| Start job (scheduled → in_progress) | (button in job detail) | `POST /api/v1/jobs/:id/start` |
| Mark job complete | (button in job detail) | `POST /api/v1/jobs/:id/complete` |

### 4.6 Earnings & Payments

| Action | Frontend Page | Endpoint |
|---|---|---|
| View earnings dashboard | `/dashboard/earnings` | `GET /api/v1/payments/provider-earnings/:id` |
| View transaction history | `/dashboard/earnings` (table) | `GET /api/v1/payments/provider-transactions/:id` |
| Subscribe to a plan | `/checkout?plan=:planId` | `POST /api/v1/subscriptions` |
| Manage subscription | `/dashboard/settings/subscription` | `GET /api/v1/subscriptions/provider/:id/active` |

### 4.7 Disputes

Providers can view and track disputes filed against their jobs.

| Action | Frontend Page | Endpoint |
|---|---|---|
| View my disputes | `/dashboard/disputes` | `GET /api/v1/disputes/my` |
| View dispute detail | `/dashboard/disputes/:id` | `GET /api/v1/disputes/:id` |

---

## 5. Admin — Full Capabilities

Admins access additional pages and endpoints. All admin API endpoints are under `/api/v1/admin/*`. The API gateway enforces the `admin` role requirement.

### 5.1 Admin Dashboard

| Page | URL | What it shows |
|---|---|---|
| Overview | `/dashboard/admin` | Key metrics: users, jobs, requests, revenue, active disputes, failed payments |

### 5.2 User Management

| Action | Frontend Page | Endpoint |
|---|---|---|
| List all users | `/dashboard/admin/users` | `GET /api/v1/user/users` |
| View user detail | `/dashboard/admin/users/:id` | `GET /api/v1/user/users/:id` |
| Create user | `/dashboard/admin/users/create` | `POST /api/v1/user/users` |
| Suspend user | (button in user detail) | `PATCH /api/v1/user/users/:id/suspend` |
| Unsuspend user | (button in user detail) | `PATCH /api/v1/user/users/:id/activate` |
| Delete user | (button in user detail) | `DELETE /api/v1/user/users/:id` |

### 5.3 Provider Verification

Providers submit documents for identity and business verification. Admins review and approve or reject.

| Action | Frontend Page | Endpoint |
|---|---|---|
| View pending verifications | `/dashboard/admin/providers` | `GET /api/v1/user/providers?status=pending` |
| Filter by verification status | (tabs on providers page) | `pending` / `verified` / `rejected` |
| View submitted documents | (expandable in providers page) | `GET /api/v1/user/providers/:id/documents` |
| Approve provider | (button in providers page) | `PATCH /api/v1/user/providers/:id/verify` |
| Reject provider | (button with reason) | `PATCH /api/v1/user/providers/:id/reject` |
| Approve individual document | (per-document action) | `PATCH /api/v1/user/providers/:id/documents/:docId/verify` |
| Reject individual document | (per-document action) | `PATCH /api/v1/user/providers/:id/documents/:docId/reject` |

### 5.4 Service Category Management

| Action | Frontend Page | Endpoint |
|---|---|---|
| View all categories | `/dashboard/admin/categories` | `GET /api/v1/categories` |
| Create category | (modal on categories page) | `POST /api/v1/categories` |
| Edit category | (modal on categories page) | `PATCH /api/v1/categories/:id` |
| Toggle active/inactive | (toggle on category card) | `PATCH /api/v1/categories/:id` |
| Delete category | (delete button with confirmation) | `DELETE /api/v1/categories/:id` |

### 5.5 Dispute Management

| Action | Frontend Page | Endpoint |
|---|---|---|
| View all disputes | `/dashboard/admin/disputes` | `GET /api/v1/admin/disputes` |
| View dispute detail | `/dashboard/admin/disputes/:id` | `GET /api/v1/admin/disputes/:id` |
| Update dispute status | (buttons in dispute detail) | `PATCH /api/v1/admin/disputes/:id` |
| Resolve with refund | (resolve form in detail) | `PATCH /api/v1/admin/disputes/:id` + `POST /api/v1/refunds` |

**Dispute resolution workflow:**
```
Admin reviews evidence
    → marks as "investigating"
    → decides outcome:
        ✓ Resolve in customer's favour → refund issued
        ✓ Resolve in provider's favour → payment released
        ✓ Close without action
```

### 5.6 Analytics Dashboard

| Action | Frontend Page | Endpoint |
|---|---|---|
| Platform analytics | `/dashboard/admin/analytics` | `GET /api/v1/analytics/metrics` |

Metrics shown:
- Total & active users, jobs, requests, platform revenue
- Jobs in progress, open disputes, failed payments
- Request status breakdown (progress bars)
- Job status breakdown (progress bars)
- Daily metrics table (7 / 30 / 90 day toggle): new users, new requests, completed jobs, revenue

### 5.7 Audit Logs

Every sensitive action is logged automatically.

| Action | Frontend Page | Endpoint |
|---|---|---|
| View audit logs | `/dashboard/admin/audit-logs` | `GET /api/v1/admin/audit-logs` |
| Filter by user ID | (filter input) | `?user_id=:id` |
| Filter by action | (filter input) | `?action=:action` |
| Search by entity/ID | (search box) | client-side filter |

Logged events include: user suspension, password resets, admin actions, payment creation, dispute updates, system settings changes, provider verification decisions, category changes.

### 5.8 System Settings

| Action | Frontend Page | Endpoint |
|---|---|---|
| View all settings | `/dashboard/admin/settings` | `GET /api/v1/admin/settings` |
| Edit a setting inline | (edit button per key) | `PATCH /api/v1/admin/settings/:key` |

Settings examples:
- `platform.commission_rate` — percentage taken from each payment
- `request.max_proposals` — max proposals per request
- `provider.auto_verify` — auto-approve provider registrations
- `platform.maintenance_mode` — put platform in read-only mode

### 5.9 Payment Administration

| Action | Endpoint |
|---|---|
| View all payments (platform-wide) | `GET /api/v1/payments` |
| View payment stats / revenue | `GET /api/v1/payments/stats` |
| Initiate refund | `POST /api/v1/refunds` |
| View all refunds | `GET /api/v1/refunds` |
| Create pricing plan | `POST /api/v1/pricing-plans` |
| Update pricing plan | `PATCH /api/v1/pricing-plans/:id` |
| Create coupon code | `POST /api/v1/coupons` |
| Deactivate coupon | `PATCH /api/v1/coupons/:id` |

---

## 6. How a Service Transaction Works

### Step-by-Step Flow

```
1. CUSTOMER: registers → verifies email → completes account setup
      ↓
2. PROVIDER: registers → completes onboarding (profile → services → availability)
      ↓
3. CUSTOMER: posts a service request
   - Title: "Need kitchen deep clean"
   - Category: Cleaning
   - Budget: $100–150
   - Location: 123 Main St
      ↓
4. PROVIDER: browses open requests
   - Filters by category, location, budget range
      ↓
5. PROVIDER: submits a proposal
   - Price: $120
   - Message: "5 years experience, eco-friendly supplies"
   - Estimated duration: 3 hours
      ↓
6. CUSTOMER: reviews proposals
   - Views provider profiles, ratings, past reviews
   - Accepts one proposal
   → Request status: open → in_progress
   → Job created (status: pending)
   → All other proposals auto-rejected
   → Both parties notified
      ↓
7. PROVIDER: starts the job
   → Job status: pending → scheduled → in_progress
      ↓
8. PROVIDER: marks job as complete
   → Customer notified
      ↓
9. CUSTOMER: confirms completion
   → Job status: completed
      ↓
10. CUSTOMER: pays via /checkout?jobId=:id
    → Payment processed via gateway (Stripe / Razorpay / mock)
    → Provider notified of payment received
      ↓
11. CUSTOMER: leaves a review (optional)
    → Provider rating recalculated async
      ↓
12. PROVIDER: responds to review (optional)
    → Public reply on provider profile
```

### What Happens If Something Goes Wrong

| Scenario | Resolution |
|---|---|
| Provider doesn't show up | Customer cancels job, no charge |
| Work is unsatisfactory | Customer files dispute at `/dashboard/disputes/file` |
| Payment fails | BullMQ retries automatically (3 attempts, exponential backoff) |
| Provider disappears mid-job | Customer files dispute; admin can issue refund |
| Dispute filed | Payment paused; admin mediates; resolved in favour of one party |

---

## 7. Payment System

### Supported Payment Gateways

Set `PAYMENT_GATEWAY` env var to switch gateways:

| Gateway | `PAYMENT_GATEWAY` value | Regions |
|---|---|---|
| Mock (testing) | `mock` | All (no real charges) |
| Stripe | `stripe` | Global |
| Razorpay | `razorpay` | India |
| PayPal | `paypal` | Global |
| PayUbiz | `payu` | India |
| Instamojo | `instamojo` | India |

### Job Payment Flow

```
Customer clicks "Pay Now" on completed job
       ↓
Redirected to /checkout?jobId=:id
       ↓
Checkout shows job summary + total amount
       ↓
Customer clicks "Pay [amount]"
       ↓
POST /api/v1/payments  { job_id, provider_id, amount, currency }
       ↓
Payment Service validates job + checks status = "completed"
       ↓
Coupon applied if provided
       ↓
Payment Gateway processes charge
       ↓
Webhook received → PaymentWorker processes asynchronously
       ↓
Payment status updated in DB
       ↓
Both parties notified (BullMQ async queue)
       ↓
Analytics tracked
```

### Subscription Payment Flow (Providers)

```
Provider selects plan on /pricing
       ↓
Redirected to /checkout?plan=:planId
       ↓
POST /api/v1/subscriptions  { provider_id, plan_id }
       ↓
POST /api/v1/subscriptions/:id/activate
       ↓
Provider subscription activated
       ↓
Manage at /dashboard/settings/subscription
```

### Refund Policy

- Refund request created → status: `pending`
- `RefundWorker` processes via gateway API (async, with retries)
- Full or partial refunds supported
- Customer notified on success or failure

### Coupon Codes

- Created by admin with a discount amount or percentage
- One-time or multi-use (configurable)
- Expiry date support
- `CleanupWorker` auto-expires stale coupons weekly

---

## 8. Dispute System

### Filing a Dispute

Customers and providers can file a dispute on any completed or in-progress job.

**Frontend flow:**
1. Go to `/dashboard/disputes/file` (or click "File Dispute" from job detail)
2. Select the related job (or it's pre-filled via `?jobId=`)
3. Choose a reason:
   - Work Not Completed
   - Poor Quality Work
   - Provider No-Show
   - Overcharged
   - Property Damaged
   - Safety Concern
   - Fraud / Scam
   - Other
4. Enter a description
5. Submit → `POST /api/v1/disputes`

### Dispute Status Tracker

```
open → investigating → resolved
                     ↘ closed
```

Shown as a visual progress bar on `/dashboard/disputes/:id`.

### Admin Resolution

1. Admin sees dispute in `/dashboard/admin/disputes`
2. Reviews evidence from both parties
3. Updates status to `investigating` while reviewing
4. Resolves with one of:
   - **Customer wins** → issue refund via `POST /api/v1/refunds`
   - **Provider wins** → release payment held in escrow
   - **Close** → no action, dispute closed
5. Both parties notified with resolution details

---

## 9. Notification System

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
| Job started | Customer | In-app |
| Job completed | Customer | In-app, Email |
| Payment received | Provider | In-app, Email |
| Payment failed | Customer | In-app, Email |
| Refund processed | Customer | In-app, Email |
| Review received | Provider | In-app |
| Dispute filed | Admin + other party | In-app, Email |
| Dispute resolved | Both | In-app, Email |
| Account suspended | User | Email |
| Card expiring soon | Customer/Provider | Email |

### Delivery Channels

| Channel | Enable via env var | Default |
|---|---|---|
| Email | `EMAIL_ENABLED=true` | Enabled |
| SMS | `SMS_ENABLED=true` | Disabled |
| Push | `PUSH_NOTIFICATIONS_ENABLED=true` | Disabled |
| In-app | `IN_APP_NOTIFICATIONS_ENABLED=true` | Disabled |

### Managing Preferences

Users control their notification channels at `/dashboard/settings/notifications`:
- Toggle email / SMS / push per event type
- Unsubscribe from all marketing email
- `POST /api/v1/notifications/unsubscribe` — adds to suppression list (CAN-SPAM compliant)

---

## 10. Review & Rating System

### How It Works

- Reviews submitted by customers after job completion (`/dashboard/reviews/submit`)
- Customers can view all reviews they've written at `/dashboard/reviews`
- Each review: 1–5 stars + written comment
- Provider's rating = weighted average of all reviews
- Recalculation is async via BullMQ `marketplace.rating` queue
- Nightly full refresh at 3AM

### Rating Aggregates

For each provider:
- Overall average rating
- Total review count
- Star distribution (1★–5★)
- Trust badge: Bronze (10+ reviews, 4.0+), Silver (25+ reviews, 4.3+), Gold (50+ reviews, 4.7+)

### Review Visibility

| Endpoint | Public? |
|---|---|
| `GET /api/v1/reviews/provider/:id` | Yes |
| Provider aggregate | `GET /api/v1/aggregates/provider/:id` | Yes |
| Top-rated providers | `GET /api/v1/aggregates/top-rated` | Yes |

### Provider Response

Providers can post one public reply per review from `/dashboard/provider/reviews`. The reply appears below the review on the provider's public profile.

---

## 11. Frontend Pages Reference

### Public Pages (no login required)

| Page | URL | Description |
|---|---|---|
| Home / Landing | `/` | Marketing homepage |
| How It Works | `/how-it-works` | Platform explainer |
| Browse Categories | `/categories` | All service categories with search |
| Browse Providers | `/providers` | Public provider directory |
| Provider Profile | `/providers/:id` | Public profile with services, reviews, availability |
| Create Request | `/requests/create` | Post a new service request |
| View Request | `/requests/:id` | Public request detail |
| Pricing | `/pricing` | Subscription plans for providers |
| Search | `/search` | Full-text provider/request search |
| About | `/about` | Company info |
| Help / FAQ | `/help`, `/faq` | Support centre |
| Contact | `/contact` | Contact form |
| Privacy / Terms | `/privacy`, `/terms`, `/cookies` | Legal pages |
| Unsubscribe | `/unsubscribe` | Email opt-out |

### Auth Pages

| Page | URL |
|---|---|
| Login | `/login` |
| Sign Up | `/signup` |
| Phone Login (OTP) | `/phone-login` |
| Forgot Password | `/forgot-password` |
| Reset Password | `/reset-password` |
| Verify Email | `/verify-email` |
| OAuth Callback | `/auth/callback` |

### Onboarding

| Page | URL | Who |
|---|---|---|
| Onboarding wizard | `/onboarding` | Customer & Provider (role-aware, 5-step for providers) |

### Customer Dashboard Pages

| Page | URL | Description |
|---|---|---|
| Overview | `/dashboard` | Role-based summary cards |
| My Requests | `/dashboard/requests` | All service requests |
| Request Detail | `/dashboard/requests/:id` | Details + proposals + accept/reject |
| Edit Request | `/dashboard/requests/:id/edit` | Modify open request |
| My Jobs | `/dashboard/jobs` | All jobs (active + history) |
| Job Detail | `/dashboard/jobs/:id` | Job status, actions (start/complete/pay/dispute) |
| Payment History | `/dashboard/payments/history` | All payments made |
| Job Checkout | `/checkout?jobId=:id` | Pay for a completed job |
| My Reviews | `/dashboard/reviews` | Reviews the customer has written |
| Submit Review | `/dashboard/reviews/submit` | Rate a completed job |
| My Disputes | `/dashboard/disputes` | All disputes filed |
| Dispute Detail | `/dashboard/disputes/:id` | Status tracker + resolution |
| File Dispute | `/dashboard/disputes/file` | Open a new dispute |
| Favourites | `/dashboard/favorites` | Saved providers |
| Messages | `/dashboard/messages` | Conversations (feature-flagged) |
| Notifications | `/dashboard/notifications` | In-app notifications (feature-flagged) |
| Profile | `/dashboard/profile` | View own profile |
| Edit Profile | `/dashboard/profile/edit` | Update name, bio, phone, photo |
| Settings | `/dashboard/settings` | Account settings hub |
| Notification Settings | `/dashboard/settings/notifications` | Channel preferences |
| Change Password | `/dashboard/settings/password` | Password update |
| Payment Methods | `/dashboard/settings/payment-methods` | Saved cards |
| Subscription | `/dashboard/settings/subscription` | View/manage subscription |

### Provider Dashboard Pages

All customer pages above, plus:

| Page | URL | Description |
|---|---|---|
| Browse Requests | `/dashboard/browse-requests` | Open requests with "Submit Proposal" action |
| My Proposals | `/dashboard/my-proposals` | All submitted proposals and statuses |
| Earnings | `/dashboard/earnings` | Revenue chart, transaction history |
| Availability | `/dashboard/availability` | Weekly schedule manager |
| Provider Profile | `/dashboard/provider` | Edit business profile |
| Services | `/dashboard/provider/services` | Manage offered service categories |
| Portfolio | `/dashboard/provider/portfolio` | Upload/manage work photos |
| Documents | `/dashboard/provider/documents` | Verification document management |
| Provider Reviews | `/dashboard/provider/reviews` | Reviews received + respond |
| My Disputes | `/dashboard/disputes` | Disputes on provider's jobs |
| Subscribe to Plan | `/checkout?plan=:id` | Provider subscription checkout |

### Admin Dashboard Pages

| Page | URL | Description |
|---|---|---|
| Admin Overview | `/dashboard/admin` | Platform-wide metrics summary |
| User Management | `/dashboard/admin/users` | List, search, filter all users |
| User Detail | `/dashboard/admin/users/:id` | Full profile + suspend/unsuspend/delete |
| Create User | `/dashboard/admin/users/create` | Admin-initiated account creation |
| Provider Verification | `/dashboard/admin/providers` | Pending/verified/rejected providers with doc review |
| Category Management | `/dashboard/admin/categories` | Create/edit/toggle/delete categories |
| Dispute Management | `/dashboard/admin/disputes` | All disputes with status filter |
| Dispute Detail | `/dashboard/admin/disputes/:id` | Full dispute + resolution actions |
| Analytics | `/dashboard/admin/analytics` | Metrics, status breakdowns, daily trends |
| Audit Logs | `/dashboard/admin/audit-logs` | Searchable action log for all admin/system events |
| System Settings | `/dashboard/admin/settings` | Live key-value settings editor |

---

## 12. API Reference by Role

All requests go through the API Gateway at `http://localhost:3700` (production domain configured via `GATEWAY_URL`).

### Authentication

All protected endpoints require:
```http
Authorization: Bearer <access_token>
```

Tokens are obtained at login (`POST /api/v1/user/auth/login`) and refreshed via `POST /api/v1/user/auth/refresh`.

| Token | Lifetime |
|---|---|
| Access token | 15 minutes |
| Refresh token | 7 days |

### Role-Accessible Endpoints Summary

| Endpoint prefix | Who can access |
|---|---|
| `POST /api/v1/user/auth/*` | Public |
| `GET /api/v1/categories` | Public |
| `GET /api/v1/user/providers` | Public |
| `GET /api/v1/reviews/provider/*` | Public |
| `GET /api/v1/aggregates/*` | Public |
| `/api/v1/user/users/me` | Own account only |
| `/api/v1/requests` | All authenticated |
| `/api/v1/proposals` | All authenticated |
| `/api/v1/jobs` | All authenticated |
| `/api/v1/payments` | Own data (admin sees all) |
| `/api/v1/disputes` | Own data (admin sees all) |
| `/api/v1/notifications` | Own data |
| `/api/v1/messages` | Own conversations |
| `/api/v1/user/favorites` | Own favourites |
| `POST /api/v1/user/providers` | Provider role |
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

Response:
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
| 409 | Conflict (e.g. duplicate proposal) |
| 429 | Rate limit exceeded |
| 500 | Server error |

---

> See also:
> - [Getting Started](GETTING_STARTED.md) — How to run the platform
> - [API Specification](api/API_SPECIFICATION.md) — Full endpoint list
> - [Authentication Workflow](guides/AUTHENTICATION_WORKFLOW.md) — Token flow details
> - [Background Jobs Guide](guides/BACKGROUND_JOBS_GUIDE.md) — Async processing
> - [Environment Variables Guide](ENVIRONMENT_VARIABLES_GUIDE.md) — All config options
> - [Route Protection Reference](ROUTE_PROTECTION_REFERENCE.md) — Which pages require which roles


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
