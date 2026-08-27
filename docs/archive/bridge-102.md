AUDIT — Current Auth State
What exists (known):
Supabase Auth with email/password login
profiles table with user data
Login page at /login
Auth nav with user state display
Supabase client setup in lib/supabase/
What's missing for Google OAuth:
OAuth callback route handler (/auth/callback)
Google sign-in button on login page
Profile auto-creation on first Google sign-in
Proper redirect URL configuration in the client
BRIDGE.MD — GOOGLE OAUTH INTEGRATION
Save this to C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend\docs\bridge.md for Claude to execute.
Markdown
Copy
Code
Preview
# Cycle — Google OAuth Sign-In Integration

## 0. Preconditions
- [ ] Confirm `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are in `.env.local`
- [ ] Confirm Google OAuth is enabled in Supabase Auth → Providers → Google
- [ ] Confirm Authorized Redirect URI in Google Console includes: `https://<project-ref>.supabase.co/auth/v1/callback`

## 1. Create OAuth Callback Route

**File:** `app/auth/callback/route.ts` (NEW)

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
2. Update Login Page — Add Google Sign-In Button
File: app/login/page.tsx (MODIFY — add Google button, keep existing email form)
Add these imports at the top:
TypeScript
import { createClient } from '@/lib/supabase/client'
Add this function inside the LoginPage component (before the return):
TypeScript
const handleGoogleSignIn = async () => {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback?next=/`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })
  if (error) {
    console.error('Google sign-in error:', error)
    setError('Failed to sign in with Google. Please try again.')
  }
}
Add this button inside the form/card area, below the email/password submit button:
tsx
<div className="relative my-6">
  <div className="absolute inset-0 flex items-center">
    <div className="w-full border-t border-gray-300 dark:border-gray-600" />
  </div>
  <div className="relative flex justify-center text-sm">
    <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
      Or continue with
    </span>
  </div>
</div>

<button
  type="button"
  onClick={handleGoogleSignIn}
  className="w-full flex items-center justify-center gap-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
>
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
  Sign in with Google
</button>
3. Ensure Profile Auto-Creation on OAuth Sign-In
File: lib/supabase/client.ts or your auth hook/context — add a listener for SIGNED_IN that creates a profile if missing.
If you have an auth provider/context file (e.g., app/providers/auth-provider.tsx or similar), add this effect:
TypeScript
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { id, email, user_metadata } = session.user
        
        // Check if profile exists
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', id)
          .single()
        
        if (!existing) {
          // Create profile for Google user
          const { error } = await supabase.from('profiles').insert({
            id,
            email,
            full_name: user_metadata?.full_name || user_metadata?.name || '',
            avatar_url: user_metadata?.avatar_url || user_metadata?.picture || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            role: 'student', // default role
          })
          
          if (error) {
            console.error('Profile creation error:', error)
          }
        }
      }
    }
  )

  return () => subscription.unsubscribe()
}, [])
If no auth context exists, create a minimal one:
File: app/providers/auth-provider.tsx (NEW)
TypeScript
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

type AuthContextType = {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        // Auto-create profile on OAuth sign-in
        if (event === 'SIGNED_IN' && session?.user) {
          const { id, email, user_metadata } = session.user
          
          const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', id)
            .single()
          
          if (!existing) {
            await supabase.from('profiles').insert({
              id,
              email,
              full_name: user_metadata?.full_name || user_metadata?.name || '',
              avatar_url: user_metadata?.avatar_url || user_metadata?.picture || '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              role: 'student',
            })
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
File: app/layout.tsx (MODIFY — wrap with AuthProvider)
Add import:
TypeScript
import { AuthProvider } from './providers/auth-provider'
Wrap the body content:
tsx
<AuthProvider>
  {children}
</AuthProvider>
4. Update Navigation to Use Auth Context
File: components/navbar.tsx or wherever auth state is displayed (MODIFY)
Replace any direct Supabase session checks with the useAuth hook:
TypeScript
'use client'

import { useAuth } from '@/app/providers/auth-provider'
// ... other imports

export function Navbar() {
  const { user, loading } = useAuth()
  
  // Use `user` instead of local session state
  // Show avatar, name, logout button when user exists
  // Show "Sign In" when user is null
}
5. RLS Policy — Ensure Profiles Table Allows Insert
Run this in Supabase SQL Editor if not already present:
sql
-- Allow users to create their own profile (needed for OAuth auto-create)
CREATE POLICY IF NOT EXISTS "Users can create own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow users to read their own profile
CREATE POLICY IF NOT EXISTS "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);
6. Build Verification Steps
npm run build — must pass with zero TypeScript errors
Test locally: click Google button → redirects to Google → redirects back to /auth/callback → redirects to homepage logged in
Check Supabase Auth → Users — new Google user should appear
Check profiles table — new row should exist with full_name, avatar_url populated from Google
Verify logout clears session and navbar updates
7. Commit Scope
app/auth/callback/route.ts (new)
app/providers/auth-provider.tsx (new)
app/login/page.tsx (modified — Google button)
app/layout.tsx (modified — AuthProvider wrap)
Any navbar/auth display components updated to use useAuth()
DO NOT commit until build passes and local test succeeds.
plain

---

## What This Does

| Component | Purpose |
|-----------|---------|
| `/auth/callback` route | Receives the OAuth `code` from Supabase, exchanges it for a session cookie, redirects to homepage |
| Google button | Triggers `signInWithOAuth({ provider: 'google' })` with offline access (for refresh tokens) |
| Auth Provider | Centralizes auth state across the app and auto-creates a `profiles` row when a Google user signs in for the first time |
| `useAuth()` hook | Replaces scattered session checks — navbar and all components read from one source of truth |

## Critical Notes

1. **The `redirectTo` URL** must exactly match what you configured in Supabase Auth → URL Configuration → Redirect URLs. Usually `https://www.elimux.ke/auth/callback` for production and `http://localhost:3000/auth/callback` for local dev.

2. **Profile fields** — The code assumes your `profiles` table has: `id` (uuid, PK), `email`, `full_name`, `avatar_url`, `role`, `created_at`, `updated_at`. If your schema differs, adjust the insert object.

3. **Existing email users** — If someone previously signed up with `john@gmail.com` via email, then clicks Google with the same email, Supabase will link the identities under one user by default (if "Allow manual linking" is off). Their existing profile remains intact.

4. **Avatar display** — With `avatar_url` now populated from Google, your navbar can show the real Google profile picture instead of a placeholder.

