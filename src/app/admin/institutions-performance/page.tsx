'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getAnalyticsInstitutions, type AnalyticsInstitutions } from '@/lib/api'
import { useAdminKey } from '@/components/admin/AdminKeyContext'
import RankedBarList from '@/components/admin/charts/RankedBarList'
import { ArrowLeft, Building2, Eye, FileCheck2, Star } from 'lucide-react'

export default function AdminInstitutionsPerformancePage() {
  const { adminKey } = useAdminKey()
  const [data, setData] = useState<AnalyticsInstitutions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!adminKey) return
    setLoading(true)
    getAnalyticsInstitutions(adminKey)
      .then((res) => setData(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load institution performance'))
      .finally(() => setLoading(false))
  }, [adminKey])

  return (
    <main className="min-h-screen py-12 px-4 max-w-6xl mx-auto">
      <Link href="/admin" className="text-sm text-muted hover:text-foreground flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold text-foreground mb-8 flex items-center gap-3">
        <Building2 className="w-8 h-8 text-primary-400" />
        Institution Performance
      </h1>

      {error && (
        <div className="mb-6 px-4 py-2 rounded-lg bg-elimux-danger/10 border border-elimux-danger/30 text-elimux-danger text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted">Loading rankings...</p>
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-elimux-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary-400" />
              By page views
            </h2>
            <RankedBarList rows={data.by_page_views.map((r) => ({ id: r.institution_id, name: r.name, count: r.count }))} />
          </div>

          <div className="bg-elimux-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-primary-400" />
              By applications
            </h2>
            <RankedBarList rows={data.by_applications.map((r) => ({ id: r.institution_id, name: r.name, count: r.count }))} />
          </div>

          <div className="bg-elimux-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-primary-400" />
              By reviews
            </h2>
            <RankedBarList
              rows={data.by_reviews.map((r) => ({
                id: r.institution_id,
                name: r.name,
                count: r.count,
                suffix: r.avg_rating ? `· ${r.avg_rating}★` : undefined,
              }))}
            />
          </div>
        </div>
      ) : null}
    </main>
  )
}
