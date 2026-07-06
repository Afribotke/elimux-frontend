'use client'

import { useState } from 'react'
import { Building2, MapPin, Globe, Link as LinkIcon, Calendar, FileText, X } from 'lucide-react'

interface InstitutionType {
  id: string
  name: string
}

interface Country {
  id: string
  name: string
}

export interface InstitutionFormData {
  name: string
  type_id: string
  country_id: string
  city: string
  description: string
  website_url: string
  founded_year: number | null
  is_active: boolean
}

interface InstitutionFormProps {
  types: InstitutionType[]
  countries: Country[]
  onSubmit: (data: InstitutionFormData) => Promise<void>
  onClose: () => void
}

export default function InstitutionForm({ types, countries, onSubmit, onClose }: InstitutionFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    type_id: '',
    country_id: '',
    city: '',
    description: '',
    website_url: '',
    founded_year: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await onSubmit({
        ...formData,
        founded_year: formData.founded_year ? parseInt(formData.founded_year, 10) : null,
        is_active: true,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add institution')
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
              <Building2 className="w-5 h-5 text-primary-400" />
              Add Institution
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
              <label className="text-sm text-muted mb-1 block">Institution Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                placeholder="e.g., University of Nairobi"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted mb-1 block flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> Type *
                </label>
                <select
                  required
                  value={formData.type_id}
                  onChange={(e) => setFormData({ ...formData, type_id: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                >
                  <option value="">Select type</option>
                  {types.map((type) => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-muted mb-1 block flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Country *
                </label>
                <select
                  required
                  value={formData.country_id}
                  onChange={(e) => setFormData({ ...formData, country_id: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                >
                  <option value="">Select country</option>
                  {countries.map((country) => (
                    <option key={country.id} value={country.id}>{country.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm text-muted mb-1 block flex items-center gap-1">
                <MapPin className="w-3 h-3" /> City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                placeholder="e.g., Nairobi"
              />
            </div>

            <div>
              <label className="text-sm text-muted mb-1 block flex items-center gap-1">
                <LinkIcon className="w-3 h-3" /> Website URL
              </label>
              <input
                type="url"
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                placeholder="https://www.example.ac.ke"
              />
            </div>

            <div>
              <label className="text-sm text-muted mb-1 block flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Founded Year
              </label>
              <input
                type="number"
                value={formData.founded_year}
                onChange={(e) => setFormData({ ...formData, founded_year: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                placeholder="e.g., 1970"
              />
            </div>

            <div>
              <label className="text-sm text-muted mb-1 block flex items-center gap-1">
                <FileText className="w-3 h-3" /> Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                placeholder="Brief description of the institution..."
              />
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
                {loading ? 'Adding...' : 'Add Institution'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
