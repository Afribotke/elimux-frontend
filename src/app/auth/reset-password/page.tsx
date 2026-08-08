'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, KeyRound, CheckCircle, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [verifying, setVerifying] = useState(true)
  const [verifyError, setVerifyError] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      setVerifyError('This reset link is invalid or has expired.')
      setVerifying(false)
      return
    }
    supabase.auth.exchangeCodeForSession(code).then(({ error: exchangeError }) => {
      if (exchangeError) {
        setVerifyError('This reset link is invalid or has expired.')
      }
      setVerifying(false)
    })
    // Only run once on mount for the code present in the initial URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
  }

  if (verifying) {
    return (
      <div className="min-h-screen bg-elimux-dark flex items-center justify-center">
        <p className="text-muted">Verifying reset link...</p>
      </div>
    )
  }

  if (verifyError) {
    return (
      <div className="min-h-screen bg-elimux-dark py-12 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-elimux-card rounded-xl border border-border p-8 text-center">
          <AlertCircle className="w-10 h-10 text-elimux-danger mx-auto mb-4" />
          <p className="text-foreground mb-6">{verifyError}</p>
          <Link href="/auth/forgot-password" className="text-primary-400 hover:text-primary-300 font-medium">
            Request a new link
          </Link>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen bg-elimux-dark py-12 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-elimux-card rounded-xl border border-border p-8 text-center">
          <CheckCircle className="w-10 h-10 text-primary-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Password updated</h1>
          <p className="text-muted mb-6">You can now sign in with your new password.</p>
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
            <h1 className="text-2xl font-bold text-foreground">Set new password</h1>
            <p className="text-muted mt-1 text-sm">Choose a new password for your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {error && (
              <div className="bg-elimux-danger/10 border border-elimux-danger/30 rounded-lg p-4 text-elimux-danger text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="password" className="text-sm text-muted mb-1 block flex items-center gap-2">
                <Lock className="w-4 h-4" /> New password
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

            <div>
              <label htmlFor="confirmPassword" className="text-sm text-muted mb-1 block flex items-center gap-2">
                <KeyRound className="w-4 h-4" /> Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-elimux-dark font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  )
}
