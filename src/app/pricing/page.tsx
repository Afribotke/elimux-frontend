'use client'

import { useState, useEffect } from 'react'
import { Check, Sparkles, Loader2 } from 'lucide-react'
import {
  fetchPlans,
  initializePayment,
  saveSubscriberSession,
  type SubscriptionPlan,
} from '@/lib/payments'

export default function PricingPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPlans()
      .then(setPlans)
      .catch(() => setError('Failed to load plans'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPlan) return
    setSubmitting(true)
    setError(null)

    try {
      const result = await initializePayment({
        email,
        name: name || undefined,
        phone: phone || undefined,
        plan_id: selectedPlan.id,
      })

      saveSubscriberSession({ email: result.subscriber_email, access_token: result.access_token })

      if (result.free) {
        window.location.href = '/account/subscription'
      } else if (result.authorization_url) {
        window.location.href = result.authorization_url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start payment')
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            Choose Your Plan
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Pricing</h1>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Pay with M-Pesa or card via Paystack. Cancel anytime.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-2xl border p-6 flex flex-col ${
                  plan.slug === 'premium'
                    ? 'border-primary-500 bg-primary-500/5'
                    : 'border-border bg-elimux-card'
                }`}
              >
                <h2 className="text-xl font-bold text-foreground mb-1">{plan.name}</h2>
                <p className="text-sm text-muted mb-4">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-foreground">
                    {plan.price_kes === 0 ? 'Free' : `KES ${plan.price_kes}`}
                  </span>
                  {plan.price_kes > 0 && <span className="text-muted">/month</span>}
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {(plan.features || []).map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setSelectedPlan(plan)}
                  className={`w-full py-2.5 rounded-xl font-semibold transition-colors ${
                    plan.slug === 'premium'
                      ? 'bg-primary-600 hover:bg-primary-700 text-white'
                      : 'bg-muted/10 hover:bg-muted/20 text-foreground'
                  }`}
                >
                  {plan.price_kes === 0 ? 'Get Started' : 'Subscribe'}
                </button>
              </div>
            ))}
          </div>
        )}

        {selectedPlan && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-elimux-card border border-border rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-foreground mb-4">
                Subscribe to {selectedPlan.name}
              </h3>
              <form onSubmit={handleSubscribe} className="space-y-4">
                <input
                  type="email"
                  required
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground"
                />
                <input
                  type="text"
                  placeholder="Full name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground"
                />
                <input
                  type="tel"
                  placeholder="Phone number (optional, for M-Pesa)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground"
                />

                {error && <p className="text-sm text-red-400">{error}</p>}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPlan(null)}
                    className="flex-1 py-2.5 rounded-xl bg-muted/10 hover:bg-muted/20 text-foreground font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Continue
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
