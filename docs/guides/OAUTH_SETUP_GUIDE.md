# OAuth Setup Guide - Google & Facebook Login

## Quick Start

This guide shows you how to enable **Google** and **Facebook** login for your Local Service Marketplace.

---

## ✅ What's Already Implemented

The OAuth infrastructure is **already integrated** into your application:

- ✅ **NextAuth v5** with Google & Facebook providers configured
- ✅ **Login & Signup pages** with OAuth buttons
- ✅ **Automatic session management** after OAuth login
- ✅ **Error handling** for OAuth failures
- ✅ **Callback URLs** configured

**You just need to add your OAuth credentials!**

---

## 🔑 Step 1: Get Google OAuth Credentials

### 1.1 Go to Google Cloud Console
Visit: https://console.cloud.google.com/

### 1.2 Create a New Project (or select existing)
1. Click the project dropdown at the top
2. Click "New Project"
3. Name it: "Local Service Marketplace"
4. Click "Create"

### 1.3 Enable Google+ API
1. Go to **APIs & Services → Library**
2. Search for "Google+ API"
3. Click it and press "Enable"

### 1.4 Create OAuth Credentials
1. Go to **APIs & Services → Credentials**
2. Click **"+ CREATE CREDENTIALS"** → **OAuth client ID**
3. If prompted, configure the **OAuth consent screen**:
   - User Type: **External**
   - App name: **Local Service Marketplace**
   - User support email: **your email**
   - Developer contact: **your email**
   - Click **Save and Continue**
   - Scopes: Click **Save and Continue** (defaults are fine)
   - Test users: Add your email for testing
   - Click **Save and Continue**

4. Back to Create OAuth Client ID:
   - Application type: **Web application**
   - Name: **Local Service Marketplace - Web**
   
5. **Authorized redirect URIs** - Add these URLs:
   ```
   http://localhost:3000/api/auth/callback/google
   http://localhost:3007/api/auth/callback/google
   ```
   
   For production, also add:
   ```
   https://yourdomain.com/api/auth/callback/google
   ```

6. Click **Create**

7. **Copy your credentials:**
   - Client ID: `xxxxx.apps.googleusercontent.com`
   - Client Secret: `xxxxxx`

### 1.5 Add to .env.local
Open `frontend/.env.local` and update:

```env
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

---

## 📘 Step 2: Get Facebook OAuth Credentials

### 2.1 Go to Facebook Developers
Visit: https://developers.facebook.com/

### 2.2 Create a New App
1. Click **"My Apps"** → **"Create App"**
2. Choose use case: **"Other"** or **"Consumer"**
3. App Type: **Business**
4. Display Name: **Local Service Marketplace**
5. Contact Email: **your email**
6. Click **Create App**

### 2.3 Add Facebook Login Product
1. Find **"Facebook Login"** in the products list
2. Click **"Set Up"**
3. Choose platform: **Web**
4. Skip the quickstart (we've already integrated it)

### 2.4 Configure OAuth Settings
1. Go to **Facebook Login → Settings** (left sidebar)
2. Under **"Valid OAuth Redirect URIs"**, add:
   ```
   http://localhost:3000/api/auth/callback/facebook
   http://localhost:3007/api/auth/callback/facebook
   ```
   
   For production, also add:
   ```
   https://yourdomain.com/api/auth/callback/facebook
   ```

3. Click **Save Changes**

### 2.5 Get App Credentials
1. Go to **Settings → Basic** (left sidebar)
2. Copy your credentials:
   - **App ID**: `xxxxxxxxxxxxx`
   - **App Secret**: Click **"Show"**, then copy

### 2.6 Add to .env.local
Open `frontend/.env.local` and update:

```env
FACEBOOK_CLIENT_ID=your_facebook_app_id_here
FACEBOOK_CLIENT_SECRET=your_facebook_app_secret_here
```

---

## 🚀 Step 3: Test OAuth Login

### 3.1 Restart Frontend Dev Server
```bash
cd frontend
npm run dev
```

### 3.2 Test Google Login
1. Visit: http://localhost:3007/login
2. Click **"Google"** button
3. You should be redirected to Google
4. Sign in with your Google account
5. After approval, you'll be redirected to `/dashboard`

### 3.3 Test Facebook Login
1. Visit: http://localhost:3007/login
2. Click **"Facebook"** button
3. You should be redirected to Facebook
4. Sign in with your Facebook account
5. After approval, you'll be redirected to `/dashboard`

---

## 🔍 Troubleshooting

### Error: "redirect_uri_mismatch"
**Problem**: The callback URL in your OAuth app doesn't match NextAuth's callback URL.

**Solution**:
1. Check your current port (3007 or 3000?)
2. Add BOTH URLs to your OAuth app:
   - `http://localhost:3000/api/auth/callback/google`
   - `http://localhost:3007/api/auth/callback/google`

### Error: "invalid_client"
**Problem**: Client ID or Secret is wrong.

**Solution**:
1. Double-check your `.env.local` file
2. Make sure there are no extra spaces
3. Restart the dev server after changing `.env.local`

### Error: "access_denied"
**Problem**: User cancelled the OAuth flow.

**Solution**: This is normal - user chose not to authorize.

### Google: "This app isn't verified"
**Problem**: Google shows a warning for unverified apps.

**Solution** (for development):
1. Click **"Advanced"**
2. Click **"Go to [App Name] (unsafe)"**
3. For production, submit your app for verification

### Facebook: "App Not Set Up for Public Use"
**Problem**: Facebook app is in development mode.

**Solution**:
1. Go to **Settings → Basic**
2. Make sure "App Mode" is set to **"Development"** for testing
3. Add test users in **Roles → Test Users**
4. For production, switch to **"Live"** mode

---

## 🔐 Security Notes

### Environment Variables
- ✅ **Never commit** `.env.local` to Git (it's in `.gitignore`)
- ✅ Use different credentials for **development** and **production**
- ✅ Rotate secrets regularly in production

### OAuth Scopes
Current implementation requests minimal scopes:
- **Google**: Profile, Email
- **Facebook**: Public Profile, Email

### Callback URLs
- ✅ Only add **trusted URLs** to your OAuth apps
- ✅ Use **HTTPS** for all production callback URLs
- ✅ Validate redirect URLs to prevent open redirects

---

## 📊 How It Works

### User Flow
```
1. User clicks "Sign in with Google/Facebook"
   ↓
2. NextAuth redirects to OAuth provider
   ↓
3. User authenticates and grants permissions
   ↓
4. OAuth provider redirects back with authorization code
   ↓
5. NextAuth exchanges code for user info
   ↓
6. NextAuth creates session with user data
   ↓
7. User is redirected to /dashboard
```

### Session Management
- OAuth users get the **same JWT session** as email/password users
- Session includes: `id`, `email`, `name`, `image`, `role`
- Auto-refresh token every 15 minutes
- Session expires after 7 days of inactivity

### Account Linking
- If user signs in with Google using same email as existing account → **auto-linked**
- If different email → **new account created**
- Users can link multiple OAuth providers later (future feature)

---

## 📝 Configuration Reference

### Environment Variables (.env.local)
```env
# NextAuth
AUTH_SECRET=your_secret_here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxxx

# Facebook OAuth
FACEBOOK_CLIENT_ID=xxxxxxxxxxxxx
FACEBOOK_CLIENT_SECRET=xxxxxxxxxxxxxx
```

### Callback URLs by Environment
| Environment | Google Callback | Facebook Callback |
|-------------|----------------|-------------------|
| Development | `http://localhost:3000/api/auth/callback/google` | `http://localhost:3000/api/auth/callback/facebook` |
| Alt Port | `http://localhost:3007/api/auth/callback/google` | `http://localhost:3007/api/auth/callback/facebook` |
| Production | `https://yourdomain.com/api/auth/callback/google` | `https://yourdomain.com/api/auth/callback/facebook` |

---

## 🎯 Next Steps

After OAuth is working:

1. **Customize OAuth consent screens** with your branding
2. **Submit for verification** (Google & Facebook) for production use
3. **Add more providers** (Apple, GitHub, Twitter) if needed
4. **Implement account linking** to let users connect multiple providers
5. **Add role selection** during OAuth signup (customer vs provider)

---

## 📚 Additional Resources

- [NextAuth Documentation](https://next-auth.js.org/)
- [Google OAuth 2.0 Setup](https://support.google.com/cloud/answer/6158849)
- [Facebook Login Setup](https://developers.facebook.com/docs/facebook-login/web)
- [OAuth 2.0 Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)

---

**Need help?** Check the [error page documentation](./OAUTH_INTEGRATION_GUIDE.md) or contact support.
