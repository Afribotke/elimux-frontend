'use client'

// ============================================
// ADMIN - AD CAMPAIGN MODERATION
// /admin/campaigns
// ============================================

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Megaphone } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL

type Campaign = {
  id: string
  title: string
  headline: string | null
  image_url: string
  target_url: string
  placement: string
  budget: number
  duration_days: number
  status: string
  impressions: number
  clicks: number
  rejection_reason: string | null
  created_at: string
  advertiser: { organization_name: string; email: string; status: string } | null
}

const TABS = ['pending_review', 'active', 'paused', 'rejected', 'draft', 'all']

const STATUS_STYLES: Record<string, string> = {
  pending_review: 'bg-primary-500/10 text-primary-400',
  active: 'bg-elimux-success/10 text-elimux-success',
  paused: 'bg-elimux-warning/10 text-elimux-warning',
  rejected: 'bg-elimux-danger/10 text-elimux-danger',
  draft: 'bg-muted/20 text-muted',
}

const kes = (n: number) => 'KES ' + Number(n).toLocaleString('en-KE', { minimumFractionDigits: 2 })

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [tab, setTab] = useState('pending_review')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rejecting, setRejecting] = useState<Campaign | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  const adminKey = () => sessionStorage.getItem('elimux-admin-key') || ''

  const load = useCallback(async (status: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(API_URL + '/api/admin/campaigns?status=' + status, {
        headers: { 'X-Admin-Key': adminKey() },
      })
      if (!res.ok) throw new Error('Request failed: ' + res.status)
      const json = await res.json()
      setCampaigns(json.data || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(tab) }, [tab, load])

  const post = async (path: string, body?: object, method = 'POST') => {
    setBusy(true)
    try {
      const res = await fetch(API_URL + path, {
        method,
        headers: { 'X-Admin-Key': adminKey(), 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Action failed')
      await load(tab)
      return true
    } catch (e: any) {
      alert(e.message)
      return false
    } finally {
      setBusy(false)
    }
  }

  const confirmReject = async () => {
    if (!rejecting || !reason.trim()) return
    const ok = await post('/api/admin/campaigns/' + rejecting.id + '/reject', { rejection_reason: reason.trim() })
    if (ok) { setRejecting(null); setReason('') }
  }

  return (
    <main className="min-h-screen py-12 px-4 max-w-6xl mx-auto">
      <Link href="/admin" className="text-sm text-muted hover:text-foreground flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
        <Megaphone className="w-8 h-8 text-primary-400" />
        Ad Campaigns
      </h1>
      <p className="text-muted mb-6">Review advertiser campaigns before they go live. Rejected campaigns are refunded automatically.</p>

      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ' +
              (tab === t
                ? 'bg-primary-500/10 text-primary-400 border-primary-500'
                : 'bg-elimux-card text-muted border-border hover:text-foreground hover:bg-muted/10')
            }
          >
            {t.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted">Loading campaigns...</p>
        </div>
      )}

      {error && (
        <div className="mb-6 px-4 py-2 rounded-lg bg-elimux-danger/10 border border-elimux-danger/30 text-elimux-danger text-sm">
          {error}
        </div>
      )}

      {!loading && !error && campaigns.length === 0 && (
        <p className="text-muted text-sm bg-elimux-card rounded-xl p-4 border border-border">
          No campaigns with status &quot;{tab.replace('_', ' ')}&quot;.
        </p>
      )}

      <div className="space-y-4">
        {campaigns.map((c) => (
          <div key={c.id} className="rounded-xl border border-border bg-elimux-card p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex gap-4 min-w-0">
                {c.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image_url} alt="" className="w-20 h-20 rounded-lg object-cover bg-muted/10 shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold text-foreground truncate">{c.title}</h2>
                    <span className={'px-2 py-0.5 rounded-full text-xs font-medium ' + (STATUS_STYLES[c.status] || 'bg-muted/20 text-muted')}>
                      {c.status.replace('_', ' ')}
                    </span>
                  </div>
                  {c.headline && <p className="text-sm text-muted truncate">{c.headline}</p>}
                  <p className="text-xs text-muted mt-1 truncate">→ {c.target_url}</p>
                  <p className="text-xs text-muted mt-1">
                    {c.advertiser?.organization_name || 'Unknown advertiser'} · {c.advertiser?.email || ''} · placement: {c.placement} · {kes(c.budget)} / {c.duration_days} days
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {c.impressions} impressions · {c.clicks} clicks · created {new Date(c.created_at).toLocaleDateString()}
                  </p>
                  {c.rejection_reason && <p className="text-xs text-elimux-danger mt-1">Reason: {c.rejection_reason}</p>}
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                {c.status === 'pending_review' && (
                  <>
                    <button disabled={busy} onClick={() => post('/api/admin/campaigns/' + c.id + '/approve')} className="px-4 py-2 rounded-lg bg-elimux-success/20 text-elimux-success hover:bg-elimux-success/30 text-sm font-medium transition-colors disabled:opacity-50">Approve</button>
                    <button disabled={busy} onClick={() => { setRejecting(c); setReason('') }} className="px-4 py-2 rounded-lg bg-elimux-danger/20 text-elimux-danger hover:bg-elimux-danger/30 text-sm font-medium transition-colors disabled:opacity-50">Reject</button>
                  </>
                )}
                {c.status === 'active' && (
                  <button disabled={busy} onClick={() => post('/api/admin/campaigns/' + c.id + '/status', { status: 'paused' }, 'PATCH')} className="px-4 py-2 rounded-lg bg-elimux-warning/20 text-elimux-warning hover:bg-elimux-warning/30 text-sm font-medium transition-colors disabled:opacity-50">Pause</button>
                )}
                {c.status === 'paused' && (
                  <button disabled={busy} onClick={() => post('/api/admin/campaigns/' + c.id + '/status', { status: 'active' }, 'PATCH')} className="px-4 py-2 rounded-lg bg-elimux-success/20 text-elimux-success hover:bg-elimux-success/30 text-sm font-medium transition-colors disabled:opacity-50">Reactivate</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {rejecting && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="rounded-xl border border-border bg-elimux-card p-6 w-full max-w-md">
            <h3 className="font-semibold text-foreground mb-2">Reject &quot;{rejecting.title}&quot;</h3>
            <p className="text-sm text-muted mb-4">{kes(rejecting.budget)} will be refunded to {rejecting.advertiser?.organization_name || 'the advertiser'}.</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for rejection (required — the advertiser sees this)"
              className="w-full h-24 rounded-lg bg-elimux-dark border border-border text-foreground p-3 text-sm mb-4 focus:outline-none focus:border-primary-500"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setRejecting(null)} className="px-4 py-2 rounded-lg border border-border text-muted hover:text-foreground text-sm font-medium transition-colors">Cancel</button>
              <button disabled={busy || !reason.trim()} onClick={confirmReject} className="px-4 py-2 rounded-lg bg-elimux-danger/20 text-elimux-danger hover:bg-elimux-danger/30 text-sm font-medium transition-colors disabled:opacity-50">Reject &amp; Refund</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
