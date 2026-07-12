'use client'

import { useState } from 'react'
import { Award, Image, Link2, MessageSquare, Calendar, X } from 'lucide-react'
import type { CreateMajorSponsorInput } from '@/lib/api'

export interface MajorSponsorFormInitialData extends CreateMajorSponsorInput {
  id: string
}

interface MajorSponsorFormProps {
  initialData?: MajorSponsorFormInitialData
  onSubmit: (data: CreateMajorSponsorInput) => Promise<void>
  onClose: () => void
}

const TIERS: CreateMajorSponsorInput['sponsorship_tier'][] = ['platinum', 'gold', 'silver', 'bronze']

export default function MajorSponsorForm({ initialData, onSubmit, onClose }: MajorSponsorFormProps) {
  const isEdit = !!initialData
  const [formData, setFormData] = useState({
    organization_name: initialData?.organization_name ?? '',
    logo_url: initialData?.logo_url ?? '',
    tagline: initialData?.tagline ?? '',
    website_url: initialData?.website_url ?? '',
    sponsorship_tier: initialData?.sponsorship_tier ?? TIERS[0],
    start_date: initialData?.start_date ?? new Date().toISOString().slice(0, 10),
    end_date: initialData?.end_date ?? '',
    show_in_header: initialData?.show_in_header ?? true,
    show_in_footer: initialData?.show_in_footer ?? true,
    show_in_loading: initialData?.show_in_loading ?? true,
    show_in_email: initialData?.show_in_email ?? true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await onSubmit({
        organization_name: formData.organization_name,
        logo_url: formData.logo_url,
        tagline: formData.tagline,
        website_url: formData.website_url,
        sponsorship_tier: formData.sponsorship_tier,
        start_date: formData.start_date,
        end_date: formData.end_date || undefined,
        show_in_header: formData.show_in_header,
        show_in_footer: formData.show_in_footer,
        show_in_loading: formData.show_in_loading,
        show_in_email: formData.show_in_email,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${isEdit ? 'update' : 'create'} sponsor`)
    } finally {
      setLoading(false)
    }
  }

  const togglePlacement = (key: 'show_in_header' | 'show_in_footer' | 'show_in_loading' | 'show_in_email') =>
    setFormData({ ...formData, [key]: !formData[key] })

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-elimux-card border border-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Award className="w-5 h-5 text-primary-400" />
              {isEdit ? 'Edit Major Sponsor' : 'New Major Sponsor'}
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
              <label className="text-sm text-muted mb-1 block">Organization Name *</label>
              <input
                type="text"
                required
                value={formData.organization_name}
                onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                placeholder="e.g., Afribot"
              />
            </div>

            <div>
              <label className="text-sm text-muted mb-1 block flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> Tagline
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                placeholder="e.g., Banking on Education"
              />
            </div>

            <div>
              <label className="text-sm text-muted mb-1 block flex items-center gap-1">
                <Image className="w-3 h-3" /> Logo URL
              </label>
              <input
                type="url"
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="text-sm text-muted mb-1 block flex items-center gap-1">
                <Link2 className="w-3 h-3" /> Website URL
              </label>
              <input
                type="url"
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                placeholder="https://sponsor.example.com"
              />
            </div>

            <div>
              <label className="text-sm text-muted mb-1 block flex items-center gap-1">
                <Award className="w-3 h-3" /> Sponsorship Tier *
              </label>
              <select
                required
                value={formData.sponsorship_tier}
                onChange={(e) => setFormData({ ...formData, sponsorship_tier: e.target.value as CreateMajorSponsorInput['sponsorship_tier'] })}
                className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500 capitalize"
              >
                {TIERS.map((t) => (
                  <option key={t} value={t} className="capitalize">
                    {t}
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
                  <Calendar className="w-3 h-3" /> End Date
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-muted mb-2 block">Show in</label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ['show_in_header', 'Header'],
                    ['show_in_footer', 'Footer'],
                    ['show_in_loading', 'Loading screen'],
                    ['show_in_email', 'Email'],
                  ] as const
                ).map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border cursor-pointer hover:bg-muted/10"
                  >
                    <input
                      type="checkbox"
                      checked={formData[key]}
                      onChange={() => togglePlacement(key)}
                      className="accent-primary-500"
                    />
                    <span className="text-sm text-foreground">{label}</span>
                  </label>
                ))}
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
                {loading ? (isEdit ? 'Saving...' : 'Creating...') : isEdit ? 'Save Changes' : 'Create Sponsor'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
