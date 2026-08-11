'use client'

import { useEffect, useState } from 'react'
import { useAdminKey } from './AdminKeyContext'
import { Users, Eye, TrendingUp, Globe } from 'lucide-react'

interface VisitorStats {
  today: {
    unique_visitors: number
    page_views: number
    top_pages: Array<{ path: string; count: number }>
  }
  all_time: {
    unique_visitors: number
    page_views: number
  }
}

export default function VisitorStatsWidget() {
  const { adminKey } = useAdminKey()
  const [stats, setStats] = useState<VisitorStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!adminKey) return
    loadStats()
    const interval = setInterval(loadStats, 30000)
    return () => clearInterval(interval)
  }, [adminKey])

  async function loadStats() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/admin/analytics/visitor-stats`, {
        headers: { 'x-admin-key': adminKey! },
      })
      if (!res.ok) throw new Error('Failed to load stats')
      const json = await res.json()
      setStats(json.data)
    } catch (err) {
      console.error('Visitor stats error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="h-32 animate-pulse rounded-xl bg-elimux-card" />
  }

  if (!stats) return null

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-elimux-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary-400" />
            <p className="text-sm text-muted">Today&apos;s Visitors</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-foreground">{stats.today.unique_visitors.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border bg-elimux-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-500" />
            <p className="text-sm text-muted">Today&apos;s Views</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-foreground">{stats.today.page_views.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border bg-elimux-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-elimux-success" />
            <p className="text-sm text-muted">Total Visitors</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-foreground">{stats.all_time.unique_visitors.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border bg-elimux-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-purple-500" />
            <p className="text-sm text-muted">Total Views</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-foreground">{stats.all_time.page_views.toLocaleString()}</p>
        </div>
      </div>

      {stats.today.top_pages.length > 0 && (
        <div className="rounded-xl border border-border bg-elimux-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-3">Top Pages Today</h3>
          <div className="space-y-2">
            {stats.today.top_pages.map((page) => (
              <div key={page.path} className="flex items-center justify-between text-sm">
                <span className="text-muted truncate max-w-[70%]">{page.path}</span>
                <span className="font-medium text-foreground">{page.count} views</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
