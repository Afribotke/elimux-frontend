'use client'

// ============================================
// ADMIN - INSTITUTION CLAIMS
// /admin/institution-claims
// Approve/suspend institution self-service claims.
// Backend: GET/PATCH /api/admin/institution-accounts (routes/admin.ts)
// institution_accounts columns: id, institution_id, user_id, contact_name,
// email, role, status ('pending'|'active'|'suspended'), created_at, updated_at
// — no 'approved'/'rejected' status, no plan/notes/phone fields exist.
// ============================================

import { useEffect, useState, useCallback } from 'react'
import { Building2, CheckCircle2, XCircle, Clock, Mail, User, Loader2, RefreshCw, Search } from 'lucide-react'
import { useAdminKey } from '@/components/admin/AdminKeyContext'

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

type InstitutionAccount = {
  id: string
  institution_id: string
  contact_name: string | null
  email: string
  status: 'pending' | 'active' | 'suspended'
  created_at: string
  updated_at: string
  institution: { name: string } | null
}

type StatusFilter = 'all' | 'pending' | 'active' | 'suspended'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-elimux-warning/10 text-elimux-warning',
  active: 'bg-elimux-success/10 text-elimux-success',
  suspended: 'bg-elimux-danger/10 text-elimux-danger',
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="w-3.5 h-3.5" />,
  active: <CheckCircle2 className="w-3.5 h-3.5" />,
  suspended: <XCircle className="w-3.5 h-3.5" />,
}

export default function InstitutionClaimsPage() {
  const { adminKey } = useAdminKey()
  const [claims, setClaims] = useState<InstitutionAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending')
  const [query, setQuery] = useState('')

  const load = useCallback(async () => {
    if (!adminKey) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/admin/institution-accounts`, {
        headers: { 'X-Admin-Key': adminKey },
      })
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      const json = await res.json()
      setClaims(json.data || [])
    } catch (e: any) {
      setError(e.message || 'Failed to load institution claims')
    } finally {
      setLoading(false)
    }
  }, [adminKey])

  useEffect(() => { load() }, [load])

  async function updateStatus(id: string, status: 'active' | 'suspended') {
    setActionLoading(id)
    try {
      const res = await fetch(`${API_URL}/api/admin/institution-accounts/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Request failed: ${res.status}`)
      }
      const { data } = await res.json()
      setClaims((prev) => prev.map((c) => (c.id === id ? { ...c, status: data.status, updated_at: data.updated_at } : c)))
    } catch (e: any) {
      alert(`Failed to update status: ${e.message}`)
    } finally {
      setActionLoading(null)
    }
  }

  const counts = {
    pending: claims.filter((c) => c.status === 'pending').length,
    active: claims.filter((c) => c.status === 'active').length,
    suspended: claims.filter((c) => c.status === 'suspended').length,
  }

  const q = query.trim().toLowerCase()
  const filtered = claims.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false
    if (!q) return true
    return (
      c.institution?.name?.toLowerCase().includes(q) ||
      c.contact_name?.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    )
  })

  return (
    <main className="min-h-screen py-12 px-4 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
        <Building2 className="w-8 h-8 text-primary-400" />
        Institution Claims
      </h1>
      <p className="text-muted mb-6">Review and approve institution self-service registration claims</p>

      <div className="grid grid-cols-3 gap-4 mb-6 max-w-md">
        {(['pending', 'active', 'suspended'] as const).map((s) => (
          <div key={s} className="bg-elimux-card rounded-xl p-4 border border-border text-center">
            <p className="text-2xl font-bold text-foreground">{counts[s]}</p>
            <p className="text-xs text-muted capitalize">{s}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-2">
          {(['all', 'pending', 'active', 'suspended'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                statusFilter === s ? 'bg-primary-600 text-white' : 'bg-elimux-card border border-border text-muted hover:text-foreground'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search institution, contact, email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-elimux-dark border border-border text-foreground text-sm focus:outline-none focus:border-primary-500"
          />
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-muted hover:text-foreground text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted">Loading claims...</p>
        </div>
      ) : error ? (
        <p className="text-elimux-danger text-sm bg-elimux-card rounded-xl p-4 border border-border">{error}</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted text-sm bg-elimux-card rounded-xl p-6 border border-border text-center">
          No {statusFilter !== 'all' ? statusFilter : ''} claims found.
        </p>
      ) : (
        <div className="bg-elimux-card border border-border rounded-xl divide-y divide-border">
          {filtered.map((claim) => (
            <div key={claim.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-foreground truncate">{claim.institution?.name || 'Unknown institution'}</p>
                  <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${STATUS_STYLES[claim.status]}`}>
                    {STATUS_ICONS[claim.status]}
                    {claim.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                  {claim.contact_name && (
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> {claim.contact_name}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" /> {claim.email}
                  </span>
                  <span>Submitted {new Date(claim.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                {claim.status !== 'active' && (
                  <button
                    onClick={() => updateStatus(claim.id, 'active')}
                    disabled={actionLoading === claim.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-elimux-success/20 text-elimux-success text-sm font-medium hover:bg-elimux-success/30 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === claim.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    Approve
                  </button>
                )}
                {claim.status !== 'suspended' && (
                  <button
                    onClick={() => updateStatus(claim.id, 'suspended')}
                    disabled={actionLoading === claim.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-elimux-danger/20 text-elimux-danger text-sm font-medium hover:bg-elimux-danger/30 transition-colors disabled:opacity-50"
                  >
                    {actionLoading === claim.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    Suspend
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
