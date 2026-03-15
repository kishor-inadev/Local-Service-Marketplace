# Microservice Boundary Map

This document defines **which service owns which database tables**.

Rules:

1. Each service **owns its tables**
2. Other services **must access data via API or events**
3. Direct cross-table access between services is discouraged
4. Shared tables should be minimal

---

# 1. Auth Service

Handles identity, authentication, and account security.

Tables owned:

users
sessions
email_verification_tokens
password_reset_tokens
login_attempts
social_accounts
user_devices

Responsibilities:

- signup
- login
- social login
- password reset
- session management
- device tracking
- authentication tokens

---

# 2. User Service

Handles user profile and provider data.

Tables owned:

providers
provider_services
provider_availability
favorites
locations

Responsibilities:

- provider profiles
- service offerings
- availability scheduling
- saved providers
- geographic data

---

# 3. Request Service

Handles service request lifecycle.

Tables owned:

service_requests
service_categories
service_request_search

Responsibilities:

- create service request
- browse requests
- search requests
- categorize services

---

# 4. Proposal Service

Handles provider proposals.

Tables owned:

proposals

Responsibilities:

- provider bids
- proposal status
- negotiation messages

---

# 5. Job Service

Handles job lifecycle after proposal acceptance.

Tables owned:

jobs

Responsibilities:

- job creation
- job tracking
- job completion

---

# 6. Payment Service

Handles financial transactions.

Tables owned:

payments
refunds
payment_webhooks
coupons
coupon_usage

Responsibilities:

- payments
- refunds
- payment gateway integration
- discount codes

---

# 7. Review Service

Handles ratings and feedback.

Tables owned:

reviews

Responsibilities:

- user reviews
- provider ratings
- feedback analysis

---

# 8. Messaging Service

Handles communication between users and providers.

Tables owned:

messages
attachments

Responsibilities:

- chat messages
- conversation history
- file attachments

---

# 9. Notification Service

Handles system notifications.

Tables owned:

notifications
notification_deliveries

Responsibilities:

- in-app notifications
- email notifications
- push notifications
- delivery tracking

---

# 10. Admin Service

Handles moderation and system administration.

Tables owned:

admin_actions
disputes
audit_logs
system_settings

Responsibilities:

- dispute resolution
- administrative actions
- audit logging
- platform configuration

---

# 11. Analytics Service

Handles analytics and metrics.

Tables owned:

daily_metrics
user_activity_logs

Responsibilities:

- usage analytics
- user activity tracking
- platform reporting

---

# 12. Infrastructure Service

Handles platform infrastructure data.

Tables owned:

events
background_jobs
rate_limits
feature_flags

Responsibilities:

- system events
- background task tracking
- API rate limiting
- feature flag rollout

---

# 13. Shared Tables

These tables may be read by multiple services but should still have a **single owning service**.

Example:

events → Infrastructure Service
attachments → Messaging Service
locations → User Service

---

# 14. Data Access Rules

Services must follow these rules:

Direct DB access allowed only for owned tables.

Cross-service access must happen via:

HTTP API calls
Event streaming (Kafka later)
Message queues

Example:

Request Service must NOT read payments table directly.

Instead:

Request Service → Payment Service API

---

# 15. Event Communication (Future)

When scaling to event-driven architecture, services communicate via events.

Examples:

request_created
proposal_submitted
proposal_accepted
job_started
payment_completed
review_submitted

These events will be stored in the events table.

---

# 16. Scaling Strategy

The service boundary map supports scaling stages.

Stage 1 – MVP

Monolithic API services

Stage 2 – Cached architecture

Redis enabled

Stage 3 – Worker layer

Background jobs enabled

Stage 4 – Event-driven architecture

Kafka enabled

Stage 5 – Distributed microservices

Kubernetes orchestration

---

End of Microservice Boundary Map
