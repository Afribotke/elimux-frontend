'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Landmark, Mail, ArrowLeft, CheckCircle2, Building2 } from 'lucide-react'

const NOTIFY_STORAGE_KEY = 'elimux-bursary-notify-emails'

export default function BursaryComingSoonPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.')
      return
    }

    // No backend endpoint exists for this yet (Bursary Engine is pre-launch) —
    // stored locally for now, matching Task 2's "no backend needed yet" scope.
    try {
      const existing = JSON.parse(localStorage.getItem(NOTIFY_STORAGE_KEY) || '[]')
      if (!existing.includes(email)) {
        existing.push(email)
        localStorage.setItem(NOTIFY_STORAGE_KEY, JSON.stringify(existing))
      }
    } catch {
      // localStorage unavailable (private browsing, etc.) — still confirm to the
      // user so the interaction doesn't feel broken, just don't persist
    }

    console.log('[Bursary] notify-me signup:', email)
    setSubmitted(true)
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-elimux-dark to-elimux-card flex flex-col items-center justify-center px-4 py-20 text-center">
      <Link
        href="https://www.elimux.ke"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary-400 transition-colors mb-10"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to ElimuX
      </Link>

      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm mb-6">
        <Landmark className="w-4 h-4" />
        Education Funding, Reimagined
      </div>

      <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4 leading-tight max-w-3xl">
        ElimuX Bursary Engine
      </h1>

      <p className="text-lg md:text-xl text-muted mb-8 max-w-2xl">
        Connecting students with funding opportunities from County Governments, NG-CDF, NGOs,
        Corporates, and Foundations.
      </p>

      <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-amber-100 text-amber-800 text-sm font-semibold mb-10">
        Opening Soon
      </span>

      <div className="w-full max-w-md">
        {submitted ? (
          <div className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-elimux-card border border-primary-500/30 text-foreground">
            <CheckCircle2 className="w-5 h-5 text-primary-400 shrink-0" />
            <span>You're on the list — we'll email you when the Bursary Engine launches.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-label="Email address"
              className="flex-1 px-4 py-3 rounded-xl bg-elimux-card border border-border text-foreground placeholder:text-muted focus:outline-none focus:border-primary-500/50"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors whitespace-nowrap"
            >
              <Mail className="w-4 h-4" />
              Get notified when we launch
            </button>
          </form>
        )}
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
      </div>

      <Link
        href="/bursary/provider/register"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-primary-500/30 text-primary-400 font-medium hover:bg-primary-500/10 transition-colors mt-10"
      >
        <Building2 className="w-4 h-4" />
        Are you a funding provider? Register as a Provider
      </Link>

      <footer className="mt-20 text-sm text-muted">
        Powered by{' '}
        <Link href="https://www.elimux.ke" className="text-primary-400 hover:text-primary-300 transition-colors">
          ElimuX
        </Link>
      </footer>
    </main>
  )
}
