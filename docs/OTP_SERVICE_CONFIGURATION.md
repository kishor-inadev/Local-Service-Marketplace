# OTP Service Configuration Guide

This guide explains how to enable/disable SMS and Email OTP services in the Local Service Marketplace platform.

## Overview

The platform supports two OTP delivery methods:
- **SMS OTP** - Via Twilio (for phone login)
- **Email OTP** - Via SMTP (for email login)

Both services can be **enabled or disabled independently** via environment variables.

---

## Configuration

### Auth Service Environment Variables

Location: `services/auth-service/.env`

#### SMS Service (Twilio)

```env
# Enable/Disable SMS OTP
SMS_SERVICE_ENABLED=true   # Set to 'false' to disable

# Twilio Credentials (Required when enabled)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

**Getting Twilio Credentials:**
1. Sign up at https://www.twilio.com/
2. Get your Account SID and Auth Token from the console
3. Purchase a phone number for sending SMS
4. Add credentials to `.env` file
5. Set `SMS_SERVICE_ENABLED=true`

#### Email Service (SMTP)

```env
# Enable/Disable Email OTP
EMAIL_SERVICE_ENABLED=true   # Set to 'false' to disable

# SMTP Configuration (Required when enabled)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@marketplace.com
```

**Gmail SMTP Setup:**
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an "App Password" from Google Account settings
3. Use the app password in `SMTP_PASS`
4. Set `EMAIL_SERVICE_ENABLED=true`

---

## How It Works

### Backend Behavior

#### When Service is ENABLED ✅

1. **Check Identifier API** (`POST /api/v1/auth/check-identifier`)
   - Response includes: `otpAvailable: true`
   - Response includes: `availableMethods: ['password', 'otp']`

2. **Request OTP API** (`POST /api/v1/auth/phone/otp/request`)
   - Checks if SMS service is enabled
   - Sends OTP via Twilio
   - Returns: `{ message: "OTP sent successfully" }`

3. **Verify OTP API** (`POST /api/v1/auth/phone/otp/verify`)
   - Verifies the OTP code
   - Returns JWT tokens on success

#### When Service is DISABLED ❌

1. **Check Identifier API**
   - Response includes: `otpAvailable: false`
   - Response includes: `availableMethods: ['password']` (OTP excluded)

2. **Request OTP API**
   - Returns 400 Error: `"SMS service is currently unavailable. Please use password login instead."`

3. **Verify OTP API**
   - Returns 400 Error: `"SMS service is currently unavailable. Please use password login instead."`

### Frontend Behavior

#### When Service is ENABLED ✅

```
User enters: user@example.com or 123-456-7890
  ↓
Backend checks if identifier exists
  ↓
Response: { exists: true, otpAvailable: true, availableMethods: ['password', 'otp'] }
  ↓
Frontend shows BOTH buttons:
┌──────────────┐ ┌──────────────┐
│ 🔐 Password  │ │ 📲 OTP       │  ← Both clickable
└──────────────┘ └──────────────┘
```

#### When Service is DISABLED ❌

```
User enters: user@example.com or 123-456-7890
  ↓
Backend checks if identifier exists
  ↓
Response: { exists: true, otpAvailable: false, availableMethods: ['password'] }
  ↓
Frontend shows ONLY Password:
┌──────────────┐
│ 🔐 Password  │  ← Only password available
└──────────────┘

ℹ️ OTP login currently unavailable. Please use password.
```

---

## Service Availability Check

### Backend Implementation

**File:** `services/auth-service/src/modules/auth/services/auth.service.ts`

```typescript
isOtpServiceAvailable(type: 'email' | 'phone'): boolean {
  if (type === 'phone') {
    // Check if SMS service is configured
    const smsEnabled = this.configService.get<string>('SMS_SERVICE_ENABLED') === 'true';
    const twilioSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const twilioToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    
    return smsEnabled && !!twilioSid && !!twilioToken;
  }
  
  if (type === 'email') {
    // Check if Email service is configured
    const emailEnabled = this.configService.get<string>('EMAIL_SERVICE_ENABLED') === 'true';
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpUser = this.configService.get<string>('SMTP_USER');
    
    return emailEnabled && !!smtpHost && !!smtpUser;
  }
  
  return false;
}
```

**Checks performed:**
1. ✅ Service is enabled via `*_SERVICE_ENABLED` flag
2. ✅ Required credentials are present (Twilio SID/Token or SMTP Host/User)
3. ✅ Both conditions must be true

---

## Error Handling

### Request OTP with Disabled Service

**Request:**
```bash
POST /api/v1/auth/phone/otp/request
{
  "phone": "+1234567890"
}
```

**Response (SMS Disabled):**
```json
{
  "statusCode": 400,
  "message": "SMS service is currently unavailable. Please use password login instead.",
  "error": "Bad Request"
}
```

### Frontend Toast Message

When user clicks OTP button but service is disabled:
```
❌ SMS service is currently unavailable. Please use password login instead.
```

User is returned to method selection screen with only Password button visible.

---

## Testing Scenarios

### Scenario 1: Both Services Enabled

**Config:**
```env
SMS_SERVICE_ENABLED=true
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx

EMAIL_SERVICE_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_USER=test@gmail.com
```

**Result:**
- Phone login: ✅ Password + OTP available
- Email login: ✅ Password + OTP available

---

### Scenario 2: Only SMS Enabled

**Config:**
```env
SMS_SERVICE_ENABLED=true
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx

EMAIL_SERVICE_ENABLED=false
```

**Result:**
- Phone login: ✅ Password + OTP available
- Email login: ⚠️ Only Password available

---

### Scenario 3: Both Services Disabled

**Config:**
```env
SMS_SERVICE_ENABLED=false
EMAIL_SERVICE_ENABLED=false
```

**Result:**
- Phone login: ⚠️ Only Password available
- Email login: ⚠️ Only Password available
- Message: "ℹ️ OTP login currently unavailable. Please use password."

---

### Scenario 4: Enabled but Missing Credentials

**Config:**
```env
SMS_SERVICE_ENABLED=true
# Missing Twilio credentials
```

**Result:**
- System treats as **disabled**
- Only Password button shown
- Prevents failed OTP attempts

---

## Security Considerations

### Why Check Service Availability?

1. **Prevent Failed Requests**
   - Don't attempt to send OTP if service is unavailable
   - Avoids error logs and alert fatigue

2. **Better User Experience**
   - Show only available options
   - Clear messaging when OTP is unavailable

3. **Fail Safely**
   - If credentials are missing, disable OTP
   - Users can still login with password

4. **User Enumeration Protection**
   - Even when disabled, "user not found" messages are generic
   - Avoids revealing which accounts exist

---

## Quick Enable/Disable Guide

### To Enable SMS OTP:

1. Get Twilio credentials
2. Update `.env`:
   ```env
   SMS_SERVICE_ENABLED=true
   TWILIO_ACCOUNT_SID=your-sid
   TWILIO_AUTH_TOKEN=your-token
   TWILIO_PHONE_NUMBER=+1234567890
   ```
3. Restart auth-service:
   ```bash
   docker-compose restart auth-service
   ```

### To Disable SMS OTP:

1. Update `.env`:
   ```env
   SMS_SERVICE_ENABLED=false
   ```
2. Restart auth-service:
   ```bash
   docker-compose restart auth-service
   ```

---

## Troubleshooting

### OTP Button Not Showing

**Check:**
1. ✅ Is `*_SERVICE_ENABLED=true` in `.env`?
2. ✅ Are credentials properly set?
3. ✅ Did you restart the auth-service?
4. ✅ Check backend response from `/api/v1/auth/check-identifier`

### OTP Request Fails

**Check:**
1. ✅ Is the service enabled?
2. ✅ Are Twilio/SMTP credentials correct?
3. ✅ Check auth-service logs for errors
4. ✅ Verify phone number format (+E.164)

### OTP Button Shows But Request Fails

**Issue:** Service was enabled when identifier was checked, but disabled before OTP request

**Solution:** This is handled gracefully:
- Backend returns 400 error with clear message
- Frontend shows toast and returns to method selection
- User can use password login instead

---

## Environment Variables Reference

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `SMS_SERVICE_ENABLED` | boolean | `false` | Enable/disable SMS OTP |
| `TWILIO_ACCOUNT_SID` | string | - | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | string | - | Twilio Auth Token |
| `TWILIO_PHONE_NUMBER` | string | - | Twilio phone number |
| `EMAIL_SERVICE_ENABLED` | boolean | `false` | Enable/disable Email OTP |
| `SMTP_HOST` | string | - | SMTP server host |
| `SMTP_PORT` | number | `587` | SMTP server port |
| `SMTP_SECURE` | boolean | `false` | Use TLS/SSL |
| `SMTP_USER` | string | - | SMTP username |
| `SMTP_PASS` | string | - | SMTP password |
| `EMAIL_FROM` | string | - | Sender email address |

---

## Best Practices

1. **Development:**
   - Keep OTP disabled unless actively testing
   - Use password login to save SMS costs

2. **Staging:**
   - Enable with test credentials
   - Verify end-to-end flow

3. **Production:**
   - Enable with production credentials
   - Monitor SMS/email delivery rates
   - Set up alerts for failed OTP attempts

4. **Cost Management:**
   - Disable OTP in maintenance mode
   - Enable only when needed for user experience

---

## Related Documentation

- [Authentication Workflow](./AUTHENTICATION_WORKFLOW.md)
- [Smart Login Guide](./PROGRESSIVE_LOGIN_GUIDE.md)
- [Environment Variables Guide](./ENVIRONMENT_VARIABLES_GUIDE.md)
- [API Specification](./API_SPECIFICATION.md)

---

**Last Updated:** March 15, 2026
