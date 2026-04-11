# Bug Fix Instructions — Local Service Marketplace

This document lists all identified bugs across all microservices, their root causes, and the exact fixes applied. Organized by severity (Critical → High → Medium → Low) within each service.

---

## PHASE 1 — CRITICAL Fixes

### 1.1 comms-service: Email/Push delivery stubs — never deliver

**Files:**
- `services/comms-service/src/notification/services/email-worker.service.ts`
- `services/comms-service/src/notification/services/push-worker.service.ts`

**Root cause:** Both methods used `setTimeout(resolve, 100)` fake delays instead of actual API calls.

**Fix applied:**
- `email-worker.service.ts`: Injected `EmailClient` + `UserClient`. Resolves UUID → email, calls `emailClient.sendEmail()`, marks delivery `failed` on error.
- `push-worker.service.ts`: Removed fake stub; throws an error explaining push requires BullMQ (not admin HTTP).

---

### 1.2 comms-service: UUID sent as email address in workers

**Files:**
- `services/comms-service/src/workers/email.worker.ts`
- `services/comms-service/src/workers/digest.worker.ts`
- `services/comms-service/src/common/user/user.client.ts` (created)
- `services/comms-service/src/common/user/user.module.ts` (created)

**Root cause:** Workers passed `userId` (UUID) directly as the `to` field in email jobs.

**Fix applied:** Created `UserClient` that calls `GET /internal/users/:userId` on identity-service via HMAC-authenticated headers. Both workers now resolve UUID → email before calling `emailClient.sendEmail()`. Throws if email cannot be resolved.

---

### 1.3 payment-service: Workers commit fraud by faking completions

**Files:**
- `services/payment-service/src/workers/payment.worker.ts`
- `services/payment-service/src/workers/refund.worker.ts`
- `services/payment-service/src/workers/webhook.worker.ts`

**Root cause:**
- `payment.worker.ts` generated fake `txn_retry_*` transaction IDs without calling the payment gateway.
- `refund.worker.ts` had a `// Simulate gateway refund` comment with no implementation.
- `webhook.worker.ts` only resolved payment by `event.paymentId`, ignoring `event.transactionId`.

**Fix applied:**
- `payment.worker.ts`: Injected `PaymentGatewayService`, calls `chargeWith(gateway, params)`, uses real `transactionId` from response.
- `refund.worker.ts`: Injected `PaymentGatewayService`, calls `refundWith(gateway, { transactionId, amount, reason })`.
- `webhook.worker.ts`: First tries `getPaymentByTransactionId(event.transactionId)`, falls back to `event.paymentId`.

---

### 1.4 identity-service: TOTP `verifySync` crash

**File:** `services/identity-service/src/modules/auth/services/auth.service.ts`

**Root cause:** `verifySync` does not exist in `otplib`. Import error crashes 2FA verification.

**Fix applied:** Replaced `import { verifySync } from "otplib"` with `import { totp } from "otplib"`. Changed call to `totp.verify({ secret, token })`.

---

### 1.5 identity-service: Logout endpoint unauthenticated (account hijack)

**File:** `services/identity-service/src/modules/auth/controllers/auth.controller.ts`

**Root cause:** `POST /auth/logout` had no `@UseGuards(JwtAuthGuard)`. Anyone could logout any user by supplying an arbitrary `x-user-id` header.

**Fix applied:** Added `@UseGuards(JwtAuthGuard)` to logout handler. Changed userId derivation from raw `x-user-id` header to `req.user.sub` (set by the guard).

---

### 1.6 identity-service: `Math.random()` used for security tokens

**File:** `services/identity-service/src/modules/auth/services/auth.service.ts`

**Root cause:** `generateRandomSecret()`, `generateSecureToken()`, `generateRandomPassword()`, `_generateRandomBackupCode()` all used `Math.random()` — cryptographically weak.

**Fix applied:** All four methods now use `crypto.randomBytes(n)` (Node.js built-in).

---

### 1.7 identity-service: GATEWAY_INTERNAL_SECRET timing attack

**File:** `services/identity-service/src/modules/auth/controllers/auth.controller.ts`

**Root cause:** `gatewaySecret !== expectedSecret` is vulnerable to timing attacks (CWE-208).

**Fix applied:** Replaced with `crypto.timingSafeEqual(Buffer.from(gatewaySecret), Buffer.from(expectedSecret))`.

---

### 1.8 infrastructure-service: WorkersModule crashes on startup

**File:** `services/infrastructure-service/src/workers/workers.module.ts`

**Root cause:** `DatabaseModule` was missing from `imports`, causing NestJS DI to fail at boot.

**Fix applied:** Added `DatabaseModule` to `imports` array.

---

### 1.9 oversight-service: Any user can read any dispute

**File:** `services/oversight-service/src/admin/services/dispute.service.ts`

**Root cause:** `getDisputeForUser()` fetched the dispute without checking if the requesting user opened it.

**Fix applied:** Added `if (dispute.opened_by !== userId) throw new ForbiddenException()` after fetching the dispute.

---

## PHASE 2 — HIGH Priority Fixes

### 2.1 marketplace-service: Provider cannot re-propose after rejection/withdrawal

**File:** `services/marketplace-service/src/modules/proposal/repositories/proposal.repository.ts`

**Root cause:** `hasExistingProposal` query matched all statuses including `rejected` and `withdrawn`.

**Fix applied:** Added `AND status NOT IN ('rejected', 'withdrawn')` to the query.

---

### 2.2 marketplace-service: acceptProposal doesn't reject competing proposals

**Files:**
- `services/marketplace-service/src/modules/proposal/repositories/proposal.repository.ts`
- `services/marketplace-service/src/modules/proposal/services/proposal.service.ts`

**Root cause:** After accepting one proposal, all other pending proposals for the same request remained `pending`.

**Fix applied:**
- Added `rejectSiblingProposals(requestId, acceptedProposalId)` to the repository.
- `acceptProposal` in service now calls `rejectSiblingProposals()` after accepting.

---

### 2.3 marketplace-service: withdrawProposal publishes no Kafka event

**File:** `services/marketplace-service/src/modules/proposal/services/proposal.service.ts`

**Root cause:** Method updated the DB but never emitted a `proposal_withdrawn` event.

**Fix applied:** Added `kafkaService.publishEvent('proposal-events', { eventType: 'proposal_withdrawn', ... })` after withdrawal.

---

### 2.4 marketplace-service: Reviews allowed on non-completed jobs + fraud vectors

**Files:**
- `services/marketplace-service/src/modules/review/services/review.service.ts`
- `services/marketplace-service/src/modules/review/repositories/review.repository.ts`

**Root cause:**
- No check that the job was `completed` before allowing a review.
- `provider_id` was accepted from the request body (fraud vector).
- No duplicate review guard.

**Fix applied:**
- `createReview` now validates `job.status === 'completed'`.
- Derives `provider_id` from `job.provider_id` (server-side), not from client.
- Checks for duplicate review via `existsForJobAndUser(jobId, userId)`.

---

### 2.5 marketplace-service: acceptProposal omits `updated_at`

**File:** `services/marketplace-service/src/modules/proposal/repositories/proposal.repository.ts`

**Fix applied:** Added `updated_at = NOW()` to the `acceptProposal` UPDATE query.

---

### 2.6 identity-service: BlacklistGuard reads wrong field name

**File:** `services/identity-service/src/modules/auth/guards/blacklist.guard.ts`

**Root cause:** Guard read `user.userId` but `JwtAuthGuard` sets `req.user.sub`.

**Fix applied:** Changed `user.userId` to `user.sub`.

---

### 2.7 identity-service: `findByPhone` doesn't filter soft-deleted users

**File:** `services/identity-service/src/modules/auth/repositories/user.repository.ts`

**Fix applied:** Added `AND deleted_at IS NULL` to `findByPhone` query.

---

### 2.8 identity-service: createEmailOtpToken destroys pending verification tokens

**Files:**
- `services/identity-service/src/modules/auth/services/token.service.ts`
- `services/identity-service/src/modules/auth/repositories/email-verification-token.repository.ts`

**Root cause:** `createEmailOtpToken` called `deleteByUserId(userId)` which deleted ALL tokens for that user, including pending long-form email verification tokens.

**Fix applied:** Added `deleteOtpByUserId(userId)` which only deletes tokens with `LENGTH(token) <= 6` (OTPs), preserving longer verification tokens.

---

### 2.9 identity-service: Login doesn't enforce email verification

**File:** `services/identity-service/src/modules/auth/services/auth.service.ts`

**Root cause:** `login()` and `loginWithPhone()` allowed unverified accounts to receive JWTs.

**Fix applied:** Added `if (!user.email_verified) throw new UnauthorizedException('Please verify your email before logging in')` in both methods after the account status check.

---

### 2.10 payment-service: Coupon validation gaps

**Files:**
- `services/payment-service/src/payment/services/coupon.service.ts`
- `services/payment-service/src/payment/repositories/coupon.repository.ts`

**Root cause:**
- `validateCoupon` didn't check the `active` flag.
- No `max_uses` enforcement.
- `recordCouponUsage` crashed with `TypeError` when `ON CONFLICT DO NOTHING` returned 0 rows.

**Fix applied:**
- Added `if (!coupon.active) throw BadRequestException` check.
- Added `getCouponUsageCount()` call and `max_uses` comparison.
- Added `if (!result.rows.length) return null` guard before `result.rows[0]` access.

---

### 2.11 payment-service: PayUbiz HMAC timing attack

**File:** `services/payment-service/src/payment/gateway/adapters/payubiz.adapter.ts`

**Fix applied:** Replaced `===` with `crypto.timingSafeEqual()` for HMAC hash comparison (CWE-208).

---

### 2.12 payment-service: false `payment_completed` Kafka event

**File:** `services/payment-service/src/payment/services/payment.service.ts`

**Root cause:** `payment_completed` was published even when payment was in `pending` state (async gateway).

**Fix applied:** Event is now conditional: `payment_completed` only when `paymentStatus === 'completed'`; publishes `payment_pending` for async gateways.

---

### 2.13 infrastructure-service: BackgroundJobWorker reads wrong property

**File:** `services/infrastructure-service/src/workers/background-job.worker.ts`

**Root cause:** Worker read `job.data.jobType` but `createJob()` stores the type as the BullMQ job name (`job.name`).

**Fix applied:** Changed to `const jobType = job.name`.

---

### 2.14 infrastructure-service: Rate limiter TOCTOU race condition

**File:** `services/infrastructure-service/src/infrastructure/services/rate-limit.service.ts`

**Root cause:** GET-then-INCR pattern allowed concurrent requests to all pass the limit check before any incremented.

**Fix applied:** Rewrote to use atomic INCR-first pattern: call `INCR key` → returns new count atomically → set `EXPIRE` on first request (count === 1) → check if count > maxRequests.

---

### 2.15 payment-service: SubscriptionWorker sends UUID as email address

**File:** `services/payment-service/src/workers/subscription.worker.ts`

**Root cause:** All notification handlers passed `subscription.provider_id` (UUID) as the `to` field for email delivery.

**Fix applied:** Injected `UserClient`. All handlers now call `userClient.getUserEmail(providerId)` to resolve the actual email. Skip notification with a warning log if email cannot be resolved.

---

### 2.16 payment-service: SubscriptionWorker.handleRenewSubscriptions is empty stub

**Files:**
- `services/payment-service/src/workers/subscription.worker.ts`
- `services/payment-service/src/payment/repositories/subscription.repository.ts`

**Root cause:** Method had only a comment, no implementation.

**Fix applied:**
- Added `getSubscriptionsForRenewal(hoursAhead)` to repository — fetches active subscriptions expiring within `hoursAhead` hours, including plan price and billing period.
- Added `renewSubscription(id, newExpiresAt)` to repository — updates `expires_at` and status.
- Implemented `handleRenewSubscriptions()`: queries near-expiry subscriptions, charges via `PaymentGatewayService.charge()`, calculates new expiry based on `billing_period` (monthly/quarterly/yearly), updates DB, sends confirmation email.

---

### 2.17 comms-service: job_cancelled doesn't notify customer

**File:** `services/comms-service/src/notification/services/event-consumer.service.ts`

**Root cause:** `handleJobCancelled` only created a notification for the provider. The customer was not notified.

**Fix applied:** Added a second `createNotification()` call for `event.data.userId` (customer).

---

### 2.18 comms-service: WebSocket `message:read` never persists to DB

**File:** `services/comms-service/src/messaging/gateways/messaging.gateway.ts`

**Root cause:** `handleMarkAsRead` emitted the WebSocket event without calling the DB to persist the read state.

**Fix applied:** Added `await messageService.markMessageAsRead(messageId)` before emitting `"message:read"`.

---

### 2.19 comms-service: Retry workers double-enqueue fresh jobs

**File:** `services/comms-service/src/notification/repositories/notification-delivery.repository.ts`

**Root cause:** `getPendingDeliveries()` returned all pending deliveries including ones just created, causing workers to enqueue them before the primary path had a chance to process them.

**Fix applied:** Added `AND created_at < NOW() - INTERVAL '5 minutes'` to the query.

---

### 2.20 comms-service: `sendNotification()` swallows `BadRequestException`

**File:** `services/comms-service/src/notification/services/notification.service.ts`

**Root cause:** `catch` block caught all errors and returned `{ success: false }`, hiding feature-flag-disabled errors from clients.

**Fix applied:** Added `if (error instanceof BadRequestException) throw error` before the generic error return.

---

### 2.21 oversight-service: `POST /analytics/internal/track` unreachable

**File:** `services/oversight-service/src/analytics/controllers/analytics.controller.ts`

**Root cause:** Class-level `@UseGuards(JwtAuthGuard)` blocked the internal-only `trackInternalEvent` endpoint (which uses `InternalServiceGuard` and doesn't send JWT headers).

**Fix applied:** Removed class-level `@UseGuards(JwtAuthGuard)`. Applied guards individually per endpoint. `trackInternalEvent` keeps only `@UseGuards(InternalServiceGuard)`.

---

### 2.22 oversight-service: `dispute.repository.ts` sets `resolved_at` unconditionally

**File:** `services/oversight-service/src/admin/repositories/dispute.repository.ts`

**Root cause:** `resolved_at` was set on every status update, even intermediate ones like `in_progress`.

**Fix applied:** Used `CASE WHEN status IN ('resolved', 'closed') THEN CURRENT_TIMESTAMP ELSE resolved_at END`.

---

### 2.23 api-gateway: Auth rate-limiter path prefix wrong

**File:** `api-gateway/src/gateway/gateway.module.ts`

**Root cause:** All `AuthRateLimitMiddleware.forRoutes()` paths were missing the `/api/v1` prefix, so the middleware never matched any actual routes.

**Fix applied:** Added `/api/v1` prefix to all 7 auth route paths.

---

### 2.24 api-gateway: `isPublic` dead-code bug in JWT middleware

**File:** `api-gateway/src/gateway/middlewares/jwt-auth.middleware.ts`

**Root cause:** JWT validation was inside an `if (!isPublic)` block — public routes had an early `return next()` before the JWT was parsed, meaning valid tokens on public routes were never processed.

**Fix applied:** Moved JWT validation to run before the public-route check. Failed token on public route → graceful anonymous fallback. Failed token on private route → error propagates.

---

## PHASE 3 — MEDIUM Priority Fixes

### 3.1 marketplace-service: RejectProposalDto reason field never wired

**Files:**
- `services/marketplace-service/src/modules/proposal/controllers/proposal.controller.ts`
- `services/marketplace-service/src/modules/proposal/services/proposal.service.ts`

**Root cause:** The controller's `rejectProposal` endpoint didn't accept a request body, so the existing `RejectProposalDto.reason` was never used despite the repository supporting it.

**Fix applied:** Added `@Body() rejectDto: RejectProposalDto` to the controller, added `reason?: string` param to `rejectProposal()` in service, and passed it through to the repository.

---

### 3.2 marketplace-service: Job status transition rules missing

**File:** `services/marketplace-service/src/modules/job/services/job.service.ts`

**Root cause:** `updateJobStatus` allowed any authenticated party to set any status — customers could mark `in_progress`, providers could mark `disputed`.

**Fix applied:** Added role-based transition matrix:
- Customers: can only set `completed` or `disputed`
- Providers: can only set `in_progress` or `completed`
- Admins: unrestricted

---

### 3.3 oversight-service: `UpdateDisputeDto.resolution` required for all statuses

**File:** `services/oversight-service/src/admin/dto/update-dispute.dto.ts`

**Root cause:** `resolution` field was `@IsNotEmpty()`, blocking status updates that don't yet have a resolution (e.g., moving to `in_progress`).

**Fix applied:** Changed to `@IsOptional()`.

---

### 3.4 oversight-service: Missing `CreateDisputeDto` validation

**Files:**
- `services/oversight-service/src/admin/dto/create-dispute.dto.ts` (created)
- `services/oversight-service/src/admin/dispute.controller.ts`

**Root cause:** `createDispute` endpoint accepted raw `{ job_id, reason }` without validation, allowing empty reasons or non-UUID job IDs.

**Fix applied:** Created `CreateDisputeDto` with `@IsUUID() job_id` and `@IsString() @MinLength(10) reason`. Updated controller to use it.

---

### 3.5 oversight-service: Duplicate dispute routes in admin.controller.ts

**File:** `services/oversight-service/src/admin/admin.controller.ts`

**Root cause:** `create-dispute`, `my-disputes`, and `dispute/:id` routes were defined in both `AdminController` and `DisputeController`.

**Fix applied:** Removed all three duplicate user-facing dispute routes from `AdminController`. These routes only exist in `DisputeController` now.

---

### 3.6 oversight-service: `POST /analytics/activity` missing IP capture

**File:** `services/oversight-service/src/analytics/controllers/analytics.controller.ts`

**Root cause:** `ip_address` was never set on tracked activity — the DTO field existed but was always `null`.

**Fix applied:** Injected `@Req() req: Request`, reads `x-forwarded-for` header (for proxy environments) or falls back to `req.ip`. Only sets if not already provided in the DTO body.

---

### 3.7 oversight-service: `backfillMetrics` has no range cap

**File:** `services/oversight-service/src/analytics/controllers/analytics.controller.ts`

**Root cause:** Admin could request a backfill spanning years, causing unbounded DB work.

**Fix applied:** Added validation: `startDate` must be before `endDate`, and the range cannot exceed 90 days. Throws `BadRequestException` otherwise.

---

### 3.8 identity-service: verificationToken logged in plaintext

**File:** `services/identity-service/src/modules/auth/services/auth.service.ts`

**Root cause:** `signup()` included `verificationToken` in a `logger.info` call — tokens in logs are a security risk.

**Fix applied:** Removed `verificationToken` from the log call, replaced with a comment explaining it's sent via email only.

---

### 3.9 identity-service: 2FA QR code regenerates secret on every GET

**Files:**
- `services/identity-service/src/modules/auth/services/auth.service.ts`
- `services/identity-service/src/modules/auth/controllers/auth.controller.ts`

**Root cause:** `GET /auth/2fa/qr-code` called `enable2FA()` which always generated a new TOTP secret, breaking any authenticator app that had already scanned the previous QR.

**Fix applied:** Added `get2FAQRCode(userId)` service method that returns the existing secret's QR code if one exists, only creating a new one if no secret is set up yet. Controller calls this instead of `enable2FA()`.

---

### 3.10 identity-service: No rate limiting on OTP endpoints

**File:** `services/identity-service/src/modules/auth/services/auth.service.ts`

**Root cause:** `requestPhoneOtp()` and `requestEmailOtp()` had no rate limiting, allowing SMS/email OTP flooding attacks.

**Fix applied:** Added rate limiting (max 5 requests per 15-minute window) using the existing `loginAttemptRepo.countRecentFailedAttempts()` mechanism. Each OTP request is recorded as an attempt for tracking purposes.

---

### 3.11 identity-service: `revokeAllTokens` hardcodes 15-min JWT TTL

**File:** `services/identity-service/src/modules/auth/controllers/auth.controller.ts`

**Root cause:** Blacklist TTL was hardcoded to `15 * 60` seconds regardless of the actual JWT expiry configured via `JWT_EXPIRATION`.

**Fix applied:** Added `parseJwtExpiry()` private helper that parses strings like `"15m"`, `"1h"`, `"7d"` to seconds. TTL is now derived from `process.env.JWT_EXPIRATION`.

---

### 3.12 oversight-service: InternalServiceGuard timing attack

**File:** `services/oversight-service/src/common/guards/internal-service.guard.ts`

**Fix applied:** Replaced `secret !== expected` string comparison with `crypto.timingSafeEqual()` (CWE-208).

---

### 3.13 comms-service: Notification pagination reports wrong total

**Files:**
- `services/comms-service/src/notification/repositories/notification.repository.ts`
- `services/comms-service/src/notification/services/notification.service.ts`
- `services/comms-service/src/notification/notification.controller.ts`

**Root cause:** `total: notifications.length` reported the count of the current page, not the total in the database.

**Fix applied:**
- Added `countByUserId(userId)` to the repository.
- Exposed as `getTotalCount(userId)` in the service.
- Controller now uses this for `total` and `totalPages`.

---

## PHASE 4 — LOW Priority Issues (not yet fixed)

The following lower-priority issues were identified but not yet implemented. They can be addressed in a follow-up pass:

| # | Service | Issue |
|---|---------|-------|
| 4.1 | comms-service | `CreateMessageDto.job_id` missing `@IsNotEmpty()` |
| 4.2 | comms-service | JWT verification duplicated in `MessagingGateway` (should use shared guard) |
| 4.3 | comms-service | No auth header on `EmailClient` (unlike `SmsClient` which has HMAC) |
| 4.4 | marketplace-service | `ProposalResponseDto.fromEntity` strips `rejected_reason` and new fields |
| 4.5 | marketplace-service | `estimated_hours @Min` inconsistency (1 vs 0 in different DTOs) |
| 4.6 | marketplace-service | `getProposalsByProvider` hardcodes `LIMIT 200` |
| 4.7 | marketplace-service | `GET /jobs/status/:status` no enum validation |
| 4.8 | marketplace-service | `addProviderResponse` dead code in `review.repository.ts` |
| 4.9 | identity-service | `generatePassword(8)` uses shorter length than the 16-char default |
| 4.10 | payment-service | `WebhookService.processWebhook()` is dead code — remove |
| 4.11 | payment-service | `PayPalAdapter.verifyWebhookSignature` always returns `true` (stub) |
| 4.12 | identity-service | `getDevices`/`removeDevice` access private pool via string injection key |
| 4.13 | marketplace-service | `getMyProposals`/`getMyJobs` fake pagination (hardcoded page 1) |
| 4.14 | identity-service | Circular module dependency `RedisModule` ↔ `UserModule` (use `forwardRef`) |
| 4.15 | identity-service | `Apple OAuth` strategy not registered in `auth.module.ts` |
| 4.16 | identity-service | OAuth exchange store (`oauthExchangeStore`) is in-memory — not cluster-safe; use Redis |
| 4.17 | identity-service | Refresh token not rotated on `/auth/refresh` — old token reusable after rotation |
| 4.18 | oversight-service | Cross-service metrics aggregation does direct DB joins on `users`, `service_requests`, `jobs`, `payments` tables (violates microservice boundaries) — replace with HTTP calls or Kafka event counters |
| 4.19 | oversight-service | `getUserDisputes` repository has a cross-service subquery on `jobs` and `providers` tables |
| 4.20 | comms-service | Three modules register the same BullMQ queues with inconsistent retry options — consolidate into a shared `QueueModule` |
| 4.21 | identity-service | 2FA QR code uses deprecated Google Charts API — replace with server-side `qrcode` npm package |
| 4.22 | marketplace-service | Cross-service DB joins on `providers` table in proposal/job repositories — replace with identity-service API calls |

---

## Architecture Reference

### Service Ports
| Service | Port |
|---------|------|
| api-gateway | 3700 |
| identity-service | 3001 |
| marketplace-service | 3003 |
| payment-service | 3006 |
| comms-service | 3007 |
| oversight-service | 3010 |
| infrastructure-service | 3012 |

### Authentication Pattern
The API Gateway validates JWTs and injects the following headers into downstream service requests:
- `x-user-id` — UUID of the authenticated user
- `x-user-email` — user's email
- `x-user-role` — user's role
- `x-gateway-hmac` — HMAC signature for request integrity

Services' `JwtAuthGuard` reads these headers (not raw JWT tokens). Internal service-to-service calls use `x-internal-service-secret` with `crypto.timingSafeEqual()` comparison.

### Key Patterns
- **Workers**: Extend `WorkerHost`, register via `@Processor('queue.name')`, read job type from `job.name`, payload from `job.data`.
- **BullMQ**: Job name = the logical operation type. Never put the type in `job.data.jobType`.
- **Kafka events**: Use `KafkaService.publishEvent(topic, { eventType, eventId, timestamp, data })`.
- **TOTP**: Use `totp.verify({ secret, token })` from `otplib` — not `verifySync` (doesn't exist).
- **Crypto**: Always use `crypto.randomBytes()`, never `Math.random()` for security tokens. Use `crypto.timingSafeEqual()` for all secret comparisons.
