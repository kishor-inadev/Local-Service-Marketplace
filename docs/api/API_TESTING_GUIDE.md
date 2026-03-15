# API Testing Guide - New Endpoints

Quick reference for testing the newly created Payment and Review endpoints.

---

## Payment Service Endpoints

**Base URL:** `http://localhost:3004`  
**Service:** payment-service  
**Port:** 3004

### 1. Create Payment
```bash
POST /payments
Authorization: Bearer <JWT_TOKEN>

{
  "jobId": "uuid",
  "amount": 150.00,
  "paymentMethodId": "stripe_pm_xxx"
}

Response: { success: true, data: { id, jobId, amount, status, ... }}
```

### 2. Get Payment Details
```bash
GET /payments/:paymentId
Authorization: Bearer <JWT_TOKEN>

Response: { success: true, data: { id, jobId, amount, status, ... }}
```

### 3. Get My Payments
```bash
GET /payments/my?limit=20&offset=0
Authorization: Bearer <JWT_TOKEN>

Response: { success: true, data: [...payments], pagination: {...} }
```

### 4. Get Job Payments
```bash
GET /payments/jobs/:jobId/payments
Authorization: Bearer <JWT_TOKEN>

Response: { success: true, data: [...payments] }
```

### 5. Get Payment Status
```bash
GET /payments/:paymentId/status
Authorization: Bearer <JWT_TOKEN>

Response: { 
  success: true, 
  data: { 
    paymentId, 
    status: "pending|completed|failed|refunded",
    lastUpdated 
  }
}
```

### 6. Request Refund
```bash
POST /payments/:paymentId/refund
Authorization: Bearer <JWT_TOKEN>

{
  "reason": "Service not completed",
  "amount": 50.00  // Optional - defaults to full amount
}

Response: { success: true, data: { refundId, amount, status, ... }}
```

### 7. Provider Earnings Summary
```bash
GET /payments/provider/:providerId/summary
Authorization: Bearer <JWT_TOKEN>

Response: { 
  success: true, 
  data: {
    totalEarnings,
    pendingAmount,
    completedPayments,
    refundedAmount
  }
}
```

### 8. Provider Transactions
```bash
GET /payments/provider/:providerId/transactions?limit=20&offset=0
Authorization: Bearer <JWT_TOKEN>

Response: { success: true, data: [...transactions], pagination: {...} }
```

---

## Review Service Endpoints

**Base URL:** `http://localhost:3005`  
**Service:** review-service  
**Port:** 3005

### 1. Create Review (Existing)
```bash
POST /reviews
Authorization: Bearer <JWT_TOKEN>

{
  "jobId": "uuid",
  "providerId": "uuid",
  "rating": 5,
  "comment": "Excellent service!"
}

Response: { success: true, data: { id, jobId, providerId, rating, ... }}
```

### 2. Get Job Review (NEW)
```bash
GET /reviews/jobs/:jobId/review
Authorization: Bearer <JWT_TOKEN>

Response: { 
  success: true, 
  data: { 
    id, 
    jobId, 
    rating, 
    comment, 
    response,      // Provider response  
    helpfulCount,
    createdAt 
  }
}

# If no review exists:
Response: { success: true, data: null }
```

### 3. Provider Responds to Review (NEW)
```bash
POST /reviews/:reviewId/respond
Authorization: Bearer <JWT_TOKEN>

{
  "response": "Thank you for your feedback! We're glad you were satisfied."
}

Response: { 
  success: true, 
  data: { 
    id, 
    response,
    responseAt 
  },
  message: "Response added successfully"
}
```

### 4. Mark Review as Helpful (NEW)
```bash
POST /reviews/:reviewId/helpful
Authorization: Bearer <JWT_TOKEN>

Response: { 
  success: true, 
  data: { 
    id, 
    helpfulCount 
  },
  message: "Helpful count incremented"
}
```

### 5. Get Provider Reviews (Existing)
```bash
GET /reviews/provider/:providerId?limit=20&offset=0
Authorization: Bearer <JWT_TOKEN>

Response: { success: true, data: [...reviews], pagination: {...} }
```

### 6. Get Provider Rating (Existing)
```bash
GET /reviews/provider/:providerId/rating

Response: { 
  success: true, 
  data: { 
    averageRating: 4.5,
    totalReviews: 127 
  }
}
```

---

## Testing Workflow

### Payment Flow Testing
```bash
# 1. User creates a payment
POST /payments
{
  "jobId": "job-123",
  "amount": 200.00,
  "paymentMethodId": "pm_xxx"
}

# 2. Check payment status
GET /payments/:paymentId/status

# 3. View all user payments
GET /payments/my

# 4. Request refund if needed
POST /payments/:paymentId/refund
{
  "reason": "Changed my mind",
  "amount": 100.00
}

# 5. Provider checks earnings
GET /payments/provider/:providerId/summary
GET /payments/provider/:providerId/transactions
```

### Review Flow Testing
```bash
# 1. Customer submits review after job completion
POST /reviews
{
  "jobId": "job-123",
  "providerId": "provider-456",
  "rating": 5,
  "comment": "Great work!"
}

# 2. Check if job has a review
GET /reviews/jobs/job-123/review

# 3. Provider responds
POST /reviews/:reviewId/respond
{
  "response": "Thank you for choosing us!"
}

# 4. Other users mark review as helpful
POST /reviews/:reviewId/helpful

# 5. View all provider reviews
GET /reviews/provider/provider-456
```

---

## Authentication

All endpoints require JWT authentication except:
- `GET /reviews/provider/:providerId/rating` (public)

### Getting a JWT Token

```bash
POST http://localhost:3001/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

Response: { 
  success: true, 
  data: { 
    token: "eyJhbGciOiJIUzI1NiIs...",
    user: {...}
  }
}
```

Use the token in subsequent requests:
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  http://localhost:3004/payments/my
```

---

## Error Responses

All endpoints follow standardized error format:

```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```

Common status codes:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Using Postman Collection

Import this environment:
```json
{
  "name": "Local Service Marketplace",
  "values": [
    { "key": "base_url_auth", "value": "http://localhost:3001" },
    { "key": "base_url_payment", "value": "http://localhost:3004" },
    { "key": "base_url_review", "value": "http://localhost:3005" },
    { "key": "jwt_token", "value": "" }
  ]
}
```

After login, set `jwt_token` variable to use in all authenticated requests.

---

## Integration Testing

### Test End-to-End Flow

```bash
# 1. Login
TOKEN=$(curl -s -X POST localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"test123"}' \
  | jq -r '.data.token')

# 2. Create payment
PAYMENT_ID=$(curl -s -X POST localhost:3004/payments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jobId":"job-123","amount":150.00,"paymentMethodId":"pm_test"}' \
  | jq -r '.data.id')

# 3. Check status  
curl -H "Authorization: Bearer $TOKEN" \
  localhost:3004/payments/$PAYMENT_ID/status

# 4. Submit review
REVIEW_ID=$(curl -s -X POST localhost:3005/reviews \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jobId":"job-123","providerId":"provider-456","rating":5,"comment":"Great!"}' \
  | jq -r '.data.id')

# 5. Provider responds
curl -X POST localhost:3005/reviews/$REVIEW_ID/respond \
  -H "Authorization: Bearer $PROVIDER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"response":"Thank you!"}'
```

---

## Debugging

### Check Service Health
```bash
# Payment service
curl http://localhost:3004/health

# Review service  
curl http://localhost:3005/health
```

### View Service Logs
```bash
# Docker logs
docker logs payment-service
docker logs review-service

# Or if running locally
npm run start:dev  # Watch for errors in console
```

### Database Queries
```bash
# Check payments table
docker exec -it postgres psql -U postgres -d marketplace \
  -c "SELECT * FROM payments ORDER BY created_at DESC LIMIT 5;"

# Check reviews table  
docker exec -it postgres psql -U postgres -d marketplace \
  -c "SELECT * FROM reviews ORDER BY created_at DESC LIMIT 5;"
```

---

**All endpoints are now live and ready for testing!**
