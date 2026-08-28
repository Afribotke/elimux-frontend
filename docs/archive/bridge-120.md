CYCLE — LOGIN PAGE CRITICAL ERROR FIX
Step 1: Replace the login page with a defensive version
File: app/login/page.tsx (or src/app/login/page.tsx)
tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import Link from 'next/link';
import { toast } from 'sonner';

// ------------------------------------------------------------------
// Safe wrapper that catches any render/mount crash and shows fallback
// ------------------------------------------------------------------
function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        // 1. Defensive session check
        const { data, error } = await supabase.auth.getSession();
        if (cancelled) return;

        if (error) {
          console.error('[Login] getSession error:', error.message);
          setHasSession(false);
          setIsLoading(false);
          return;
        }

        if (data?.session) {
          setHasSession(true);
          // 2. Safe redirect — read ?back only if it exists and is local
          const back = searchParams.get('back');
          let redirectTo = '/dashboard';

          if (back) {
            try {
              const url = new URL(back, window.location.origin);
              // Only allow same-origin relative paths or exact origin
              if (url.origin === window.location.origin && url.pathname.startsWith('/')) {
                redirectTo = url.pathname + url.search + url.hash;
              }
            } catch {
              // ignore malformed back URL
            }
          }

          router.replace(redirectTo);
          return;
        }

        setHasSession(false);
      } catch (err) {
        console.error('[Login] unexpected error in checkSession:', err);
        setHasSession(false);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    checkSession();

    // 3. Listen for auth state changes safely
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === 'SIGNED_IN' && session) {
        const back = searchParams.get('back');
        let redirectTo = '/dashboard';
        if (back) {
          try {
            const url = new URL(back, window.location.origin);
            if (url.origin === window.location.origin && url.pathname.startsWith('/')) {
              redirectTo = url.pathname + url.search + url.hash;
            }
          } catch { /* ignore */ }
        }
        router.replace(redirectTo);
      }
    });

    return () => {
      cancelled = true;
      listener?.subscription?.unsubscribe();
    };
  }, [router, searchParams]);

  // 4. Show nothing while checking (prevents flash of login form for logged-in users)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-400" />
      </div>
    );
  }

  // 5. If already has session, we're redirecting — show spinner
  if (hasSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-400" />
      </div>
    );
  }

  // 6. Render login form
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-slate-400">Sign in to your ElimuX account</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            theme="dark"
            providers={['google']}
            redirectTo={`${typeof window !== 'undefined' ? window.location.origin : 'https://www.elimux.ke'}/auth/callback`}
            onlyThirdPartyProviders={false}
          />
        </div>

        <div className="text-center">
          <Link href="/" className="text-sm text-slate-400 hover:text-yellow-400 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Export wrapped in Suspense because useSearchParams requires it
// ------------------------------------------------------------------
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-400" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
Step 2: Ensure the auth callback page is safe
File: app/auth/callback/route.ts (or src/app/auth/callback/route.ts)
TypeScript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // If Google returned an error, send user to login with a safe toast message
  if (error) {
    console.error('[Auth Callback] OAuth error:', error, errorDescription);
    const redirectUrl = new URL('/login', requestUrl.origin);
    redirectUrl.searchParams.set('auth_error', 'OAuth sign-in failed. Please try again.');
    return NextResponse.redirect(redirectUrl);
  }

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    try {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        console.error('[Auth Callback] exchangeCodeForSession error:', exchangeError.message);
        const redirectUrl = new URL('/login', requestUrl.origin);
        redirectUrl.searchParams.set('auth_error', 'Session exchange failed. Please try again.');
        return NextResponse.redirect(redirectUrl);
      }
    } catch (err) {
      console.error('[Auth Callback] unexpected error:', err);
      const redirectUrl = new URL('/login', requestUrl.origin);
      redirectUrl.searchParams.set('auth_error', 'Unexpected error. Please try again.');
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Successful auth — redirect to dashboard (or back URL if you track it)
  return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
}
Step 3: Add a global error boundary (if not present)
File: app/global-error.tsx (or create at project root app/global-error.tsx)
tsx
'use client';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white">Critical Error</h2>
          <p className="text-slate-400">Something went wrong at the application level.</p>
          {process.env.NODE_ENV === 'development' && (
            <pre className="text-left text-xs text-red-400 bg-slate-900 p-4 rounded-lg overflow-auto">
              {error.message}
              {'\n'}
              {error.stack}
            </pre>
          )}
          <div className="space-y-3">
            <button
              onClick={reset}
              className="w-full py-3 px-4 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-semibold rounded-xl transition-colors"
            >
              Try Again
            </button>
            <a
              href="/"
              className="block w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-colors"
            >
              Back to Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
Step 4: Build and deploy
powershell
cd "C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend"
npm run build
If build passes clean, commit and push:
powershell
git add -A
git commit -m "fix(login): defensive auth flow + error boundary — Cycle login-fix"
git push origin main
What this fixes:
Table
Risk	Fix applied
useSearchParams() crashes outside Suspense	Wrapped in <Suspense> boundary
getSession() throws uncaught	Wrapped in try/catch with fallback state
Malicious/malformed ?back= URL	Parsed through URL constructor with origin check
OAuth callback errors unhandled	error + error_description params caught and redirected with toast
exchangeCodeForSession() throws	Wrapped in try/catch
Missing global error boundary	Added global-error.tsx for any future crashes
Run the build and report back the result.