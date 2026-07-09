'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { listAdminPlans, createPlan, updatePlan, deactivatePlan, type SubscriptionPlanRow } from '@/lib/api'
import { useAdminKey } from '@/components/admin/AdminKeyContext'
import PlanForm, { type PlanFormData, type PlanFormInitialData } from '@/components/admin/PlanForm'
import { ArrowLeft, Tag, Pencil, Ban, Plus, Users } from 'lucide-react'

export default function AdminPricingPage() {
  const { adminKey } = useAdminKey()
  const [plans, setPlans] = useState<SubscriptionPlanRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<PlanFormInitialData | null>(null)

  const loadPlans = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await listAdminPlans(adminKey)
      setPlans(res.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plans')
    } finally {
      setLoading(false)
    }
  }, [adminKey])

  useEffect(() => {
    loadPlans()
  }, [loadPlans])

  function flashSuccess(message: string) {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(null), 4000)
  }

  async function handleCreate(data: PlanFormData) {
    await createPlan(data, adminKey)
    setShowForm(false)
    flashSuccess('Plan added successfully.')
    await loadPlans()
  }

  async function handleUpdate(data: PlanFormData) {
    if (!editing) return
    await updatePlan(editing.id, data, adminKey)
    setEditing(null)
    flashSuccess('Plan updated successfully.')
    await loadPlans()
  }

  async function handleDeactivate(plan: SubscriptionPlanRow) {
    if (!window.confirm(`Deactivate "${plan.name}"? It will be hidden from the pricing page but kept for existing subscribers.`)) return
    try {
      await deactivatePlan(plan.id, adminKey)
      flashSuccess('Plan deactivated.')
      await loadPlans()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate plan')
    }
  }

  function openEdit(plan: SubscriptionPlanRow) {
    setEditing({
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      description: plan.description || '',
      price_kes: plan.price_kes,
      price_usd: plan.price_usd,
      currency: plan.currency,
      duration_months: plan.duration_months,
      features: plan.features || [],
      is_active: plan.is_active,
    })
  }

  return (
    <main className="min-h-screen py-12 px-4 max-w-6xl mx-auto">
      <Link href="/admin" className="text-sm text-muted hover:text-foreground flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Tag className="w-8 h-8 text-primary-400" />
          Manage Pricing
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Plan
        </button>
      </div>

      {successMessage && (
        <div className="mb-6 px-4 py-2 rounded-lg bg-elimux-success/10 border border-elimux-success/30 text-elimux-success text-sm">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-6 px-4 py-2 rounded-lg bg-elimux-danger/10 border border-elimux-danger/30 text-elimux-danger text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted">Loading plans...</p>
        </div>
      ) : (
        <div className="bg-elimux-card border border-border rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-elimux-dark text-muted text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Price (KES)</th>
                <th className="px-4 py-3 font-medium">Price (USD)</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> Subscribers
                  </span>
                </th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id} className="border-t border-border">
                  <td className="px-4 py-3 text-foreground font-medium">
                    {plan.name}
                    <div className="text-xs text-muted">{plan.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {plan.price_kes === 0 ? 'Free' : `${plan.currency} ${plan.price_kes}`}
                  </td>
                  <td className="px-4 py-3 text-muted">{plan.price_usd != null ? `$${plan.price_usd}` : '—'}</td>
                  <td className="px-4 py-3 text-muted">
                    {plan.duration_months} {plan.duration_months === 1 ? 'month' : 'months'}
                  </td>
                  <td className="px-4 py-3 text-muted">{plan.subscriber_count}</td>
                  <td className="px-4 py-3">
                    <span className={plan.is_active ? 'text-elimux-success' : 'text-elimux-danger'}>
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(plan)}
                        className="p-1.5 rounded-lg hover:bg-muted/10 text-muted hover:text-foreground transition-colors"
                        aria-label="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {plan.is_active && (
                        <button
                          onClick={() => handleDeactivate(plan)}
                          className="p-1.5 rounded-lg hover:bg-elimux-danger/10 text-muted hover:text-elimux-danger transition-colors"
                          aria-label="Deactivate"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {plans.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted">
                    No plans yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && <PlanForm onSubmit={handleCreate} onClose={() => setShowForm(false)} />}

      {editing && <PlanForm initialData={editing} onSubmit={handleUpdate} onClose={() => setEditing(null)} />}
    </main>
  )
}
