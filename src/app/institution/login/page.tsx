'use client'

// ============================================
// ELIMUX INSTITUTION PORTAL - LOGIN
// /institution/login
// ============================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, LogIn } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { institutionFetch, takePendingInstitutionRegistration } from '@/lib/institutionAuth'

export default function InstitutionLoginPage() {
  const router = useRouter()
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

    // Complete a pending claim registration if one was interrupted by email confirmation
    const pending = takePendingInstitutionRegistration()
    if (pending) {
      try {
        await institutionFetch('/api/institution-portal/register', {
          method: 'POST',
          body: JSON.stringify(pending),
        })
      } catch {
        // Non-fatal - dashboard will show the appropriate state
      }
    }

    router.push('/institution/dashboard')
  }

  return (
    <div className="min-h-screen bg-elimux-dark py-12 px-4 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="bg-elimux-card rounded-xl border border-border overflow-hidden">
          <div className="px-8 py-6 border-b border-border">
            <h1 className="text-2xl font-bold text-foreground">Institution Login</h1>
            <p className="text-muted mt-1 text-sm">Sign in to manage your institution on ElimuX</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {error && (
              <div className="bg-elimux-danger/10 border border-elimux-danger/30 rounded-lg p-4 text-elimux-danger text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="text-sm text-muted mb-1 block flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="text-sm text-muted mb-1 block flex items-center gap-2">
                <Lock className="w-4 h-4" /> Password
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
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
              <LogIn className="w-4 h-4" />
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <p className="text-sm text-muted text-center">
              Institution not on ElimuX yet?{' '}
              <Link href="/institution/register" className="text-primary-400 hover:text-primary-300">
                Claim your institution
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
