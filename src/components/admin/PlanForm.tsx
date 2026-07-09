'use client'

import { useState } from 'react'
import { Tag, FileText, DollarSign, Hash, Clock, ListChecks, X } from 'lucide-react'

export interface PlanFormData {
  name: string
  slug: string
  description: string
  price_kes: number
  price_usd: number | null
  currency: string
  duration_months: number
  features: string[]
  is_active: boolean
}

export interface PlanFormInitialData extends PlanFormData {
  id: string
}

interface PlanFormProps {
  initialData?: PlanFormInitialData
  onSubmit: (data: PlanFormData) => Promise<void>
  onClose: () => void
}

export default function PlanForm({ initialData, onSubmit, onClose }: PlanFormProps) {
  const isEdit = !!initialData
  const [formData, setFormData] = useState({
    name: initialData?.name ?? '',
    slug: initialData?.slug ?? '',
    description: initialData?.description ?? '',
    price_kes: initialData?.price_kes != null ? String(initialData.price_kes) : '',
    price_usd: initialData?.price_usd != null ? String(initialData.price_usd) : '',
    currency: initialData?.currency ?? 'KES',
    duration_months: initialData?.duration_months != null ? String(initialData.duration_months) : '1',
    features: (initialData?.features ?? []).join('\n'),
    is_active: initialData?.is_active ?? true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await onSubmit({
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        price_kes: Number(formData.price_kes),
        price_usd: formData.price_usd ? Number(formData.price_usd) : null,
        currency: formData.currency,
        duration_months: Number(formData.duration_months),
        features: formData.features
          .split('\n')
          .map((f) => f.trim())
          .filter(Boolean),
        is_active: formData.is_active,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${isEdit ? 'update' : 'add'} plan`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-elimux-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary-400" />
              {isEdit ? 'Edit Plan' : 'Add Plan'}
            </h2>
            <button onClick={onClose} className="text-muted hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 px-4 py-2 rounded-lg bg-elimux-danger/10 border border-elimux-danger/30 text-elimux-danger text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-muted mb-1 block">Plan Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                placeholder="e.g., Premium"
              />
            </div>

            <div>
              <label className="text-sm text-muted mb-1 block flex items-center gap-1">
                <Hash className="w-3 h-3" /> Slug *
              </label>
              <input
                type="text"
                required
                disabled={isEdit}
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500 disabled:opacity-50"
                placeholder="e.g., premium"
              />
            </div>

            <div>
              <label className="text-sm text-muted mb-1 block flex items-center gap-1">
                <FileText className="w-3 h-3" /> Description
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                placeholder="Short description shown on the pricing page"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-muted mb-1 block flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> Price (KES) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.price_kes}
                  onChange={(e) => setFormData({ ...formData, price_kes: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="text-sm text-muted mb-1 block">Price (USD)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.price_usd}
                  onChange={(e) => setFormData({ ...formData, price_usd: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="text-sm text-muted mb-1 block flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Duration (months)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.duration_months}
                  onChange={(e) => setFormData({ ...formData, duration_months: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-muted mb-1 block">Currency</label>
              <input
                type="text"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                placeholder="KES"
                maxLength={3}
              />
            </div>

            <div>
              <label className="text-sm text-muted mb-1 block flex items-center gap-1">
                <ListChecks className="w-3 h-3" /> Features (one per line)
              </label>
              <textarea
                rows={4}
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                placeholder={'Unlimited favorites\nPriority AI search\nAd-free browsing'}
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-border"
              />
              Active (visible on pricing page)
            </label>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg border border-border text-muted hover:bg-muted/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium transition-colors disabled:opacity-50"
              >
                {loading ? (isEdit ? 'Saving...' : 'Adding...') : isEdit ? 'Save Changes' : 'Add Plan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
