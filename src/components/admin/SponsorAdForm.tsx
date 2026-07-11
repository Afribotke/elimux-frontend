'use client'

import { useState } from 'react'
import { Megaphone, FileText, Image, Link2, LayoutTemplate, Calendar, X } from 'lucide-react'
import type { CreateSponsorAdInput } from '@/lib/api'

export interface SponsorAdFormInitialData extends CreateSponsorAdInput {
  id: string
}

interface SponsorAdFormProps {
  initialData?: SponsorAdFormInitialData
  onSubmit: (data: CreateSponsorAdInput) => Promise<void>
  onClose: () => void
}

const PLACEMENTS = ['homepage', 'search', 'institutions']

export default function SponsorAdForm({ initialData, onSubmit, onClose }: SponsorAdFormProps) {
  const isEdit = !!initialData
  const [formData, setFormData] = useState({
    sponsor_id: initialData?.sponsor_id ?? '',
    title: initialData?.title ?? '',
    description: initialData?.description ?? '',
    image_url: initialData?.image_url ?? '',
    target_url: initialData?.target_url ?? '',
    placement: initialData?.placement ?? PLACEMENTS[0],
    start_date: initialData?.start_date ?? new Date().toISOString().slice(0, 10),
    end_date: initialData?.end_date ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await onSubmit({
        sponsor_id: formData.sponsor_id || null,
        title: formData.title,
        description: formData.description,
        image_url: formData.image_url,
        target_url: formData.target_url,
        placement: formData.placement,
        start_date: formData.start_date,
        end_date: formData.end_date,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${isEdit ? 'update' : 'create'} ad`)
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
              <Megaphone className="w-5 h-5 text-primary-400" />
              {isEdit ? 'Edit Sponsor Ad' : 'New Sponsor Ad'}
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
              <label className="text-sm text-muted mb-1 block">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                placeholder="e.g., Study in the UK — Apply Now"
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
                placeholder="Short line shown under the ad title"
              />
            </div>

            <div>
              <label className="text-sm text-muted mb-1 block flex items-center gap-1">
                <Image className="w-3 h-3" /> Image URL
              </label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="text-sm text-muted mb-1 block flex items-center gap-1">
                <Link2 className="w-3 h-3" /> Target URL *
              </label>
              <input
                type="url"
                required
                value={formData.target_url}
                onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                placeholder="https://sponsor.example.com/landing"
              />
            </div>

            <div>
              <label className="text-sm text-muted mb-1 block flex items-center gap-1">
                <LayoutTemplate className="w-3 h-3" /> Placement *
              </label>
              <select
                required
                value={formData.placement}
                onChange={(e) => setFormData({ ...formData, placement: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
              >
                {PLACEMENTS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted mb-1 block flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="text-sm text-muted mb-1 block flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> End Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

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
                {loading ? (isEdit ? 'Saving...' : 'Creating...') : isEdit ? 'Save Changes' : 'Create Ad'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
