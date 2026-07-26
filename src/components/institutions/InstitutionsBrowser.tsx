'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import InstitutionCard from '@/components/InstitutionCard'
import { createClient } from '@/lib/supabase/client'
import type { InstitutionRow } from '@/lib/api'
import { Loader2, Search, Building2 } from 'lucide-react'

interface InstitutionsBrowserProps {
  initialInstitutions: InstitutionRow[]
}

interface InstitutionTypeRow {
  id: string
  name: string
}

const INSTITUTION_SELECT =
  '*, type:institution_types(name, icon), country:countries(name, flag_emoji), accreditations:institution_accreditations(accreditation_status)'

export default function InstitutionsBrowser({ initialInstitutions }: InstitutionsBrowserProps) {
  const [types, setTypes] = useState<InstitutionTypeRow[]>([])
  const [typeId, setTypeId] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [institutions, setInstitutions] = useState<InstitutionRow[]>(initialInstitutions)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('institution_types')
      .select('id, name')
      .order('name')
      .then(({ data }) => setTypes(data || []))
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    if (!typeId && !search) {
      setInstitutions(initialInstitutions)
      setError(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(false)

    const supabase = createClient()
    let query = supabase
      .from('institutions')
      .select(INSTITUTION_SELECT)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(24)

    if (typeId) query = query.eq('type_id', typeId)
    if (search) query = query.ilike('name', `%${search}%`)

    query.then(({ data, error: dbError }) => {
      if (cancelled) return
      if (dbError) {
        setInstitutions([])
        setError(true)
      } else {
        setInstitutions((data as unknown as InstitutionRow[]) || [])
      }
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [typeId, search, initialInstitutions])

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search institutions..."
            className="w-full pl-10 pr-4 py-2.5 min-h-[44px] rounded-lg bg-elimux-card border border-border text-foreground focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <label htmlFor="institution-type-filter" className="flex items-center gap-2 text-sm text-muted flex-shrink-0">
            <Building2 className="w-4 h-4 text-primary-400" />
            Type
          </label>
          <select
            id="institution-type-filter"
            value={typeId}
            onChange={(e) => setTypeId(e.target.value)}
            className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] rounded-lg bg-elimux-card border border-border text-foreground focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All types</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-muted text-lg">Search is temporarily unavailable.</p>
          <p className="text-sm text-muted mt-2">Please try again in a moment.</p>
        </div>
      ) : institutions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {institutions.map((inst) => (
            <Link key={inst.id} href={`/institutions/${inst.id}/`}>
              <InstitutionCard institution={inst} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted text-lg">No institutions found.</p>
          <p className="text-sm text-muted mt-2">Try a different search or filter.</p>
        </div>
      )}
    </div>
  )
}
