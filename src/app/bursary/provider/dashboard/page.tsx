'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getUserWithTimeout } from '@/lib/client-auth'

interface TenantSummary {
  name: string
  status: string
}

const STAT_CARDS = [
  { label: 'Active Bursaries', value: '0', hint: 'No active bursaries yet' },
  { label: 'Total Applications', value: '0', hint: 'Applications received' },
  { label: 'Funds Disbursed', value: 'KES 0', hint: 'Total disbursed to date' },
]

export default function BursaryProviderDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [tenant, setTenant] = useState<TenantSummary | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data: { user } } = await getUserWithTimeout()
      if (!user) return

      const supabase = createClient()
      const { data: role } = await supabase
        .from('user_tenant_roles')
        .select('tenants(name, status)')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .eq('status', 'active')
        .single()

      if (cancelled) return
      const t = Array.isArray(role?.tenants) ? role?.tenants[0] : role?.tenants
      if (t) setTenant(t as TenantSummary)
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="max-w-xl mx-auto text-center py-24">
        <p className="text-foreground">You are not assigned to any provider. Contact support.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted">Manage your bursary programs</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            tenant.status === 'active'
              ? 'bg-primary-500/10 text-primary-400'
              : 'bg-elimux-warning/10 text-elimux-warning'
          }`}
        >
          {tenant.status === 'active' ? 'Active' : tenant.status || 'Pending'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {STAT_CARDS.map((card) => (
          <div key={card.label} className="rounded-xl bg-elimux-card border border-border p-6">
            <p className="text-sm font-medium text-muted mb-2">{card.label}</p>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
            <p className="text-xs text-muted mt-1">{card.hint}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-elimux-card border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-2">Getting Started</h2>
        <p className="text-sm text-muted">
          Your provider portal is active. Use the sidebar to create bursary programs, review applications, and manage
          disbursements.
        </p>
      </div>
    </div>
  )
}
