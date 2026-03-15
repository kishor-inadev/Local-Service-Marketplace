# NextAuth.js Migration Guide

## What Changed

Your frontend authentication has been migrated from **localStorage-based JWT** to **NextAuth.js v5** for improved security and functionality.

---

## Key Benefits

✅ **No more XSS vulnerabilities** - Tokens stored in HTTP-only cookies
✅ **Server-side authentication** - Works with SSR and middleware
✅ **Automatic token refresh** - Built-in session management
✅ **CSRF protection** - Built-in security
✅ **OAuth ready** - Easy to add Google, GitHub, etc.
✅ **Type-safe** - Full TypeScript support

---

## Files Changed

### ✅ Added Files

- `auth.config.ts` - NextAuth configuration
- `app/api/auth/[...nextauth]/route.ts` - NextAuth API handlers
- `types/next-auth.d.ts` - TypeScript type extensions

### ✅ Modified Files

- `package.json` - Added next-auth dependencies
- `middleware.ts` - Now uses NextAuth for route protection
- `hooks/useAuth.ts` - Updated to use NextAuth session
- `services/auth-service.ts` - Updated for NextAuth compatibility
- `app/providers.tsx` - Added SessionProvider
- `.env` & `.env.example` - Added AUTH_SECRET and NEXTAUTH_URL

### ⚠️ Deprecated (but kept for compatibility)

- `store/authStore.ts` - No longer used, replaced by NextAuth session

---

## Installation

Install the new dependencies:

```bash
cd frontend
pnpm install
```

---

## Environment Variables

**Required:** Add these to your `.env` file:

```bash
# Generate a secure secret for production:
# openssl rand -base64 32
AUTH_SECRET=your_generated_secret_here

NEXTAUTH_URL=http://localhost:3000
```

**For production**, generate a strong secret:
```bash
openssl rand -base64 32
```

---

## Usage Guide

### Login (Client Component)

```tsx
'use client';

import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const { login, isLoading } = useAuth();

  const handleSubmit = async (email: string, password: string) => {
    try {
      await login(email, password);
      // Redirects to /dashboard automatically
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Your login form */}
    </form>
  );
}
```

### Signup (Client Component)

```tsx
'use client';

import { useAuth } from '@/hooks/useAuth';

export default function SignupPage() {
  const { signup } = useAuth();

  const handleSubmit = async (data) => {
    await signup({
      email: data.email,
      password: data.password,
      name: data.name,
      role: 'customer',
    });
    // Automatically logs in and redirects
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Your signup form */}
    </form>
  );
}
```

### Logout

```tsx
'use client';

import { useAuth } from '@/hooks/useAuth';

export default function Header() {
  const { logout } = useAuth();

  return (
    <button onClick={logout}>
      Logout
    </button>
  );
}
```

### Access User Data

```tsx
'use client';

import { useAuth } from '@/hooks/useAuth';

export default function Profile() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Not logged in</div>;

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
    </div>
  );
}
```

### Server-Side Authentication (Server Component)

```tsx
import { auth } from '@/auth.config';

export default async function ServerPage() {
  const session = await auth();

  if (!session) {
    return <div>Not authenticated</div>;
  }

  return (
    <div>
      <h1>Server-side: {session.user.name}</h1>
      <p>Role: {session.user.role}</p>
    </div>
  );
}
```

### Protect Routes with Middleware

Routes are automatically protected by middleware:

- `/login`, `/signup` → Redirect to `/dashboard` if logged in
- All other routes → Redirect to `/login` if not logged in
- Public routes: `/`, `/login`, `/signup`, `/auth/callback`, `/verify-email`

To add more public routes, edit `middleware.ts`:

```ts
const publicRoutes = ['/', '/login', '/signup', '/about', '/contact'];
```

### Role-Based Access

```tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

export default function AdminPage() {
  const { requireRole } = useAuth();

  useEffect(() => {
    const hasAccess = requireRole(['admin']);
    // Automatically redirects if not admin
  }, []);

  return <div>Admin Content</div>;
}
```

---

## API Requests

API requests now automatically include authentication cookies:

```tsx
import { apiClient } from '@/services/api-client';

// Cookies are sent automatically (withCredentials: true)
const response = await apiClient.get('/user/profile');
```

**No need to:**
- Manually set Authorization headers
- Store tokens in localStorage
- Handle token refresh manually

---

## OAuth (Future Enhancement)

NextAuth makes it easy to add social login:

```ts
// auth.config.ts
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";

export const authConfig = {
  providers: [
    Credentials({ /* ... */ }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  // ...
};
```

---

## Testing

Run the development server:

```bash
pnpm dev
```

Test authentication flow:
1. Navigate to `/login`
2. Enter credentials
3. Verify redirect to `/dashboard`
4. Check session persistence on page refresh
5. Test logout functionality

---

## Security Notes

🔒 **HTTP-Only Cookies**: Tokens cannot be accessed by JavaScript (XSS protection)
🔒 **CSRF Protection**: Built-in using SameSite cookies
🔒 **Secure in Production**: Cookies only sent over HTTPS when `NODE_ENV=production`
🔒 **Auto Session Refresh**: Session refreshed every 5 minutes

---

## Troubleshooting

### "Invalid session" errors

- Ensure `AUTH_SECRET` is set in `.env`
- Restart dev server after adding environment variables

### Infinite redirects

- Check `middleware.ts` route configuration
- Ensure `/login` is in `publicRoutes` array

### Session not persisting

- Check browser cookies are enabled
- Verify `withCredentials: true` in API client
- Check CORS settings allow credentials

### TypeScript errors

- Run: `pnpm install` to ensure types are installed
- Restart TypeScript server in VS Code

---

## Migration Checklist

- [x] Install next-auth dependencies
- [x] Create auth.config.ts
- [x] Create API route handler
- [x] Update middleware
- [x] Update useAuth hook
- [x] Add SessionProvider to app
- [x] Add TypeScript types
- [x] Update environment variables
- [ ] Install dependencies: `pnpm install`
- [ ] Test login flow
- [ ] Test logout flow
- [ ] Test protected routes
- [ ] Test session persistence
- [ ] Remove old authStore usage (optional)

---

## Next Steps

1. **Install dependencies**: `cd frontend && pnpm install`
2. **Start dev server**: `pnpm dev`
3. **Test authentication**: Visit http://localhost:3000/login
4. **Update components**: Replace any direct `authStore` usage with `useAuth` hook
5. **(Optional) Add OAuth**: Configure Google/GitHub providers

---

## Need Help?

- NextAuth.js Docs: https://next-auth.js.org/
- Example Usage: Check updated `hooks/useAuth.ts`
- Type Definitions: See `types/next-auth.d.ts`

