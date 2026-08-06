'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useAdminKey } from '@/components/admin/AdminKeyContext'
import {
  runTvetaScraper,
  getTvetaStatus,
  listTvetaPending,
  approveTveta,
  rejectTveta,
  type TvetaStatus,
  type TvetaScrapedInstitution,
  type TvetaRunResult,
} from '@/lib/api'
import { ArrowLeft, ShieldCheck, Play, CheckCircle2, XCircle, Loader2, ExternalLink } from 'lucide-react'

export default function TvetaScraperPage() {
  const { adminKey } = useAdminKey()
  const [status, setStatus] = useState<TvetaStatus | null>(null)
  const [pending, setPending] = useState<TvetaScrapedInstitution[]>([])
  const [pendingLoading, setPendingLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [runResult, setRunResult] = useState<TvetaRunResult | null>(null)
  const [runError, setRunError] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)

  const loadStatus = useCallback(() => {
    if (!adminKey) return
    getTvetaStatus(adminKey)
      .then(setStatus)
      .catch(() => setStatus(null))
  }, [adminKey])

  const loadPending = useCallback(() => {
    if (!adminKey) return
    setPendingLoading(true)
    listTvetaPending(adminKey)
      .then((res) => setPending(res.data))
      .catch(() => setPending([]))
      .finally(() => setPendingLoading(false))
  }, [adminKey])

  useEffect(() => {
    loadStatus()
    loadPending()
  }, [loadStatus, loadPending])

  async function handleRun() {
    setRunning(true)
    setRunResult(null)
    setRunError(null)
    try {
      const res = await runTvetaScraper(adminKey)
      setRunResult(res)
      loadStatus()
      loadPending()
    } catch (err) {
      setRunError(err instanceof Error ? err.message : 'Scraper run failed')
    } finally {
      setRunning(false)
    }
  }

  async function handleApprove(id: string) {
    setActingId(id)
    try {
      await approveTveta(id, adminKey)
      loadStatus()
      loadPending()
    } finally {
      setActingId(null)
    }
  }

  async function handleReject(id: string) {
    setActingId(id)
    try {
      await rejectTveta(id, adminKey)
      loadStatus()
      loadPending()
    } finally {
      setActingId(null)
    }
  }

  return (
    <main className="min-h-screen py-12 px-4 max-w-5xl mx-auto">
      <Link href="/admin" className="text-sm text-muted hover:text-foreground flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold text-foreground flex items-center gap-3 mb-6">
        <ShieldCheck className="w-8 h-8 text-primary-400" />
        TVETA Accreditation Scraper
      </h1>

      <div className="bg-elimux-card border border-border rounded-xl p-4 mb-6 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
        <p className="text-sm text-muted">
          Checks robots.txt before every run, waits 2.5s between requests, and only reads TVETA&apos;s public
          accredited-institutions listing. Results land here for review before anything is linked to a live
          institution.
        </p>
      </div>

      {status && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-elimux-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{status.total}</p>
            <p className="text-xs text-muted">Total Scraped</p>
          </div>
          <div className="bg-elimux-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-elimux-warning">{status.pending}</p>
            <p className="text-xs text-muted">Pending Review</p>
          </div>
          <div className="bg-elimux-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-elimux-success">{status.approved}</p>
            <p className="text-xs text-muted">Approved &amp; Linked</p>
          </div>
        </div>
      )}

      <div className="bg-elimux-card border border-border rounded-xl p-5 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-sm font-medium text-foreground">Run scraper</h2>
            <p className="text-sm text-muted mt-1">Scrapes the TVETA registry. Takes a few minutes.</p>
          </div>
          <button
            onClick={handleRun}
            disabled={running}
            className="px-5 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {running ? 'Running...' : 'Run Scraper'}
          </button>
        </div>

        {runResult && (
          <p className="text-sm text-elimux-success mt-3">
            Found {runResult.institutionsFound} institutions across {runResult.pagesScanned} pages — {runResult.inserted} new,{' '}
            {runResult.duplicates} duplicates skipped.
          </p>
        )}
        {runError && <p className="text-sm text-elimux-danger mt-3">{runError}</p>}
      </div>

      <h2 className="text-sm font-medium text-foreground mb-4">Pending review {pending.length > 0 && `(${pending.length})`}</h2>
      {pendingLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : (
        <div className="bg-elimux-card border border-border rounded-xl divide-y divide-border">
          {pending.map((inst) => (
            <div key={inst.id} className="flex items-center gap-3 p-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{inst.name}</p>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {inst.registration_number && (
                    <span className="text-[10px] bg-primary-500/10 text-primary-400 px-1.5 py-0.5 rounded font-mono">
                      {inst.registration_number}
                    </span>
                  )}
                  {inst.category && (
                    <span className="text-[10px] bg-elimux-dark text-muted px-1.5 py-0.5 rounded">{inst.category}</span>
                  )}
                  {inst.county && (
                    <span className="text-[10px] bg-elimux-success/10 text-elimux-success px-1.5 py-0.5 rounded">
                      {inst.county}
                    </span>
                  )}
                </div>
              </div>
              <a
                href={inst.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted hover:text-foreground shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={() => handleReject(inst.id)}
                disabled={actingId === inst.id}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border text-muted hover:text-elimux-danger hover:border-elimux-danger transition-colors shrink-0 disabled:opacity-50"
              >
                <XCircle className="w-3 h-3 inline mr-1" />
                Reject
              </button>
              <button
                onClick={() => handleApprove(inst.id)}
                disabled={actingId === inst.id}
                className="bg-elimux-success hover:opacity-90 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity shrink-0 flex items-center gap-1 disabled:opacity-50"
              >
                <CheckCircle2 className="w-3 h-3" />
                Approve
              </button>
            </div>
          ))}
          {pending.length === 0 && <p className="px-4 py-8 text-center text-muted text-sm">No pending institutions.</p>}
        </div>
      )}
    </main>
  )
}
