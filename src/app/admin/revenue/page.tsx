'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getAnalyticsRevenue, type AnalyticsRevenue } from '@/lib/api'
import { useAdminKey } from '@/components/admin/AdminKeyContext'
import PieChart from '@/components/admin/charts/PieChart'
import { ArrowLeft, DollarSign } from 'lucide-react'

type AdPayment = {
  id: string
  amount: number
  status: string
  paystack_reference: string | null
  created_at: string
  advertiser: { organization_name: string; email: string } | null
}

type RevenueData = AnalyticsRevenue & {
  ad_revenue_total_kes?: number
  ad_revenue_30d_kes?: number
  ad_payment_history?: AdPayment[]
}

export default function AdminRevenuePage() {
  const { adminKey } = useAdminKey()
  const [revenue, setRevenue] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!adminKey) return
    setLoading(true)
    getAnalyticsRevenue(adminKey)
      .then((res) => setRevenue(res.data as RevenueData))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load revenue'))
      .finally(() => setLoading(false))
  }, [adminKey])

  return (
    <main className="min-h-screen py-12 px-4 max-w-6xl mx-auto">
      <Link href="/admin" className="text-sm text-muted hover:text-foreground flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold text-foreground mb-8 flex items-center gap-3">
        <DollarSign className="w-8 h-8 text-primary-400" />
        Revenue
      </h1>

      {error && (
        <div className="mb-6 px-4 py-2 rounded-lg bg-elimux-danger/10 border border-elimux-danger/30 text-elimux-danger text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted">Loading revenue...</p>
        </div>
      ) : revenue ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-elimux-card rounded-xl p-6 border border-border">
              <p className="text-sm text-muted mb-1">Monthly Recurring Revenue</p>
              <p className="text-3xl font-bold text-foreground">KES {revenue.mrr_kes.toLocaleString()}</p>
            </div>
            <div className="bg-elimux-card rounded-xl p-6 border border-border">
              <p className="text-sm text-muted mb-1">Ad Revenue (all time)</p>
              <p className="text-3xl font-bold text-foreground">KES {(revenue.ad_revenue_total_kes ?? 0).toLocaleString()}</p>
            </div>
            <div className="bg-elimux-card rounded-xl p-6 border border-border">
              <p className="text-sm text-muted mb-1">Ad Revenue (last 30 days)</p>
              <p className="text-3xl font-bold text-foreground">KES {(revenue.ad_revenue_30d_kes ?? 0).toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-elimux-card rounded-xl p-6 border border-border mb-6">
            <h2 className="text-sm font-medium text-foreground mb-4">Revenue by plan</h2>
            <PieChart data={revenue.revenue_by_plan.map((p) => ({ label: p.plan, value: p.revenue_kes }))} />
          </div>

          <div className="bg-elimux-card border border-border rounded-xl overflow-hidden overflow-x-auto mb-6">
            <h2 className="text-sm font-medium text-foreground p-5 pb-0">Subscription payment history (last 30 days)</h2>
            <table className="w-full text-sm mt-4">
              <thead className="bg-elimux-dark text-muted text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Subscriber</th>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {revenue.payment_history.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-4 py-3 text-muted whitespace-nowrap">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-foreground">{p.subscriber?.email || '—'}</td>
                    <td className="px-4 py-3 text-muted">{p.subscription?.plan?.name || '—'}</td>
                    <td className="px-4 py-3 text-foreground tabular-nums">
                      {p.currency} {p.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          p.status === 'success'
                            ? 'text-elimux-success'
                            : p.status === 'pending'
                              ? 'text-elimux-warning'
                              : 'text-elimux-danger'
                        }
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {revenue.payment_history.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted">
                      No subscription payments in the last 30 days.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-elimux-card border border-border rounded-xl overflow-hidden overflow-x-auto">
            <h2 className="text-sm font-medium text-foreground p-5 pb-0">Ad payment history (last 30 days)</h2>
            <table className="w-full text-sm mt-4">
              <thead className="bg-elimux-dark text-muted text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Advertiser</th>
                  <th className="px-4 py-3 font-medium">Reference</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(revenue.ad_payment_history ?? []).map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-4 py-3 text-muted whitespace-nowrap">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-foreground">{p.advertiser?.organization_name || '—'}</td>
                    <td className="px-4 py-3 text-muted text-xs">{p.paystack_reference || '—'}</td>
                    <td className="px-4 py-3 text-foreground tabular-nums">KES {Number(p.amount).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          p.status === 'paid'
                            ? 'text-elimux-success'
                            : p.status === 'pending'
                              ? 'text-elimux-warning'
                              : 'text-elimux-danger'
                        }
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {(revenue.ad_payment_history ?? []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted">
                      No ad payments in the last 30 days.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </main>
  )
}
