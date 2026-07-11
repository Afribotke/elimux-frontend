'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getAnalyticsSearches, type AnalyticsSearches } from '@/lib/api'
import { useAdminKey } from '@/components/admin/AdminKeyContext'
import LineChart from '@/components/admin/charts/LineChart'
import { ArrowLeft, Search, SearchX } from 'lucide-react'

export default function AdminSearchesPage() {
  const { adminKey } = useAdminKey()
  const [searches, setSearches] = useState<AnalyticsSearches | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!adminKey) return
    setLoading(true)
    getAnalyticsSearches(adminKey)
      .then((res) => setSearches(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load searches'))
      .finally(() => setLoading(false))
  }, [adminKey])

  return (
    <main className="min-h-screen py-12 px-4 max-w-6xl mx-auto">
      <Link href="/admin" className="text-sm text-muted hover:text-foreground flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold text-foreground mb-8 flex items-center gap-3">
        <Search className="w-8 h-8 text-primary-400" />
        Searches
      </h1>

      {error && (
        <div className="mb-6 px-4 py-2 rounded-lg bg-elimux-danger/10 border border-elimux-danger/30 text-elimux-danger text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted">Loading searches...</p>
        </div>
      ) : searches ? (
        <>
          <div className="bg-elimux-card rounded-xl p-5 border border-border mb-6">
            <h2 className="text-sm font-medium text-foreground mb-4">Search trend (last 30 days)</h2>
            <LineChart data={searches.trend.map((t) => ({ date: t.date, value: t.count }))} label="searches per day" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-elimux-card border border-border rounded-xl p-5">
              <h2 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
                <Search className="w-4 h-4 text-primary-400" />
                Popular terms
              </h2>
              {searches.popular_terms.length === 0 ? (
                <p className="text-sm text-muted py-6 text-center">No searches tracked yet.</p>
              ) : (
                <ol className="space-y-2">
                  {searches.popular_terms.map((t, i) => (
                    <li key={t.term} className="flex items-center justify-between text-sm">
                      <span className="text-foreground truncate">
                        <span className="text-muted mr-2 tabular-nums">{i + 1}.</span>
                        {t.term}
                      </span>
                      <span className="text-muted tabular-nums flex-shrink-0">{t.count}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className="bg-elimux-card border border-border rounded-xl p-5">
              <h2 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
                <SearchX className="w-4 h-4 text-elimux-danger" />
                Zero-result searches
              </h2>
              {searches.zero_result_searches.length === 0 ? (
                <p className="text-sm text-muted py-6 text-center">No zero-result searches.</p>
              ) : (
                <ol className="space-y-2">
                  {searches.zero_result_searches.map((t, i) => (
                    <li key={t.term} className="flex items-center justify-between text-sm">
                      <span className="text-foreground truncate">
                        <span className="text-muted mr-2 tabular-nums">{i + 1}.</span>
                        {t.term}
                      </span>
                      <span className="text-elimux-danger tabular-nums flex-shrink-0">{t.count}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </>
      ) : null}
    </main>
  )
}
