# Microservice Boundary Map

This document defines **which service owns which database tables**.

Rules:

1. Each service **owns its tables**
2. Other services **must access data via API or events**
3. Direct cross-table access between services is prohibited
4. No cross-service database joins

---

# 1. identity-service (port 3001)

Auth, user profiles, and provider management.

Tables owned:

- users
- sessions
- email_verification_tokens
- password_reset_tokens
- login_attempts
- social_accounts
- user_devices
- providers
- provider_services
- provider_availability
- favorites
- locations

Responsibilities:

- Signup, login, social login (Google, Facebook)
- JWT token issuance and refresh
- Password reset, email verification
- Session and device tracking
- Provider profiles, services, availability
- User favorites, geographic data

---

# 2. marketplace-service (port 3003)

Service requests, proposals, jobs, and reviews.

Tables owned:

- service_requests
- service_categories
- service_request_search
- proposals
- jobs
- reviews

Responsibilities:

- Create and browse service requests
- Provider proposals and bidding
- Job lifecycle (creation → tracking → completion)
- Reviews and ratings

---

# 3. payment-service (port 3006)

Financial transactions.

Tables owned:

- payments
- refunds
- payment_webhooks
- coupons
- coupon_usage

Responsibilities:

- Payment processing (Stripe, Razorpay, PayPal, mock)
- Refunds and escrow
- Payment gateway webhooks
- Discount codes

---

# 4. comms-service (port 3007)

Notifications and messaging.

Tables owned:

- notifications
- notification_deliveries
- messages
- attachments

Responsibilities:

- Email delivery (via email-service)
- SMS/OTP delivery (via sms-service)
- In-app notifications
- Chat messages and attachments

---

# 5. oversight-service (port 3010)

Administration and analytics.

Tables owned:

- admin_actions
- disputes
- audit_logs
- system_settings
- user_activity_logs
- daily_metrics

Responsibilities:

- Admin moderation and dispute resolution
- Audit logging
- System configuration
- Platform analytics and metrics

---

# 6. infrastructure-service (port 3012)

Platform infrastructure (optional, Docker profile: `infrastructure`).

Tables owned:

- events
- background_jobs
- rate_limits
- feature_flags

Responsibilities:

- Event store
- Background job processing
- Rate limiting
- Feature flag management

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
