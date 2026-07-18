'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CreditCard, Loader2 } from 'lucide-react'
import {
  fetchSubscriptionStatus,
  fetchPaymentHistory,
  cancelSubscription,
  getSubscriberSession,
  type Subscription,
  type Payment,
  type SubscriberSession,
} from '@/lib/payments'

export default function SubscriptionStatusPage() {
  const [session, setSession] = useState<SubscriberSession | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [history, setHistory] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const stored = getSubscriberSession()
    setSession(stored)

    if (!stored) {
      setLoading(false)
      return
    }

    Promise.all([fetchSubscriptionStatus(stored), fetchPaymentHistory(stored)])
      .then(([sub, payments]) => {
        setSubscription(sub)
        setHistory(payments)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load subscription'))
      .finally(() => setLoading(false))
  }, [])

  async function handleCancel() {
    if (!session || !subscription) return
    setCancelling(true)
    try {
      const updated = await cancelSubscription(session, subscription.id)
      setSubscription(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen py-16 px-4 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
      </main>
    )
  }

  if (!session) {
    return (
      <main className="min-h-screen py-16 px-4 flex items-center justify-center text-center">
        <div>
          <p className="text-lg text-foreground mb-6">No active session found.</p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors"
          >
            View plans
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <CreditCard className="w-7 h-7 text-primary-400" />
          My Subscription
        </h1>
        <p className="text-muted mb-8">{session.email}</p>

        {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

        {subscription ? (
          <div className="rounded-2xl border border-border bg-elimux-card p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">{subscription.plan.name}</h2>
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  subscription.status === 'active'
                    ? 'bg-green-500/10 text-green-400'
                    : subscription.status === 'pending'
                    ? 'bg-yellow-500/10 text-yellow-400'
                    : subscription.status === 'expired'
                    ? 'bg-red-500/10 text-red-400'
                    : 'bg-muted/10 text-muted'
                }`}
              >
                {subscription.status}
              </span>
            </div>
            {subscription.current_period_end && (
              <p className="text-sm text-muted mb-6">
                {subscription.status === 'active'
                  ? `Renews / expires on ${new Date(subscription.current_period_end).toLocaleDateString()}`
                  : subscription.status === 'expired'
                  ? `Expired on ${new Date(subscription.current_period_end).toLocaleDateString()}`
                  : `Period ends ${new Date(subscription.current_period_end).toLocaleDateString()}`}
              </p>
            )}

            {subscription.status === 'active' &&
              subscription.current_period_end &&
              (new Date(subscription.current_period_end).getTime() - Date.now()) / 86400000 <= 7 && (
                <div className="mb-6 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm">
                  Your plan expires within 7 days. Renew now to keep your benefits.
                </div>
              )}

            <div className="flex gap-3">
              {subscription.status === 'expired' || subscription.status === 'cancelled' ? (
                <Link
                  href="/pricing"
                  className="flex-1 text-center py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors"
                >
                  Renew subscription
                </Link>
              ) : (
                <Link
                  href="/pricing"
                  className="flex-1 text-center py-2.5 rounded-xl bg-muted/10 hover:bg-muted/20 text-foreground font-semibold"
                >
                  Change plan
                </Link>
              )}
              {subscription.status === 'active' && (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold disabled:opacity-60"
                >
                  {cancelling ? 'Cancelling...' : 'Cancel subscription'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 mb-8">
            <p className="text-lg text-foreground mb-6">You don&apos;t have a subscription yet.</p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors"
            >
              View plans
            </Link>
          </div>
        )}

        {history.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-foreground mb-4">Payment history</h2>
            <div className="space-y-2">
              {history.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-elimux-card px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {payment.currency} {payment.amount}
                    </p>
                    <p className="text-xs text-muted">
                      {new Date(payment.created_at).toLocaleDateString()} · {payment.paystack_reference}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      payment.status === 'success'
                        ? 'bg-green-500/10 text-green-400'
                        : payment.status === 'failed'
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-yellow-500/10 text-yellow-400'
                    }`}
                  >
                    {payment.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
