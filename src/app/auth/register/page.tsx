'use client'

// ============================================
// ELIMUX - GENERIC REGISTER
// /auth/register
// Creates a standard student account. Partner/advertiser/
// institution accounts go through their own dedicated
// registration flows (/partner, /advertiser/register,
// /institution/register) which assign elevated roles.
// ============================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, User, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getRoleHomePath } from '@/lib/auth/rbac'

export default function RegisterPage() {
  const router = useRouter()
  // Must match the client /auth/login uses (see its comment) - this page
  // creates the student account that then uses apply/profile/logbook,
  // all of which read the session via '@/lib/supabase/client'.
  const supabase = createClient()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: ${window.location.origin}/auth/callback, data: { full_name: fullName } },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.session) {
      router.push(getRoleHomePath('student'))
      return
    }

    setDone('Check your email to confirm your account, then sign in.')
    setLoading(false)
  }

  if (done) {
    return (
      <div className="min-h-screen bg-elimux-dark py-12 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-elimux-card rounded-xl border border-border p-8 text-center">
          <UserPlus className="w-10 h-10 text-primary-400 mx-auto mb-4" />
          <p className="text-foreground mb-6">{done}</p>
          <Link href="/auth/login" className="text-primary-400 hover:text-primary-300 font-medium">
            Go to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-elimux-dark py-12 px-4 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="bg-elimux-card rounded-xl border border-border overflow-hidden">
          <div className="px-8 py-6 border-b border-border">
            <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
            <p className="text-muted mt-1 text-sm">Join ElimuX to save favorites and apply to programs</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {error && (
              <div className="bg-elimux-danger/10 border border-elimux-danger/30 rounded-lg p-4 text-elimux-danger text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="full_name" className="text-sm text-muted mb-1 block flex items-center gap-2">
                <User className="w-4 h-4" /> Full name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
              />
            </div>

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
                className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="text-sm text-muted mb-1 block flex items-center gap-2">
                <Lock className="w-4 h-4" /> Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-elimux-dark font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

            <p className="text-sm text-muted text-center">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary-400 hover:text-primary-300">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

