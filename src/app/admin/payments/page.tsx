'use client'

// ============================================
// ADMIN - PAYMENTS OVERVIEW
// /admin/payments
// Read-only view across the two live payment flows:
//   - subscriptions (routes/payments.ts)
//   - advertiser wallet top-ups (routes/advertiser-payments.ts)
// Paystack secret key is never fetched or displayed here — only a
// configured/testMode flag derived server-side from the env var.
// ============================================

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, CreditCard, CheckCircle2, XCircle } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL

type SubscriptionPayment = {
  id: string
  amount: number
  currency: string
  status: string
  payment_method: string | null
  paystack_reference: string
  created_at: string
  subscriber: { email: string } | null
}

type AdPayment = {
  id: string
  amount: number
  status: string
  paystack_reference: string
  paid_at: string | null
  created_at: string
  advertiser: { organization_name: string; email: string } | null
}

type Overview = {
  paystack: { configured: boolean; testMode: boolean }
  totals: {
    combined_revenue: number
    subscription_revenue: number
    subscription_transactions: number
    subscription_successful: number
    ad_topup_revenue: number
    ad_topup_transactions: number
    ad_topup_successful: number
  }
  recent_subscription_payments: SubscriptionPayment[]
  recent_ad_payments: AdPayment[]
}

const adminKey = () => sessionStorage.getItem('elimux-admin-key') || ''

const kes = (n: number) => 'KES ' + Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })

const STATUS_STYLES: Record<string, string> = {
  success: 'bg-elimux-success/10 text-elimux-success',
  paid: 'bg-elimux-success/10 text-elimux-success',
  pending: 'bg-elimux-warning/10 text-elimux-warning',
  processing: 'bg-primary-500/10 text-primary-400',
  failed: 'bg-elimux-danger/10 text-elimux-danger',
  refunded: 'bg-muted/20 text-muted',
}

export default function AdminPaymentsPage() {
  const [data, setData] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(API_URL + '/api/admin/payments', {
        headers: { 'X-Admin-Key': adminKey() },
      })
      if (!res.ok) throw new Error('Request failed: ' + res.status)
      const json = await res.json()
      setData(json.data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <main className="min-h-screen py-12 px-4 max-w-6xl mx-auto">
      <Link href="/admin" className="text-sm text-muted hover:text-foreground flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
        <CreditCard className="w-8 h-8 text-primary-400" />
        Payments
      </h1>
      <p className="text-muted mb-6">
        Combined view of subscriber billing and advertiser wallet top-ups. Both flows run on Paystack and are
        configured entirely via backend environment variables — no keys are stored or shown here.
      </p>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted">Loading payments overview...</p>
        </div>
      )}

      {error && (
        <div className="mb-6 px-4 py-2 rounded-lg bg-elimux-danger/10 border border-elimux-danger/30 text-elimux-danger text-sm">
          {error} — if you have not signed in, open /admin first, then return here.
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* Paystack status */}
          <div className="rounded-xl border border-border bg-elimux-card p-5 mb-8 flex items-center gap-3">
            {data.paystack.configured ? (
              <CheckCircle2 className="w-5 h-5 text-elimux-success shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-elimux-danger shrink-0" />
            )}
            <div>
              <p className="text-sm font-medium text-foreground">
                Paystack {data.paystack.configured ? 'configured' : 'not configured'}
                {data.paystack.configured && (
                  <span className={'ml-2 px-2 py-0.5 rounded-full text-xs font-medium ' + (data.paystack.testMode ? 'bg-elimux-warning/10 text-elimux-warning' : 'bg-elimux-success/10 text-elimux-success')}>
                    {data.paystack.testMode ? 'Test mode' : 'Live mode'}
                  </span>
                )}
              </p>
              <p className="text-xs text-muted mt-0.5">
                {data.paystack.configured
                  ? 'PAYSTACK_SECRET_KEY is set on the backend service.'
                  : 'Set PAYSTACK_SECRET_KEY as an environment variable on the backend service to enable payments.'}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="rounded-xl border border-border bg-elimux-card p-5">
              <p className="text-sm text-muted">Combined Revenue</p>
              <p className="text-2xl font-bold text-foreground mt-1">{kes(data.totals.combined_revenue)}</p>
            </div>
            <div className="rounded-xl border border-border bg-elimux-card p-5">
              <p className="text-sm text-muted">Subscription Revenue</p>
              <p className="text-2xl font-bold text-primary-400 mt-1">{kes(data.totals.subscription_revenue)}</p>
              <p className="text-xs text-muted mt-1">{data.totals.subscription_successful} / {data.totals.subscription_transactions} successful</p>
            </div>
            <div className="rounded-xl border border-border bg-elimux-card p-5">
              <p className="text-sm text-muted">Advertiser Top-ups</p>
              <p className="text-2xl font-bold text-elimux-success mt-1">{kes(data.totals.ad_topup_revenue)}</p>
              <p className="text-xs text-muted mt-1">{data.totals.ad_topup_successful} / {data.totals.ad_topup_transactions} successful</p>
            </div>
          </div>

          {/* Recent subscription payments */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-3">Recent Subscription Payments</h2>
            {data.recent_subscription_payments.length === 0 ? (
              <p className="text-muted text-sm bg-elimux-card rounded-xl p-4 border border-border">No subscription payments yet.</p>
            ) : (
              <div className="rounded-xl border border-border bg-elimux-card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-muted">Subscriber</th>
                      <th className="text-right py-3 px-4 font-medium text-muted">Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-muted">Method</th>
                      <th className="text-left py-3 px-4 font-medium text-muted">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-muted">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.recent_subscription_payments.map((p) => (
                      <tr key={p.id}>
                        <td className="py-3 px-4 text-foreground">{p.subscriber?.email || 'Unknown'}</td>
                        <td className="py-3 px-4 text-right font-medium text-foreground">{p.currency} {Number(p.amount).toFixed(2)}</td>
                        <td className="py-3 px-4 text-muted capitalize">{p.payment_method || '—'}</td>
                        <td className="py-3 px-4">
                          <span className={'px-2 py-1 rounded-full text-xs font-medium ' + (STATUS_STYLES[p.status] || 'bg-muted/20 text-muted')}>{p.status}</span>
                        </td>
                        <td className="py-3 px-4 text-muted">{new Date(p.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Recent ad top-ups */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Recent Advertiser Top-ups</h2>
            {data.recent_ad_payments.length === 0 ? (
              <p className="text-muted text-sm bg-elimux-card rounded-xl p-4 border border-border">No advertiser top-ups yet.</p>
            ) : (
              <div className="rounded-xl border border-border bg-elimux-card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-muted">Advertiser</th>
                      <th className="text-right py-3 px-4 font-medium text-muted">Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-muted">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-muted">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.recent_ad_payments.map((p) => (
                      <tr key={p.id}>
                        <td className="py-3 px-4 text-foreground">{p.advertiser?.organization_name || 'Unknown'}</td>
                        <td className="py-3 px-4 text-right font-medium text-foreground">{kes(p.amount)}</td>
                        <td className="py-3 px-4">
                          <span className={'px-2 py-1 rounded-full text-xs font-medium ' + (STATUS_STYLES[p.status] || 'bg-muted/20 text-muted')}>{p.status}</span>
                        </td>
                        <td className="py-3 px-4 text-muted">{new Date(p.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  )
}
