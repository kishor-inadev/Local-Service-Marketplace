# Authentication & Validation Workflow

## System Authentication Flow

This document explains **how authentication, validation, and authorization** work throughout the Local Service Marketplace platform.

---

## 1. Complete Authentication Flow

### User Signup Flow
```
┌────────────────────────────────────────────────────────────────┐
│                     USER CLICKS "SIGN UP"                      │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│                     FRONTEND VALIDATION                        │
│  • React Hook Form + Zod Schema                               │
│  • Email format check                                          │
│  • Password strength (8+ chars, uppercase, lowercase, number) │
│  • Phone format (E.164: +[country][number])                   │
│  • Role selection (customer/provider)                         │
│  • Show real-time validation errors                           │
└────────────────────────────────────────────────────────────────┘
                              ↓
                         [VALIDATION OK?]
                              ↓ Yes
┌────────────────────────────────────────────────────────────────┐
│                   SEND TO API GATEWAY                          │
│  POST http://localhost:3700/api/v1/user/auth/signup                │
│  Headers:                                                      │
│    Content-Type: application/json                             │
│  Body:                                                         │
│    {                                                           │
│      "email": "user@example.com",                             │
│      "password": "SecurePass123",                             │
│      "name": "John Doe",                                      │
│      "role": "customer",                                      │
│      "phone": "+1234567890"                                   │
│    }                                                           │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│                        API GATEWAY                             │
│  • Receives request on port 3700                              │
│  • Routes to identity-service:3001/auth/signup                    │
│  • No authentication needed for signup                        │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│                    AUTH SERVICE (NestJS)                       │
│  Step 1: DTO Validation (class-validator)                    │
│    • @IsEmail() - email format                                │
│    • @IsString() @MinLength(8) - password                     │
│    • @IsEnum(['customer', 'provider']) - role                 │
└────────────────────────────────────────────────────────────────┘
                              ↓
                         [DTO VALID?]
                              ↓ Yes
┌────────────────────────────────────────────────────────────────┐
│                    AUTH SERVICE LOGIC                          │
│  Step 2: Check if email exists                                │
│    SELECT * FROM users WHERE email = $1                       │
│                                                                │
│  Step 3: Hash password                                        │
│    bcrypt.hash(password, 10)                                  │
│                                                                │
│  Step 4: Create user record                                   │
│    INSERT INTO users (email, password_hash, role, phone)      │
│    VALUES (...)                                               │
│    RETURNING id, email, role, created_at                      │
│                                                                │
│  Step 5: Generate email verification token                    │
│    token = crypto.randomUUID()                                │
│    INSERT INTO email_verification_tokens                      │
│    (user_id, token, expires_at)                               │
│                                                                │
│  Step 6: Generate JWT access token                            │
│    payload = { sub: user.id, email, role }                    │
│    jwt.sign(payload, SECRET, { expiresIn: '7d' })            │
│                                                                │
│  Step 7: Send verification email (via comms-service)   │
│    POST http://comms-service:3007/notifications        │
│    {                                                           │
│      "user_id": user.id,                                      │
│      "type": "email_verification",                            │
│      "channel": "email",                                      │
│      "data": {                                                │
│        "verification_link": "http://.../verify?token=..."    │
│      }                                                         │
│    }                                                           │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│                 NOTIFICATION SERVICE                           │
│  Step 1: Create notification record                           │
│    INSERT INTO notifications (user_id, type, data)            │
│                                                                │
│  Step 2: Check EMAIL_ENABLED flag                            │
│    if EMAIL_ENABLED:                                          │
│      POST http://email-service:4000/api/email/send            │
│      {                                                         │
│        "to": user.email,                                      │
│        "template": "email_verification",                      │
│        "variables": {                                         │
│          "name": user.name,                                   │
│          "link": verification_link                            │
│        }                                                       │
│      }                                                         │
│                                                                │
│  Step 3: Log delivery                                         │
│    INSERT INTO notification_deliveries                        │
│    (notification_id, delivery_method, status)                 │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│                      EMAIL SERVICE                             │
│  Step 1: Queue email job                                      │
│  Step 2: Render template with variables                       │
│  Step 3: Send via SMTP (Nodemailer)                          │
│  Step 4: Log to MongoDB                                       │
│    collection: email_logs                                     │
│    status: "sent"                                             │
│  Step 5: Return message_id to comms-service            │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│                    RESPONSE TO FRONTEND                        │
│  Status: 201 Created                                          │
│  Body:                                                         │
│  {                                                             │
│    "access_token": "eyJhbGciOiJIUzI1NiIsInR...",             │
│    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR...",            │
│    "user": {                                                  │
│      "id": "uuid",                                            │
│      "email": "user@example.com",                             │
│      "name": "John Doe",                                      │
│      "role": "customer",                                      │
│      "email_verified": false                                  │
│    }                                                           │
│  }                                                             │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│                  FRONTEND TOKEN STORAGE                        │
│  localStorage.setItem('access_token', token)                  │
│  localStorage.setItem('refresh_token', refresh_token)         │
│  authStore.setUser(user)                                       │
│  router.push('/dashboard')                                    │
│  toast.success('Account created! Please verify your email')   │
└────────────────────────────────────────────────────────────────┘
```

---

## 2. Social Login Flow (Google/Facebook)

```
┌────────────────────────────────────────────────────────────────┐
│              USER CLICKS "CONTINUE WITH GOOGLE"                │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│                   REDIRECT TO GOOGLE OAUTH                     │
│  window.location.href =                                        │
│  "http://localhost:3700/api/v1/user/auth/google"                   │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│                   AUTH SERVICE (GOOGLE GUARD)                  │
│  Redirects to:                                                 │
│  https://accounts.google.com/o/oauth2/v2/auth?                │
│    client_id=xxx&                                              │
│    redirect_uri=http://localhost:3700/.../google/callback&    │
│    response_type=code&                                         │
│    scope=email+profile                                         │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│                  USER AUTHENTICATES WITH GOOGLE                │
│  • User logs in to Google                                     │
│  • User grants permissions                                     │
│  • Google redirects back with authorization code              │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│                AUTH SERVICE OAUTH CALLBACK                     │
│  GET /auth/google/callback?code=xxx                           │
│                                                                │
│  Step 1: Exchange code for access token                       │
│    POST https://oauth2.googleapis.com/token                   │
│    { code, client_id, client_secret, redirect_uri }          │
│                                                                │
│  Step 2: Get user info from Google                            │
│    GET https://www.googleapis.com/oauth2/v1/userinfo          │
│    Response: { id, email, name, picture }                     │
│                                                                │
│  Step 3: Check if social_account exists                       │
│    SELECT * FROM social_accounts                              │
│    WHERE provider='google' AND provider_user_id=$1            │
│                                                                │
│  Step 4a: If exists → Get user                                │
│    SELECT * FROM users WHERE id = social_account.user_id      │
│                                                                │
│  Step 4b: If not exists → Create user + social_account        │
│    BEGIN TRANSACTION;                                         │
│    INSERT INTO users (email, role, email_verified)            │
│    VALUES (google_email, 'customer', true)                    │
│    RETURNING id;                                              │
│                                                                │
│    INSERT INTO social_accounts                                │
│    (user_id, provider, provider_user_id, provider_email,      │
│     provider_data)                                            │
│    VALUES (user.id, 'google', google_id, email, {...})        │
│    COMMIT;                                                    │
│                                                                │
│  Step 5: Generate JWT token                                   │
│    jwt.sign({ sub: user.id, email, role })                   │
│                                                                │
│  Step 6: Redirect to frontend with token                      │
│    res.redirect('http://localhost:3000/auth/callback?         │
│                  token=eyJhbGci...')                          │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│              FRONTEND OAUTH CALLBACK PAGE                      │
│  /auth/callback?token=xxx                                     │
│                                                                │
│  const token = searchParams.get('token');                     │
│  localStorage.setItem('access_token', token);                 │
│  const user = await authService.getProfile();                 │
│  authStore.setUser(user);                                      │
│  router.push('/dashboard');                                   │
│  toast.success('Successfully logged in!');                    │
└────────────────────────────────────────────────────────────────┘
```

---

## 3. Login Flow

```
┌────────────────────────────────────────────────────────────────┐
│                   USER SUBMITS LOGIN FORM                      │
│  Frontend validation (Zod):                                   │
│    • Email format                                              │
│    • Password not empty                                        │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│                POST /api/v1/auth/login                         │
│  { "email": "user@example.com", "password": "pass123" }       │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│                    AUTH SERVICE LOGIN                          │
│  Step 1: Find user by email                                   │
│    SELECT * FROM users WHERE email = $1                       │
│                                                                │
│  Step 2: Check if user exists                                 │
│    if (!user) throw UnauthorizedException                     │
│                                                                │
│  Step 3: Verify password                                      │
│    bcrypt.compare(password, user.password_hash)               │
│    if (!match) {                                              │
│      // Track failed attempt                                  │
│      INSERT INTO login_attempts (user_id, ip, success)        │
│      VALUES (user.id, req.ip, false)                          │
│      throw UnauthorizedException                              │
│    }                                                           │
│                                                                │
│  Step 4: Check account status                                 │
│    if (user.status === 'suspended')                           │
│      throw ForbiddenException('Account suspended')            │
│                                                                │
│  Step 5: Track successful login                               │
│    INSERT INTO login_attempts (user_id, ip, success)          │
│    VALUES (user.id, req.ip, true)                             │
│                                                                │
│  Step 6: Create session                                       │
│    INSERT INTO sessions (user_id, ip, user_agent)             │
│    VALUES (user.id, req.ip, req.headers['user-agent'])        │
│    RETURNING session_id                                       │
│                                                                │
│  Step 7: Generate tokens                                      │
│    access_token = jwt.sign(                                   │
│      { sub: user.id, email, role },                           │
│      SECRET, { expiresIn: '7d' }                              │
│    )                                                           │
│    refresh_token = jwt.sign(                                  │
│      { sub: user.id, session_id },                            │
│      REFRESH_SECRET, { expiresIn: '30d' }                     │
│    )                                                           │
│                                                                │
│  Step 8: Check if SMS_ENABLED and user has 2FA enabled        │
│    if (SMS_ENABLED && user.two_factor_enabled) {              │
│      otp = generateOTP(6)                                     │
│      POST http://sms-service:5000/api/sms/otp/send            │
│      {                                                         │
│        "phone": user.phone,                                   │
│        "purpose": "login_2fa"                                 │
│      }                                                         │
│      return { requires_2fa: true, session_id }                │
│    }                                                           │
│                                                                │
│  Step 9: Return tokens                                        │
│    return {                                                   │
│      access_token,                                            │
│      refresh_token,                                           │
│      user: { id, email, name, role, email_verified }          │
│    }                                                           │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│                    FRONTEND TOKEN STORAGE                      │
│  localStorage.setItem('access_token', access_token)           │
│  localStorage.setItem('refresh_token', refresh_token)         │
│  authStore.setUser(user)                                       │
│  router.push('/dashboard')                                    │
└────────────────────────────────────────────────────────────────┘
```

---

## 4. Authenticated Request Flow

```
┌────────────────────────────────────────────────────────────────┐
│           USER CREATES SERVICE REQUEST (AUTHENTICATED)         │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│                  FRONTEND FORM VALIDATION (ZOD)                │
│  Schema: createRequestSchema                                  │
│  • category_id: UUID format                                    │
│  • description: 10-1000 characters                            │
│  • budget: positive number, max 1M                            │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│               SEND REQUEST WITH AUTH TOKEN                     │
│  POST http://localhost:3700/api/v1/requests                   │
│  Headers:                                                      │
│    Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR...           │
│    Content-Type: application/json                             │
│  Body:                                                         │
│    {                                                           │
│      "category_id": "uuid",                                   │
│      "description": "Need plumbing repair",                   │
│      "budget": 150.00                                         │
│    }                                                           │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│                        API GATEWAY                             │
│  • Extract Authorization header                               │
│  • Route to marketplace-service:3003/requests                     │
│  • Forward Authorization header                               │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│                REQUEST SERVICE - AUTH MIDDLEWARE               │
│  Step 1: Extract JWT token                                    │
│    const token = req.headers.authorization.split(' ')[1]      │
│                                                                │
│  Step 2: Verify JWT signature                                 │
│    jwt.verify(token, JWT_SECRET)                              │
│    if invalid → throw UnauthorizedException                   │
│                                                                │
│  Step 3: Check token expiration                               │
│    if (decoded.exp < Date.now() / 1000)                       │
│      throw UnauthorizedException('Token expired')             │
│                                                                │
│  Step 4: Extract user info from token                         │
│    req.user = {                                               │
│      id: decoded.sub,                                         │
│      email: decoded.email,                                    │
│      role: decoded.role                                       │
│    }                                                           │
│                                                                │
│  Step 5: Continue to controller                               │
│    next()                                                     │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│              REQUEST SERVICE - DTO VALIDATION                  │
│  class-validator checks:                                      │
│  • @IsUUID() category_id                                      │
│  • @IsString() @MinLength(10) description                     │
│  • @IsNumber() @IsPositive() budget                           │
│                                                                │
│  if validation fails → throw BadRequestException              │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│            REQUEST SERVICE - BUSINESS LOGIC                    │
│  Step 1: Verify category exists                               │
│    SELECT * FROM service_categories WHERE id = $1             │
│    if (!category) throw NotFoundException                     │
│                                                                │
│  Step 2: Create service request                               │
│    INSERT INTO service_requests                               │
│    (customer_id, category_id, description, budget, status)    │
│    VALUES (req.user.id, $1, $2, $3, 'open')                   │
│    RETURNING *                                                │
│                                                                │
│  Step 3: Trigger notification (if EVENT_BUS_ENABLED)          │
│    if (EVENT_BUS_ENABLED) {                                   │
│      kafka.publish('request_created', {                       │
│        request_id: request.id,                                │
│        customer_id: req.user.id,                              │
│        category_id                                            │
│      })                                                       │
│    }                                                           │
│                                                                │
│  Step 4: Notify nearby providers (via comms-service)   │
│    POST http://comms-service:3007/notifications/bulk   │
│    {                                                           │
│      "recipients": [provider_ids],                            │
│      "type": "new_request",                                   │
│      "channel": ["email", "push"],                            │
│      "data": { request_id, category, budget }                 │
│    }                                                           │
│                                                                │
│  Step 5: Return created request                               │
│    return {                                                   │
│      id, customer_id, category_id, description,               │
│      budget, status, created_at                               │
│    }                                                           │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│                    RESPONSE TO FRONTEND                        │
│  Status: 201 Created                                          │
│  Body:                                                         │
│  {                                                             │
│    "id": "uuid",                                              │
│    "customer_id": "uuid",                                     │
│    "category_id": "uuid",                                     │
│    "description": "Need plumbing repair",                     │
│    "budget": 150.00,                                          │
│    "status": "open",                                          │
│    "created_at": "2026-03-13T10:00:00Z"                       │
│  }                                                             │
│                                                                │
│  Frontend:                                                     │
│  toast.success('Request created successfully!')               │
│  router.push(`/requests/${response.id}`)                      │
└────────────────────────────────────────────────────────────────┘
```

---

## 5. Token Refresh Flow

```
┌────────────────────────────────────────────────────────────────┐
│             API REQUEST WITH EXPIRED TOKEN                     │
│  GET /api/v1/requests                                         │
│  Authorization: Bearer {expired_token}                        │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│                   SERVICE AUTH MIDDLEWARE                      │
│  jwt.verify(token, SECRET)                                    │
│  Error: TokenExpiredError                                     │
│                                                                │
│  Response:                                                     │
│  Status: 401 Unauthorized                                     │
│  Body: { error: { code: "TOKEN_EXPIRED", message: "..." } }  │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│              FRONTEND API CLIENT INTERCEPTOR                   │
│  if (error.response.status === 401) {                         │
│    // Attempt token refresh                                   │
│    const refreshToken = localStorage.getItem('refresh_token')│
│                                                                │
│    POST /api/v1/auth/refresh                                  │
│    { "refreshToken": refreshToken }                           │
│  }                                                             │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│                  AUTH SERVICE - TOKEN REFRESH                  │
│  Step 1: Verify refresh token                                 │
│    jwt.verify(refreshToken, REFRESH_SECRET)                   │
│                                                                │
│  Step 2: Check session exists and is active                   │
│    SELECT * FROM sessions                                     │
│    WHERE id = decoded.session_id AND active = true            │
│    if (!session) throw UnauthorizedException                  │
│                                                                │
│  Step 3: Get user                                             │
│    SELECT * FROM users WHERE id = decoded.sub                 │
│                                                                │
│  Step 4: Generate new access token                            │
│    newAccessToken = jwt.sign(                                 │
│      { sub: user.id, email, role },                           │
│      SECRET, { expiresIn: '7d' }                              │
│    )                                                           │
│                                                                │
│  Step 5: Return new token                                     │
│    return { accessToken: newAccessToken }                     │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│           FRONTEND - RETRY ORIGINAL REQUEST                    │
│  localStorage.setItem('access_token', newAccessToken)         │
│                                                                │
│  // Retry original request with new token                     │
│  return apiClient.get('/requests', {                          │
│    headers: { Authorization: `Bearer ${newAccessToken}` }     │
│  })                                                            │
└────────────────────────────────────────────────────────────────┘
```

---

## 6. Validation Layers Summary

| Layer | Technology | Purpose | Example |
|-------|-----------|---------|---------|
| **Frontend (Client-side)** | Zod + React Hook Form | UX, immediate feedback | Email format, password strength |
| **API Gateway** | None (routes only) | Traffic routing | Forward to services |
| **Backend DTO** | class-validator (NestJS) | Input validation | @IsEmail(), @MinLength() |
| **Backend Business Logic** | Custom validation | Business rules | "User can't bid on own request" |
| **Database** | PostgreSQL constraints | Data integrity | UNIQUE(email), NOT NULL |

### Why Multiple Layers?

1. **Frontend validation**: Fast feedback, better UX
2. **Backend DTO validation**: Security (don't trust client)
3. **Business logic validation**: Complex rules
4. **Database constraints**: Last line of defense

---

## 7. Security Best Practices Implemented

✅ **Password Security**
- bcrypt hashing (10 rounds)
- Min 8 characters, uppercase, lowercase, number
- No password in responses

✅ **JWT Security**
- Short-lived access tokens (7 days)
- Long-lived refresh tokens (30 days)
- Secure secret keys (env variables)
- Token expiration checking

✅ **Session Management**
- Session tracking in database
- IP and user agent logging
- Logout invalidates session

✅ **Rate Limiting**
- Login attempts tracked
- Account locking after 5 failed attempts
- API rate limiting (100 req/min)

✅ **Input Validation**
- Frontend + Backend validation
- SQL injection prevention (parameterized queries)
- XSS prevention (input sanitization)

✅ **Email Verification**
- Required for sensitive actions
- Time-limited tokens (24 hours)
- One-time use tokens

✅ **OAuth Security**
- State parameter for CSRF protection
- HTTPS required in production
- Minimal scope requests

---

## 8. Error Handling Strategy

### Frontend Error Display
```typescript
catch (error) {
  const errorMessage = 
    error.response?.data?.error?.message ||  // API spec format
    error.response?.data?.message ||         // NestJS validation
    'An error occurred';                     // Fallback
  
  toast.error(errorMessage);
}
```

### Backend Error Responses

**Validation Error** (400):
```json
{
  "statusCode": 400,
  "message": ["email must be an email", "password must be longer than 8 characters"],
  "error": "Bad Request"
}
```

**Custom Error** (API Spec Format):
```json
{
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "An account with this email already exists"
  },
  "statusCode": 409,
  "timestamp": "2026-03-13T10:00:00Z",
  "path": "/api/v1/auth/signup"
}
```

---

## Workflow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPLETE SYSTEM FLOW                         │
├─────────────────────────────────────────────────────────────────┤
│  1. User fills form → Frontend validation (Zod)                │
│  2. POST to API Gateway → Routes to service                     │
│  3. Auth middleware → Verify JWT (if required)                  │
│  4. DTO validation → class-validator checks                     │
│  5. Business logic → Service layer processing                   │
│  6. Database operations → PostgreSQL queries                    │
│  7. Side effects → Notifications, events, logging              │
│  8. Response → JSON back to frontend                            │
│  9. Frontend updates → UI refresh, toasts, redirects           │
└─────────────────────────────────────────────────────────────────┘
```

**This architecture ensures**:
- ✅ Type safety across frontend & backend
- ✅ Secure authentication & authorization
- ✅ Comprehensive validation at every layer
- ✅ Graceful error handling
- ✅ Scalable microservices design
- ✅ Production-ready security practices

---

**Last Updated**: March 13, 2026
