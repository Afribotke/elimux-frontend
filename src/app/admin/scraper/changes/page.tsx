'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { listProgramChanges, approveChange, rejectChange, type ProgramChange } from '@/lib/api'
import { useAdminKey } from '@/components/admin/AdminKeyContext'
import { ArrowLeft, GitCompare, Check, X, Sparkles, Pencil, Trash2 } from 'lucide-react'

const STATUS_OPTIONS = ['pending', 'approved', 'rejected'] as const

const CHANGE_TYPE_STYLE: Record<ProgramChange['change_type'], { label: string; icon: typeof Sparkles; color: string }> = {
  new: { label: 'New program', icon: Sparkles, color: 'text-elimux-success bg-elimux-success/10' },
  updated: { label: 'Field update', icon: Pencil, color: 'text-primary-400 bg-primary-500/10' },
  deleted: { label: 'Not found on page', icon: Trash2, color: 'text-elimux-danger bg-elimux-danger/10' },
}

interface ExtractedProgram {
  name: string
  level: string | null
  duration_months: number | null
  tuition_fees: number | null
  currency: string | null
  description: string | null
}

function DiffPanel({ change }: { change: ProgramChange }) {
  if (change.change_type === 'new') {
    let extracted: ExtractedProgram | null = null
    try {
      extracted = JSON.parse(change.new_value || '{}')
    } catch {
      extracted = null
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-border bg-elimux-dark p-3">
          <p className="text-xs text-muted uppercase tracking-wide mb-1">Before</p>
          <p className="text-muted italic">Did not exist</p>
        </div>
        <div className="rounded-lg border border-elimux-success/30 bg-elimux-success/5 p-3">
          <p className="text-xs text-muted uppercase tracking-wide mb-1">After (scraped)</p>
          {extracted ? (
            <div className="space-y-0.5 text-foreground">
              <p className="font-medium">{extracted.name}</p>
              {extracted.level && <p className="text-muted">{extracted.level}</p>}
              {extracted.duration_months && <p className="text-muted">{extracted.duration_months} months</p>}
              {extracted.tuition_fees && (
                <p className="text-muted">
                  {extracted.currency || ''} {extracted.tuition_fees.toLocaleString()}
                </p>
              )}
              {extracted.description && <p className="text-muted text-xs mt-1">{extracted.description}</p>}
            </div>
          ) : (
            <p className="text-muted">{change.new_value}</p>
          )}
        </div>
      </div>
    )
  }

  if (change.change_type === 'deleted') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-border bg-elimux-dark p-3">
          <p className="text-xs text-muted uppercase tracking-wide mb-1">Before</p>
          <p className="text-foreground font-medium">{change.old_value}</p>
        </div>
        <div className="rounded-lg border border-elimux-danger/30 bg-elimux-danger/5 p-3">
          <p className="text-xs text-muted uppercase tracking-wide mb-1">After</p>
          <p className="text-muted italic">Not mentioned on the scraped page</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
      <div className="rounded-lg border border-border bg-elimux-dark p-3">
        <p className="text-xs text-muted uppercase tracking-wide mb-1">{change.field_name} (before)</p>
        <p className="text-foreground">{change.old_value || '—'}</p>
      </div>
      <div className="rounded-lg border border-primary-500/30 bg-primary-500/5 p-3">
        <p className="text-xs text-muted uppercase tracking-wide mb-1">{change.field_name} (scraped)</p>
        <p className="text-foreground">{change.new_value || '—'}</p>
      </div>
    </div>
  )
}

export default function AdminScraperChangesPage() {
  const { adminKey } = useAdminKey()
  const [changes, setChanges] = useState<ProgramChange[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>('pending')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!adminKey) return
    setLoading(true)
    listProgramChanges(adminKey, { status })
      .then((res) => setChanges(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load changes'))
      .finally(() => setLoading(false))
  }, [adminKey, status])

  useEffect(() => {
    load()
  }, [load])

  async function handleApprove(id: string) {
    setBusyId(id)
    setError(null)
    try {
      await approveChange(id, adminKey)
      setChanges((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve change')
    } finally {
      setBusyId(null)
    }
  }

  async function handleReject(id: string) {
    setBusyId(id)
    setError(null)
    try {
      await rejectChange(id, adminKey)
      setChanges((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject change')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <main className="min-h-screen py-12 px-4 max-w-5xl mx-auto">
      <Link href="/admin/scraper" className="text-sm text-muted hover:text-foreground flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Scraper
      </Link>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <GitCompare className="w-8 h-8 text-primary-400" />
          Review Changes
        </h1>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as (typeof STATUS_OPTIONS)[number])}
          className="px-4 py-2 rounded-lg bg-elimux-card border border-border text-foreground text-sm focus:outline-none focus:border-primary-500"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-6 px-4 py-2 rounded-lg bg-elimux-danger/10 border border-elimux-danger/30 text-elimux-danger text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : changes.length === 0 ? (
        <p className="text-center py-12 text-muted">No {status} changes.</p>
      ) : (
        <div className="space-y-4">
          {changes.map((change) => {
            const typeInfo = CHANGE_TYPE_STYLE[change.change_type]
            const Icon = typeInfo.icon
            return (
              <div key={change.id} className="bg-elimux-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {typeInfo.label}
                    </span>
                    <span className="text-sm text-foreground font-medium">
                      {change.institution?.name}
                      {change.program?.name && ` · ${change.program.name}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted">
                      Confidence: <span className="text-foreground font-medium">{Math.round(change.confidence_score * 100)}%</span>
                    </span>
                    {status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(change.id)}
                          disabled={busyId === change.id}
                          className="p-1.5 rounded-lg bg-elimux-success/10 text-elimux-success hover:bg-elimux-success/20 transition-colors disabled:opacity-50"
                          aria-label="Approve"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleReject(change.id)}
                          disabled={busyId === change.id}
                          className="p-1.5 rounded-lg bg-elimux-danger/10 text-elimux-danger hover:bg-elimux-danger/20 transition-colors disabled:opacity-50"
                          aria-label="Reject"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <DiffPanel change={change} />
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
