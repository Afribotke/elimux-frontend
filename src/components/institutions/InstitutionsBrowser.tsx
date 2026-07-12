'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import InstitutionCard from '@/components/InstitutionCard'
import { listAccreditationBodies, listInstitutions, type AccreditationBodyRow, type InstitutionRow } from '@/lib/api'
import { Loader2, ShieldCheck } from 'lucide-react'

interface InstitutionsBrowserProps {
  initialInstitutions: InstitutionRow[]
}

export default function InstitutionsBrowser({ initialInstitutions }: InstitutionsBrowserProps) {
  const [bodies, setBodies] = useState<AccreditationBodyRow[]>([])
  const [bodyId, setBodyId] = useState('')
  const [institutions, setInstitutions] = useState<InstitutionRow[]>(initialInstitutions)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    listAccreditationBodies()
      .then((res) => setBodies(res.data))
      .catch(() => setBodies([]))
  }, [])

  useEffect(() => {
    if (!bodyId) {
      setInstitutions(initialInstitutions)
      return
    }

    let cancelled = false
    setLoading(true)

    listInstitutions({ accreditation_body_id: bodyId, limit: 24 })
      .then((res) => {
        if (!cancelled) setInstitutions(res.data)
      })
      .catch(() => {
        if (!cancelled) setInstitutions([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [bodyId, initialInstitutions])

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
        <label htmlFor="accreditation-body-filter" className="flex items-center gap-2 text-sm text-muted flex-shrink-0">
          <ShieldCheck className="w-4 h-4 text-primary-400" />
          Accreditation body
        </label>
        <select
          id="accreditation-body-filter"
          value={bodyId}
          onChange={(e) => setBodyId(e.target.value)}
          className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] rounded-lg bg-elimux-card border border-border text-foreground focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">All accreditation bodies</option>
          {bodies.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
              {b.code ? ` (${b.code})` : ''}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
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
          <p className="text-sm text-muted mt-2">Try a different accreditation body.</p>
        </div>
      )}
    </div>
  )
}
