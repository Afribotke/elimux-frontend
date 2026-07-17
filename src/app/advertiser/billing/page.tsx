'use client'

// ============================================
// ELIMUX AD PORTAL - BILLING & PAYMENTS PAGE
// /advertiser/billing
// ============================================

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Wallet, Receipt } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { advertiserFetch, ADVERTISER_LOGIN_PATH } from '@/lib/advertiserAuth'
import AdvertiserNav from '@/components/AdvertiserNav'

interface Payment {
  id: string
  amount: number
  // Verified against the live ad_payments_status_check constraint -
  // 'completed' is rejected, 'paid' is the accepted value.
  status: 'pending' | 'paid' | 'failed'
  paystack_reference?: string
  paid_at?: string
  created_at: string
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'bg-elimux-warning/10 text-elimux-warning',
    paid: 'bg-elimux-success/10 text-elimux-success',
    failed: 'bg-elimux-danger/10 text-elimux-danger',
  }
  return colors[status] || 'bg-muted/20 text-muted'
}

export default function BillingPage() {
  const router = useRouter()
  const [balance, setBalance] = useState(0)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [amount, setAmount] = useState(500)
  const [payLoading, setPayLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push(ADVERTISER_LOGIN_PATH)
        return
      }

      const statsRes = await advertiserFetch('/api/advertiser/stats')
      const statsData = await statsRes.json()
      if (statsData.success) setBalance(statsData.data.balance)

      const paymentsRes = await advertiserFetch('/api/advertiser/payments/history')
      const paymentsData = await paymentsRes.json()
      if (paymentsData.success) setPayments(paymentsData.data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    if (amount < 100) {
      setError('Minimum top-up is KES 100')
      return
    }

    setPayLoading(true)
    setError('')

    try {
      const response = await advertiserFetch('/api/advertiser/payments/paystack/create', {
        method: 'POST',
        body: JSON.stringify({ amount }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      if (data.data?.authorization_url) {
        window.location.href = data.data.authorization_url
      } else {
        throw new Error('No authorization URL received')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setPayLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-elimux-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-elimux-dark">
      <AdvertiserNav />
      <div className="max-w-6xl mx-auto px-4 pb-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Billing & Payments</h1>
          <p className="text-muted mt-1">Manage your advertising wallet</p>
        </div>

        {error && (
          <div className="bg-elimux-danger/10 border border-elimux-danger/30 rounded-lg p-4 text-elimux-danger text-sm mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-elimux-card border border-border rounded-xl p-6">
              <div className="text-sm text-muted mb-1">Current Balance</div>
              <div className="text-4xl font-bold text-foreground">KES {balance.toFixed(2)}</div>
              <div className="text-sm text-muted mt-1">Available for campaigns</div>
            </div>

            <div className="bg-elimux-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary-400" />
                Top Up with Card (Paystack)
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted mb-2 block">Amount (KES)</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {[500, 1000, 5000, 10000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAmount(amt)}
                        className={`px-3 py-1 rounded border text-sm ${
                          amount === amt
                            ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                            : 'border-border text-muted'
                        }`}
                      >
                        KES {amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min={100}
                    value={amount}
                    onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                  />
                </div>
                <button
                  onClick={handlePayment}
                  disabled={payLoading}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-elimux-dark font-semibold py-2 rounded-lg disabled:opacity-50"
                >
                  {payLoading ? 'Processing...' : `Pay KES ${amount.toLocaleString()}`}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-elimux-card border border-border rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">Payment History</h2>
              </div>

              {payments.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-muted/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Receipt className="w-8 h-8 text-muted" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-1">No payments yet</h3>
                  <p className="text-muted">Top up your balance to start advertising</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-elimux-dark">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase">Reference</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {payments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-elimux-dark/50">
                          <td className="px-6 py-4 text-sm text-foreground">
                            {new Date(payment.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-foreground">KES {payment.amount.toFixed(2)}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted font-mono">
                            {payment.paystack_reference || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
