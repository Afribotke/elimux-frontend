'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import InstitutionCard from '@/components/InstitutionCard'
import { createClient } from '@/lib/supabase/client'
import { listInstitutions } from '@/lib/api'
import type { InstitutionRow } from '@/lib/api'
import { Loader2, Search, Building2, ChevronLeft, ChevronRight } from 'lucide-react'

interface InstitutionTypeRow {
  id: string
  name: string
}

const ITEMS_PER_PAGE = 24

export default function InstitutionsBrowser() {
  const [types, setTypes] = useState<InstitutionTypeRow[]>([])
  const [typeId, setTypeId] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [institutions, setInstitutions] = useState<InstitutionRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
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
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)

    listInstitutions({
      page,
      limit: ITEMS_PER_PAGE,
      search: search || undefined,
      type_id: typeId || undefined,
    })
      .then(({ data, meta }) => {
        if (cancelled) return
        setInstitutions((data || []).filter((i) => i.is_active !== false))
        setTotalCount(meta.total || 0)
        setTotalPages(meta.totalPages || 1)
      })
      .catch(() => {
        if (cancelled) return
        setInstitutions([])
        setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [page, search, typeId])

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={totalCount ? `Search ${totalCount.toLocaleString()} institutions...` : 'Search institutions...'}
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
            onChange={(e) => {
              setTypeId(e.target.value)
              setPage(1)
            }}
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
        <>
          <p className="text-sm text-muted mb-4">
            Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, totalCount)} of {totalCount.toLocaleString()} institutions
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {institutions.map((inst) => (
              <Link key={inst.id} href={`/institutions/${inst.id}/`}>
                <InstitutionCard institution={inst} />
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                className="p-2 rounded-lg border border-border hover:bg-elimux-card disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let p: number
                  if (totalPages <= 5) p = i + 1
                  else if (page <= 3) p = i + 1
                  else if (page >= totalPages - 2) p = totalPages - 4 + i
                  else p = page - 2 + i

                  return (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`min-w-[40px] h-10 rounded-lg text-sm font-medium transition-colors ${
                        p === page ? 'bg-primary-600 text-elimux-dark' : 'border border-border hover:bg-elimux-card'
                      }`}
                    >
                      {p}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => goToPage(page + 1)}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-border hover:bg-elimux-card disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted text-lg">No institutions found.</p>
          <p className="text-sm text-muted mt-2">Try a different search or filter.</p>
        </div>
      )}
    </div>
  )
}
