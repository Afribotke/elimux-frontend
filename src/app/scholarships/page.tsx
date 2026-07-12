'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { listScholarships, type ScholarshipRow, type ScholarshipListParams } from '@/lib/api'
import ScholarshipCard from '@/components/scholarships/ScholarshipCard'
import ScholarshipFilters from '@/components/scholarships/ScholarshipFilters'
import { Loader2, Award } from 'lucide-react'

const PAGE_SIZE = 12

function ScholarshipsPageInner() {
  const searchParams = useSearchParams()

  const [scholarships, setScholarships] = useState<ScholarshipRow[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState<ScholarshipListParams>(() => ({
    keyword: searchParams.get('keyword') || '',
    country_id: searchParams.get('country_id') || '',
    study_level: searchParams.get('study_level') || '',
    discipline: searchParams.get('discipline') || '',
    deadline_after: searchParams.get('deadline_after') || '',
  }))
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.keyword) params.set('keyword', filters.keyword)
    if (filters.country_id) params.set('country_id', filters.country_id)
    if (filters.study_level) params.set('study_level', filters.study_level)
    if (filters.discipline) params.set('discipline', filters.discipline)
    if (filters.deadline_after) params.set('deadline_after', filters.deadline_after)

    const query = params.toString()
    const newUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname
    window.history.replaceState({}, '', newUrl)
  }, [filters])

  const fetchScholarships = useCallback(async () => {
    setLoading(true)
    try {
      const res = await listScholarships({ ...filters, limit: PAGE_SIZE, offset })
      setScholarships(res.data)
      setTotal(res.meta.total)
    } catch (err) {
      console.error('Error fetching scholarships:', err)
    } finally {
      setLoading(false)
    }
  }, [filters, offset])

  useEffect(() => {
    fetchScholarships()
  }, [fetchScholarships])

  const handleFiltersChange = (next: ScholarshipListParams) => {
    setFilters(next)
    setOffset(0)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Find Scholarships</h1>
          <p className="text-muted">Discover funding opportunities for your education</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <ScholarshipFilters filters={filters} onChange={handleFiltersChange} />
          </div>

          <div className="lg:col-span-3">
            <p className="text-sm text-muted mb-4">{total.toLocaleString()} scholarships found</p>

            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
              </div>
            ) : scholarships.length === 0 ? (
              <div className="text-center py-16 bg-elimux-card rounded-xl border border-border">
                <Award className="w-12 h-12 text-muted mx-auto mb-3" />
                <p className="text-muted">No scholarships found. Try adjusting your filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {scholarships.map((s) => (
                  <Link key={s.id} href={`/scholarships/${s.id}/`}>
                    <ScholarshipCard scholarship={s} />
                  </Link>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
                  disabled={offset === 0}
                  className="px-4 py-2.5 min-h-[44px] rounded-lg border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted/10"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm text-muted">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setOffset((o) => o + PAGE_SIZE)}
                  disabled={currentPage >= totalPages}
                  className="px-4 py-2.5 min-h-[44px] rounded-lg border border-border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted/10"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

export default function ScholarshipsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex justify-center items-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      }
    >
      <ScholarshipsPageInner />
    </Suspense>
  )
}
