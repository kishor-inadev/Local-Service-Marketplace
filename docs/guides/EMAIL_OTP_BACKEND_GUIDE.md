# Email OTP Backend Implementation Guide

## Overview

This guide shows how to add **Email + OTP** authentication endpoints to your auth service. The implementation is similar to the existing phone OTP system but uses email instead.

---

## Required Backend Endpoints

### 1. Request Email OTP
**POST** `/api/v1/auth/email/otp/request`

```typescript
// auth.controller.ts
@Post('email/otp/request')
async requestEmailOtp(
  @Body() emailOtpRequestDto: EmailOtpRequestDto,
): Promise<{ message: string }> {
  this.logger.info('POST /auth/email/otp/request', {
    context: 'AuthController',
    email: emailOtpRequestDto.email,
  });
  return this.authService.requestEmailOtp(emailOtpRequestDto.email);
}
```

### 2. Verify Email OTP
**POST** `/api/v1/auth/email/otp/verify`

```typescript
// auth.controller.ts
@Post('email/otp/verify')
async verifyEmailOtp(
  @Body() emailOtpVerifyDto: EmailOtpVerifyDto,
  @Ip() ipAddress: string,
  @Res({ passthrough: true }) res: Response,
): Promise<AuthResponseDto> {
  this.logger.info('POST /auth/email/otp/verify', {
    context: 'AuthController',
    email: emailOtpVerifyDto.email,
    ipAddress,
  });
  const result = await this.authService.verifyEmailOtp(
    emailOtpVerifyDto.email,
    emailOtpVerifyDto.code,
    ipAddress,
  );
  
  // Set tokens as HTTP-only cookies
  this.setAuthCookies(res, result.accessToken, result.refreshToken);
  
  return result;
}
```

---

## DTOs

### Email OTP Request DTO

```typescript
// dto/email-otp-request.dto.ts
import { IsEmail } from 'class-validator';

export class EmailOtpRequestDto {
  @IsEmail()
  email: string;
}
```

### Email OTP Verify DTO

```typescript
// dto/email-otp-verify.dto.ts
import { IsEmail, IsString, Length } from 'class-validator';

export class EmailOtpVerifyDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6)
  code: string;
}
```

---

## Service Implementation

### auth.service.ts

```typescript
/**
 * Request OTP for email login
 */
async requestEmailOtp(email: string): Promise<{ message: string }> {
  this.logger.info('OTP request for email login', { context: 'AuthService', email });

  // Find user by email
  const user = await this.userRepo.findByEmail(email);

  if (!user) {
    this.logger.warn('OTP requested for non-existent email', {
      context: 'AuthService',
      email,
    });
    // Return generic message to avoid user enumeration
    return { message: 'If the email is registered, an OTP has been sent' };
  }

  if (user.status !== 'active') {
    this.logger.warn('OTP request for inactive account', {
      context: 'AuthService',
      email,
      status: user.status,
    });
    // Still return generic message
    return { message: 'If the email is registered, an OTP has been sent' };
  }

  try {
    // Send OTP via email using notification service
    await this.notificationClient.sendEmail({
      to: email,
      template: 'otp-login',
      data: {
        name: user.name || user.email.split('@')[0],
        // The notificationClient should handle OTP generation
        // or you can generate it here and pass it
      },
    });

    this.logger.info('OTP sent successfully via email', {
      context: 'AuthService',
      email,
    });

    return { message: 'OTP sent successfully' };
  } catch (error) {
    this.logger.error('Failed to send OTP via email', {
      context: 'AuthService',
      email,
      error: error.message,
    });
    throw new BadRequestException('Failed to send OTP. Please try again.');
  }
}

/**
 * Verify email OTP and login
 */
async verifyEmailOtp(email: string, code: string, ipAddress?: string): Promise<AuthResponseDto> {
  this.logger.info('OTP verification attempt for email login', { context: 'AuthService', email });

  // Find user
  const user = await this.userRepo.findByEmail(email);

  if (!user) {
    this.logger.warn('OTP verification failed: User not found', {
      context: 'AuthService',
      email,
    });
    throw new UnauthorizedException('Invalid email or OTP');
  }

  if (user.status !== 'active') {
    this.logger.warn('OTP verification failed: Account not active', {
      context: 'AuthService',
      email,
      status: user.status,
    });
    throw new UnauthorizedException('Account is not active');
  }

  try {
    // Verify OTP via notification/email service
    // This depends on how you're storing/managing OTPs
    // Option 1: Use a dedicated OTP table (similar to email_verification_tokens)
    // Option 2: Use Redis with expiration
    // Option 3: Use notification service to verify
    
    const verificationResult = await this.verifyEmailOtpCode(email, code);

    if (!verificationResult) {
      this.logger.warn('OTP verification failed: Invalid code', {
        context: 'AuthService',
        email,
      });
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Update last login
    await this.userRepo.updateLastLogin(user.id);

    // Generate tokens
    const { accessToken, refreshToken } = await this.jwtService.generateTokenPair(
      user.id,
      user.email,
      user.role,
    );

    // Create session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await this.sessionRepo.create(user.id, accessToken, refreshToken, expiresAt, ipAddress);

    this.logger.info('Email OTP login successful', {
      context: 'AuthService',
      userId: user.id,
      email: user.email,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        email_verified: user.email_verified,
        phone_verified: user.phone_verified || false,
        profile_picture_url: user.profile_picture_url,
        timezone: user.timezone,
        language: user.language,
        last_login_at: new Date(),
      },
    };
  } catch (error) {
    if (error instanceof UnauthorizedException) {
      throw error;
    }
    this.logger.error('Error during OTP verification', {
      context: 'AuthService',
      email,
      error: error.message,
    });
    throw new UnauthorizedException('Invalid or expired OTP');
  }
}

/**
 * Helper: Verify OTP code
 * Implement based on your OTP storage strategy
 */
private async verifyEmailOtpCode(email: string, code: string): Promise<boolean> {
  // OPTION 1: Using email_verification_tokens table (reuse existing table)
  const token = await this.emailVerificationTokenRepo.findByToken(code);
  if (!token || token.expires_at < new Date()) {
    return false;
  }
  
  const user = await this.userRepo.findById(token.user_id);
  if (!user || user.email !== email) {
    return false;
  }

  // Delete used token
  await this.emailVerificationTokenRepo.deleteByToken(code);
  return true;

  // OPTION 2: Using Redis (recommended for OTPs)
  // const storedCode = await this.redisClient.get(`email-otp:${email}`);
  // if (storedCode === code) {
  //   await this.redisClient.del(`email-otp:${email}`);
  //   return true;
  // }
  // return false;

  // OPTION 3: Using dedicated OTP table (create new table)
  // const otp = await this.otpRepo.findByEmailAndCode(email, code);
  // if (otp && otp.expires_at > new Date()) {
  //   await this.otpRepo.delete(otp.id);
  //   return true;
  // }
  // return false;
}
```

---

## OTP Generation

### Option 1: Random 6-Digit Code

```typescript
private generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async requestEmailOtp(email: string): Promise<{ message: string }> {
  // ... existing code ...

  const otpCode = this.generateOtpCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Store in database or Redis
  await this.emailVerificationTokenRepo.create(user.id, otpCode, expiresAt);

  // Send email
  await this.notificationClient.sendEmail({
    to: email,
    template: 'otp-login',
    data: {
      name: user.name || user.email.split('@')[0],
      code: otpCode,
      expiresIn: '5 minutes',
    },
  });

  return { message: 'OTP sent successfully' };
}
```

### Option 2: Using Redis (Recommended)

```typescript
// Install: npm install ioredis
import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';

async requestEmailOtp(email: string): Promise<{ message: string }> {
  // ... existing code ...

  const otpCode = this.generateOtpCode();
  
  // Store in Redis with 5-minute expiration
  await this.redisClient.setex(
    `email-otp:${email}`,
    300, // 5 minutes
    otpCode
  );

  // Send email
  await this.notificationClient.sendEmail({
    to: email,
    template: 'otp-login',
    data: {
      name: user.name || user.email.split('@')[0],
      code: otpCode,
      expiresIn: '5 minutes',
    },
  });

  return { message: 'OTP sent successfully' };
}

async verifyEmailOtp(email: string, code: string, ipAddress?: string): Promise<AuthResponseDto> {
  // ... existing validation ...

  // Verify OTP from Redis
  const storedCode = await this.redisClient.get(`email-otp:${email}`);
  
  if (!storedCode || storedCode !== code) {
    throw new UnauthorizedException('Invalid or expired OTP');
  }

  // Delete used OTP
  await this.redisClient.del(`email-otp:${email}`);

  // ... continue with login ...
}
```

---

## Email Template

Create an email template for OTP: `email-otp-login.html`

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .otp-code { 
      font-size: 32px; 
      font-weight: bold; 
      letter-spacing: 5px;
      color: #2563eb;
      text-align: center;
      padding: 20px;
      background: #f0f9ff;
      border-radius: 8px;
      margin: 20px 0;
    }
    .warning { color: #dc2626; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Your Login Code</h2>
    <p>Hi {{name}},</p>
    <p>Use the following code to sign in to your account:</p>
    
    <div class="otp-code">{{code}}</div>
    
    <p>This code will expire in <strong>{{expiresIn}}</strong>.</p>
    
    <p class="warning">⚠️ Never share this code with anyone. We will never ask for your code.</p>
    
    <p>If you didn't request this code, please ignore this email or contact support if you're concerned about your account security.</p>
    
    <p>Best regards,<br>Local Service Marketplace Team</p>
  </div>
</body>
</html>
```

---

## Route Registration

Update `auth.module.ts`:

```typescript
import { EmailOtpRequestDto } from './dto/email-otp-request.dto';
import { EmailOtpVerifyDto } from './dto/email-otp-verify.dto';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtService,
    TokenService,
    // ... other providers
  ],
  exports: [AuthService],
})
export class AuthModule {}
```

---

## Security Considerations

### Rate Limiting
```typescript
// Add rate limiting to prevent abuse
@UseGuards(ThrottlerGuard)
@Throttle(3, 60) // 3 requests per 60 seconds
@Post('email/otp/request')
async requestEmailOtp(@Body() dto: EmailOtpRequestDto) {
  return this.authService.requestEmailOtp(dto.email);
}
```

### Failed Attempt Tracking
```typescript
async verifyEmailOtp(email: string, code: string, ipAddress?: string): Promise<AuthResponseDto> {
  // Track failed attempts
  const failedAttempts = await this.loginAttemptRepo.countRecentFailedAttempts(email);
  
  if (failedAttempts >= 5) {
    throw new UnauthorizedException('Too many failed attempts. Please try again later.');
  }

  // ... verify OTP ...

  // If verification fails:
  await this.loginAttemptRepo.create(email, ipAddress, false);
  throw new UnauthorizedException('Invalid OTP');

  // If verification succeeds:
  await this.loginAttemptRepo.create(email, ipAddress, true);
  // ... continue with login ...
}
```

### IP-Based Rate Limiting
```typescript
// Track OTP requests by IP
const otpRequestKey = `otp-request:${ipAddress}`;
const requestCount = await this.redisClient.incr(otpRequestKey);

if (requestCount === 1) {
  await this.redisClient.expire(otpRequestKey, 3600); // 1 hour
}

if (requestCount > 10) { // Max 10 OTP requests per hour per IP
  throw new BadRequestException('Too many OTP requests. Please try again later.');
}
```

---

## Testing

### Test Request OTP
```bash
curl -X POST http://localhost:3700/api/v1/auth/email/otp/request \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

Expected Response:
```json
{
  "message": "OTP sent successfully"
}
```

### Test Verify OTP
```bash
curl -X POST http://localhost:3700/api/v1/auth/email/otp/verify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "code": "123456"
  }'
```

Expected Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1...",
  "refreshToken": "eyJhbGciOiJIUzI1...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "role": "customer",
    ...
  }
}
```

---

## Integration with Frontend

The frontend is already configured to call these endpoints:

```typescript
// Frontend: hooks/useAuth.ts
const requestEmailOTP = async (email: string) => {
  const response = await fetch('/api/v1/auth/email/otp/request', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
  return response.json();
};

const loginWithEmailOTP = async (email: string, otp: string) => {
  const result = await signIn('email-otp', {
    email,
    otp,
    redirect: false,
  });
  return result;
};
```

Frontend calls → NextAuth → Your Backend → Email sent → User verifies → Session created

---

## Database Schema (Optional)

If you want a dedicated OTP table instead of reusing email_verification_tokens:

```sql
CREATE TABLE otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  code VARCHAR(10) NOT NULL,
  type VARCHAR(20) NOT NULL, -- 'email', 'phone', 'login', 'verification'
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_otp_email_code (email, code),
  INDEX idx_otp_phone_code (phone, code),
  INDEX idx_otp_expires_at (expires_at)
);
```

---

## Production Checklist

- [ ] Implement OTP generation and storage
- [ ] Create email template for OTP
- [ ] Add rate limiting on OTP request endpoint
- [ ] Track failed verification attempts
- [ ] Set appropriate OTP expiration (5-10 minutes)
- [ ] Add IP-based rate limiting
- [ ] Test email delivery in production
- [ ] Add monitoring for OTP success/failure rates
- [ ] Implement OTP cleanup job (delete expired codes)
- [ ] Add logging for security audit

---

**The frontend is ready! Implement these backend endpoints to enable email OTP login.** 🎉
