'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const redirectTo = `${window.location.origin}/auth/reset-password`
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

    if (resetError) {
      setError(resetError.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-elimux-dark py-12 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-elimux-card rounded-xl border border-border p-8 text-center">
          <CheckCircle className="w-10 h-10 text-primary-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Check your email</h1>
          <p className="text-muted mb-6">
            We sent a password reset link to <span className="text-foreground">{email}</span>. Click the link in the email to set a new password.
          </p>
          <Link href="/auth/login" className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to login
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
            <h1 className="text-2xl font-bold text-foreground">Forgot password?</h1>
            <p className="text-muted mt-1 text-sm">Enter your email and we&apos;ll send you a reset link.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {error && (
              <div className="bg-elimux-danger/10 border border-elimux-danger/30 rounded-lg p-4 text-elimux-danger text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
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
                className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-elimux-dark font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              <Mail className="w-4 h-4" />
              {loading ? 'Sending...' : 'Send reset link'}
            </button>

            <p className="text-sm text-muted text-center">
              Remember your password?{' '}
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
