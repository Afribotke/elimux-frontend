'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, KeyRound, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  const code = searchParams.get('code')
  // token_hash/type: Supabase's cross-device-safe recovery pattern - the OTP
  // is already verified server-side by GoTrue's own /verify endpoint before
  // it ever reaches us, so consuming it here needs no browser-local secret
  // (unlike the PKCE `code` above, which requires the same browser that
  // requested the link - see git history for the bad_code_verifier issue
  // this caused when the email was opened on a different device).
  const tokenHash = searchParams.get('token_hash')
  const otpType = searchParams.get('type')
  const hasResetToken = Boolean(code || tokenHash)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!hasResetToken) {
      setError('Invalid or expired password reset link. Please request a new one.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    // 20-second timeout wrapper — Supabase usage limits cause hangs
    const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error('Request timed out. Please try again in a moment.')), ms)
        ),
      ])
    }

    try {
      // Exchanged here (submit time) rather than on page load: exchanging on
      // mount lets an email security scanner's link-prefetch silently consume
      // the single-use code before the real user clicks it, which then makes
      // a legitimate click fail with "invalid or expired".
      const { error: exchangeError } = tokenHash
        ? await withTimeout(
            supabase.auth.verifyOtp({ token_hash: tokenHash, type: (otpType as any) || 'recovery' }),
            20000
          )
        : await withTimeout(
            supabase.auth.exchangeCodeForSession(code!),
            20000
          )
      if (exchangeError) throw exchangeError

      const { error: updateError } = await withTimeout(
        supabase.auth.updateUser({ password }),
        20000
      )
      if (updateError) throw updateError

      setDone(true)
      await supabase.auth.signOut()
      setTimeout(() => router.push('/auth/login'), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please request a new link.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-elimux-dark py-12 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-elimux-card rounded-xl border border-border p-8 text-center">
          <CheckCircle className="w-10 h-10 text-primary-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Password updated</h1>
          <p className="text-muted mb-6">Redirecting you to login...</p>
          <Link href="/auth/login" className="text-primary-400 hover:text-primary-300 font-medium">
            Go to login now
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
              <div className="bg-elimux-danger/10 border border-elimux-danger/30 rounded-lg p-4 text-elimux-danger text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="password" className="text-sm text-muted mb-1 block flex items-center gap-2">
                <Lock className="w-4 h-4" /> New password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 pr-10 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="text-sm text-muted mb-1 block flex items-center gap-2">
                <KeyRound className="w-4 h-4" /> Confirm password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 pr-10 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !hasResetToken}
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
