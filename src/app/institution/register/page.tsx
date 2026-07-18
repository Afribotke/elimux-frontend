'use client'

// ============================================
// ELIMUX INSTITUTION PORTAL - REGISTER (CLAIM)
// /institution/register
// ============================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, User, Building2, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { institutionFetch, savePendingInstitutionRegistration } from '@/lib/institutionAuth'

const API_URL = process.env.NEXT_PUBLIC_API_URL

type InstitutionHit = { id: string; name: string; city?: string }

export default function InstitutionRegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [contactName, setContactName] = useState('')
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<InstitutionHit[]>([])
  const [selected, setSelected] = useState<InstitutionHit | null>(null)
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState('')

  const search = async () => {
    if (query.trim().length < 3) return
    setSearching(true)
    try {
      const res = await fetch(`${API_URL}/api/institutions?search=${encodeURIComponent(query.trim())}`)
      const json = await res.json()
      const rows = Array.isArray(json) ? json : json.data || []
      setHits(rows.slice(0, 8).map((r: any) => ({ id: r.id, name: r.name, city: r.city })))
    } catch {
      setHits([])
    } finally {
      setSearching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) {
      setError('Please search for and select your institution.')
      return
    }
    setLoading(true)
    setError('')

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    const payload = { institution_id: selected.id, contact_name: contactName }

    if (data.session) {
      // Email confirmation disabled - register the claim immediately
      try {
        await institutionFetch('/api/institution-portal/register', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        setDone('Your claim has been submitted and is pending admin approval. You can now sign in.')
      } catch (err: any) {
        setError(err.message || 'Failed to submit claim.')
        setLoading(false)
        return
      }
    } else {
      // Email confirmation required - finish registration on first login
      savePendingInstitutionRegistration(payload)
      setDone('Check your email to confirm your account, then sign in to complete your claim.')
    }

    setLoading(false)
  }

  if (done) {
    return (
      <div className="min-h-screen bg-elimux-dark py-12 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-elimux-card rounded-xl border border-border p-8 text-center">
          <Building2 className="w-10 h-10 text-primary-400 mx-auto mb-4" />
          <p className="text-foreground mb-6">{done}</p>
          <Link href="/institution/login" className="text-primary-400 hover:text-primary-300 font-medium">
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
            <h1 className="text-2xl font-bold text-foreground">Claim Your Institution</h1>
            <p className="text-muted mt-1 text-sm">Manage how students see your institution on ElimuX</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {error && (
              <div className="bg-elimux-danger/10 border border-elimux-danger/30 rounded-lg p-4 text-elimux-danger text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="text-sm text-muted mb-1 block flex items-center gap-2">
                <Search className="w-4 h-4" /> Find your institution
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setSelected(null) }}
                  placeholder="Type at least 3 letters"
                  className="flex-1 px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                />
                <button
                  type="button"
                  onClick={search}
                  disabled={searching}
                  className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-elimux-dark font-semibold disabled:opacity-50"
                >
                  {searching ? '...' : 'Search'}
                </button>
              </div>
              {hits.length > 0 && !selected && (
                <div className="mt-2 rounded-lg border border-border overflow-hidden">
                  {hits.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => { setSelected(h); setHits([]) }}
                      className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-white/5 border-b border-border last:border-0"
                    >
                      {h.name}{h.city ? ` — ${h.city}` : ''}
                    </button>
                  ))}
                </div>
              )}
              {selected && (
                <p className="mt-2 text-sm text-elimux-success">
                  Selected: {selected.name}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm text-muted mb-1 block flex items-center gap-2">
                <User className="w-4 h-4" /> Your name (contact person)
              </label>
              <input
                type="text"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="text-sm text-muted mb-1 block flex items-center gap-2">
                <Mail className="w-4 h-4" /> Work email
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
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !selected}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-elimux-dark font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Claim'}
            </button>

            <p className="text-sm text-muted text-center">
              Already claimed?{' '}
              <Link href="/institution/login" className="text-primary-400 hover:text-primary-300">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
