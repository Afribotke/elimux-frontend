'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Check, ArrowRight } from 'lucide-react'
import { fetchPlans, type SubscriptionPlan } from '@/lib/payments'

export default function PricingTeaser() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetchPlans()
      .then(setPlans)
      .catch(() => setPlans([]))
      .finally(() => setLoaded(true))
  }, [])

  if (loaded && plans.length === 0) return null

  return (
    <section className="py-16 px-4 max-w-6xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Simple, Transparent Pricing</h2>
        <p className="text-muted">Pay with M-Pesa or card via Paystack. Cancel anytime.</p>
      </div>

      {!loaded ? (
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {plans.slice(0, 3).map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl border p-6 flex flex-col ${
                plan.slug === 'premium' ? 'border-primary-500 bg-primary-500/5' : 'border-border bg-elimux-card'
              }`}
            >
              <h3 className="text-lg font-bold text-foreground mb-1">{plan.name}</h3>
              <p className="text-sm text-muted mb-4">{plan.description}</p>
              <div className="mb-4">
                <span className="text-2xl font-bold text-foreground">
                  {plan.price_kes === 0 ? 'Free' : `KES ${plan.price_kes}`}
                </span>
                {plan.price_kes > 0 && <span className="text-muted">/month</span>}
              </div>
              <ul className="space-y-2 flex-1">
                {(plan.features || []).slice(0, 3).map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div className="text-center">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors"
        >
          View full pricing
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  )
}
