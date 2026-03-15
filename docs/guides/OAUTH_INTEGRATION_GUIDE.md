# OAuth Integration Guide (Google & Facebook Login)

## Overview

This guide explains how to integrate **Google OAuth 2.0** and **Facebook Login** into the Local Service Marketplace authentication system.

---

## 1. Architecture Integration

### Current Architecture
```
Frontend (Next.js)
    ↓
API Gateway (Port 3500)
    ↓
Auth Service (NestJS)
    ↓
PostgreSQL (social_accounts table)
```

### OAuth Flow
```
User clicks "Google/Facebook" button
    ↓
Frontend redirects to OAuth provider
    ↓
User authenticates with Google/Facebook
    ↓
Provider redirects back with authorization code
    ↓
Frontend sends code to Auth Service
    ↓
Auth Service exchanges code for user info
    ↓
Auth Service creates/links social_account
    ↓
Returns JWT token to frontend
```

---

## 2. Database Schema (Already Exists)

The `social_accounts` table is already defined in `database/schema.sql`:

```sql
CREATE TABLE social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'google', 'facebook', 'apple'
  provider_user_id VARCHAR(255) NOT NULL,
  provider_email VARCHAR(255),
  provider_data JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, provider_user_id)
);

CREATE INDEX idx_social_accounts_user_id ON social_accounts(user_id);
CREATE INDEX idx_social_accounts_provider ON social_accounts(provider, provider_user_id);
```

---

## 3. Backend Implementation (Auth Service)

### Step 1: Install Dependencies

```bash
cd services/auth-service
npm install passport passport-google-oauth20 passport-facebook @nestjs/passport
```

### Step 2: Environment Variables

Add to `services/auth-service/.env`:

```env
# OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3500/api/v1/auth/google/callback

FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_CALLBACK_URL=http://localhost:3500/api/v1/auth/facebook/callback

# Frontend URLs
FRONTEND_URL=http://localhost:3000
OAUTH_SUCCESS_REDIRECT=/dashboard
OAUTH_FAILURE_REDIRECT=/login?error=oauth_failed
```

### Step 3: Create OAuth DTOs

**File**: `services/auth-service/src/modules/auth/dto/oauth.dto.ts`

```typescript
export class GoogleOAuthDto {
  code: string;
  redirect_uri: string;
}

export class FacebookOAuthDto {
  code: string;
  redirect_uri: string;
}

export class SocialAccountDto {
  provider: 'google' | 'facebook' | 'apple';
  provider_user_id: string;
  provider_email?: string;
  provider_data?: any;
}
```

### Step 4: Create OAuth Strategy

**File**: `services/auth-service/src/modules/auth/strategies/google.strategy.ts`

```typescript
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, emails, displayName, photos } = profile;
    
    const user = {
      provider: 'google',
      provider_user_id: id,
      provider_email: emails[0].value,
      name: displayName,
      photo: photos[0]?.value,
      provider_data: profile,
    };

    done(null, user);
  }
}
```

**File**: `services/auth-service/src/modules/auth/strategies/facebook.strategy.ts`

```typescript
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get('FACEBOOK_APP_ID'),
      clientSecret: configService.get('FACEBOOK_APP_SECRET'),
      callbackURL: configService.get('FACEBOOK_CALLBACK_URL'),
      scope: ['email', 'public_profile'],
      profileFields: ['id', 'emails', 'name', 'photos'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: any, user: any, info?: any) => void,
  ): Promise<any> {
    const { id, emails, displayName, photos } = profile;
    
    const user = {
      provider: 'facebook',
      provider_user_id: id,
      provider_email: emails?.[0]?.value,
      name: displayName,
      photo: photos?.[0]?.value,
      provider_data: profile,
    };

    done(null, user);
  }
}
```

### Step 5: Update Auth Controller

**File**: `services/auth-service/src/modules/auth/controllers/auth.controller.ts`

Add these endpoints:

```typescript
import { Controller, Get, Post, Body, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Google OAuth
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates the Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req, @Res() res: Response) {
    const token = await this.authService.handleSocialLogin(req.user);
    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }

  // Facebook OAuth
  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  async facebookAuth() {
    // Initiates the Facebook OAuth flow
  }

  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  async facebookAuthCallback(@Req() req, @Res() res: Response) {
    const token = await this.authService.handleSocialLogin(req.user);
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
}
```

### Step 6: Update Auth Service

**File**: `services/auth-service/src/modules/auth/services/auth.service.ts`

Add social login method:

```typescript
async handleSocialLogin(socialData: any): Promise<{ access_token: string; user: any }> {
  const { provider, provider_user_id, provider_email, name, provider_data } = socialData;

  // Check if social account exists
  let socialAccount = await this.socialAccountRepo.findByProvider(provider, provider_user_id);
  
  if (socialAccount) {
    // Existing social account - get user
    const user = await this.userRepo.findById(socialAccount.user_id);
    const token = this.generateJWT(user);
    return { access_token: token, user };
  }

  // Check if user exists with this email
  let user = provider_email ? await this.userRepo.findByEmail(provider_email) : null;

  if (!user) {
    // Create new user
    user = await this.userRepo.create({
      email: provider_email || `${provider}_${provider_user_id}@social.local`,
      password_hash: null, // No password for social login
      role: 'customer',
      email_verified: true, // Social logins are pre-verified
    });
  }

  // Create social account link
  await this.socialAccountRepo.create({
    user_id: user.id,
    provider,
    provider_user_id,
    provider_email,
    provider_data: JSON.stringify(provider_data),
  });

  const token = this.generateJWT(user);
  return { access_token: token, user };
}
```

### Step 7: Create Social Account Repository

**File**: `services/auth-service/src/modules/auth/repositories/social-account.repository.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class SocialAccountRepository {
  constructor(private pool: Pool) {}

  async findByProvider(provider: string, providerUserId: string) {
    const query = `
      SELECT * FROM social_accounts
      WHERE provider = $1 AND provider_user_id = $2
    `;
    const result = await this.pool.query(query, [provider, providerUserId]);
    return result.rows[0];
  }

  async findByUserId(userId: string) {
    const query = `SELECT * FROM social_accounts WHERE user_id = $1`;
    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  async create(data: {
    user_id: string;
    provider: string;
    provider_user_id: string;
    provider_email?: string;
    provider_data?: string;
  }) {
    const query = `
      INSERT INTO social_accounts (user_id, provider, provider_user_id, provider_email, provider_data)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await this.pool.query(query, [
      data.user_id,
      data.provider,
      data.provider_user_id,
      data.provider_email,
      data.provider_data,
    ]);
    return result.rows[0];
  }

  async unlink(userId: string, provider: string) {
    const query = `
      DELETE FROM social_accounts
      WHERE user_id = $1 AND provider = $2
      RETURNING *
    `;
    const result = await this.pool.query(query, [userId, provider]);
    return result.rows[0];
  }
}
```

---

## 4. Frontend Implementation

### Step 1: Update Auth Service

**File**: `frontend/nextjs-app/services/auth-service.ts`

Add OAuth methods:

```typescript
class AuthService {
  // ... existing methods ...

  initiateGoogleLogin(): void {
    const authUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/google`;
    window.location.href = authUrl;
  }

  initiateFacebookLogin(): void {
    const authUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/facebook`;
    window.location.href = authUrl;
  }

  async handleOAuthCallback(token: string): Promise<AuthResponse> {
    this.setToken(token);
    // Get user profile
    const user = await this.getProfile();
    return { access_token: token, user };
  }
}
```

### Step 2: Create OAuth Callback Page

**File**: `frontend/nextjs-app/app/auth/callback/page.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services/auth-service';
import toast from 'react-hot-toast';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      toast.error('Authentication failed. Please try again.');
      router.push('/login');
      return;
    }

    if (token) {
      authService.handleOAuthCallback(token)
        .then(() => {
          toast.success('Successfully logged in!');
          router.push('/dashboard');
        })
        .catch(() => {
          toast.error('Failed to complete login');
          router.push('/login');
        });
    } else {
      router.push('/login');
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
}
```

### Step 3: Update Signup Page (Already Done)

The social login buttons are already added in the previous update to `signup/page.tsx`.

Add click handlers:

```typescript
import { authService } from '@/services/auth-service';

// In the component:
const handleGoogleLogin = () => {
  authService.initiateGoogleLogin();
};

const handleFacebookLogin = () => {
  authService.initiateFacebookLogin();
};

// Update button onClick:
<button onClick={handleGoogleLogin}>Google</button>
<button onClick={handleFacebookLogin}>Facebook</button>
```

---

## 5. OAuth Provider Setup

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs:
   - `http://localhost:3500/api/v1/auth/google/callback`
   - `https://your-domain.com/api/v1/auth/google/callback`
7. Copy **Client ID** and **Client Secret**

### Facebook OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app → **Consumer**
3. Add **Facebook Login** product
4. Settings → Basic:
   - Copy **App ID** and **App Secret**
5. Facebook Login → Settings:
   - Valid OAuth Redirect URIs:
     - `http://localhost:3500/api/v1/auth/facebook/callback`
     - `https://your-domain.com/api/v1/auth/facebook/callback`
6. App Review → Make app public

---

## 6. Testing OAuth Flow

### Test Google Login:
```bash
# Start services
docker-compose up -d auth-service api-gateway

# Frontend
cd frontend/nextjs-app
pnpm dev

# Navigate to http://localhost:3000/signup
# Click "Continue with Google"
```

### Expected Flow:
1. Redirects to Google login
2. User authenticates
3. Redirects back to `/auth/callback?token=xxx`
4. Token is stored
5. User redirects to `/dashboard`

---

## 7. Security Considerations

1. **HTTPS in Production**: Always use HTTPS for OAuth callbacks
2. **State Parameter**: Add CSRF protection with state parameter
3. **Token Storage**: Store tokens in httpOnly cookies (more secure than localStorage)
4. **Scope Limitation**: Only request necessary scopes (email, profile)
5. **Account Linking**: Warn users before linking existing email accounts

---

## 8. Environment Variables Summary

Add to all relevant `.env` files:

```env
# Auth Service
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_CALLBACK_URL=http://localhost:3500/api/v1/auth/google/callback

FACEBOOK_APP_ID=xxx
FACEBOOK_APP_SECRET=xxx
FACEBOOK_CALLBACK_URL=http://localhost:3500/api/v1/auth/facebook/callback

FRONTEND_URL=http://localhost:3000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3500
```

---

## Completion Checklist

- [ ] Install passport dependencies in auth-service
- [ ] Add OAuth strategies (Google, Facebook)
- [ ] Create SocialAccountRepository
- [ ] Update AuthController with OAuth endpoints
- [ ] Implement handleSocialLogin in AuthService
- [ ] Create OAuth callback page in frontend
- [ ] Update signup/login pages with social buttons
- [ ] Set up Google OAuth credentials
- [ ] Set up Facebook OAuth credentials
- [ ] Test Google login flow
- [ ] Test Facebook login flow
- [ ] Add account linking UI
- [ ] Add unlink social account feature

---

**Estimated Implementation Time**: 8-12 hours
