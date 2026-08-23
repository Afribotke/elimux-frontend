'use client'

// ============================================
// ELIMUX - GENERIC LOGIN
// /auth/login
// Works for all account types (student, partner, advertiser,
// institution, admin). Redirects to ?redirect= if present,
// otherwise to the role's default home via getRoleHomePath.
// ============================================

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, LogIn } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError || !data.session) {
      setError(signInError?.message || 'Invalid email or password.')
      setLoading(false)
      return
    }

    const redirect = searchParams.get('redirect')
    if (redirect) {
      router.push(redirect)
      return
    }

    const { data: roleRow } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', data.session.user.id)
      .single()

    const role = (roleRow?.role as UserRole) || 'student'
    router.push(getRoleHomePath(role))
  }

  return (
    <div className="min-h-screen bg-elimux-dark py-12 px-4 flex items-center justify-center">
      <div className="max-w-md w-full">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-elimux-dark font-semibold py-3 px-6 rounded-lg shadow-soft hover:shadow-soft-lg transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Signing in...' : 'Sign In'}
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
