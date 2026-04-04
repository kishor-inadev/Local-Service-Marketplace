# Comprehensive Audit Report & Implementation Plan

**Date:** April 4, 2026  
**Scope:** Full application — Database, Backend Services, API Gateway, Frontend, Docker/Infrastructure, Security, Code Quality, Design/UX

---

## EXECUTIVE SUMMARY

| Dimension | Health | Issues Found |
|-----------|--------|-------------|
| Database/Schema | 🟢 96% aligned | 2 entity nullable mismatches, 2 duplicate entities |
| API Gateway → Backend | 🟡 96% routes match | 11 public auth routes declared but controller endpoints missing |
| Frontend → Backend | 🟡 92% aligned | 8 broken endpoints, 5 type mismatches, 3 missing features |
| Security | 🔴 Critical gaps | Hardcoded secrets, weak bcrypt, missing helmet on microservices |
| Docker/Infrastructure | 🔴 Not production-ready | Missing closing brace in gateway, broken Dockerfile CMDs, no resource limits |
| Code Quality | 🟠 Needs work | 100+ `any` types, swallowed errors, ~10% test coverage |
| Frontend Design/UX | 🟢 Strong foundation | 27 UI components, dark mode, good a11y — missing onboarding & search page |

**Total Issues Found: 67**  
- 🔴 Critical: 12  
- 🟠 High: 15  
- 🟡 Medium: 22  
- 🟢 Low: 18  

---

## PART 1: DETAILED FINDINGS

---

### A. DATABASE & ENTITY ALIGNMENT

**50 tables audited, 52 entity files checked**

#### 🔴 Critical Issues

| # | Issue | Table | File | Fix |
|---|-------|-------|------|-----|
| 1 | `message` not nullable in entity but nullable in schema | proposals | `marketplace-service/.../proposal.entity.ts` | Change `message: string` → `message?: string` |
| 2 | `user_id` not nullable in marketplace Location entity | locations | `marketplace-service/.../location.entity.ts` | Change `user_id: string` → `user_id?: string` |

#### ⚠️ Duplicates

| Entity | File 1 | File 2 | Difference |
|--------|--------|--------|-----------|
| User | `identity-service/auth/entities/user.entity.ts` | `identity-service/user/entities/user.entity.ts` | Identical — consolidate |
| Location | `identity-service/user/entities/location.entity.ts` | `marketplace-service/request/entities/location.entity.ts` | `user_id` optional vs required |

---

### B. API GATEWAY → BACKEND ROUTES

#### 🔴 Missing Auth Endpoints

The gateway `services.config.ts` declares these as **public routes**, but the auth controller has **no matching handlers**:

| Route | Method | Status |
|-------|--------|--------|
| `/user/auth/check-identifier` | POST | ❌ No controller handler |
| `/user/auth/verify` | POST | ❌ No controller handler |
| `/user/auth/google` | GET/POST | ❌ No controller handler |
| `/user/auth/google/callback` | GET | ❌ No controller handler |
| `/user/auth/facebook` | GET/POST | ❌ No controller handler |
| `/user/auth/facebook/callback` | GET | ❌ No controller handler |
| `/user/auth/phone/login` | POST | ❌ No controller handler |
| `/user/auth/phone/otp/request` | POST | ❌ No controller handler |
| `/user/auth/phone/otp/verify` | POST | ❌ No controller handler |
| `/user/auth/email/otp/request` | POST | ❌ No controller handler |
| `/user/auth/email/otp/verify` | POST | ❌ No controller handler |

**Impact:** Frontend calls to OAuth, phone login, or OTP endpoints will fail.

**Decision:** Either implement these endpoints in `auth.controller.ts` OR remove them from the gateway's `publicRoutes` array.

#### ✅ All Other Routes Verified (22/23 matched)

All identity-service (6 prefixes), marketplace-service (6), payment-service (5), comms-service (3), oversight-service (2), infrastructure-service (4) routes correctly match their controllers.

---

### C. FRONTEND → BACKEND INTEGRATION

#### 🔴 Broken Features (8 issues)

| # | Feature | Frontend Service | Backend Status | Impact |
|---|---------|-----------------|----------------|--------|
| 1 | Send message | `message-service.ts` POST `/messages` | ❌ No handler in comms-service | Messages non-functional |
| 2 | Get job messages | `message-service.ts` GET `/messages/jobs/{id}` | ❌ No handler | Can't view conversations |
| 3 | Get conversations | `message-service.ts` GET `/messages/conversations` | ❌ No handler | Chat list broken |
| 4 | Mark message read | `message-service.ts` PATCH `/messages/{id}/read` | ❌ No handler | Unread markers broken |
| 5 | Admin job stats | `admin-service.ts` GET `/admin/jobs/stats` | ❌ Not implemented | Admin dashboard incomplete |
| 6 | Provider payouts | `payment-service.ts` GET `/payments/provider/{id}/payouts` | ❌ Returns empty `[]` | No payout tracking |
| 7 | Auth logout | `auth-service.ts` POST `/user/auth/logout` | ⚠️ No session invalidation | Session persists after logout |
| 8 | Notification prefs update | `notification-service.ts` PUT | ⚠️ Backend expects PATCH | 405 Method Not Allowed |

#### ⚠️ Type Mismatches (5 issues)

| # | Field | Frontend Expects | Backend Returns |
|---|-------|-----------------|-----------------|
| 1 | Review stars | `one_star_count` | `rating_1_count` |
| 2 | Notification format | Multiple formats handled defensively | Should standardize |
| 3 | Provider services | Dedicated array endpoint | Embedded in provider response |
| 4 | Payment method default | PUT | Should be PATCH |
| 5 | Pagination on `/requests/my` | Paginated | Returns flat array |

---

### D. SECURITY ASSESSMENT

#### 🔴 Critical (3 issues)

| # | Issue | Location | Risk |
|---|-------|----------|------|
| 1 | **Hardcoded production secrets in Git** | `docker.env` — JWT_SECRET, DB password, encryption key all committed | Full compromise if repo exposed |
| 2 | **Weak bcrypt salt rounds (10)** | `auth.service.ts:35`, `user.service.ts:16` | Industry standard is 12+ |
| 3 | **MongoDB default credentials** | `docker-compose.yml` — `mongoadmin:mongopass123` | Public knowledge creds |

#### 🟠 High (6 issues)

| # | Issue | Location | Risk |
|---|-------|----------|------|
| 4 | Microservices missing helmet | All `main.ts` except gateway | XSS, clickjacking if directly accessed |
| 5 | Unsigned x-user-* headers | Gateway injects, services trust without HMAC | Privilege escalation if gateway compromised |
| 6 | Potential IDOR in review responses | `review.controller.ts` — no provider ownership check | Any user could respond to any review |
| 7 | Missing CSRF verification | Frontend middleware.ts | Cross-site request forgery |
| 8 | Login DTO accepts any-length password | `login.dto.ts` — only `@IsString()` | 10KB password causes bcrypt DoS |
| 9 | No password complexity on register DTO | `register.dto.ts` — only `@MinLength(8)` | Weak passwords accepted |

---

### E. DOCKER & INFRASTRUCTURE

#### 🔴 Critical (5 issues)

| # | Issue | File | Fix |
|---|-------|------|-----|
| 1 | **`bootstrap()` missing closing `}`** | `api-gateway/src/main.ts:75` — function never closed | Add `}` before `bootstrap()` call |
| 2 | Hardcoded secrets in docker.env | `docker.env` | Rotate and externalize |
| 3 | Missing `depends_on` health conditions | `docker-compose.yml` — services start before deps ready | Add `condition: service_healthy` |
| 4 | Missing env vars for email | No `EMAIL_USER`/`EMAIL_PASS` in docker.env | Emails silently fail |
| 5 | Duplicate API gateway docker-compose | `api-gateway/docker-compose.yml` conflicts with root | Delete the service-level compose |

#### 🟠 High (4 issues)

| # | Issue | File | Fix |
|---|-------|------|-----|
| 6 | infrastructure-service uses `npm` instead of `pnpm` | `services/infrastructure-service/Dockerfile` | Change to `pnpm run build` |
| 7 | payment-service wrong CMD path | `services/payment-service/Dockerfile` | `dist/src/main` → `dist/main.js` |
| 8 | 4 services run as root | identity, marketplace, oversight, api-gateway Dockerfiles | Add `USER node` |
| 9 | Node version mismatch | api-gateway & frontend use 18, others use 20 | Standardize to node:20-alpine |

#### 🟡 Medium (4 issues)

| # | Issue | Fix |
|---|-------|-----|
| 10 | No resource limits (CPU/memory) | Add `deploy.resources` to all services |
| 11 | All microservice ports exposed to host | Remove port mappings in production compose |
| 12 | Missing SERVICE_NAME env vars | Add to infrastructure, email, sms services |
| 13 | CORS_ORIGIN/FRONTEND_URL not in docker.env | Add to env file |

---

### F. CODE QUALITY

#### 🔴 Critical (3 issues)

| # | Issue | Count | Impact |
|---|-------|-------|--------|
| 1 | **Swallowed promise rejections** | 15+ `.catch()` blocks that log but don't re-throw | Notifications silently fail, users never get emails |
| 2 | **TypeScript strict mode disabled** | All 6 services have `strictNullChecks: false` | 100+ `any` types pass compilation |
| 3 | **Missing ParseUUIDPipe** | 8+ endpoints accept UUID params without validation | Invalid UUIDs cause 500 instead of 400 |

#### 🟠 High (5 issues)

| # | Issue | Location |
|---|-------|----------|
| 4 | No request ID propagation | Gateway doesn't inject `x-request-id` — can't trace across services |
| 5 | Inline `@Body()` objects without DTOs | `proposal.controller.ts:85`, `auth.controller.ts:218`, `webhook.controller.ts:54` |
| 6 | `console.log` in production code | `infrastructure-service/main.ts:35,45` |
| 7 | ~10% test coverage | comms-service has 0 tests, only 11 spec files total |
| 8 | No sensitive data logging filters | Passwords/tokens could appear in logs |

---

### G. FRONTEND DESIGN & UX

#### ✅ Strengths
- 27 reusable UI components (Button, Card, Modal, DataTable, etc.)
- Full dark mode support with system detection
- 63 pages covering all features
- Error boundaries at 3 levels (global, dashboard, auth)
- 404 and 403 pages exist
- Skeleton loading component available
- React Hook Form + Zod validation
- Comprehensive security headers in next.config.js
- Good accessibility foundation (aria-labels on modals, tabs, file uploads)

#### ⚠️ Gaps

| # | Issue | Impact | Recommendation |
|---|-------|--------|---------------|
| 1 | No onboarding flow after signup | Users land on empty dashboard | Create `/onboarding/` wizard |
| 2 | No unified search results page | Users can't search across requests + providers | Create `/search/page.tsx` |
| 3 | Only 1 `loading.tsx` for all dashboard routes | Same spinner for all pages | Add per-section loading states |
| 4 | Missing metadata/SEO on most pages | Poor search rankings | Add `generateMetadata()` to all pages |
| 5 | No lazy loading / code splitting | Larger initial bundle | Add `next/dynamic` imports |
| 6 | No invoice/receipt generation | Users can't download payment records | Add PDF export |
| 7 | No reviews on provider profile page | Users can't see reviews when browsing | Add review section to provider detail |
| 8 | No Cmd+K command palette | Power users navigating slowly | Add search/command palette |
| 9 | Review stars field name mismatch | Fragile transform layer | Standardize `rating_X_count` naming |
| 10 | Missing `aria-expanded` on dropdowns | Screen readers affected | Add to Dropdown component |

---

## PART 2: IMPLEMENTATION PLAN

### Phase 0: Critical Fixes (Day 1-2) — MUST DO FIRST

> These block everything. Application won't compile or run safely without them.

| # | Task | File(s) | Time |
|---|------|---------|------|
| 0.1 | **Fix `bootstrap()` missing `}`** | `api-gateway/src/main.ts` — add `}` before line 75 | 5 min |
| 0.2 | **Fix proposal entity nullable** | `marketplace-service/.../proposal.entity.ts` — `message?: string` | 5 min |
| 0.3 | **Fix location entity nullable** | `marketplace-service/.../location.entity.ts` — `user_id?: string` | 5 min |
| 0.4 | **Rotate all secrets** | Generate new JWT_SECRET, JWT_REFRESH_SECRET, GATEWAY_INTERNAL_SECRET, ENCRYPTION_KEY, DB password | 30 min |
| 0.5 | **Fix infrastructure-service Dockerfile** | Change `npm run build` → `pnpm run build` | 5 min |
| 0.6 | **Fix payment-service Dockerfile CMD** | Change `dist/src/main` → `dist/main.js` | 5 min |
| 0.7 | **Increase bcrypt salt rounds** | `auth.service.ts:35` and `user.service.ts:16` — change `10` → `12` | 10 min |
| 0.8 | **Fix notification preferences HTTP method** | Frontend `notification-service.ts` — change PUT → PATCH | 15 min |

---

### Phase 1: Security Hardening (Day 3-5)

| # | Task | Files | Priority |
|---|------|-------|----------|
| 1.1 | Add `helmet()` to all microservice `main.ts` files | identity, marketplace, payment, comms, oversight, infrastructure | HIGH |
| 1.2 | Add HMAC signature to gateway user context headers | `api-gateway/.../gateway.service.ts` + all services' guards | HIGH |
| 1.3 | Fix IDOR in review respond endpoint | `marketplace-service/.../review.controller.ts` — add provider ownership check | HIGH |
| 1.4 | Add `@MinLength(8)` and `@MaxLength(64)` to login DTO password | `identity-service/.../login.dto.ts` | HIGH |
| 1.5 | Add password complexity regex to register DTO | `identity-service/.../register.dto.ts` — match signup DTO pattern | MEDIUM |
| 1.6 | Add `USER node` to Dockerfiles missing it | identity, marketplace, oversight, infrastructure, api-gateway | MEDIUM |
| 1.7 | Remove MongoDB default credentials | Use env vars in docker-compose.yml | MEDIUM |
| 1.8 | Add `depends_on` health conditions | All service blocks in docker-compose.yml | MEDIUM |

---

### Phase 2: Missing Backend Endpoints (Day 6-10)

| # | Task | Service | Endpoints |
|---|------|---------|-----------|
| 2.1 | **Implement messaging controller** | comms-service | POST `/messages`, GET `/messages/jobs/:id`, GET `/messages/conversations`, PATCH `/messages/:id/read` |
| 2.2 | **Implement admin job stats** | oversight-service | GET `/admin/jobs/stats` (calls marketplace-service internally) |
| 2.3 | **Implement auth logout session invalidation** | identity-service | POST `/auth/logout` — delete session from DB |
| 2.4 | **Resolve gateway public routes** | identity-service OR api-gateway | Either implement OAuth/OTP endpoints OR remove from publicRoutes |
| 2.5 | **Add ParseUUIDPipe to all UUID params** | comms-service (notification.controller), marketplace-service (review.controller), oversight-service (analytics.controller) | Add pipe decorators |
| 2.6 | **Create proper DTOs for inline @Body objects** | proposal.controller.ts, auth.controller.ts, analytics.controller.ts, webhook.controller.ts | Create DTO files with validators |

---

### Phase 3: Code Quality & Reliability (Day 11-15)

| # | Task | Scope | Details |
|---|------|-------|---------|
| 3.1 | **Fix swallowed promise rejections** | All services | 15+ `.catch()` blocks — add retry queue or re-throw with proper error type |
| 3.2 | **Add request ID propagation** | api-gateway + all services | Gateway: generate `x-request-id`, Services: extract and include in all logs |
| 3.3 | **Replace `console.log` with logger** | infrastructure-service `main.ts` | Use Winston logger |
| 3.4 | **Consolidate duplicate entities** | identity-service | Remove duplicate `user.entity.ts`, export from single location |
| 3.5 | **Standardize Node.js version** | api-gateway, frontend Dockerfiles | Update from node:18 → node:20-alpine |
| 3.6 | **Add missing env vars to docker.env** | docker.env | Add `EMAIL_USER`, `EMAIL_PASS`, `CORS_ORIGIN`, `FRONTEND_URL`, `SERVICE_NAME` vars |
| 3.7 | **Add resource limits to Docker services** | docker-compose.yml | Add `deploy.resources.limits` (CPU, memory) |

---

### Phase 4: Frontend Improvements (Day 16-22)

| # | Task | Files | Details |
|---|------|-------|---------|
| 4.1 | **Fix review stars field naming** | Frontend types + provider detail page | Standardize to match backend `rating_X_count` |
| 4.2 | **Add per-route loading.tsx** | Dashboard subdirectories | Add `loading.tsx` to requests/, payments/, messages/, etc. |
| 4.3 | **Standardize pagination response** | All "my" endpoints (requests, jobs, proposals) | Ensure consistent `{ data, pagination }` format |
| 4.4 | **Add reviews section to provider profile** | `app/providers/[id]/page.tsx` | Fetch and display provider reviews |
| 4.5 | **Add `generateMetadata()` to all pages** | All 63 `page.tsx` files | SEO titles, descriptions |
| 4.6 | **Add skeleton loaders to list pages** | DataTable, card grids | Replace spinner with Skeleton component |
| 4.7 | **Add `aria-expanded` to Dropdown** | `components/ui/Dropdown.tsx` | Accessibility fix |
| 4.8 | **Create onboarding flow** | `app/onboarding/page.tsx` | Role selection → profile setup → first action |

---

### Phase 5: Testing & Observability (Day 23-30)

| # | Task | Scope | Target |
|---|------|-------|--------|
| 5.1 | **Add unit tests to comms-service** | Controllers + services | ~70% coverage |
| 5.2 | **Add e2e tests for critical flows** | Auth, create request, submit proposal, create job, process payment | 5 happy paths |
| 5.3 | **Enable TypeScript strict mode incrementally** | Start with infrastructure-service (smallest) | Fix `any` types, `strictNullChecks: true` |
| 5.4 | **Add sensitive data logging filters** | Winston config in all services | Filter passwords, tokens, API keys from logs |
| 5.5 | **Set up centralized logging** | Docker + ELK/Datadog | Aggregate all service logs with request IDs |
| 5.6 | **Add API contract tests** | Postman/Newman collection | Validate response shapes match frontend expectations |

---

### Phase 6: Production Readiness (Day 31-40)

| # | Task | Scope |
|---|------|-------|
| 6.1 | Create `docker-compose.prod.yml` | Production-only settings (no port exposure, resource limits, secrets via Vault) |
| 6.2 | Remove all microservice port mappings from prod | Keep only gateway (3700) and frontend (3000) exposed |
| 6.3 | Add database migration system | Schema versioning with up/down migrations |
| 6.4 | Implement invoice/receipt PDF generation | Payment service + frontend download |
| 6.5 | Create unified search page | `app/search/page.tsx` — search requests, providers, categories |
| 6.6 | Add lazy loading / code splitting | `next/dynamic` for dashboard routes |
| 6.7 | Performance budgets & Core Web Vitals monitoring | Vercel Analytics or custom |
| 6.8 | Security penetration testing | OWASP ZAP scan against staging |

---

## PRIORITY MATRIX

```
                    HIGH IMPACT
                        │
     Phase 0 ──────────►│◄──────────── Phase 1
   (Critical Fixes)     │            (Security)
                        │
  ──────────────────────┼──────────────────────
                        │
     Phase 2 ──────────►│◄──────────── Phase 3
  (Missing Endpoints)   │          (Code Quality)
                        │
                    LOW IMPACT
   ──────────────────────────────────────────
   QUICK TO DO                    TAKES TIME
```

---

## RISK REGISTER

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Secrets already compromised | Medium | Critical | Rotate immediately, audit access logs |
| Message feature used before implementation | High | High | Add feature flag to disable messaging UI |
| Bootstrap fix breaks gateway | Low | Critical | Test locally before deploying |
| Bcrypt round increase slows auth | Low | Low | Only adds ~20ms per hash |
| Strict TS mode causes cascade of errors | High | Medium | Enable incrementally, one service at a time |

---

## DEFINITION OF DONE

Each phase is complete when:
- [ ] All changes pass `pnpm lint` and `pnpm build` in affected services
- [ ] No new TypeScript errors introduced
- [ ] Docker containers start successfully with `docker-compose up -d`
- [ ] Postman/Newman tests pass: `pnpm test:api`
- [ ] Changes committed with conventional commit messages
- [ ] No hardcoded secrets in committed code

---

*Generated from comprehensive audit of 50 database tables, 52 entity files, 23 gateway routes, 150+ controller endpoints, 14 frontend services, 63 pages, 27 UI components, 10 Docker services, and 6 microservice codebases.*
