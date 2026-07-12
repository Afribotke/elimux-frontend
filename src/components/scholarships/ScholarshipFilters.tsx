'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Filter, Search } from 'lucide-react'
import type { ScholarshipListParams } from '@/lib/api'

interface ScholarshipFiltersProps {
  filters: ScholarshipListParams
  onChange: (filters: ScholarshipListParams) => void
}

export default function ScholarshipFilters({ filters, onChange }: ScholarshipFiltersProps) {
  const [countries, setCountries] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    supabase
      .from('countries')
      .select('id,name')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => setCountries(data || []))
  }, [])

  const set = (patch: Partial<ScholarshipListParams>) => onChange({ ...filters, ...patch })
  const hasActiveFilters = Object.entries(filters).some(
    ([key, value]) => key !== 'limit' && key !== 'offset' && !!value
  )

  const clear = () =>
    onChange({ keyword: '', country_id: '', study_level: '', discipline: '', deadline_after: '' })

  return (
    <div className="bg-elimux-card rounded-lg border border-border p-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-primary-400" />
        <h2 className="font-semibold text-foreground">Filters</h2>
        {hasActiveFilters && (
          <button onClick={clear} className="ml-auto text-sm text-primary-400 hover:text-primary-300">
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Search scholarships..."
            value={filters.keyword || ''}
            onChange={(e) => set({ keyword: e.target.value })}
            className="w-full pl-10 pr-4 py-3 min-h-[44px] rounded-lg bg-elimux-dark border border-border text-foreground focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <select
          value={filters.country_id || ''}
          onChange={(e) => set({ country_id: e.target.value })}
          className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-elimux-dark border border-border text-foreground focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Countries</option>
          {countries.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Study level (e.g. undergraduate)"
          value={filters.study_level || ''}
          onChange={(e) => set({ study_level: e.target.value })}
          className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-elimux-dark border border-border text-foreground focus:ring-2 focus:ring-primary-500"
        />

        <input
          type="text"
          placeholder="Discipline (e.g. engineering)"
          value={filters.discipline || ''}
          onChange={(e) => set({ discipline: e.target.value })}
          className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-elimux-dark border border-border text-foreground focus:ring-2 focus:ring-primary-500"
        />

        <div>
          <label className="block text-xs text-muted mb-1">Deadline after</label>
          <input
            type="date"
            value={filters.deadline_after || ''}
            onChange={(e) => set({ deadline_after: e.target.value })}
            className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-elimux-dark border border-border text-foreground focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>
    </div>
  )
}
