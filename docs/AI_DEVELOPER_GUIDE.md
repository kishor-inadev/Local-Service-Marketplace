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

frontend/              # Next.js application

api-gateway/           # NestJS API Gateway (port 3700)

services/
  identity-service/      # Auth + Users + Providers (port 3001)
  marketplace-service/   # Requests + Proposals + Jobs + Reviews (port 3003)
  payment-service/       # Payments + Refunds (port 3006)
  comms-service/         # Notifications + Messaging (port 3007)
  oversight-service/     # Admin + Analytics (port 3010)
  infrastructure-service/ # Events + Feature flags (port 3012)
  email-service/         # SMTP email delivery
  sms-service/           # SMS/OTP delivery

database/
  schema.sql
  migrations/

docker/
  docker-compose.yml

docs/
  ARCHITECTURE.md
  MICROSERVICE_BOUNDARY_MAP.md
  SCALING_STRATEGY.md
  SYSTEM_DIAGRAM.md
  AI_DEVELOPER_GUIDE.md
```

---

# 4. Service Responsibilities

AI agents must generate code only within the responsibility of each service.

Auth Service

Handles:

- signup
- login
- JWT authentication
- password reset
- session management
- social login

Tables

```
users
sessions
email_verification_tokens
password_reset_tokens
login_attempts
social_accounts
user_devices
```

---

User Service

Handles:

- provider profiles
- provider services
- user favorites
- locations

Tables

```
providers
provider_services
provider_availability
favorites
locations
```

---

Request Service

Handles:

- service requests
- request search
- request categories

Tables

```
service_requests
service_categories
service_request_search
```

---

Proposal Service

Handles provider proposals.

Tables

```
proposals
```

---

Job Service

Handles job lifecycle.

Tables

```
jobs
```

---

Payment Service

Handles financial transactions.

Tables

```
payments
refunds
payment_webhooks
coupons
coupon_usage
```

---

Review Service

Handles ratings.

Tables

```
reviews
```

---

Messaging Service

Handles chat messages and file attachments.

Tables

```
messages
attachments
```

---

Notification Service

Handles system notifications.

Tables

```
notifications
notification_deliveries
```

---

Admin Service

Handles moderation and system configuration.

Tables

```
admin_actions
disputes
audit_logs
system_settings
```

---

Analytics Service

Handles usage analytics.

Tables

```
user_activity_logs
daily_metrics
```

---

Infrastructure Service

Handles infrastructure support tables.

Tables

```
events
background_jobs
rate_limits
feature_flags
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

Heavy tasks must run through worker services.

Examples

- email sending
- analytics processing
- notification delivery
- payment retry logic

Workers consume jobs from Redis queues.

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
