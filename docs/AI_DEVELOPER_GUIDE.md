# AI Developer Guide

This document explains how AI coding agents should interact with the codebase of the **Local Service Marketplace** project.

It ensures that generated code follows the platform architecture and does not violate service boundaries.

---

# 1. Project Overview

This repository contains a **microservices-based marketplace platform**.

Users can:

- create service requests
- receive proposals
- hire providers
- track job progress
- make payments
- leave reviews

Providers can:

- create profiles
- submit proposals
- complete jobs

Admins can:

- moderate users
- manage disputes
- analyze activity

---

# 2. Architecture Principles

AI agents must follow these rules:

1. Services are **independent microservices**
2. Each service **owns its database tables**
3. Services communicate via **API calls or events**
4. Database schema is **production-grade and stable**
5. Infrastructure layers may change but **service code must not**

---

# 3. Repository Structure

```
Local-Service-Marketplace/

frontend/                    # Next.js application (port 3000)

api-gateway/                 # NestJS API Gateway (port 3700)

services/
  identity-service/          # Auth + Users + Providers + Portfolio (port 3001)
  marketplace-service/       # Requests + Proposals + Jobs + Reviews (port 3003)
  payment-service/           # Payments + Refunds + Subscriptions (port 3006)
  comms-service/             # Notifications + Messaging (port 3007)
  oversight-service/         # Admin + Analytics + Disputes (port 3010)
  infrastructure-service/    # Events + Feature flags + Background jobs (port 3012)
  email-service/             # SMTP delivery (internal, port 4000)
  sms-service/               # SMS/OTP delivery (internal, port 5000)

database/
  schema.sql                 # Authoritative full schema (45+ tables)
  migrations/                # Incremental SQL migrations (001– prefix)
  seed.js                    # Test data seeder (320+ users, 1000+ records)

docker-compose.yml           # Core docker setup
docker.env                   # Docker environment variables
config/                      # Shared config (queue-config.ts)
docs/                        # Documentation
scripts/                     # PowerShell utility scripts
```

---

# 4. Service Responsibilities

AI agents must generate code only within the responsibility of each service.

**identity-service** (port 3001)

Handles:
- signup, login, JWT authentication, token refresh, token revocation (Redis blacklist)
- password reset, email verification, OAuth (Google), phone login
- user profiles, provider profiles, provider availability
- provider portfolio (images), provider documents (verification)
- favorites, locations

Tables owned:
```
users, sessions, email_verification_tokens, password_reset_tokens
login_attempts, social_accounts, user_devices, login_history
two_factor_secrets, magic_link_tokens, account_deletion_requests
providers, provider_services, provider_availability
provider_portfolio, provider_documents
favorites, locations, notification_preferences
```

---

**marketplace-service** (port 3003)

Handles:
- service requests (post, browse, search)
- proposals (submit, accept, reject, withdraw)
- jobs (lifecycle: pending → in_progress → completed)
- reviews and ratings (with aggregate computation)
- service categories (CRUD, soft delete via active flag)

Tables owned:
```
service_requests, service_categories
proposals, jobs
reviews, provider_review_aggregates
```

---

**payment-service** (port 3006)

Handles:
- payment processing (Stripe/Razorpay)
- refunds, coupons, coupon usage
- pricing plans and subscriptions
- saved payment methods
- payment webhooks

Tables owned:
```
payments, refunds, payment_webhooks
coupons, coupon_usage
pricing_plans, saved_payment_methods, subscriptions
```

---

**comms-service** (port 3007)

Handles:
- in-app notifications and delivery tracking
- job-scoped chat messages (with edit/delete support)
- message attachments
- delegates email to email-service, SMS to sms-service

Tables owned:
```
notifications, notification_deliveries
messages, attachments
unsubscribes
```

---

**oversight-service** (port 3010)

Handles:
- admin actions and audit logs
- dispute management
- system settings
- analytics (user activity, daily metrics)

Tables owned:
```
admin_actions, disputes, audit_logs
system_settings, user_activity_logs, daily_metrics
```

---

**infrastructure-service** (port 3012)

Handles:
- event store (all domain events)
- background job tracking
- rate limits per user/IP
- feature flags

Tables owned:
```
events, background_jobs, rate_limits, feature_flags
```

---

# 5. API Design Rules

All APIs must follow REST conventions.

Example

```
POST /requests
GET /requests
GET /requests/{id}
PATCH /requests/{id}
```

Rules

- Use JSON responses
- Validate request payloads
- Return proper HTTP status codes
- Implement pagination

Example pagination

```
GET /requests?limit=20&cursor=xyz
```

---

# 6. Database Rules

AI agents must follow these rules when generating database code.

Primary keys must use UUID.

Never create cross-service joins.

Example bad query

```
SELECT *
FROM service_requests
JOIN payments ON ...
```

Instead call the Payment Service API.

---

# 7. Background Jobs

All background jobs use **BullMQ** (`@nestjs/bullmq` package). The shared queue configuration lives in `config/queue-config.ts`.

Each service has a `workers/` module with processors for:
- Sending emails and SMS notifications
- Payment retries
- Analytics aggregation
- Token/session cleanup
- Rating recalculation

Workers consume jobs from Redis queues. Redis must be running (start with `--profile cache`).

---

# 8. Event Driven Architecture

When Kafka is enabled, services communicate via events.

Example events

```
request_created
proposal_submitted
job_started
payment_completed
review_submitted
```

Events must be stored in the `events` table.

---

# 9. Logging

All services must implement structured logging.

Example fields

```
timestamp
service_name
request_id
user_id
action
```

Logs should include:

- request lifecycle
- errors
- security events

---

# 10. Security Rules

AI agents must ensure:

Passwords are hashed with bcrypt.

JWT tokens must be validated.

Sensitive actions must be logged.

Login attempts must be tracked.

Rate limits must be enforced.

---

# 11. Performance Rules

To support high concurrency:

Always paginate queries.

Limit responses to 20–50 rows.

Cache frequently accessed data.

Avoid heavy joins.

Move heavy tasks to workers.

---

# 12. Scaling Awareness

AI agents must generate code that works across all scaling stages.

Infrastructure stages

Level 1 – MVP
Level 2 – Cache layer
Level 3 – Worker layer
Level 4 – Event-driven architecture
Level 5 – Distributed system

Code must not depend on specific infrastructure.

Example

```
if (CACHE_ENABLED) {
  useRedisCache()
}
```

---

# 13. Code Style

Preferred patterns

Layered architecture

```
controllers/
services/
repositories/
models/
routes/
```

Rules

- controllers handle HTTP
- services contain business logic
- repositories handle database queries

---

# 14. Testing

AI agents should generate:

- unit tests for services
- integration tests for APIs
- database migration tests

---

# 15. AI Coding Behavior

AI agents should:

- follow service boundaries
- avoid modifying unrelated services
- reuse existing patterns
- keep APIs consistent
- avoid schema changes unless required

---

End of AI Developer Guide
