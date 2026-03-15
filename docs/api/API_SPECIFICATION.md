# API Specification

This document defines the primary REST APIs for the **Local Service Marketplace** platform.

APIs are grouped by microservice.

All APIs must:

- use JSON request/response bodies
- follow REST conventions
- implement pagination where needed
- return proper HTTP status codes

Base URL (example)

```
/api/v1
```

---

# 1. Auth Service

Handles authentication and identity.

### Signup

POST /auth/signup

Request

```
{
  "email": "user@example.com",
  "password": "password123"
}
```

---

### Login

POST /auth/login

```
{
  "email": "user@example.com",
  "password": "password123"
}
```

---

### Refresh Token

POST /auth/refresh

---

### Logout

POST /auth/logout

---

### Verify Email

POST /auth/verify-email

---

### Request Password Reset

POST /auth/password-reset/request

---

### Reset Password

POST /auth/password-reset/confirm

---

# 2. User Service

### Get Profile

GET /users/me

---

### Update Profile

PATCH /users/me

---

### Create Provider Profile

POST /providers

---

### Update Provider Profile

PATCH /providers/{providerId}

---

### List Provider Services

GET /providers/{providerId}/services

---

### Update Provider Services

PUT /providers/{providerId}/services

---

# 3. Request Service

### Create Service Request

POST /requests

```
{
  "category_id": "uuid",
  "description": "Need plumbing work",
  "budget": 200
}
```

---

### List Requests

GET /requests?limit=20&cursor=xyz

---

### Get Request

GET /requests/{requestId}

---

### Update Request

PATCH /requests/{requestId}

---

### Cancel Request

PATCH /requests/{requestId}/cancel

---

# 4. Proposal Service

### Submit Proposal

POST /proposals

```
{
  "request_id": "uuid",
  "price": 150,
  "message": "I can complete this job."
}
```

---

### List Proposals for Request

GET /requests/{requestId}/proposals

---

### Accept Proposal

POST /proposals/{proposalId}/accept

---

### Reject Proposal

POST /proposals/{proposalId}/reject

---

# 5. Job Service

### Create Job

POST /jobs

---

### Get Job

GET /jobs/{jobId}

---

### Update Job Status

PATCH /jobs/{jobId}/status

---

### Complete Job

POST /jobs/{jobId}/complete

---

# 6. Payment Service

### Create Payment

POST /payments

---

### Payment Webhook

POST /payments/webhook

---

### Get Payment

GET /payments/{paymentId}

---

### Request Refund

POST /payments/{paymentId}/refund

---

# 7. Review Service

### Create Review

POST /reviews

```
{
  "job_id": "uuid",
  "rating": 5,
  "comment": "Excellent service"
}
```

---

### Get Provider Reviews

GET /providers/{providerId}/reviews

---

# 8. Messaging Service

### Send Message

POST /messages

---

### Get Conversation

GET /jobs/{jobId}/messages

---

### Upload Attachment

POST /attachments

---

# 9. Notification Service

### List Notifications

GET /notifications

---

### Mark Notification Read

PATCH /notifications/{notificationId}/read

---

# 10. Admin Service

### List Users

GET /admin/users

---

### Suspend User

PATCH /admin/users/{userId}/suspend

---

### Resolve Dispute

PATCH /admin/disputes/{disputeId}

---

### View Audit Logs

GET /admin/audit-logs

---

# 11. Analytics Service

### Platform Metrics

GET /analytics/metrics

---

### User Activity Logs

GET /analytics/user-activity

---

# Pagination Standard

All list endpoints should support:

```
?limit=20
?cursor=xyz
```

Response example

```
{
  "data": [...],
  "next_cursor": "abc123"
}
```

---

# Error Response Format

All services must return errors in this format:

```
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid input"
  }
}
```

---

# Authentication

All protected routes must include:

```
Authorization: Bearer <JWT_TOKEN>
```

---

# API Versioning

All endpoints must be versioned.

Example

```
/api/v1/requests
```

Future versions

```
/api/v2/requests
```

---

End of API Specification
