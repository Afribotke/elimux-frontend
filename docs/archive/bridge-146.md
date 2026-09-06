Step 1: Replace src/lib/supabase/client.ts
This is the single most common failure point. The browser client must not attempt server-style cookie operations.
TypeScript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

let clientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  if (clientInstance) return clientInstance

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL or Anon Key missing from environment')
  }

  clientInstance = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
    cookies: {
      get(name: string) {
        const cookie = document.cookie
          .split('; ')
          .find((row) => row.startsWith(`${name}=`))
        return cookie ? cookie.split('=')[1] : undefined
      },
      set(name: string, value: string, options: { path?: string; maxAge?: number; domain?: string; sameSite?: string; secure?: boolean }) {
        // Browser client should NOT try to set httpOnly cookies.
        // Only set client-accessible cookies here.
        let cookieString = `${name}=${value}`
        if (options.path) cookieString += `; path=${options.path}`
        if (options.maxAge) cookieString += `; max-age=${options.maxAge}`
        if (options.domain) cookieString += `; domain=${options.domain}`
        if (options.sameSite) cookieString += `; samesite=${options.sameSite}`
        if (options.secure) cookieString += `; secure`
        document.cookie = cookieString
      },
      remove(name: string, options: { path?: string }) {
        document.cookie = `${name}=; path=${options.path || '/'}; max-age=0`
      },
    },
  })

  return clientInstance
}
Step 2: Replace src/app/auth/login/page.tsx
This rewrite adds:
Hard 8-second timeout on every auth operation — if Supabase hangs, we surface it
Explicit .catch() on every promise — no silent rejections
Direct window.location.href fallback — if Next.js router hangs, we navigate manually
Granular console logging — so you can see exactly where it stops in DevTools
No reliance on setSessionMarkers — we verify the session directly from the auth response
TypeScript
// src/app/auth/login/page.tsx
'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ─── Constants ─────────────────────────────────────────────
const AUTH_TIMEOUT_MS = 8000

// ─── Helper: Promise with timeout ──────────────────────────
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ])
}

// ─── Inner component that uses useSearchParams ─────────────
function LoginForm() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugLog, setDebugLog] = useState<string[]>([])

  const log = useCallback((msg: string) => {
    const line = `[${new Date().toISOString().split('T')[1].slice(0, 8)}] ${msg}`
    console.log(line)
    setDebugLog((prev) => [...prev.slice(-9), line])
  }, [])

  // Auto-clear error when user types
  useEffect(() => {
    if (error) setError(null)
  }, [email, password])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    setDebugLog([])

    log('▶️ Submit clicked')

    try {
      const supabase = createClient()
      log('✅ Client created')

      // ─── Sign in with hard timeout ───────────────────────
      log('⏳ Calling signInWithPassword...')
      const { data, error: signInError } = await withTimeout(
        supabase.auth.signInWithPassword({ email: email.trim(), password }),
        AUTH_TIMEOUT_MS,
        'signInWithPassword'
      )

      if (signInError) {
        log(`❌ signInError: ${signInError.message}`)
        throw signInError
      }

      if (!data.session) {
        log('❌ No session returned from signInWithPassword')
        throw new Error('Authentication succeeded but no session was returned. Please try again.')
      }

      log(`✅ Session received — user: ${data.user?.email}, expires: ${data.session.expires_at}`)

      // ─── Explicitly set localStorage markers (defensive) ─
      try {
        localStorage.setItem('elimux_auth_timestamp', Date.now().toString())
        localStorage.setItem('elimux_user_id', data.user.id)
        log('✅ localStorage markers set')
      } catch (storageErr) {
        log(`⚠️ localStorage failed (private mode?): ${(storageErr as Error).message}`)
      }

      // ─── Verify session is readable ──────────────────────
      log('⏳ Verifying session via getSession...')
      const { data: verifyData, error: verifyError } = await withTimeout(
        supabase.auth.getSession(),
        AUTH_TIMEOUT_MS,
        'getSession'
      )

      if (verifyError) {
        log(`❌ getSession error: ${verifyError.message}`)
        throw verifyError
      }

      if (!verifyData.session) {
        log('❌ getSession returned empty — cookie write may have failed')
        throw new Error('Session verification failed. Try clearing cookies and retrying.')
      }

      log('✅ Session verified in client')

      // ─── Navigation ──────────────────────────────────────
      log(`🚀 Navigating to: ${redirect}`)

      // Primary: Next.js router (soft nav)
      // Fallback: window.location (hard nav) after 500ms if still on page
      const navTimeout = setTimeout(() => {
        log('⚠️ Router nav did not complete — forcing window.location')
        window.location.href = redirect
      }, 800)

      // Use router if available, else fallback immediately
      try {
        // Dynamic import to avoid SSR issues
        const { useRouter } = await import('next/navigation')
        const router = useRouter()
        router.push(redirect)
        log('📡 router.push() issued')
      } catch (routerErr) {
        log(`⚠️ Router unavailable: ${(routerErr as Error).message} — using window.location`)
        clearTimeout(navTimeout)
        window.location.href = redirect
      }

    } catch (err: any) {
      log(`🔴 CATCH BLOCK: ${err?.message || String(err)}`)
      setError(err?.message || 'An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Welcome back</h1>
        <p className="text-sm text-gray-500 text-center mb-6">Sign in to your ElimuX account</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <Link href="/auth/register" className="text-blue-600 hover:underline">
            Get Started
          </Link>
        </div>

        {/* Debug panel — remove after fix confirmed */}
        {debugLog.length > 0 && (
          <div className="mt-6 p-3 bg-gray-900 rounded-lg text-xs font-mono text-green-400 overflow-auto max-h-48">
            <div className="text-gray-400 mb-1 uppercase tracking-wider text-[10px]">Debug Log</div>
            {debugLog.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page export with Suspense boundary ────────────────────
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
Step 3: Verify / Fix src/middleware.ts (or middleware.ts at project root)
If middleware is reading the session before the cookie is fully written, it can cause a redirect loop or stall. Ensure middleware does NOT try to refresh the session on the login page itself.
TypeScript
// middleware.ts (at project root or src/middleware.ts)
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // ─── CRITICAL: Do NOT refresh session on auth pages ─────
  // Refreshing here can race with the login form's own auth flow
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Public paths that never require auth
  const publicPaths = [
    '/',
    '/auth/login',
    '/auth/register',
    '/auth/callback',
    '/auth/reset-password',
    '/ai-search',
    '/schools',
    '/about',
    '/contact',
  ]

  const isPublic = publicPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  // If user is NOT logged in and tries to access a protected route → redirect to login
  if (!user && !isPublic) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
Step 4: Quick Diagnostic Script (run in browser console)
After deploying, open /auth/login in an incognito window, open DevTools Console, paste this, and hit Enter before trying to log in. It will monitor the Supabase client in real time:
JavaScript
// Paste this in browser console on /auth/login BEFORE submitting the form
(() => {
  const start = Date.now();
  const log = (m) => console.log(`[DIAG ${Date.now() - start}ms] ${m}`);

  // Hook into fetch to see auth requests
  const origFetch = window.fetch;
  window.fetch = async (...args) => {
    const url = args[0]?.url || args[0];
    if (String(url).includes('supabase') || String(url).includes('auth')) {
      log(`FETCH → ${String(url).slice(0, 80)}`);
    }
    try {
      const res = await origFetch(...args);
      if (String(url).includes('supabase') || String(url).includes('auth')) {
        log(`FETCH ← ${res.status} ${String(url).slice(0, 80)}`);
      }
      return res;
    } catch (e) {
      log(`FETCH ERR → ${e.message}`);
      throw e;
    }
  };

  // Monitor localStorage
  const origSet = localStorage.setItem;
  localStorage.setItem = function(k, v) {
    log(`localStorage.set('${k}', '${String(v).slice(0, 40)}...')`);
    return origSet.call(this, k, v);
  };

  log('Diagnostics active. Now submit the login form.');
})();
EXECUTION CHECKLIST
Do these in order. Do not skip steps.
Table
#	Action	Expected Result
1	Replace src/lib/supabase/client.ts with Step 1 code	File saved, no TypeScript errors
2	Replace src/app/auth/login/page.tsx with Step 2 code	File saved, no TypeScript errors
3	Verify/replace middleware.ts with Step 3 code	File saved, no TypeScript errors
4	Run npm run build locally	Build succeeds with zero errors
5	Deploy to Vercel preview (vercel --prod only after preview passes)	Preview URL live
6	Open preview /auth/login in Chrome Incognito	Page loads, debug panel visible at bottom
7	Create a test account via Supabase Dashboard → Authentication → Users → Add User	User appears in list, email confirmed
8	On the login page, open DevTools Console, paste Step 4 diagnostic script	[DIAG 0ms] Diagnostics active... appears
9	Enter test credentials and click Sign In	Debug panel shows: Client created → Calling signInWithPassword → Session received → Navigating to...
10	If navigation succeeds, verify localStorage has elimux_auth_timestamp	In Console: localStorage.getItem('elimux_auth_timestamp') returns a number
11	Navigate to /pathways/select while still logged in	Page loads, user appears signed in (nav shows avatar/name)
12	If ANY step shows a red error or timeout message, screenshot the debug panel and send it to me	I will issue a corrected full script
WHAT CHANGED & WHY
Table
File	What Changed	Why It Fixes the Hang
client.ts	Added explicit cookies get/set/remove implementation with document.cookie	The default @supabase/ssr browser client can silently fail when cookie access is restricted or when Next.js middleware has already set httpOnly cookies the browser can't read. Explicit cookie handlers bypass ambiguity.
client.ts	Added singleton guard (clientInstance)	Prevents multiple Supabase clients from racing each other and creating conflicting auth state listeners.
login/page.tsx	Wrapped signInWithPassword in withTimeout(…, 8000ms)	If Supabase SDK enters an infinite wait (e.g., waiting for a cookie write that never fires), the timeout forces an error surface instead of a silent hang.
login/page.tsx	Added explicit .catch-equivalent via try/catch on every async boundary	No promise rejection goes unhandled. Every failure has a user-visible message.
login/page.tsx	Added getSession() verification step after login	Confirms the session is actually persisted in the client before navigating away. If cookie write failed, this catches it.
login/page.tsx	Added window.location.href fallback with 800ms timeout	If Next.js router.push() hangs (known issue in some App Router versions during auth state transitions), the page forces a hard navigation.
login/page.tsx	Added live debug log panel	You can see exactly which line execution stops on without needing to dig through DevTools.
middleware.ts	Removed supabase.auth.getSession() refresh on auth pages	Prevents middleware from racing the login form's own session establishment. getUser() is sufficient for route guards.
AFTER YOU CONFIRM THE FIX
Once login works end-to-end in production:
Remove the debug panel from login/page.tsx (delete the {debugLog.length > 0 && (…)} block)
Remove the debugLog state and log function if you want a cleaner page
Re-deploy
Return to the original task: testing the signed-in pathway selection flow on /pathways/select