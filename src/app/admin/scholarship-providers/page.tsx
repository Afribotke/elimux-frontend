'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useAdminKey } from '@/components/admin/AdminKeyContext'
import { listScholarshipProviders, approveProviderPartnership } from '@/lib/api'
import type { ScholarshipProvider } from '@/lib/api'
import { ArrowLeft, Building2 } from 'lucide-react'

export default function AdminScholarshipProvidersPage() {
  const { adminKey } = useAdminKey()
  const [providers, setProviders] = useState<ScholarshipProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [approvingId, setApprovingId] = useState<string | null>(null)

  const loadProviders = useCallback(async () => {
    if (!adminKey) return
    setLoading(true)
    setError(null)
    try {
      const res = await listScholarshipProviders({ claimed_only: true }, adminKey)
      setProviders(res.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load providers')
    } finally {
      setLoading(false)
    }
  }, [adminKey])

  useEffect(() => {
    loadProviders()
  }, [loadProviders])

  async function approve(id: string) {
    if (!adminKey) return
    setApprovingId(id)
    try {
      await approveProviderPartnership(id, adminKey)
      setProviders((prev) => prev.map((p) => (p.id === id ? { ...p, is_partner: true } : p)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve partnership')
    } finally {
      setApprovingId(null)
    }
  }

  return (
    <main className="min-h-screen py-12 px-4 max-w-6xl mx-auto">
      <Link href="/admin/scholarships" className="text-sm text-muted hover:text-foreground flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Scholarships
      </Link>

      <h1 className="text-3xl font-bold text-foreground flex items-center gap-3 mb-6">
        <Building2 className="w-8 h-8 text-primary-400" />
        Scholarship Providers
      </h1>

      {error && (
        <div className="mb-6 px-4 py-2 rounded-lg bg-elimux-danger/10 border border-elimux-danger/30 text-elimux-danger text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted">Loading providers...</p>
        </div>
      ) : providers.length === 0 ? (
        <div className="text-center py-16 bg-elimux-card rounded-xl border border-border">
          <Building2 className="w-12 h-12 text-muted mx-auto mb-3" />
          <p className="text-muted">No claimed providers yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {providers.map((p) => (
            <div
              key={p.id}
              className="bg-elimux-card rounded-xl border border-border p-6 flex flex-wrap justify-between items-center gap-4"
            >
              <div>
                <h3 className="text-lg font-semibold text-foreground">{p.name}</h3>
                <p className="text-muted text-sm">
                  {p.website}
                  {p.website && ' • '}
                  Claimed: {p.claimed_at ? new Date(p.claimed_at).toLocaleDateString() : 'Unknown'}
                </p>
                <span
                  className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium ${
                    p.is_partner ? 'bg-elimux-success/10 text-elimux-success' : 'bg-warning/10 text-warning'
                  }`}
                >
                  {p.is_partner ? 'Partner' : 'Claimed — Pending Approval'}
                </span>
              </div>
              {!p.is_partner && (
                <button
                  onClick={() => approve(p.id)}
                  disabled={approvingId === p.id}
                  className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {approvingId === p.id ? 'Approving…' : 'Approve Partnership'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
