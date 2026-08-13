'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  listAdminScholarships,
  getAdminScholarship,
  createScholarship,
  updateScholarship,
  deleteScholarship,
  listScholarshipSponsors,
} from '@/lib/api'
import { useAdminKey } from '@/components/admin/AdminKeyContext'
import AddScholarshipForm, { type ScholarshipFormInitialData } from '@/components/admin/AddScholarshipForm'
import type { Scholarship, ScholarshipFormData, ScholarshipSponsor } from '@/types/scholarships'
import { ArrowLeft, Award, Pencil, Trash2, Plus, Search, Landmark } from 'lucide-react'

function getAppStatusClass(status?: string | null) {
  switch (status) {
    case 'open': return 'text-elimux-success'
    case 'closed': return 'text-elimux-danger'
    case 'upcoming': return 'text-amber-400'
    default: return 'text-muted'
  }
}

export default function AdminScholarshipsPage() {
  const { adminKey } = useAdminKey()
  const [scholarships, setScholarships] = useState<Scholarship[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [appStatusFilter, setAppStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [sponsors, setSponsors] = useState<ScholarshipSponsor[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ScholarshipFormInitialData | null>(null)

  useEffect(() => {
    if (!adminKey) return
    listScholarshipSponsors({}, adminKey).then((res) => setSponsors(res.data)).catch(() => {})
  }, [adminKey])

  const loadScholarships = useCallback(async () => {
    if (!adminKey) return
    setLoading(true)
    setError(null)
    try {
      const res = await listAdminScholarships(
        { page, limit: 20, status: statusFilter || undefined, application_status: appStatusFilter || undefined, search: search || undefined },
        adminKey
      )
      setScholarships(res.data)
      setTotalPages(res.meta.totalPages || 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scholarships')
    } finally {
      setLoading(false)
    }
  }, [adminKey, page, statusFilter, appStatusFilter, search])

  useEffect(() => {
    loadScholarships()
  }, [loadScholarships])

  function flashSuccess(message: string) {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(null), 4000)
  }

  async function handleCreate(data: ScholarshipFormData) {
    await createScholarship(data, adminKey)
    setShowForm(false)
    flashSuccess('Scholarship created successfully.')
    await loadScholarships()
  }

  async function handleUpdate(data: ScholarshipFormData) {
    if (!editing) return
    await updateScholarship(editing.id, data, adminKey)
    setEditing(null)
    flashSuccess('Scholarship updated successfully.')
    await loadScholarships()
  }

  async function handleDelete(s: Scholarship) {
    if (!window.confirm(`Delete "${s.title}"? This cannot be undone.`)) return
    try {
      await deleteScholarship(s.id, adminKey)
      flashSuccess('Scholarship deleted.')
      await loadScholarships()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete scholarship')
    }
  }

  async function openEdit(s: Scholarship) {
    try {
      const res = await getAdminScholarship(s.id, adminKey)
      const full = res.data
      setEditing({
        id: full.id,
        title: full.title,
        provider: full.provider,
        provider_id: full.provider_id ?? '',
        description: full.description ?? '',
        eligibility: full.eligibility ?? '',
        benefits: full.benefits ?? '',
        amount: full.amount ?? '',
        currency: full.currency ?? 'KES',
        coverage_type: full.coverage_type ?? '',
        funding_amount: full.funding_amount ?? null,
        duration: full.duration ?? null,
        duration_unit: full.duration_unit ?? null,
        application_opens: full.application_opens ?? '',
        application_deadline: full.application_deadline,
        notification_date: full.notification_date ?? '',
        application_url: full.application_url ?? '',
        application_process: full.application_process ?? '',
        source_url: full.source_url ?? '',
        study_levels: full.study_levels ?? [],
        disciplines: full.disciplines ?? [],
        target_groups: full.target_groups ?? [],
        required_documents: full.required_documents ?? [],
        status: full.status ?? 'active',
        application_status: full.application_status ?? 'upcoming',
        is_featured: full.is_featured ?? false,
        is_sponsored: full.is_sponsored ?? false,
        sponsor_id: full.sponsor_id ?? '',
        eligibility_criteria: (full.eligibility_criteria ?? []).map((c) => ({
          criteria_type: c.criteria_type,
          criteria_value: c.criteria_value,
          is_required: c.is_required,
          description: c.description ?? '',
        })),
        documents: (full.documents ?? []).map((d) => ({
          document_name: d.document_name,
          document_description: d.document_description ?? '',
          is_required: d.is_required,
          file_type_hint: d.file_type_hint ?? '',
          max_file_size_mb: d.max_file_size_mb,
        })),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scholarship')
    }
  }

  return (
    <main className="min-h-screen py-12 px-4 max-w-6xl mx-auto">
      <Link href="/admin" className="text-sm text-muted hover:text-foreground flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="flex items-center justify-between mb-2 flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Award className="w-8 h-8 text-primary-400" />
          Manage Scholarships
        </h1>
        <div className="flex items-center gap-2">
          <Link href="/admin/scholarships/sponsors" className="px-4 py-2 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-muted/10 transition-colors flex items-center gap-2">
            <Landmark className="w-4 h-4" /> Sponsors
          </Link>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Scholarship
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value) }}
            placeholder="Search by title..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setPage(1); setStatusFilter(e.target.value) }}
          className="px-3 py-2 text-sm rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={appStatusFilter}
          onChange={(e) => { setPage(1); setAppStatusFilter(e.target.value) }}
          className="px-3 py-2 text-sm rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
        >
          <option value="">All App Statuses</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="upcoming">Upcoming</option>
        </select>
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
          <p className="text-muted">Loading scholarships...</p>
        </div>
      ) : (
        <div className="bg-elimux-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-elimux-dark text-muted text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Provider</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Deadline</th>
                <th className="px-4 py-3 font-medium">App Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {scholarships.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-4 py-3 text-foreground font-medium">
                    {s.title}
                    {s.is_sponsored && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-500/10 text-primary-400">
                        Sponsored
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">{s.provider}</td>
                  <td className="px-4 py-3 text-muted">{s.amount || '—'}</td>
                  <td className="px-4 py-3 text-muted">{s.application_deadline ? new Date(s.application_deadline).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={getAppStatusClass(s.application_status || (s.status === 'active' ? 'open' : 'closed'))}>
                      {s.application_status || (s.status === 'active' ? 'open' : 'closed')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-muted/10 text-muted hover:text-foreground transition-colors" aria-label="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(s)} className="p-1.5 rounded-lg hover:bg-elimux-danger/10 text-muted hover:text-elimux-danger transition-colors" aria-label="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {scholarships.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted">
                    No scholarships found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 rounded-lg border border-border text-sm text-muted disabled:opacity-40">
            Previous
          </button>
          <span className="text-sm text-muted">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 rounded-lg border border-border text-sm text-muted disabled:opacity-40">
            Next
          </button>
        </div>
      )}

      {showForm && (
        <AddScholarshipForm sponsors={sponsors} onSubmit={handleCreate} onClose={() => setShowForm(false)} />
      )}

      {editing && (
        <AddScholarshipForm sponsors={sponsors} initialData={editing} onSubmit={handleUpdate} onClose={() => setEditing(null)} />
      )}
    </main>
  )
}
