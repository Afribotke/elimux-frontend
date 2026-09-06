'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAdminKey } from '@/components/admin/AdminKeyContext'
import { useCRMActingUser } from '@/components/crm/CRMActingUserContext'
import { SendMessageModal } from '@/components/crm/SendMessageModal'
import {
  getCRMContacts,
  getContactsNeedingEnrichment,
  getCRMTeam,
  getCRMTemplates,
  assignContact,
  updateContact,
  sendMessage,
  type CRMContact,
  type CRMTeamMember,
  type CRMMessageTemplate,
} from '@/lib/crm-api'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  Phone,
  Send,
  Pencil,
  Eye,
  Sparkles,
} from 'lucide-react'

const PAGE_SIZE = 50

const ENTITY_TYPES = ['university', 'school_public', 'school_private', 'company', 'government', 'partner', 'other']
const STATUSES = ['new', 'contacted', 'responded', 'negotiating', 'onboarded', 'active', 'dormant', 'rejected', 'blacklisted']
const COUNTRY_RELEVANCE = ['kenya', 'foreign', 'unknown']

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-gray-50 text-gray-600',
  contacted: 'bg-blue-50 text-blue-600',
  responded: 'bg-purple-50 text-purple-600',
  negotiating: 'bg-yellow-50 text-yellow-700',
  onboarded: 'bg-green-100 text-green-700',
  active: 'bg-green-50 text-green-600',
  dormant: 'bg-gray-100 text-gray-500',
  rejected: 'bg-red-50 text-red-600',
  blacklisted: 'bg-red-100 text-red-700',
}

export default function CRMContactsPage() {
  const { adminKey } = useAdminKey()
  const { actingUserId } = useCRMActingUser()

  const [contacts, setContacts] = useState<CRMContact[]>([])
  const [team, setTeam] = useState<CRMTeamMember[]>([])
  const [templates, setTemplates] = useState<CRMMessageTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const [entityType, setEntityType] = useState('')
  const [status, setStatus] = useState('')
  const [countryRelevance, setCountryRelevance] = useState('')
  const [county, setCounty] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [needsEnrichmentOnly, setNeedsEnrichmentOnly] = useState(false)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [messagingContact, setMessagingContact] = useState<CRMContact | null>(null)
  const [bulkTemplateId, setBulkTemplateId] = useState('')
  const [bulkAssignTo, setBulkAssignTo] = useState('')
  const [bulkStatus, setBulkStatus] = useState('')
  const [bulkBusy, setBulkBusy] = useState(false)

  useEffect(() => {
    if (!adminKey) return
    getCRMTeam(adminKey).then(setTeam).catch(() => {})
    getCRMTemplates(adminKey).then(setTemplates).catch(() => {})
  }, [adminKey])

  useEffect(() => {
    if (!adminKey) return
    loadData(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKey, entityType, status, countryRelevance, county, assignedTo, appliedSearch, needsEnrichmentOnly])

  async function loadData(targetPage: number) {
    setLoading(true)
    setLoadError(null)
    setSelectedIds(new Set())
    try {
      if (needsEnrichmentOnly) {
        const res = await getContactsNeedingEnrichment(adminKey, {
          entity_type: entityType || undefined,
          page: targetPage,
          limit: PAGE_SIZE,
        })
        setContacts(res.data)
        setTotalCount(res.meta.total)
      } else {
        const res = await getCRMContacts(adminKey, {
          entity_type: entityType || undefined,
          status: status || undefined,
          country_relevance: countryRelevance || undefined,
          county: county || undefined,
          assigned_to: assignedTo || undefined,
          search: appliedSearch || undefined,
          page: targetPage,
          limit: PAGE_SIZE,
        })
        setContacts(res.data)
        setTotalCount(res.meta.total)
      }
      setPage(targetPage)
    } catch (err: any) {
      setLoadError(err.message || 'Failed to load contacts')
      toast.error(err.message || 'Failed to load contacts')
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  function toggleSelect(id: string) {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  function teamMemberLabel(userId: string | null | undefined) {
    if (!userId) return '—'
    const member = team.find((m) => m.user_id === userId)
    return member?.user?.name || member?.user?.email || userId.slice(0, 8)
  }

  async function handleBulkAssign() {
    if (!bulkAssignTo) {
      toast.error('Choose a rep to assign to')
      return
    }
    setBulkBusy(true)
    try {
      await Promise.all(Array.from(selectedIds).map((id) => assignContact(adminKey, id, bulkAssignTo, actingUserId || undefined)))
      toast.success(`Assigned ${selectedIds.size} contacts`)
      loadData(page)
    } catch (err: any) {
      toast.error(err.message || 'Bulk assign failed')
    } finally {
      setBulkBusy(false)
    }
  }

  async function handleBulkStatus() {
    if (!bulkStatus) {
      toast.error('Choose a status')
      return
    }
    setBulkBusy(true)
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) => updateContact(adminKey, id, { status: bulkStatus, updated_by: actingUserId || undefined }))
      )
      toast.success(`Updated status for ${selectedIds.size} contacts`)
      loadData(page)
    } catch (err: any) {
      toast.error(err.message || 'Bulk status update failed')
    } finally {
      setBulkBusy(false)
    }
  }

  async function handleBulkSend() {
    if (!bulkTemplateId) {
      toast.error('Choose a template')
      return
    }
    if (!actingUserId) {
      toast.error('Select who you are acting as first')
      return
    }
    setBulkBusy(true)
    let sent = 0
    let skipped = 0
    let failed = 0
    for (const id of Array.from(selectedIds)) {
      try {
        const result = await sendMessage(adminKey, { contact_id: id, template_id: bulkTemplateId, sent_by: actingUserId })
        if (result.success) sent++
        else if (result.needs_enrichment) skipped++
        else failed++
      } catch {
        failed++
      }
    }
    toast.success(`Sent ${sent}, skipped ${skipped} (needs enrichment), failed ${failed}`)
    setBulkBusy(false)
    loadData(page)
  }

  if (!adminKey) {
    return <div className="flex h-96 items-center justify-center text-sm text-muted-foreground">Admin key required</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CRM — Contacts</h1>
          <p className="text-sm text-muted-foreground">Unified outreach across universities, schools, companies, and partners.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/crm/dashboard" className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent">
            Dashboard
          </Link>
          <Link href="/admin/crm/templates" className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent">
            Templates
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setAppliedSearch(search)}
            className="rounded-md border border-border bg-background pl-9 pr-3 py-2 text-sm w-56"
          />
        </div>
        <select value={entityType} onChange={(e) => setEntityType(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
          <option value="">All Types</option>
          {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm" disabled={needsEnrichmentOnly}>
          <option value="">All Status</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={countryRelevance} onChange={(e) => setCountryRelevance(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm" disabled={needsEnrichmentOnly}>
          <option value="">All Countries</option>
          {COUNTRY_RELEVANCE.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          type="text"
          placeholder="County..."
          value={county}
          onChange={(e) => setCounty(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm w-32"
          disabled={needsEnrichmentOnly}
        />
        <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="rounded-md border border-border bg-background px-3 py-2 text-sm" disabled={needsEnrichmentOnly}>
          <option value="">All Reps</option>
          {team.map((m) => <option key={m.user_id} value={m.user_id}>{m.user?.name || m.user?.email || m.user_id}</option>)}
        </select>
        <button
          onClick={() => setAppliedSearch(search)}
          className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          Search
        </button>
        <button
          onClick={() => setNeedsEnrichmentOnly((v) => !v)}
          className={`rounded-md px-3 py-2 text-xs font-medium inline-flex items-center gap-1.5 ${
            needsEnrichmentOnly ? 'bg-amber-500 text-white' : 'border border-border hover:bg-accent'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Needs Enrichment
        </button>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/50 p-3">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>

          <select value={bulkTemplateId} onChange={(e) => setBulkTemplateId(e.target.value)} className="rounded-md border border-border bg-background px-2 py-1.5 text-xs">
            <option value="">Template...</option>
            {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button onClick={handleBulkSend} disabled={bulkBusy} className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            <Send className="inline h-3 w-3 mr-1" />Send Template
          </button>

          <select value={bulkAssignTo} onChange={(e) => setBulkAssignTo(e.target.value)} className="rounded-md border border-border bg-background px-2 py-1.5 text-xs">
            <option value="">Rep...</option>
            {team.map((m) => <option key={m.user_id} value={m.user_id}>{m.user?.name || m.user?.email || m.user_id}</option>)}
          </select>
          <button onClick={handleBulkAssign} disabled={bulkBusy} className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50">
            Assign
          </button>

          <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} className="rounded-md border border-border bg-background px-2 py-1.5 text-xs">
            <option value="">Status...</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={handleBulkStatus} disabled={bulkBusy} className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50">
            Change Status
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : loadError ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2 text-sm text-red-500">
          <p>Failed to load: {loadError}</p>
          <button onClick={() => loadData(page)} className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent">Retry</button>
        </div>
      ) : contacts.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">No contacts found</div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left w-8">
                  <input
                    type="checkbox"
                    onChange={() => {
                      if (selectedIds.size === contacts.length) setSelectedIds(new Set())
                      else setSelectedIds(new Set(contacts.map((c) => c.id)))
                    }}
                    checked={selectedIds.size === contacts.length && contacts.length > 0}
                  />
                </th>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Country</th>
                <th className="px-4 py-3 text-left font-medium">County</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Priority</th>
                <th className="px-4 py-3 text-left font-medium">Assigned To</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Phone</th>
                <th className="px-4 py-3 text-left font-medium">Last Contact</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggleSelect(c.id)} />
                  </td>
                  <td className="px-4 py-3 font-medium max-w-[220px] truncate">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{c.entity_type.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3">
                    {c.country_relevance && (
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        c.country_relevance === 'kenya' ? 'bg-green-50 text-green-600' : c.country_relevance === 'foreign' ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-500'
                      }`}>
                        {c.country_relevance}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.county || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[c.status] || 'bg-gray-50 text-gray-600'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{c.priority}</td>
                  <td className="px-4 py-3 text-muted-foreground">{teamMemberLabel(c.assigned_to)}</td>
                  <td className="px-4 py-3">
                    {c.email ? <Mail className="h-4 w-4 text-green-500" /> : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {c.phone ? <Phone className="h-4 w-4 text-purple-500" /> : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {c.last_contact_at ? new Date(c.last_contact_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link href={`/admin/crm/${c.id}`} className="p-1.5 rounded-md hover:bg-accent" title="View">
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link href={`/admin/crm/${c.id}?enrich=1`} className="p-1.5 rounded-md hover:bg-accent" title="Enrich">
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => setMessagingContact(c)}
                        disabled={!c.email && !c.phone}
                        className="p-1.5 rounded-md hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed"
                        title={c.email || c.phone ? 'Send Message' : 'No channel available'}
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !loadError && totalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount.toLocaleString()} contacts
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadData(Math.max(1, page - 1))}
              disabled={page === 1 || loading}
              className="inline-flex items-center gap-1 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />Previous
            </button>
            <span className="text-sm font-medium px-3">Page {page} of {totalPages}</span>
            <button
              onClick={() => loadData(Math.min(totalPages, page + 1))}
              disabled={page === totalPages || loading}
              className="inline-flex items-center gap-1 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next<ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {messagingContact && (
        <SendMessageModal
          contact={messagingContact}
          onClose={() => setMessagingContact(null)}
          onSent={() => loadData(page)}
        />
      )}
    </div>
  )
}
