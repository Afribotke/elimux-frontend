'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { createScholarshipAlert } from '@/lib/api'
import { Bell, CheckCircle2 } from 'lucide-react'

interface ScholarshipAlertFormProps {
  defaultKeywords?: string
  defaultCountryId?: string | null
}

const STUDY_LEVELS = [
  { value: 'bachelor', label: "Bachelor's" },
  { value: 'master', label: "Master's" },
  { value: 'phd', label: 'PhD' },
]

export default function ScholarshipAlertForm({ defaultKeywords, defaultCountryId }: ScholarshipAlertFormProps) {
  const [countries, setCountries] = useState<{ id: string; name: string }[]>([])
  const [email, setEmail] = useState('')
  const [keywords, setKeywords] = useState(defaultKeywords || '')
  const [countryId, setCountryId] = useState(defaultCountryId || '')
  const [studyLevel, setStudyLevel] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    supabase
      .from('countries')
      .select('id,name')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => setCountries(data || []))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return

    setSubmitting(true)
    setError('')
    try {
      await createScholarshipAlert({
        email,
        keywords: keywords || undefined,
        country_id: countryId || undefined,
        study_level: studyLevel || undefined,
      })
      setSuccess(true)
    } catch (err: any) {
      setError(err?.message || 'Failed to create alert. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="flex items-start gap-3 p-4 rounded-xl bg-success/10 border border-success/20 text-success">
        <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <p className="text-sm font-medium">Alert created! We&apos;ll email you when matching scholarships are added.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="email"
        required
        placeholder="Your email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-elimux-dark border border-border text-foreground focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      />

      <input
        type="text"
        placeholder="Keywords (optional)"
        value={keywords}
        onChange={(e) => setKeywords(e.target.value)}
        className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-elimux-dark border border-border text-foreground focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      />

      <div className="grid grid-cols-2 gap-3">
        <select
          value={countryId}
          onChange={(e) => setCountryId(e.target.value)}
          className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-elimux-dark border border-border text-foreground focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Any country</option>
          {countries.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={studyLevel}
          onChange={(e) => setStudyLevel(e.target.value)}
          className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-elimux-dark border border-border text-foreground focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Any level</option>
          {STUDY_LEVELS.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting || !email}
        className="w-full flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-colors"
      >
        <Bell className="w-4 h-4" />
        {submitting ? 'Creating alert...' : 'Notify me of similar scholarships'}
      </button>
    </form>
  )
}
