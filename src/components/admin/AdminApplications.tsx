'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  listAdminApplications,
  approveApplication,
  rejectApplication,
  approveProgramApplication,
  rejectProgramApplication,
  type AdminInstitutionApplication,
} from '@/lib/api'
import { useAdminKey } from '@/components/admin/AdminKeyContext'
import { ClipboardList, CheckCircle2, XCircle, Clock, Building2, ChevronDown, ChevronUp } from 'lucide-react'

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-elimux-warning/10 text-elimux-warning',
    approved: 'bg-elimux-success/10 text-elimux-success',
    rejected: 'bg-elimux-danger/10 text-elimux-danger',
  }
  const icons: Record<string, React.ReactNode> = {
    pending: <Clock className="w-3 h-3" />,
    approved: <CheckCircle2 className="w-3 h-3" />,
    rejected: <XCircle className="w-3 h-3" />,
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || styles.pending}`}>
      {icons[status] || icons.pending}
      {status}
    </span>
  )
}

export default function AdminApplications() {
  const { adminKey } = useAdminKey()
  const [applications, setApplications] = useState<AdminInstitutionApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})

  const loadApplications = useCallback(async () => {
    if (!adminKey) return
    setLoading(true)
    setError(null)
    try {
      // Fetch everything and filter client-side (not just status=pending):
      // an institution already approved can still have a program application
      // that arrived later and is still awaiting its own review.
      const { data } = await listAdminApplications(adminKey)
      setApplications(
        data.filter((app) => app.status === 'pending' || app.programs.some((p) => p.status === 'pending'))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications')
    } finally {
      setLoading(false)
    }
  }, [adminKey])

  useEffect(() => {
    loadApplications()
  }, [loadApplications])

  async function handleApprove(id: string) {
    if (!adminKey) return
    setBusyId(id)
    try {
      await approveApplication(id, adminKey, notes[id])
      await loadApplications()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve application')
    } finally {
      setBusyId(null)
    }
  }

  async function handleReject(id: string) {
    if (!adminKey) return
    setBusyId(id)
    try {
      await rejectApplication(id, adminKey, notes[id])
      await loadApplications()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject application')
    } finally {
      setBusyId(null)
    }
  }

  async function handleProgramApprove(programId: string) {
    if (!adminKey) return
    setBusyId(programId)
    try {
      await approveProgramApplication(programId, adminKey)
      await loadApplications()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve program')
    } finally {
      setBusyId(null)
    }
  }

  async function handleProgramReject(programId: string) {
    if (!adminKey) return
    setBusyId(programId)
    try {
      await rejectProgramApplication(programId, adminKey)
      await loadApplications()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject program')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <ClipboardList className="w-5 h-5 text-primary-400" />
        Pending Applications
        {applications.length > 0 && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400">
            {applications.length}
          </span>
        )}
      </h2>

      {error && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-elimux-danger/10 border border-elimux-danger/30 text-elimux-danger text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : applications.length === 0 ? (
        <p className="text-muted text-sm bg-elimux-card rounded-xl p-4 border border-border">
          No pending applications.
        </p>
      ) : (
        <div className="bg-elimux-card border border-border rounded-xl divide-y divide-border">
          {applications.map((app) => {
            const expanded = expandedId === app.id
            return (
              <div key={app.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <Building2 className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{app.name}</p>
                        <StatusPill status={app.status} />
                      </div>
                      <p className="text-xs text-muted">
                        {app.email} · {app.programs.length} program{app.programs.length === 1 ? '' : 's'} submitted
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedId(expanded ? null : app.id)}
                    className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-lg text-muted hover:text-foreground hover:bg-muted/10 transition-colors"
                    aria-label={expanded ? 'Collapse' : 'Expand'}
                  >
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {expanded && (
                  <div className="mt-4 space-y-4">
                    {app.description && <p className="text-sm text-muted">{app.description}</p>}

                    {app.programs.length > 0 && (
                      <div className="border border-border rounded-lg divide-y divide-border">
                        {app.programs.map((program) => (
                          <div key={program.id} className="p-3 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm text-foreground truncate">{program.name}</p>
                              <p className="text-xs text-muted">{program.level}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <StatusPill status={program.status} />
                              {program.status === 'pending' && app.status === 'approved' && (
                                <>
                                  <button
                                    onClick={() => handleProgramApprove(program.id)}
                                    disabled={busyId === program.id}
                                    className="px-2.5 py-1.5 min-h-[36px] rounded-lg bg-elimux-success/10 text-elimux-success text-xs font-medium disabled:opacity-50"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleProgramReject(program.id)}
                                    disabled={busyId === program.id}
                                    className="px-2.5 py-1.5 min-h-[36px] rounded-lg bg-elimux-danger/10 text-elimux-danger text-xs font-medium disabled:opacity-50"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {app.status === 'pending' && (
                      <>
                        <textarea
                          placeholder="Admin notes (optional)"
                          value={notes[app.id] || ''}
                          onChange={(e) => setNotes((prev) => ({ ...prev, [app.id]: e.target.value }))}
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg bg-elimux-dark border border-border text-foreground text-sm focus:outline-none focus:border-primary-500"
                        />

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(app.id)}
                            disabled={busyId === app.id}
                            className="flex-1 px-4 py-2.5 min-h-[44px] rounded-lg bg-elimux-success/20 text-elimux-success text-sm font-medium disabled:opacity-50"
                          >
                            {busyId === app.id ? 'Working...' : 'Approve Institution + Programs'}
                          </button>
                          <button
                            onClick={() => handleReject(app.id)}
                            disabled={busyId === app.id}
                            className="flex-1 px-4 py-2.5 min-h-[44px] rounded-lg bg-elimux-danger/20 text-elimux-danger text-sm font-medium disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
