'use client'

import { useEffect, useState } from 'react'
import { Flame, TrendingUp, Eye, Share2 } from 'lucide-react'
import Link from 'next/link'

interface TrendingItem {
  content_type: string
  content_id: string
  score: number
  clicks_24h: number
  clicks_7d: number
  shares_24h: number
  unique_visitors: number
  rank: number
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'scholarship', label: 'Scholarships' },
  { key: 'course', label: 'Programs' },
  { key: 'internship', label: 'Internships' },
]

function getHref(item: TrendingItem): string {
  switch (item.content_type) {
    case 'scholarship': return `/scholarships/${item.content_id}`
    case 'course': return `/programs/${item.content_id}`
    case 'institution': return `/institutions/${item.content_id}`
    case 'attachment': return `/attachments/${item.content_id}`
    case 'internship': return `/internships/${item.content_id}`
    case 'bursary': return `/bursary/fund/${item.content_id}`
    default: return '/'
  }
}

export default function TrendingSection() {
  const [items, setItems] = useState<TrendingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<string>('all')

  useEffect(() => {
    fetch('/api/trending?limit=12')
      .then((r) => r.json())
      .then((res) => { if (res.success) setItems(res.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = activeFilter === 'all' ? items : items.filter((i) => i.content_type === activeFilter)

  if (loading) {
    return (
      <section className="py-8 px-4 max-w-6xl mx-auto">
        <div className="h-48 bg-elimux-card border border-border rounded-xl animate-pulse" />
      </section>
    )
  }

  if (items.length === 0) return null

  return (
    <section className="py-12 px-4 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-6 h-6 text-orange-400" />
        <h2 className="text-2xl font-bold text-foreground">Trending Now</h2>
        <span className="text-xs bg-orange-500/15 text-orange-400 px-2 py-0.5 rounded-full font-medium">Live</span>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setActiveFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
              activeFilter === f.key
                ? 'bg-primary-500 text-white'
                : 'bg-elimux-card border border-border text-muted hover:text-foreground hover:border-primary-500/50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted text-sm">Nothing trending in this category yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.slice(0, 8).map((item, idx) => (
            <TrendingCard key={`${item.content_type}-${item.content_id}`} item={item} index={idx} />
          ))}
        </div>
      )}
    </section>
  )
}

function TrendingCard({ item, index }: { item: TrendingItem; index: number }) {
  return (
    <Link href={getHref(item)} className="group block">
      <div className="relative bg-elimux-card rounded-xl p-4 border border-border hover:border-primary-500/50 transition-all hover:shadow-lg hover:shadow-primary-500/10 hover:-translate-y-0.5">
        <div className="absolute -top-2 -left-2 w-7 h-7 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md">
          {index + 1}
        </div>

        <div className="flex items-center gap-1 mb-2">
          <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-xs font-medium text-orange-400">Trending</span>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted mb-2">
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {item.clicks_24h} today</span>
          <span className="flex items-center gap-1"><Share2 className="w-3 h-3" /> {item.shares_24h} shares</span>
        </div>

        <div className="text-xs text-muted/70 uppercase tracking-wide">{item.content_type}</div>
      </div>
    </Link>
  )
}
