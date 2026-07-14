'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getUniversityAnalytics, type UniversityAnalytics } from '@/lib/api'
import { useAdminKey } from '@/components/admin/AdminKeyContext'
import LineChart from '@/components/admin/charts/LineChart'
import StatCard from '@/components/admin/StatCard'
import { ArrowLeft, BarChart3, Eye, FileCheck2, TrendingUp, Globe2, Search, Sparkles } from 'lucide-react'

interface InstitutionOption {
  id: string
  name: string
}

export default function AdminUniversityAnalyticsPage() {
  const { adminKey } = useAdminKey()
  const [institutions, setInstitutions] = useState<InstitutionOption[]>([])
  const [institutionId, setInstitutionId] = useState('')
  const [analytics, setAnalytics] = useState<UniversityAnalytics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('institutions')
      .select('id, name')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        if (data) {
          setInstitutions(data)
          if (data.length > 0) setInstitutionId(data[0].id)
        }
      })
  }, [])

  useEffect(() => {
    if (!adminKey || !institutionId) return
    setLoading(true)
    setError(null)
    getUniversityAnalytics(institutionId, adminKey)
      .then((res) => setAnalytics(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load analytics'))
      .finally(() => setLoading(false))
  }, [adminKey, institutionId])

  return (
    <main className="min-h-screen py-12 px-4 max-w-6xl mx-auto">
      <Link href="/admin" className="text-sm text-muted hover:text-foreground flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-primary-400" />
          University Analytics
        </h1>

        <select
          value={institutionId}
          onChange={(e) => setInstitutionId(e.target.value)}
          className="px-4 py-2.5 rounded-lg bg-elimux-card border border-border text-foreground focus:outline-none focus:border-primary-500 min-w-[220px]"
        >
          {institutions.map((inst) => (
            <option key={inst.id} value={inst.id}>
              {inst.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-6 px-4 py-2 rounded-lg bg-elimux-danger/10 border border-elimux-danger/30 text-elimux-danger text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted">Loading analytics...</p>
        </div>
      ) : analytics ? (
        <>
          <p className="text-sm text-muted mb-4">Last {analytics.period_days} days</p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <StatCard icon={Eye} label="Program views" value={analytics.total_views.toLocaleString()} />
            <StatCard icon={FileCheck2} label="Applications" value={analytics.total_applications.toLocaleString()} color="text-elimux-success" />
            <StatCard icon={TrendingUp} label="Conversion rate" value={`${analytics.conversion_rate}%`} color="text-elimux-warning" />
          </div>

          <div className="bg-elimux-card rounded-xl p-5 border border-border mb-6">
            <h2 className="text-sm font-medium text-foreground mb-4">Views trend</h2>
            <LineChart data={analytics.views_trend.map((t) => ({ date: t.date, value: t.count }))} label="views per day" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-elimux-card border border-border rounded-xl p-5">
              <h2 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary-400" />
                Top programs viewed
              </h2>
              {analytics.top_programs.length === 0 ? (
                <p className="text-sm text-muted py-6 text-center">No program views yet.</p>
              ) : (
                <ol className="space-y-2">
                  {analytics.top_programs.map((p, i) => (
                    <li key={p.program_id} className="flex items-center justify-between text-sm">
                      <span className="text-foreground truncate">
                        <span className="text-muted mr-2 tabular-nums">{i + 1}.</span>
                        {p.name}
                      </span>
                      <span className="text-muted tabular-nums flex-shrink-0">{p.views}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className="bg-elimux-card border border-border rounded-xl p-5">
              <h2 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-primary-400" />
                Regional interest
              </h2>
              {analytics.regional_interest.length === 0 ? (
                <p className="text-sm text-muted py-6 text-center">No regional data yet.</p>
              ) : (
                <ol className="space-y-2">
                  {analytics.regional_interest.map((r) => (
                    <li key={r.country} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{r.country}</span>
                      <span className="text-muted tabular-nums flex-shrink-0">{r.count}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>

          <div className="bg-elimux-card border border-border rounded-xl p-5 mb-8">
            <h2 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
              <Search className="w-4 h-4 text-primary-400" />
              Search terms leading to your programs
            </h2>
            {analytics.top_search_terms.length === 0 ? (
              <p className="text-sm text-muted py-6 text-center">No attributed searches yet.</p>
            ) : (
              <ol className="space-y-2">
                {analytics.top_search_terms.map((t, i) => (
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

          <div className="bg-gradient-to-r from-primary-500/10 to-transparent border border-primary-500/30 rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-primary-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">Unlock Premium Analytics</p>
                <p className="text-xs text-muted">Cohort comparisons, applicant demographics, and weekly email reports.</p>
              </div>
            </div>
            <button className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors">
              Upgrade
            </button>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted bg-elimux-card rounded-xl p-4 border border-border">Select an institution to view analytics.</p>
      )}
    </main>
  )
}
