'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { listScholarshipSponsors, createScholarshipSponsor } from '@/lib/api'
import { useAdminKey } from '@/components/admin/AdminKeyContext'
import AddScholarshipSponsorForm from '@/components/admin/AddScholarshipSponsorForm'
import type { ScholarshipSponsor, ScholarshipSponsorFormData } from '@/types/scholarships'
import { ArrowLeft, Landmark, Plus, BadgeCheck } from 'lucide-react'

function tierClass(tier: string) {
  switch (tier) {
    case 'premium': return 'bg-primary-500/10 text-primary-400'
    case 'hub': return 'bg-amber-500/10 text-amber-400'
    default: return 'bg-muted/10 text-muted'
  }
}

const TYPE_ICON: Record<string, string> = {
  embassy: '🏛️',
  university: '🎓',
  government: '⚖️',
  foundation: '💎',
  corporate: '🏢',
  international: '🌍',
  ngo: '🤝',
}

export default function AdminScholarshipSponsorsPage() {
  const { adminKey } = useAdminKey()
  const [sponsors, setSponsors] = useState<ScholarshipSponsor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const loadSponsors = useCallback(async () => {
    if (!adminKey) return
    setLoading(true)
    setError(null)
    try {
      const res = await listScholarshipSponsors({}, adminKey)
      setSponsors(res.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sponsors')
    } finally {
      setLoading(false)
    }
  }, [adminKey])

  useEffect(() => {
    loadSponsors()
  }, [loadSponsors])

  function flashSuccess(message: string) {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(null), 4000)
  }

  async function handleCreate(data: ScholarshipSponsorFormData) {
    await createScholarshipSponsor(data, adminKey)
    setShowForm(false)
    flashSuccess('Sponsor added successfully.')
    await loadSponsors()
  }

  return (
    <main className="min-h-screen py-12 px-4 max-w-6xl mx-auto">
      <Link href="/admin/scholarships" className="text-sm text-muted hover:text-foreground flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Scholarships
      </Link>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Landmark className="w-8 h-8 text-primary-400" />
          Scholarship Sponsors
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Sponsor
        </button>
      </div>

      {successMessage && (
        <div className="mb-6 px-4 py-2 rounded-lg bg-elimux-success/10 border border-elimux-success/30 text-elimux-success text-sm">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-6 px-4 py-2 rounded-lg bg-elimux-danger/10 border border-elimux-danger/30 text-elimux-danger text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted">Loading sponsors...</p>
        </div>
      ) : sponsors.length === 0 ? (
        <div className="text-center py-16 bg-elimux-card rounded-xl border border-border">
          <Landmark className="w-12 h-12 text-muted mx-auto mb-3" />
          <p className="text-muted">No sponsors yet. Add your first one above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sponsors.map((s) => (
            <div key={s.id} className="bg-elimux-card border border-border rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{TYPE_ICON[s.type] || '📋'}</span>
                  <div>
                    <h3 className="font-semibold text-foreground">{s.name}</h3>
                    <p className="text-sm text-muted capitalize">{s.type}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${tierClass(s.tier)}`}>{s.tier}</span>
              </div>
              {s.country_code && <p className="text-sm text-muted mb-1">Country: {s.country_code}</p>}
              {s.contact_email && <p className="text-sm text-muted mb-2">{s.contact_email}</p>}
              {s.is_verified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-elimux-success/10 text-elimux-success">
                  <BadgeCheck className="w-3 h-3" /> Verified
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && <AddScholarshipSponsorForm onSubmit={handleCreate} onClose={() => setShowForm(false)} />}
    </main>
  )
}
