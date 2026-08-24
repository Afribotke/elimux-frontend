'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { validateProviderInvite, acceptProviderInvite } from '@/lib/api'

const inputClass =
  'w-full px-4 py-2.5 rounded-xl bg-elimux-card border border-border text-foreground placeholder:text-muted focus:outline-none focus:border-primary-500/50'
const labelClass = 'block text-sm font-medium text-foreground mb-1.5'

export default function BursaryProviderInviteAcceptPage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()

  const [validating, setValidating] = useState(true)
  const [invite, setInvite] = useState<{ providerName?: string; email?: string } | null>(null)
  const [validationError, setValidationError] = useState('')

  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    let cancelled = false
    validateProviderInvite(token)
      .then((res) => {
        if (cancelled) return
        if (!res.valid) {
          setValidationError('This invite link is invalid or has expired. Please contact support.')
        } else {
          setInvite({ providerName: res.providerName, email: res.email })
        }
      })
      .catch(() => {
        if (!cancelled) setValidationError('This invite link is invalid or has expired. Please contact support.')
      })
      .finally(() => {
        if (!cancelled) setValidating(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError('')

    if (password.length < 8) {
      setSubmitError('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match')
      return
    }

    setSubmitting(true)
    try {
      const result = await acceptProviderInvite({ token, password, fullName })

      // Auto sign-in so the dashboard redirect lands with a real session.
      const supabase = createClient()
      await supabase.auth.signInWithPassword({ email: result.email, password })

      setSuccess(true)
      setTimeout(() => router.push('/bursary/provider/dashboard'), 1200)
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to accept invite. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (validating) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-elimux-dark to-elimux-card flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
      </main>
    )
  }

  if (validationError) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-elimux-dark to-elimux-card flex flex-col items-center justify-center px-4 text-center">
        <div className="w-full max-w-md rounded-xl bg-red-500/10 border border-red-500/30 px-6 py-5 text-red-400 text-sm">
          {validationError}
        </div>
        <Link
          href="https://bursary.elimux.ke"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors mt-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Bursary Engine
        </Link>
      </main>
    )
  }

  if (success) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-elimux-dark to-elimux-card flex flex-col items-center justify-center px-4 text-center">
        <CheckCircle2 className="w-14 h-14 text-primary-400 mb-6" />
        <h1 className="text-3xl font-bold text-foreground mb-2">Welcome aboard</h1>
        <p className="text-muted">Your account has been created. Redirecting to your dashboard…</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-elimux-dark to-elimux-card px-4 py-16">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-2">Accept admin invite</h1>
        <p className="text-muted mb-10">
          You have been invited to administer <strong className="text-foreground">{invite?.providerName || 'your provider'}</strong>. Create your account to get started.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Full Name *</label>
            <input required className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input disabled className={`${inputClass} opacity-60`} value={invite?.email || ''} />
          </div>
          <div>
            <label className={labelClass}>Password *</label>
            <input
              required
              type="password"
              minLength={8}
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
            />
          </div>
          <div>
            <label className={labelClass}>Confirm Password *</label>
            <input
              required
              type="password"
              className={inputClass}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {submitError && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{submitError}</div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors disabled:opacity-60"
          >
            {submitting ? 'Creating account…' : 'Create Account & Access Dashboard'}
          </button>
        </form>
      </div>
    </main>
  )
}
