'use client'

// ============================================
// ELIMUX AD PORTAL - CREATE CAMPAIGN
// /advertiser/campaigns/new
// ============================================

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Image as ImageIcon, Link2, Megaphone, Calendar, Wallet } from 'lucide-react'
import { advertiserFetch } from '@/lib/advertiserAuth'
import AdvertiserNav from '@/components/AdvertiserNav'

const PLACEMENTS = [
  { value: 'ribbon', label: 'Ribbon', description: 'Slim banner strip' },
  { value: 'homepage_hero', label: 'Homepage Hero', description: 'Main banner on the homepage (premium)' },
  { value: 'search_inline', label: 'Search Inline', description: 'Inline placement within search results' },
  { value: 'institution_sidebar', label: 'Institution Sidebar', description: 'Sidebar on institution detail pages' },
  { value: 'scholarship_banner', label: 'Scholarship Banner', description: 'Banner on scholarship pages' },
] as const

type Placement = (typeof PLACEMENTS)[number]['value']

interface FormData {
  title: string
  description: string
  image_url: string
  target_url: string
  placement: Placement | ''
  budget: string
  duration_days: string
  start_date: string
  end_date: string
  auto_renew: boolean
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export default function CreateCampaignPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [balance, setBalance] = useState(0)

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    image_url: '',
    target_url: '',
    placement: '',
    budget: '',
    duration_days: '',
    start_date: '',
    end_date: '',
    auto_renew: false,
  })

  useEffect(() => {
    advertiserFetch('/api/advertiser/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setBalance(data.data.balance)
      })
      .catch(() => {})
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const validate = (): Record<string, string> => {
    const errors: Record<string, string> = {}

    if (!formData.title.trim()) errors.title = 'Title is required.'
    if (!formData.description.trim()) errors.description = 'Description is required.'

    if (!formData.image_url.trim()) errors.image_url = 'Image URL is required.'
    else if (!isValidUrl(formData.image_url)) errors.image_url = 'Enter a valid http(s) URL.'

    if (!formData.target_url.trim()) errors.target_url = 'Target URL is required.'
    else if (!isValidUrl(formData.target_url)) errors.target_url = 'Enter a valid http(s) URL.'

    if (!formData.placement) errors.placement = 'Choose a placement.'

    const budgetNum = Number(formData.budget)
    if (!formData.budget || Number.isNaN(budgetNum) || budgetNum <= 0) {
      errors.budget = 'Enter a budget greater than 0.'
    } else if (budgetNum > balance) {
      errors.budget = `Budget exceeds your available balance (KES ${balance.toFixed(2)}).`
    }

    const durationNum = Number(formData.duration_days)
    if (!formData.duration_days || !Number.isInteger(durationNum) || durationNum < 7 || durationNum > 30) {
      errors.duration_days = 'Enter a whole number of days between 7 and 30.'
    }

    if (formData.start_date && formData.end_date && formData.end_date < formData.start_date) {
      errors.end_date = 'End date must be after the start date.'
    }

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setLoading(true)
    try {
      const response = await advertiserFetch('/api/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          image_url: formData.image_url.trim(),
          target_url: formData.target_url.trim(),
          placement: formData.placement,
          budget: Number(formData.budget),
          duration_days: Number(formData.duration_days),
          start_date: formData.start_date || undefined,
          end_date: formData.end_date || undefined,
          auto_renew: formData.auto_renew,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to create campaign')

      router.push('/advertiser/campaigns')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const selectedPlacement = PLACEMENTS.find((p) => p.value === formData.placement)
  const inputClass = (field: string) =>
    `w-full px-4 py-2 rounded-lg bg-elimux-dark border text-foreground focus:outline-none focus:border-primary-500 ${
      fieldErrors[field] ? 'border-elimux-danger' : 'border-border'
    }`

  return (
    <div className="min-h-screen bg-elimux-dark">
      <AdvertiserNav />
      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Megaphone className="w-7 h-7 text-primary-400" />
            Create Campaign
          </h1>
          <p className="text-muted mt-1">Available balance: KES {balance.toFixed(2)}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <form onSubmit={handleSubmit} className="lg:col-span-2 bg-elimux-card border border-border rounded-xl p-8 space-y-6">
            {error && (
              <div className="bg-elimux-danger/10 border border-elimux-danger/30 rounded-lg p-4 text-elimux-danger text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="text-sm text-muted mb-1 block">Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Study at UoN"
                className={inputClass('title')}
              />
              {fieldErrors.title && <p className="text-xs text-elimux-danger mt-1">{fieldErrors.title}</p>}
            </div>

            <div>
              <label className="text-sm text-muted mb-1 block">Description *</label>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief description of this campaign"
                className={inputClass('description')}
              />
              {fieldErrors.description && <p className="text-xs text-elimux-danger mt-1">{fieldErrors.description}</p>}
            </div>

            <div>
              <label className="text-sm text-muted mb-1 block flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Image URL *
              </label>
              <input
                type="url"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                placeholder="https://your-site.com/image.jpg"
                className={inputClass('image_url')}
              />
              {fieldErrors.image_url && <p className="text-xs text-elimux-danger mt-1">{fieldErrors.image_url}</p>}
            </div>

            <div>
              <label className="text-sm text-muted mb-1 block flex items-center gap-2">
                <Link2 className="w-4 h-4" /> Target URL *
              </label>
              <input
                type="url"
                name="target_url"
                value={formData.target_url}
                onChange={handleChange}
                placeholder="https://your-site.com/apply"
                className={inputClass('target_url')}
              />
              {fieldErrors.target_url && <p className="text-xs text-elimux-danger mt-1">{fieldErrors.target_url}</p>}
            </div>

            <div>
              <label className="text-sm text-muted mb-2 block">Placement *</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PLACEMENTS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, placement: p.value }))}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      formData.placement === p.value
                        ? 'border-primary-500 bg-primary-500/10'
                        : 'border-border hover:border-primary-500/50'
                    }`}
                  >
                    <div className="font-semibold text-foreground">{p.label}</div>
                    <div className="text-sm text-muted mt-1">{p.description}</div>
                  </button>
                ))}
              </div>
              {fieldErrors.placement && <p className="text-xs text-elimux-danger mt-1">{fieldErrors.placement}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-muted mb-1 block flex items-center gap-2">
                  <Wallet className="w-4 h-4" /> Budget (KES) *
                </label>
                <input
                  type="number"
                  name="budget"
                  min={1}
                  step="0.01"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder="50"
                  className={inputClass('budget')}
                />
                {fieldErrors.budget && <p className="text-xs text-elimux-danger mt-1">{fieldErrors.budget}</p>}
              </div>

              <div>
                <label className="text-sm text-muted mb-1 block">Duration (days) *</label>
                <input
                  type="number"
                  name="duration_days"
                  min={7}
                  max={30}
                  step="1"
                  value={formData.duration_days}
                  onChange={handleChange}
                  placeholder="7"
                  className={inputClass('duration_days')}
                />
                <p className="text-xs text-muted mt-1">Between 7 and 30 days.</p>
                {fieldErrors.duration_days && <p className="text-xs text-elimux-danger mt-1">{fieldErrors.duration_days}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-muted mb-1 block flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Start Date
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  className={inputClass('start_date')}
                />
              </div>
              <div>
                <label className="text-sm text-muted mb-1 block flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> End Date
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  className={inputClass('end_date')}
                />
                {fieldErrors.end_date && <p className="text-xs text-elimux-danger mt-1">{fieldErrors.end_date}</p>}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                name="auto_renew"
                checked={formData.auto_renew}
                onChange={handleChange}
                className="rounded border-border"
              />
              Auto-renew when this campaign ends
            </label>

            <div className="flex justify-between pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => router.push('/advertiser/campaigns')}
                className="px-6 py-2 border border-border rounded-lg text-foreground hover:bg-elimux-dark"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-elimux-dark font-semibold rounded-lg disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Campaign'}
              </button>
            </div>
          </form>

          {/* Live preview */}
          <div className="lg:col-span-1">
            <div className="bg-elimux-card border border-border rounded-xl p-6 sticky top-20">
              <h3 className="font-semibold text-foreground mb-4">Ad Preview</h3>
              <div className="bg-elimux-dark rounded-lg border border-border overflow-hidden">
                {formData.image_url && isValidUrl(formData.image_url) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={formData.image_url} alt="" className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 flex items-center justify-center text-muted text-sm">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}
                <div className="p-4">
                  <h4 className="font-bold text-foreground">{formData.title || 'Your Ad Title'}</h4>
                  <p className="text-muted text-sm mt-1 line-clamp-2">{formData.description || 'Your description'}</p>
                </div>
              </div>

              <div className="mt-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Placement</span>
                  <span className="text-foreground font-medium">{selectedPlacement?.label || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Budget</span>
                  <span className="text-foreground font-medium">
                    {formData.budget ? `KES ${Number(formData.budget).toFixed(2)}` : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Duration</span>
                  <span className="text-foreground font-medium">
                    {formData.duration_days ? `${formData.duration_days} days` : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
