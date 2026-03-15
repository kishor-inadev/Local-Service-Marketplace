# Phone Login Implementation Guide

This guide explains the phone number authentication system supporting both password and OTP login methods.

---

## Overview

Users can now login using their phone number in two ways:
1. **Phone + Password** - Traditional authentication using phone and password
2. **Phone + OTP** - Passwordless authentication using one-time password sent via SMS

---

## Backend Implementation

### 1. DTOs Created

**PhoneLoginDto** (`services/auth-service/src/modules/auth/dto/phone-login.dto.ts`):
```typescript
{
  phone: string;     // E.164 format: +1234567890
  password: string;  // Min 8 characters
}
```

**PhoneOtpRequestDto** (`services/auth-service/src/modules/auth/dto/phone-otp-request.dto.ts`):
```typescript
{
  phone: string;  // E.164 format: +1234567890
}
```

**PhoneOtpVerifyDto** (`services/auth-service/src/modules/auth/dto/phone-otp-verify.dto.ts`):
```typescript
{
  phone: string;  // E.164 format: +1234567890
  code: string;   // Exactly 6 digits
}
```

### 2. SmsClient Service

**File**: `services/auth-service/src/modules/auth/clients/sms.client.ts`

HTTP client for communicating with SMS service:

```typescript
class SmsClient {
  async sendOtp(phone: string, purpose: string): Promise<OtpSendResponse>
  async verifyOtp(phone: string, code: string, purpose: string): Promise<OtpVerifyResponse>
}
```

**Features**:
- Checks SMS_ENABLED flag (gracefully handles disabled state)
- Uses SMS_API_KEY for authentication
- Configurable SMS_SERVICE_URL
- Error handling with fallback responses

### 3. UserRepository Updates

**File**: `services/auth-service/src/modules/auth/repositories/user.repository.ts`

Added method:
```typescript
async findByPhone(phone: string): Promise<User | null>
```

### 4. AuthService Methods

**File**: `services/auth-service/src/modules/auth/services/auth.service.ts`

#### loginWithPhone(phone: string, password: string, ipAddress?: string)
- Validates phone and password
- Checks login attempts (rate limiting)
- Finds user by phone number
- Verifies password with bcrypt
- Checks account status (active/inactive)
- Generates JWT tokens
- Creates session
- Returns AuthResponseDto

#### requestPhoneOtp(phone: string)
- Checks if user exists with phone
- Validates account status
- Sends OTP via SMS service
- Returns success message (doesn't reveal if user exists - security)

#### verifyPhoneOtp(phone: string, code: string, ipAddress?: string)
- Finds user by phone
- Validates account status
- Verifies OTP via SMS service
- Generates JWT tokens on success
- Creates session
- Returns AuthResponseDto

### 5. AuthController Endpoints

**File**: `services/auth-service/src/modules/auth/controllers/auth.controller.ts`

#### POST /auth/phone/login
Request:
```json
{
  "phone": "+1234567890",
  "password": "your-password"
}
```

Response:
```json
{
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "customer",
    "email_verified": true
  }
}
```

#### POST /auth/phone/otp/request
Request:
```json
{
  "phone": "+1234567890"
}
```

Response:
```json
{
  "message": "OTP sent successfully"
}
```

#### POST /auth/phone/otp/verify
Request:
```json
{
  "phone": "+1234567890",
  "code": "123456"
}
```

Response: Same as phone/login (access token + user)

### 6. Module Configuration

**File**: `services/auth-service/src/modules/auth/auth.module.ts`

Added `SmsClient` to providers.

### 7. Dependencies

**File**: `services/auth-service/package.json`

Added:
```json
{
  "axios": "^1.6.0"
}
```

### 8. Environment Variables

**File**: `services/auth-service/.env.example`

```env
# SMS Service (for OTP login)
SMS_SERVICE_URL=http://sms-service:3000
SMS_ENABLED=false
SMS_API_KEY=change-me-to-a-strong-random-secret
```

---

## Frontend Implementation

### Updated Login Page

**File**: `frontend/nextjs-app/app/(auth)/login/page.tsx`

**Features**:
- Three login methods: Email, Phone+Password, Phone+OTP
- Tab-based UI to switch between methods
- Phone number validation (E.164 format)
- OTP request flow with countdown
- Resend OTP functionality
- Form validation with Zod schemas
- Error handling with toast notifications

**Login Methods**:

1. **Email + Password** (existing):
   - Standard email/password login
   - Uses existing `useAuth` hook

2. **Phone + Password** (new):
   - Phone input with country code
   - Password input
   - POST to `/auth/phone/login`

3. **Phone + OTP** (new):
   - Step 1: Request OTP (phone input only)
   - Step 2: Verify OTP (6-digit code input)
   - POST to `/auth/phone/otp/request`
   - POST to `/auth/phone/otp/verify`

**UI Components**:
- Tab navigation for login method selection
- Phone number input with format hint (+1234567890)
- OTP code input (6 digits, maxLength=6)
- "Change number" link to go back
- "Resend OTP" button

---

## Phone Number Format

**Required Format**: E.164 International Format
- **Example**: `+1234567890` (US)
- **Pattern**: `^\+?[1-9]\d{1,14}$`
- **Rules**:
  - Must start with country code
  - Plus sign (+) recommended but optional
  - 10-15 digits total
  - No spaces, dashes, or parentheses

**Examples**:
- US: `+12025551234`
- UK: `+447911123456`
- India: `+919876543210`

---

## OTP Configuration

**SMS Service Settings**:
- **Code Length**: 6 digits
- **Expiry**: 10 minutes
- **Purpose**: "login" (to differentiate from other OTP uses like verification)
- **Max Attempts**: 5 (configured in SMS service)
- **Provider**: mock (default, no cost) or twilio/aws-sns (production)

---

## Security Features

### Rate Limiting
- Uses existing `LoginAttemptRepository`
- Tracks failed attempts by phone number
- Blocks after `MAX_LOGIN_ATTEMPTS` (default: 5)
- Cooldown period: `LOGIN_ATTEMPT_WINDOW` (default: 15 minutes)

### User Enumeration Prevention
- OTP request returns success even if phone doesn't exist
- Generic error messages ("Invalid credentials")
- Doesn't reveal if user exists

### Account Status Check
- Only active accounts can login
- Suspended/inactive accounts rejected

---

## Testing

### Test Phone + Password Login

```bash
curl -X POST http://localhost:3500/api/v1/auth/phone/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567890",
    "password": "your-password"
  }'
```

Expected response:
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": { ... }
}
```

### Test Phone + OTP Login

**Step 1: Request OTP**
```bash
curl -X POST http://localhost:3500/api/v1/auth/phone/otp/request \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567890"
  }'
```

Expected response:
```json
{
  "message": "OTP sent successfully"
}
```

**Step 2: Check SMS (if using real provider)**
- Check your phone for SMS
- Or check SMS service logs: `docker-compose logs sms-service`

**Step 3: Verify OTP**
```bash
curl -X POST http://localhost:3500/api/v1/auth/phone/otp/verify \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567890",
    "code": "123456"
  }'
```

Expected response: AuthResponseDto (access token + user)

---

## SMS Service Integration

### Mock Provider (Default, Free)
- SMS_ENABLED=false (or SMS_PROVIDER=mock)
- No real SMS sent
- OTP code: Always returns a test code
- Logs to console: Check `docker-compose logs sms-service`
- Perfect for development

### Twilio (Production)
1. Sign up at twilio.com (free $15 credit)
2. Get Account SID, Auth Token, Phone Number
3. Update .env:
   ```env
   SMS_ENABLED=true
   SMS_PROVIDER=twilio
   TWILIO_ACCOUNT_SID=your-account-sid
   TWILIO_AUTH_TOKEN=your-auth-token
   TWILIO_FROM_NUMBER=+1234567890
   ```
4. Restart: `docker-compose restart auth-service sms-service`

---

## Database Schema

The `users` table already has a `phone` field:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  phone TEXT,  -- Phone number in E.164 format
  role TEXT NOT NULL DEFAULT 'customer',
  email_verified BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Index Recommendation** (for performance):
```sql
CREATE INDEX idx_users_phone ON users(phone);
```

---

## Frontend Usage Example

```typescript
// Login with phone + password
const response = await axios.post(`${API_URL}/auth/phone/login`, {
  phone: '+1234567890',
  password: 'password123'
});
const { accessToken, refreshToken } = response.data;

// Login with phone + OTP
// Step 1: Request OTP
await axios.post(`${API_URL}/auth/phone/otp/request`, {
  phone: '+1234567890'
});

// Step 2: User enters code from SMS
const otpResponse = await axios.post(`${API_URL}/auth/phone/otp/verify`, {
  phone: '+1234567890',
  code: '123456'
});
const { accessToken, refreshToken } = otpResponse.data;
```

---

## Signup with Phone

To allow signup with phone number, update the signup form:

**Backend** (already supports phone):
```typescript
// In SignupDto
phone?: string;

// In AuthService.signup()
const user = await this.userRepo.create(email, passwordHash, role, phone);
```

**Frontend** (add phone field to signup form):
```typescript
<Input
  label="Phone number (optional)"
  type="tel"
  placeholder="+1234567890"
  {...register('phone')}
/>
```

---

## Error Handling

### Common Errors

**Invalid phone format**:
```json
{
  "statusCode": 400,
  "message": "Phone number must be in E.164 format (e.g., +1234567890)"
}
```

**Too many login attempts**:
```json
{
  "statusCode": 429,
  "message": "Too many failed login attempts. Please try again later."
}
```

**Invalid OTP**:
```json
{
  "statusCode": 401,
  "message": "Invalid or expired OTP"
}
```

**SMS service disabled**:
```json
{
  "statusCode": 400,
  "message": "Failed to send OTP. Please try again."
}
```

---

## Production Checklist

### Security
- [ ] Enable SMS service (`SMS_ENABLED=true`)
- [ ] Configure production SMS provider (Twilio/AWS SNS)
- [ ] Set strong SMS_API_KEY (32+ characters)
- [ ] Add phone number index to database
- [ ] Configure rate limiting (MAX_LOGIN_ATTEMPTS)
- [ ] Set up monitoring for failed OTP attempts
- [ ] Implement CAPTCHA for OTP requests (prevent abuse)

### Cost Management
- [ ] Set OTP expiry time (10 minutes recommended)
- [ ] Limit OTP requests per phone (prevent SMS flooding)
- [ ] Configure SMS provider cost alerts
- [ ] Monitor SMS usage and costs
- [ ] Consider fallback to cheaper providers

### User Experience
- [ ] Add phone number validation on frontend
- [ ] Auto-format phone input (add country code)
- [ ] Show countdown timer for OTP expiry
- [ ] Auto-submit OTP when 6 digits entered
- [ ] Add "Didn't receive OTP?" help text
- [ ] Test with multiple country codes

---

## Next Steps

### Enhancements
1. **Add phone verification flow**:
   - Require OTP verification after signup
   - Store phone_verified flag in database

2. **Support phone as primary identifier**:
   - Allow login with phone instead of email
   - Make email optional

3. **Add 2FA**:
   - Use phone OTP as second factor
   - Enable/disable in user settings

4. **Phone number management**:
   - Allow users to update phone number
   - Verify new phone before updating
   - Keep old phone for 30 days (recovery)

5. **International support**:
   - Auto-detect country code
   - Phone number formatting library
   - Country-specific SMS providers

---

## Summary

**Files Created**:
1. `services/auth-service/src/modules/auth/dto/phone-login.dto.ts`
2. `services/auth-service/src/modules/auth/dto/phone-otp-request.dto.ts`
3. `services/auth-service/src/modules/auth/dto/phone-otp-verify.dto.ts`
4. `services/auth-service/src/modules/auth/clients/sms.client.ts`

**Files Modified**:
1. `services/auth-service/src/modules/auth/repositories/user.repository.ts` - Added findByPhone()
2. `services/auth-service/src/modules/auth/services/auth.service.ts` - Added 3 phone login methods
3. `services/auth-service/src/modules/auth/controllers/auth.controller.ts` - Added 3 endpoints
4. `services/auth-service/src/modules/auth/auth.module.ts` - Added SmsClient provider
5. `services/auth-service/package.json` - Added axios dependency
6. `services/auth-service/.env.example` - Added SMS configuration
7. `frontend/nextjs-app/app/(auth)/login/page.tsx` - Complete redesign with 3 login methods

**API Endpoints**:
- POST `/auth/phone/login` - Login with phone + password
- POST `/auth/phone/otp/request` - Request OTP for phone
- POST `/auth/phone/otp/verify` - Verify OTP and login

**Dependencies**:
- Backend: axios (HTTP client for SMS service)
- Frontend: zod (validation schemas)

**Next Steps**:
1. Install axios: `cd services/auth-service && npm install axios`
2. Enable SMS service: Set SMS_ENABLED=true in .env
3. Configure SMS provider: Twilio or mock for testing
4. Rebuild auth-service: `docker-compose build auth-service`
5. Test phone login in browser
