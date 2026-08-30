'use client'

// ============================================
// ELIMUX - GENERIC LOGIN
// /auth/login
// Works for all account types (student, partner, advertiser,
// institution, admin). Redirects to ?redirect= if present,
// otherwise to the role's default home via getRoleHomePath.
// ============================================

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, Lock, LogIn } from 'lucide-react'
import { createClient, setSessionMarkers } from '@/lib/supabase/client'
import { getRoleHomePath, type UserRole } from '@/lib/auth/rbac'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // This is the front door for every account type (student, employer,
  // etc. - see header comment). It must write the session with the same
  // client every downstream page reads it with. It previously used the
  // plain @supabase/supabase-js client from '@/lib/supabase', while
  // employer/student pages (register, settings, apply, profile, logbook)
  // all read the session via the @supabase/ssr browser client from
  // '@/lib/supabase/client' - two different storage formats under
  // (coincidentally) similar-looking keys, so a session written here was
  // never visible to getSession() on those pages. Verified in production:
  // this broke employer registration outright for a genuinely logged-in
  // user, and by the same mechanism almost certainly broke the internship
  // application flow too.
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  useEffect(() => {
    const message = searchParams.get('message')
    if (message) {
      setError(message)
      return
    }
    const errorCode = searchParams.get('error')
    if (errorCode) {
      setError('Sign-in failed. Please try again.')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Temporary diagnostic timeout + logging around a real, reproduced
      // production hang: the SDK call below sometimes never resolves (the
      // raw REST call it wraps succeeds fine), leaving the button stuck on
      // "Signing in..." forever with no error. This surfaces it instead of
      // hanging silently, and the console trail pinpoints which step stalls.
      console.log('[Login] calling signInWithPassword...')
      const AUTH_TIMEOUT_MS = 10000
      const { data, error: signInError } = await Promise.race([
        supabase.auth.signInWithPassword({ email, password }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Login request timed out. Please check your connection and try again.')),
            AUTH_TIMEOUT_MS
          )
        ),
      ])
      console.log('[Login] signInWithPassword resolved - error:', signInError?.message ?? 'none')

      if (signInError || !data.session) {
        setError(signInError?.message || 'Invalid email or password.')
        setLoading(false)
        return
      }

      if (!data.session.user.email_confirmed_at) {
        await supabase.auth.signOut()
        setError('Please verify your email before signing in. Check your inbox for the verification link.')
        setLoading(false)
        return
      }

      console.log('[Login] session valid, calling setSessionMarkers...')
      setSessionMarkers(rememberMe)
      console.log('[Login] setSessionMarkers done')

      const redirect = searchParams.get('redirect')
      if (redirect) {
        console.log('[Login] navigating to redirect:', redirect)
        router.push(redirect)
        return
      }

      const { data: roleRow } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.session.user.id)
        .single()

      const role = (roleRow?.role as UserRole) || 'student'
      console.log('[Login] navigating to role home:', role)
      router.push(getRoleHomePath(role))
    } catch (err) {
      // Guards against an unexpected throw (e.g. a network failure) from
      // leaving the button stuck on "Signing in..." with no feedback -
      // signInWithPassword's own expected failures already return
      // { error } above rather than throwing, so this only catches the
      // unexpected case.
      console.error('[Login] unexpected error during sign-in:', err)
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    try {
      // The redirect to Google navigates away from this page, so the markers
      // must be set now rather than after the round trip completes - they're
      // real cookies on the elimux.ke domain and survive the navigation.
      setSessionMarkers(rememberMe)
      const redirectParam = searchParams.get('redirect')
      const callbackUrl = `${window.location.origin}/auth/callback${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ''}`
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: callbackUrl },
      })
      if (oauthError) setError(oauthError.message)
    } catch (err) {
      console.error('[Login] unexpected error during Google sign-in:', err)
      setError('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-elimux-dark py-12 px-4 flex items-center justify-center">
      <div className="max-w-md w-full">
        <Image src="/logo-white.png" alt="ElimuX" width={128} height={128} className="h-16 w-16 mx-auto mb-6" priority />

        <div className="bg-elimux-card rounded-xl border border-border shadow-soft-lg overflow-hidden">
          <div className="px-8 py-6 border-b border-border">
            <h1 className="text-balance text-2xl font-bold text-foreground">Sign In</h1>
            <p className="text-muted mt-1 text-sm">Sign in to your ElimuX account</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {error && (
              <div role="alert" className="bg-elimux-danger/10 border border-elimux-danger/30 rounded-lg p-4 text-elimux-danger text-sm animate-fade-in">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="text-sm text-muted mb-1 block flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground transition-all focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="text-sm text-muted flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Password
                </label>
                <Link href="/auth/forgot-password" className="text-sm text-primary-400 hover:text-primary-300">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground transition-all focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30"
              />
            </div>

            <label htmlFor="rememberMe" className="flex items-center gap-2 text-sm text-muted cursor-pointer select-none">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-border"
              />
              Remember this device for 30 days
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-elimux-dark font-semibold py-3 px-6 rounded-lg shadow-soft hover:shadow-soft-lg transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-elimux-card px-2 text-muted">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 rounded-lg border border-border bg-elimux-dark px-4 py-2.5 text-sm font-medium text-foreground hover:bg-elimux-dark/60 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Sign in with Google
            </button>

            <p className="text-sm text-muted text-center">
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="text-primary-400 hover:text-primary-300">
                Sign up
              </Link>
            </p>

            <div className="text-xs text-muted text-center space-x-3 pt-2 border-t border-border">
              <span>Institution?</span>
              <Link href="/institution/login" className="text-primary-400 hover:text-primary-300">Institution login</Link>
              <span>&middot;</span>
              <Link href="/advertiser/login" className="text-primary-400 hover:text-primary-300">Advertiser login</Link>
              <span>&middot;</span>
              <Link href="/partner/login" className="text-primary-400 hover:text-primary-300">Partner login</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
