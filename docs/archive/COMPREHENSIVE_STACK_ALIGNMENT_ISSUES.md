# Comprehensive Stack Alignment Issues Report

**Generated:** March 15, 2026  
**Status:** 🔴 **CRITICAL MISMATCHES FOUND**

This document identifies ALL mismatches between Database Schema → Backend APIs → Frontend across the entire Local Service Marketplace platform.

---

## 📊 Executive Summary

| Category | Count |
|----------|-------|
| **Database Tables** | 40+ |
| **Backend Services** | 14 |
| **Backend API Endpoints** | 120+ |
| **Frontend Service Files** | 11 |
| **Frontend Pages** | 53 |
| **CRITICAL Issues** | 8 |
| **WARNINGS** | 12 |

---

## 🔴 CRITICAL ISSUES

These are blocking issues where frontend calls non-existent backends or databases have no exposure.

### 1. ❌ **Payment Endpoints Missing in Backend**

**Severity:** CRITICAL  
**Impact:** Payment functionality broken

#### Frontend Calls (from [frontend/services/payment-service.ts](frontend/services/payment-service.ts)):

```typescript
apiClient.post<Payment>('/payments', data)           // ❌ NO BACKEND
apiClient.get<Payment>(`/payments/${id}`)            // ❌ NO BACKEND
apiClient.get<Payment[]>(`/jobs/${jobId}/payments`)  // ❌ NO BACKEND
apiClient.post<Payment>(`/payments/${id}/refund`, data) // ❌ NO BACKEND
apiClient.get<Payment[]>(`/payments/my?user_id=${userId}`) // ❌ NO BACKEND
apiClient.get<Payment>(`/payments/${id}/status`)     // ❌ NO BACKEND
```

#### What Exists:
- ✅ Database Table: `payments` (full schema)
- ✅ Backend Entity: `payment.entity.ts`
- ❌ Backend Controller: **MISSING** `/payments` endpoints

#### What's Missing:
```typescript
// NEED TO CREATE: services/payment-service/src/payment/controllers/payment.controller.ts
POST   /payments              // Create payment
GET    /payments/:id          // Get payment details
GET    /payments/my           // Get user payments (customer + provider)
POST   /payments/:id/refund   // Request refund
GET    /payments/:id/status   // Get payment status
GET    /jobs/:jobId/payments  // Get payments for job
```

**Tables Involved:** `payments` (id, job_id, user_id, provider_id, amount, platform_fee, provider_amount, currency, payment_method, status, transaction_id, failed_reason, created_at, paid_at)

**Fix Priority:** 🔴 **CRITICAL** - Core payment flow broken

---

### 2. ❌ **Review Creation Endpoints Missing in Backend**

**Severity:** CRITICAL  
**Impact:** Users cannot submit reviews

#### Frontend Calls (from [frontend/services/review-service.ts](frontend/services/review-service.ts)):

```typescript
apiClient.post<Review>('/reviews', data)             // ❌ NO BACKEND
apiClient.get<Review>(`/reviews/${reviewId}`)        // ❌ NO BACKEND
apiClient.get<Review>(`/jobs/${jobId}/review`)       // ❌ NO BACKEND
```

#### What Exists:
- ✅ Database Table: `reviews` (full schema)
- ✅ Backend Entity: `review.entity.ts`
- ✅ Backend Service: `provider-review-aggregate.controller.ts` (GET aggregates only)
- ❌ Backend Controller: **MISSING** CRUD operations

#### What's Missing:
```typescript
// NEED TO CREATE: services/review-service/src/review/controllers/review.controller.ts
POST   /reviews               // Create review after job completion
GET    /reviews/:id           // Get review details
GET    /jobs/:jobId/review    // Get review for specific job
GET    /providers/:id/reviews // Get reviews for provider (exists in aggregate)
POST   /reviews/:id/respond   // Provider respond to review
POST   /reviews/:id/helpful   // Mark review helpful
```

**Tables Involved:** `reviews` (id, job_id, user_id, provider_id, rating, comment, response, response_at, helpful_count, verified_purchase, created_at)

**Fix Priority:** 🔴 **CRITICAL** - Review system broken

---

### 3. ❌ **Provider Earnings/Transactions Missing**

**Severity:** HIGH  
**Impact:** Providers cannot view earnings

#### Frontend Calls (from [frontend/app/dashboard/earnings/page.tsx](frontend/app/dashboard/earnings/page.tsx)):

```typescript
// Frontend expects provider earnings dashboard
GET /payments/provider/:userId/earnings      // ❌ NO BACKEND
GET /payments/provider/:userId/transactions  // ❌ NO BACKEND  
GET /payments/provider/:userId/payouts       // ❌ NO BACKEND
```

#### What Exists:
- ✅ Database: Can query `payments` table filtered by `provider_id`
- ❌ Backend Endpoints: **NONE**

#### What's Missing:
```typescript
// NEED TO CREATE in payment.controller.ts
GET /payments/provider/:providerId/summary
  // Returns: { totalEarnings, pendingPayouts, completedPayouts, platformFees }
GET /payments/provider/:providerId/transactions
  // Returns paginated list of all provider transactions
GET /payments/provider/:providerId/withdraw
  // Initiate payout to provider
```

**Fix Priority:** 🔴 **HIGH** - Provider dashboard incomplete

---

### 4. ⚠️ **Notification Service Not Integrated**

**Severity:** MEDIUM  
**Impact:** Notifications working but preferences not exposed

#### Backend Exists:
- ✅ Database Table: `notifications`, `notification_deliveries`, `notification_preferences`
- ✅ Backend Entities: All exist
- ✅ Backend Controller: `notification-preferences.controller.ts`
- ⚠️ **FEATURE FLAGGED:** Requires `NOTIFICATION_PREFERENCES_ENABLED=true`

#### Frontend Status:
- ✅ `notification-service.ts` exists
- ❌ **Missing:** Preference management UI

#### What's Missing in Frontend:
```typescript
// NEED TO ADD to notification-service.ts
getNotificationPreferences()
updateNotificationPreferences(preferences)
enableAllNotifications()
disableAllNotifications()
```

**Frontend Page Missing:** `/dashboard/settings/notifications/page.tsx` exists but may not use preferences API

**Fix Priority:** ⚠️ **MEDIUM** - Feature exists but not fully integrated

---

### 5. ❌ **Messaging System Not Integrated in Frontend**

**Severity:** HIGH  
**Impact:** In-job messaging UI missing

#### Backend Exists:
- ✅ Database Tables: `messages`, `attachments`
- ✅ Backend Entities: Complete
- ✅ Backend Controller: `messaging.controller.ts` with full CRUD

#### Frontend Status:
- ❌ **MISSING:** `message-service.ts` exists but possibly incomplete
- ⚠️ Frontend calls: `getMessagesByJob()`, `sendMessage()` defined
- ❌ **Page:** `/dashboard/messages/page.tsx` exists but integration unclear

#### Endpoints Available (Not Used):
```typescript
POST   /messages                           // Create message ✅
GET    /messages/jobs/:jobId/messages      // Get conversation ✅
GET    /messages/conversations             // Get all conversations ✅
POST   /messages/attachments               // Upload attachment ✅
GET    /messages/attachments/message/:id   // Get attachments ✅
```

**Fix Priority:** 🔴 **HIGH** - Feature built but not integrated

---

### 6. ❌ **Analytics Not Integrated**

**Severity:** LOW  
**Impact:** No user activity tracking

#### Backend Exists:
- ✅ Database Tables: `user_activity_logs`, `daily_metrics`
- ✅ Backend Entities: Complete
- ✅ Backend Controller: `analytics.controller.ts`

#### Frontend Status:
- ❌ **COMPLETELY MISSING** from frontend

#### Available Endpoints (Unused):
```typescript
POST /analytics/activity              // Track event
GET  /analytics/user-activity         // Get all activity
GET  /analytics/user-activity/:userId // Get user activity
```

**Fix Priority:** ⚠️ **LOW** - Optional feature for future

---

### 7. ⚠️ **Subscription Backend Complete but Frontend Unclear**

**Severity:** MEDIUM  
**Impact:** Subscription flow may have gaps

#### Backend Exists:
- ✅ Database Tables: `subscriptions`, `pricing_plans`, `saved_payment_methods`
- ✅ Backend Entities: Complete
- ✅ Backend Controllers:
  - `subscription.controller.ts` - Full CRUD
  - `pricing-plan.controller.ts` - Full CRUD
  - `saved-payment-method.controller.ts` - Full CRUD

#### Frontend Status:
- ✅ `payment-service.ts` has subscription methods
- ⚠️ Frontend pages exist but integration unclear:
  - `/dashboard/settings/subscription/page.tsx` ✅
  - `/dashboard/settings/payment-methods/page.tsx` ✅
  - `/pricing/page.tsx` ✅

#### Verification Needed:
- [ ] Test subscription creation flow
- [ ] Test payment method CRUD
- [ ] Test subscription upgrade/cancel
- [ ] Test pricing plan display

**Fix Priority:** ⚠️ **MEDIUM** - Verify integration

---

### 8. ⚠️ **Favorites Feature Incomplete**

**Severity:** LOW  
**Impact:** Save favorites exists in backend but not frontend

#### Backend Exists:
- ✅ Database Table: `favorites` (user_id, provider_id)
- ✅ Backend Entity: `favorite.entity.ts`
- ✅ Backend Controller: `favorite.controller.ts`

#### Frontend Status:
- ✅ `favorite-service.ts` **EXISTS**
- ❌ **BUT:** No UI to add/remove favorites in provider pages

#### Available Endpoints:
```typescript
POST   /favorites            // Save favorite ✅
GET    /favorites            // Get user favorites ✅
DELETE /favorites/:providerId // Remove favorite ✅
```

**Frontend Fix Needed:**
- Add "Save Provider" button to `/providers/[id]/page.tsx`
- Add favorites list to `/dashboard/favorites/page.tsx` (if created)

**Fix Priority:** ⚠️ **LOW** - Nice-to-have feature

---

## ⚠️ WARNING ISSUES

Non-blocking but important misalignments.

### 9. ⚠️ **Contact Form Backend vs Frontend Mismatch**

**Severity:** LOW  
**Impact:** Contact form works but through wrong service

#### Current State:
- ✅ Database Table: `contact_messages`
- ✅ Backend: `admin-service` handles via `POST /admin/contact`
- ⚠️ Frontend: `/contact/page.tsx` exists but may call different endpoint

#### Issue:
Contact form should be public but routed through **admin-service** which feels architecturally odd.

**Recommendation:** Move contact endpoint to a public route or dedicated service.

---

### 10. ⚠️ **Phone Login Inconsistency**

**Severity:** MEDIUM  
**Impact:** OTP login exists in backend but NextAuth used in frontend

#### Backend Supports:
```typescript
POST /auth/phone/login           // Phone + password ✅
POST /auth/phone/otp/request     // Request OTP ✅
POST /auth/phone/otp/verify      // Verify OTP + login ✅
POST /auth/check-identifier      // Check if identifier exists + OTP availability ✅
```

#### Frontend Status:
- ✅ `/login/page.tsx` has phone/OTP UI
- ✅ Calls `check-identifier` endpoint
- ⚠️ BUT primary auth through NextAuth credentials provider

**Clarification Needed:** Is phone OTP fully integrated or just UI scaffold?

---

### 11. ❌ **Refunds Table Without Exposure**

**Severity:** MEDIUM  
**Impact:** Refunds tracked in DB but no API

#### Database:
- ✅ Table: `refunds` (id, payment_id, amount, status, reason, created_at)

#### Backend:
- ✅ Entity: `refund.entity.ts`
- ❌ Controller: **NO ENDPOINTS**

#### Frontend:
- ⚠️ Calls `POST /payments/:id/refund` which doesn't exist

**Missing Endpoints:**
```typescript
POST /payments/:paymentId/refund  // Request refund
GET  /refunds                     // List refunds (admin)
GET  /refunds/:id                 // Get refund status
PATCH /refunds/:id                // Update refund status (admin)
```

**Fix Priority:** ⚠️ **MEDIUM** - Refund system incomplete

---

### 12. ⚠️ **Coupons Table Without Exposure**

**Severity:** LOW  
**Impact:** Coupon system exists in DB only

#### Database:
- ✅ Tables: `coupons`, `coupon_usage`

#### Backend:
- ❌ **NO ENTITIES, CONTROLLERS, OR ENDPOINTS**

#### Frontend:
- ⚠️ `createPayment()` accepts `coupon_code` param
- ❌ No coupon management UI

**Missing Implementation:**
- [ ] Create entities for coupons
- [ ] Create coupon controller
- [ ] Add admin coupon management UI
- [ ] Add user coupon application in checkout

**Fix Priority:** ⚠️ **LOW** - Future feature

---

## ✅ WELL-ALIGNED FEATURES

These work correctly across all layers:

### Core Features
- ✅ **Authentication** - Signup, login, password reset, OAuth (Google/Facebook), phone login
- ✅ **User Management** - Profile CRUD
- ✅ **Provider Management** - Profile, services, availability CRUD
- ✅ **Service Requests** - Full CRUD with pagination, filtering
- ✅ **Service Categories** - Public browsing
- ✅ **Proposals** - Create, list, accept, reject
- ✅ **Jobs** - Status tracking, completion
- ✅ **Provider Portfolio** - Upload, manage, reorder images
- ✅ **Provider Documents** - Upload, verification by admin
- ✅ **Subscriptions** - Create, activate, cancel, upgrade
- ✅ **Pricing Plans** - Public access, admin management
- ✅ **Payment Methods** - Save, manage, set default, delete
- ✅ **Admin Panel** - User moderation, disputes, audit logs, system settings

### Infrastructure
- ✅ **Rate Limiting** - Check/reset limits
- ✅ **Feature Flags** - CRUD operations
- ✅ **Background Jobs** - Job queue management
- ✅ **Events** - Event logging

---

## 🛠️ RECOMMENDED FIXES

### Priority 1: CRITICAL (Complete Within 1 Week)

1. **Create Payment Controller** ([services/payment-service/src/payment/controllers/payment.controller.ts](services/payment-service/src/payment/controllers/payment.controller.ts))
   ```typescript
   POST   /payments              // Create payment
   GET    /payments/:id          // Get payment
   GET    /payments/my           // User payments
   POST   /payments/:id/refund   // Refund request
   GET    /payments/:id/status   // Payment status
   GET    /jobs/:jobId/payments  // Job payments
   ```

2. **Create Review Controller** ([services/review-service/src/review/controllers/review.controller.ts](services/review-service/src/review/controllers/review.controller.ts))
   ```typescript
   POST   /reviews               // Submit review
   GET    /reviews/:id           // Get review
   GET    /jobs/:jobId/review    // Job review
   POST   /reviews/:id/respond   // Provider response
   POST   /reviews/:id/helpful   // Mark helpful
   ```

3. **Create Provider Earnings Endpoints** in payment.controller.ts
   ```typescript
   GET /payments/provider/:providerId/summary
   GET /payments/provider/:providerId/transactions
   ```

### Priority 2: HIGH (Complete Within 2 Weeks)

4. **Integrate Messaging System**
   - Verify `message-service.ts` frontend integration
   - Test `/dashboard/messages/page.tsx`
   - Ensure real-time updates (consider WebSockets)

5. **Complete Refunds System**
   - Create refund controller
   - Add refund management UI (customer + admin)

6. **Verify Subscription Flow End-to-End**
   - Test all subscription states
   - Verify payment integration
   - Test upgrade/cancel flows

### Priority 3: MEDIUM (Complete Within 1 Month)

7. **Integrate Notification Preferences**
   - Enable feature flag `NOTIFICATION_PREFERENCES_ENABLED=true`
   - Add UI to `/dashboard/settings/notifications/page.tsx`

8. **Complete Favorites Feature**
   - Add save/unsave buttons to provider pages
   - Add favorites list page

9. **Migrate Contact Form to Proper Service**
   - Move from admin-service to dedicated contact-service
   - Or create public endpoint in user-service

### Priority 4: LOW (Future Enhancements)

10. **Implement Coupon System**
    - Backend entities + controller
    - Admin coupon management UI
    - Customer coupon application

11. **Integrate Analytics Tracking**
    - Add activity tracking calls throughout frontend
    - Create analytics dashboards (admin)

12. **Phone Login Integration Clarification**
    - Document OTP login vs NextAuth flow
    - Ensure consistent auth experience

---

## 📋 DATABASE TABLES STATUS

| Table | Backend Entity | Backend API | Frontend Integration | Status |
|-------|----------------|-------------|----------------------|--------|
| `users` | ✅ | ✅ Full | ✅ | ✅ Complete |
| `sessions` | ✅ | ✅ (auth) | ✅ | ✅ Complete |
| `providers` | ✅ | ✅ Full | ✅ | ✅ Complete |
| `provider_services` | ✅ | ✅ | ✅ | ✅ Complete |
| `provider_availability` | ✅ | ✅ | ✅ | ✅ Complete |
| `provider_portfolio` | ✅ | ✅ Full | ✅ | ✅ Complete |
| `provider_documents` | ✅ | ✅ Full | ✅ | ✅ Complete |
| `service_categories` | ✅ | ✅ | ✅ | ✅ Complete |
| `service_requests` | ✅ | ✅ Full | ✅ | ✅ Complete |
| `proposals` | ✅ | ✅ Full | ✅ | ✅ Complete |
| `jobs` | ✅ | ✅ Full | ⚠️ Partial | ⚠️ Verify |
| `payments` | ✅ | ❌ **MISSING** | ✅ Broken | 🔴 CRITICAL |
| `payment_webhooks` | ✅ | ⚠️ Partial | N/A | ⚠️ Internal |
| `refunds` | ✅ | ❌ **MISSING** | ❌ | 🔴 HIGH |
| `reviews` | ✅ | ⚠️ Aggregates Only | ❌ Broken | 🔴 CRITICAL |
| `messages` | ✅ | ✅ Full | ❌ Not Integrated | 🔴 HIGH |
| `attachments` | ✅ | ✅ | ❌ | ⚠️ Medium |
| `notifications` | ✅ | ⚠️ Exists | ⚠️ Partial | ⚠️ Medium |
| `notification_preferences` | ✅ | ✅ Flagged | ❌ | ⚠️ Medium |
| `favorites` | ✅ | ✅ Full | ❌ No UI | ⚠️ Low |
| `subscriptions` | ✅ | ✅ Full | ⚠️ Verify | ⚠️ Medium |
| `pricing_plans` | ✅ | ✅ Full | ✅ | ✅ Complete |
| `saved_payment_methods` | ✅ | ✅ Full | ✅ | ✅ Complete |
| `coupons` | ❌ | ❌ | ⚠️ Partial | 🔴 LOW |
| `coupon_usage` | ❌ | ❌ | ❌ | 🔴 LOW |
| `disputes` | ✅ | ✅ Admin | ⚠️ Admin Only | ✅ Complete |
| `audit_logs` | ✅ | ✅ Admin | ⚠️ Admin Only | ✅ Complete |
| `user_activity_logs` | ✅ | ✅ | ❌ | ⚠️ Low |
| `daily_metrics` | ✅ | ❌ | ❌ | ⚠️ Low |
| `background_jobs` | ✅ | ✅ Full | N/A | ✅ Infrastructure |
| `events` | ✅ | ✅ Full | N/A | ✅ Infrastructure |
| `rate_limits` | ✅ | ✅ Full | N/A | ✅ Infrastructure |
| `feature_flags` | ✅ | ✅ Full | N/A | ✅ Infrastructure |
| `contact_messages` | ✅ | ✅ Admin | ✅ | ⚠️ Misplaced |
| `unsubscribes` | ✅ | ❌ | ⚠️ Page Exists | ⚠️ Medium |
| `locations` | ✅ | ⚠️ Embedded | ✅ | ✅ Complete |
| `social_accounts` | ✅ | ✅ (OAuth) | ✅ | ✅ Complete |
| `user_devices` | ✅ | ⚠️ Internal | N/A | ✅ Complete |
| `login_attempts` | ✅ | ⚠️ Internal | N/A | ✅ Complete |
| `email_verification_tokens` | ✅ | ⚠️ Internal | N/A | ✅ Complete |
| `password_reset_tokens` | ✅ | ⚠️ Internal | N/A | ✅ Complete |

**Legend:**
- ✅ Complete - Fully implemented and integrated
- ⚠️ Partial - Exists but incomplete or flagged
- ❌ Missing - Not implemented
- 🔴 Critical/High/Medium/Low - Priority level

---

## 🎯 ACTION PLAN

### Week 1 (CRITICAL)
- [ ] Create Payment Controller with full CRUD
- [ ] Create Review Controller with full CRUD
- [ ] Add Provider Earnings endpoints
- [ ] Test all payment flows end-to-end
- [ ] Test review submission and provider response

### Week 2 (HIGH)
- [ ] Verify and fix messaging integration
- [ ] Create Refund endpoints
- [ ] Test subscription flows
- [ ] Add refund management UI

### Week 3-4 (MEDIUM)
- [ ] Enable notification preferences feature flag
- [ ] Integrate notification preferences UI
- [ ] Complete favorites UI
- [ ] Migrate contact form architecture
- [ ] Document phone login flow

### Future (LOW)
- [ ] Implement coupon system
- [ ] Add analytics tracking
- [ ] Create analytics dashboards

---

**Report Generated By:** AI Developer Agent  
**Last Updated:** March 15, 2026  
**Next Review:** After Priority 1 fixes completed
