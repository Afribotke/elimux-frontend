'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getSharedSearch, type SharedSearchRow } from '@/lib/api'
import { Loader2, Clock, DollarSign, MapPin, ArrowRight, GraduationCap } from 'lucide-react'

// Static page (no [token] dynamic segment) reading ?token= from the query
// string. elimux-frontend is a fully static export (next.config.js has
// output: 'export'), which requires every dynamic route segment to be
// enumerated by generateStaticParams at build time - impossible here since
// share tokens are created by users after each deploy. A single static shell
// that reads the token client-side (same pattern /programs already uses for
// its filters) sidesteps that without needing new hosting/rewrite config.
function SharePageInner() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [shared, setShared] = useState<SharedSearchRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      setError('No share link provided.')
      return
    }
    getSharedSearch(token)
      .then((res) => setShared(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'This share link could not be found.'))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
      </main>
    )
  }

  if (error || !shared) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-foreground font-semibold mb-2">Share link not found</p>
          <p className="text-muted text-sm mb-6">{error || 'This link may have expired.'}</p>
          <Link href="/programs" className="text-primary-400 hover:text-primary-300 text-sm">
            Explore programs on ElimuX &rarr;
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-2 text-primary-400">
          <GraduationCap className="w-6 h-6" />
          <span className="font-bold">ElimuX</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {shared.query_text ? `Programs found for "${shared.query_text}"` : 'Shared programs'}
        </h1>
        <p className="text-muted mb-8">{shared.programs.length} program{shared.programs.length === 1 ? '' : 's'} shared with you</p>

        <div className="flex flex-col gap-3">
          {shared.programs.map((program) => (
            <div key={program.id} className="bg-elimux-card border border-border rounded-xl p-5">
              <h3 className="text-lg font-bold text-foreground mb-2">{program.name}</h3>
              {program.institution && (
                <p className="text-sm text-muted mb-3 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {program.institution.name}
                  {program.institution.city && `, ${program.institution.city}`}
                  {program.institution.country?.name && `, ${program.institution.country.name}`}
                </p>
              )}
              <div className="flex flex-wrap gap-3 text-sm">
                {program.duration_months && (
                  <span className="flex items-center gap-1 text-muted">
                    <Clock className="w-4 h-4 text-primary-400" />
                    {program.duration_months} months
                  </span>
                )}
                {program.tuition_fees && (
                  <span className="flex items-center gap-1 text-muted">
                    <DollarSign className="w-4 h-4 text-elimux-success" />
                    {program.currency || 'USD'} {program.tuition_fees.toLocaleString()}
                  </span>
                )}
              </div>
              <Link
                href={`/programs/${program.id}/?from=shared_search`}
                className="inline-flex items-center gap-1 mt-4 text-sm text-primary-400 hover:text-primary-300"
              >
                View program <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/programs"
            className="inline-block px-6 py-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
          >
            Explore more programs on ElimuX
          </Link>
        </div>
      </div>
    </main>
  )
}

export default function SharePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
        </main>
      }
    >
      <SharePageInner />
    </Suspense>
  )
}
