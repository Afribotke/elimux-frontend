'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  listComplianceFlags,
  resolveComplianceFlag,
  listVerifiedEmployers,
  type ComplianceFlag,
  type VerifiedEmployer,
} from '@/lib/api'
import { useAdminKey } from '@/components/admin/AdminKeyContext'
import { ArrowLeft, Shield, Flag, ShieldCheck, CheckCircle2 } from 'lucide-react'

type Tab = 'flags' | 'verified'

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-elimux-danger/10 text-elimux-danger',
  high: 'bg-elimux-warning/10 text-elimux-warning',
  warning: 'bg-elimux-warning/10 text-elimux-warning',
  info: 'bg-primary-500/10 text-primary-400',
}

export default function AdminCompliancePage() {
  const { adminKey } = useAdminKey()
  const [tab, setTab] = useState<Tab>('flags')

  const [flags, setFlags] = useState<ComplianceFlag[]>([])
  const [flagsCount, setFlagsCount] = useState(0)
  const [flagsLoading, setFlagsLoading] = useState(true)
  const [flagsError, setFlagsError] = useState<string | null>(null)
  const [resolvedFilter, setResolvedFilter] = useState<'false' | 'true' | ''>('false')
  const [busyId, setBusyId] = useState<string | null>(null)

  const [verified, setVerified] = useState<VerifiedEmployer[]>([])
  const [verifiedCount, setVerifiedCount] = useState(0)
  const [verifiedLoading, setVerifiedLoading] = useState(true)
  const [verifiedError, setVerifiedError] = useState<string | null>(null)

  const loadFlags = useCallback(async () => {
    if (!adminKey) return
    setFlagsLoading(true)
    try {
      const res = await listComplianceFlags(adminKey, {
        resolved: resolvedFilter === '' ? undefined : resolvedFilter === 'true',
      })
      setFlags(res.data)
      setFlagsCount(res.count)
      setFlagsError(null)
    } catch (err) {
      setFlagsError(err instanceof Error ? err.message : 'Failed to load compliance flags')
    } finally {
      setFlagsLoading(false)
    }
  }, [adminKey, resolvedFilter])

  const loadVerified = useCallback(async () => {
    if (!adminKey) return
    setVerifiedLoading(true)
    try {
      const res = await listVerifiedEmployers(adminKey, { is_active: true })
      setVerified(res.data)
      setVerifiedCount(res.count)
      setVerifiedError(null)
    } catch (err) {
      setVerifiedError(err instanceof Error ? err.message : 'Failed to load verified employers')
    } finally {
      setVerifiedLoading(false)
    }
  }, [adminKey])

  useEffect(() => {
    if (tab === 'flags') loadFlags()
    else loadVerified()
  }, [tab, loadFlags, loadVerified])

  async function handleResolve(id: string) {
    if (!adminKey) return
    setBusyId(id)
    try {
      await resolveComplianceFlag(id, { resolved: true, resolution_notes: 'Resolved from admin dashboard' }, adminKey)
      setFlags((prev) => prev.filter((f) => f.id !== id))
      setFlagsCount((c) => Math.max(0, c - 1))
    } catch (err) {
      setFlagsError(err instanceof Error ? err.message : 'Failed to resolve flag')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <main className="min-h-screen py-12 px-4 max-w-6xl mx-auto">
      <Link href="/admin" className="text-sm text-muted hover:text-foreground flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
        <Shield className="w-8 h-8 text-primary-400" />
        Compliance & Verification
      </h1>
      <p className="text-muted mb-6">
        ElimuX&apos;s own platform trust &amp; safety layer — separate from NITA&apos;s regulatory compliance.
      </p>

      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setTab('flags')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
            tab === 'flags' ? 'bg-primary-500/10 text-primary-400' : 'text-muted hover:text-foreground hover:bg-muted/10'
          }`}
        >
          <Flag className="w-3.5 h-3.5" /> Compliance Flags
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted/20">{flagsCount}</span>
        </button>
        <button
          onClick={() => setTab('verified')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
            tab === 'verified' ? 'bg-primary-500/10 text-primary-400' : 'text-muted hover:text-foreground hover:bg-muted/10'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" /> Verified Employers
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted/20">{verifiedCount}</span>
        </button>
      </div>

      {tab === 'flags' && (
        <>
          <div className="flex items-center gap-2 mb-4">
            {(['false', 'true', ''] as const).map((v) => (
              <button
                key={v}
                onClick={() => setResolvedFilter(v)}
                className={`px-3 py-1 rounded-lg text-xs font-medium ${
                  resolvedFilter === v ? 'bg-primary-500/10 text-primary-400' : 'text-muted hover:text-foreground'
                }`}
              >
                {v === 'false' ? 'Open' : v === 'true' ? 'Resolved' : 'All'}
              </button>
            ))}
          </div>

          {flagsError && (
            <div className="mb-6 px-4 py-2 rounded-lg bg-elimux-danger/10 border border-elimux-danger/30 text-elimux-danger text-sm">
              {flagsError}
            </div>
          )}

          {flagsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted">Loading flags...</p>
            </div>
          ) : flags.length === 0 ? (
            <p className="text-muted text-sm bg-elimux-card rounded-xl p-4 border border-border">No flags found.</p>
          ) : (
            <div className="bg-elimux-card border border-border rounded-xl divide-y divide-border">
              {flags.map((f) => (
                <div key={f.id} className="p-4 flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-medium text-foreground">
                        {f.employer?.company_name || 'Unknown employer'}
                      </span>
                      <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-muted/20 text-muted">
                        {f.flag_type.replace(/_/g, ' ')}
                      </span>
                      <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${SEVERITY_STYLES[f.severity] || SEVERITY_STYLES.info}`}>
                        {f.severity}
                      </span>
                    </div>
                    <p className="text-sm text-muted">{f.flag_reason}</p>
                    <p className="text-xs text-muted mt-1">
                      {f.source} · {new Date(f.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {!f.resolved && (
                    <button
                      onClick={() => handleResolve(f.id)}
                      disabled={busyId === f.id}
                      className="px-3 py-1.5 min-h-[36px] rounded-lg bg-elimux-success/10 text-elimux-success text-xs font-medium disabled:opacity-50 flex items-center gap-1 flex-shrink-0"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark Resolved
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'verified' && (
        <>
          {verifiedError && (
            <div className="mb-6 px-4 py-2 rounded-lg bg-elimux-danger/10 border border-elimux-danger/30 text-elimux-danger text-sm">
              {verifiedError}
            </div>
          )}

          {verifiedLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted">Loading verified employers...</p>
            </div>
          ) : verified.length === 0 ? (
            <p className="text-muted text-sm bg-elimux-card rounded-xl p-4 border border-border">
              No employers verified through this system yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {verified.map((v) => (
                <div key={v.id} className="bg-elimux-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-foreground">{v.employer?.company_name || 'Unknown'}</p>
                    <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-elimux-success/10 text-elimux-success">
                      {v.tier.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-muted mb-2">
                    {v.employer?.industry || '—'} · {v.employer?.location_county || '—'}
                  </p>
                  <p className="text-xs text-muted">Method: {v.verification_method.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-muted">Verified {new Date(v.verified_at).toLocaleDateString()}</p>
                  {v.verification_notes && (
                    <p className="text-xs text-muted mt-2 italic">&ldquo;{v.verification_notes}&rdquo;</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  )
}
