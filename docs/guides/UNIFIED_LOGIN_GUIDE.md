# Unified Login Page Guide

## Overview

All 6 authentication methods are now available on a **single unified login page** at `/login`.

**Previous Setup** (Before):
- Separate `/login` page (email only)
- Separate `/phone-login` page (phone only)

**New Setup** (After):
- **One** `/login` page with tabs to switch between email and phone
- Both password and OTP methods available for each type

---

## 6 Authentication Methods

### Email-Based Authentication

1. **Email + Password**
   - Select "📧 Email" tab
   - Select "🔐 Password" tab
   - Enter email and password
   - Click "Sign in"

2. **Email + OTP**
   - Select "📧 Email" tab
   - Select "📲 OTP" tab
   - Enter email and click "Send OTP"
   - Enter 6-digit code from email
   - Click "Verify & Sign in"

### Phone-Based Authentication

3. **Phone + Password**
   - Select "📱 Phone" tab
   - Select "🔐 Password" tab
   - Enter phone number and password
   - Click "Sign in"

4. **Phone + OTP**
   - Select "📱 Phone" tab
   - Select "📲 OTP" tab
   - Enter phone number and click "Send OTP"
   - Enter 6-digit code from SMS
   - Click "Verify & Sign in"

### OAuth Authentication

5. **Google Sign-In**
   - Click "Google" button
   - Authenticate via Google OAuth popup
   - Automatically redirected to dashboard

6. **Facebook Sign-In**
   - Click "Facebook" button
   - Authenticate via Facebook OAuth popup
   - Automatically redirected to dashboard

---

## UI/UX Features

### Two-Level Tab System

**Level 1: Login Type** (Email or Phone)
```
┌─────────────────────────────┐
│  [📧 Email]  [📱 Phone]     │
└─────────────────────────────┘
```

**Level 2: Login Method** (Password or OTP)
```
┌─────────────────────────────┐
│  [🔐 Password]  [📲 OTP]    │
└─────────────────────────────┘
```

### Smart Form Behavior

- **Auto-focus**: First field automatically focused on mount and when switching tabs
- **OTP Timer**: 60-second cooldown before "Resend OTP" becomes available
- **Real-time validation**: Email/phone/password validated as you type
- **Conditional fields**: Form adapts based on selected login type and method
- **Smart button state**: Submit button disabled when:
  - Form is invalid
  - Form hasn't been changed
  - OTP method selected but OTP not sent yet

### Forgot Password

- Only shows when:
  - Login type is **Email**
  - Login method is **Password**

---

## Technical Implementation

### Form Management

Uses **two separate React Hook Form instances**:

```typescript
// Email form (for email + password / email + OTP)
const emailForm = useForm<EmailLoginFormData>({
  resolver: zodResolver(emailLoginSchema),
  defaultValues: { email: '', password: '' },
});

// Phone form (for phone + password / phone + OTP)
const phoneForm = useForm<PhoneLoginFormData>({
  resolver: zodResolver(phoneLoginSchema),
  defaultValues: { phone: '', password: '' },
});
```

**Why two forms?**
- Different validation rules (email vs phone)
- Different backend endpoints
- Prevents state pollution when switching types

### Submit Handler Routing

The submit handler automatically routes to the correct authentication method:

```typescript
const getSubmitHandler = () => {
  if (loginType === 'email') {
    return loginMethod === 'password' 
      ? onEmailPasswordSubmit 
      : onEmailOTPSubmit;
  } else {
    return loginMethod === 'password' 
      ? onPhonePasswordSubmit 
      : onPhoneOTPSubmit;
  }
};
```

| Login Type | Login Method | Handler | Backend Endpoint |
|-----------|-------------|---------|-----------------|
| Email | Password | `onEmailPasswordSubmit` | `signIn("credentials")` |
| Email | OTP | `onEmailOTPSubmit` | `signIn("email-otp")` |
| Phone | Password | `onPhonePasswordSubmit` | `signIn("phone-password")` |
| Phone | OTP | `onPhoneOTPSubmit` | `signIn("phone-otp")` |

### State Management

```typescript
const [loginType, setLoginType] = useState<'email' | 'phone'>('email');
const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
const [otpSent, setOtpSent] = useState(false);
const [otpTimer, setOtpTimer] = useState(0);
```

**State Reset** when switching login type:
- `loginMethod` resets to 'password'
- `otpSent` resets to false
- Previous form values cleared (separate forms)

---

## Backend Integration

### NextAuth Credential Providers (4)

1. **credentials** - Email + Password
2. **phone-password** - Phone + Password  
3. **phone-otp** - Phone + OTP
4. **email-otp** - Email + OTP

### Backend API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/v1/auth/login` | Email + password login |
| POST | `/api/v1/auth/phone/login` | Phone + password login |
| POST | `/api/v1/auth/phone/otp/request` | Send SMS OTP |
| POST | `/api/v1/auth/phone/otp/verify` | Verify SMS OTP |
| POST | `/api/v1/auth/email/otp/request` | Send email OTP (pending) |
| POST | `/api/v1/auth/email/otp/verify` | Verify email OTP (pending) |
| GET | `/api/v1/auth/google` | Google OAuth redirect |
| GET | `/api/v1/auth/facebook` | Facebook OAuth redirect |

---

## Validation Rules

### Email Schema
```typescript
{
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
}
```

### Phone Schema
```typescript
{
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
}
```

**Note**: For OTP methods, the `password` field is reused to store the 6-digit OTP code.

---

## Testing the Login Page

### 1. Test Email + Password
```
1. Go to http://localhost:3007/login
2. "📧 Email" should be selected (default)
3. "🔐 Password" should be selected (default)
4. Enter email: test@example.com
5. Enter password: password123
6. Click "Sign in"
7. Should redirect to /dashboard
```

### 2. Test Phone + OTP
```
1. Go to http://localhost:3007/login
2. Click "📱 Phone" tab
3. Click "📲 OTP" tab
4. Enter phone: +1234567890
5. Click "Send OTP"
6. Check phone for SMS with 6-digit code
7. Enter code in OTP field
8. Click "Verify & Sign in"
9. Should redirect to /dashboard
```

### 3. Test Google OAuth
```
1. Go to http://localhost:3007/login
2. Scroll to social login buttons
3. Click "Google" button
4. Should redirect to backend: http://localhost:3001/api/v1/auth/google
5. Complete Google login
6. Should redirect to /auth/callback
7. Should redirect to /dashboard
```

---

## Migration Notes

### Removed Files
- ❌ `/frontend/app/(auth)/phone-login/page.tsx` - **NO LONGER NEEDED**

### Updated Files
- ✅ `/frontend/app/(auth)/login/page.tsx` - **Unified login page**
- ✅ `/frontend/hooks/useAuth.ts` - 8 authentication methods
- ✅ `/frontend/auth.config.ts` - 4 NextAuth providers

### Constants
- ⚠️ `ROUTES.PHONE_LOGIN` still exists in `config/constants.ts` but is deprecated
- All authentication now happens through `ROUTES.LOGIN`

---

## User Experience Benefits

✅ **Single Entry Point**: Users don't need to know which login page to visit  
✅ **Intuitive Tabs**: Clear visual distinction between email/phone and password/OTP  
✅ **Flexible**: Users can switch methods without page refresh  
✅ **Consistent**: All authentication methods use the same UI layout  
✅ **Mobile Friendly**: Tab-based navigation works well on small screens  
✅ **Accessible**: ARIA labels, keyboard navigation, screen reader support  

---

## URL Access

| URL | Behavior |
|-----|----------|
| `/login` | Main unified login page ✅ |
| `/phone-login` | **Deprecated** - redirects to `/login` |
| `/signup` | Signup page (separate) |

---

## Future Enhancements

### Potential Additions
1. **Remember Me** - Optional session persistence
2. **Biometric Auth** - WebAuthn/FIDO2 support
3. **Magic Link** - Passwordless email login
4. **SSO** - Enterprise single sign-on
5. **2FA** - Two-factor authentication

### Backend Todos
- [ ] Implement email OTP endpoints (`/api/v1/auth/email/otp/request`, `/api/v1/auth/email/otp/verify`)
- [ ] Add rate limiting for OTP requests (max 3 per 5 minutes)
- [ ] Add OTP expiration (5-10 minutes)
- [ ] Add brute-force protection (account lockout after 5 failed attempts)

---

## Summary

The unified login page consolidates **6 authentication methods** into a single, intuitive interface:

**Before**: 2 separate pages  
**After**: 1 unified page with tabs

**Methods**: Email/Phone × Password/OTP + Google/Facebook OAuth

**User Flow**: Select type → Select method → Enter credentials → Sign in

**Developer Benefits**: Single page to maintain, consistent codebase, easier testing
