'use client'

import { useState } from 'react'
import { Landmark, X } from 'lucide-react'
import type { ScholarshipSponsorFormData, ScholarshipSponsorType, ScholarshipSponsorTier } from '@/types/scholarships'

const inputClass =
  'w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500'
const labelClass = 'text-sm text-muted mb-1 block'

interface AddScholarshipSponsorFormProps {
  onSubmit: (data: ScholarshipSponsorFormData) => Promise<void>
  onClose: () => void
}

export default function AddScholarshipSponsorForm({ onSubmit, onClose }: AddScholarshipSponsorFormProps) {
  const [form, setForm] = useState({
    name: '',
    type: 'foundation' as ScholarshipSponsorType,
    tier: 'free' as ScholarshipSponsorTier,
    logo_url: '',
    website: '',
    country_code: '',
    contact_email: '',
    contact_phone: '',
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await onSubmit({
        ...form,
        logo_url: form.logo_url || undefined,
        website: form.website || undefined,
        country_code: form.country_code || undefined,
        contact_email: form.contact_email || undefined,
        contact_phone: form.contact_phone || undefined,
        description: form.description || undefined,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create sponsor')
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
              <Landmark className="w-5 h-5 text-primary-400" />
              Add Sponsor
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
              <label className={labelClass}>Name *</label>
              <input required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Type *</label>
                <select required value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ScholarshipSponsorType })} className={inputClass}>
                  <option value="foundation">Foundation</option>
                  <option value="government">Government</option>
                  <option value="university">University</option>
                  <option value="international">International</option>
                  <option value="embassy">Embassy</option>
                  <option value="corporate">Corporate</option>
                  <option value="ngo">NGO</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Tier</label>
                <select value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value as ScholarshipSponsorTier })} className={inputClass}>
                  <option value="free">Free</option>
                  <option value="hub">Hub ($200/mo)</option>
                  <option value="premium">Premium ($500/mo)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Country Code</label>
                <input type="text" maxLength={2} value={form.country_code} onChange={(e) => setForm({ ...form, country_code: e.target.value.toUpperCase() })}
                  className={`${inputClass} uppercase`} placeholder="KE, TR, CN" />
              </div>
              <div>
                <label className={labelClass}>Website</label>
                <input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className={inputClass} placeholder="https://" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Contact Email</label>
              <input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Description</label>
              <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-border text-muted hover:bg-muted/10 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="flex-1 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium transition-colors disabled:opacity-50">
                {loading ? 'Saving...' : 'Save Sponsor'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
