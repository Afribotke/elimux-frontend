'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Trophy, Medal, RefreshCw, ArrowRight } from 'lucide-react'
import { listLeaderboard, type LeaderboardEntry } from '@/lib/api'
import BadgeShowcase from '@/components/BadgeShowcase'

const RANK_STYLES: Record<number, { badge: string; row: string }> = {
  1: { badge: 'bg-yellow-500/15 border-yellow-500/40 text-yellow-400', row: 'border-yellow-500/20 bg-yellow-500/5' },
  2: { badge: 'bg-gray-400/15 border-gray-400/40 text-gray-300', row: 'border-gray-400/20 bg-gray-400/5' },
  3: { badge: 'bg-orange-500/15 border-orange-500/40 text-orange-400', row: 'border-orange-500/20 bg-orange-500/5' },
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (isRefresh: boolean) => {
    isRefresh ? setRefreshing(true) : setLoading(true)
    setError(null)
    try {
      const { data } = await listLeaderboard(50)
      setEntries(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load(false)
  }, [load])

  return (
    <main className="min-h-screen py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm mb-6">
            <Trophy className="w-4 h-4" />
            Community Leaderboard
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Leaderboard</h1>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Top ElimuX users ranked by points earned from searching, reviewing, sharing, and referrals.
          </p>
        </div>

        <div className="flex justify-end mb-4">
          <button
            onClick={() => load(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted">Loading leaderboard...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-lg text-foreground mb-6">{error}</p>
            <button
              onClick={() => load(false)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors"
            >
              Try again
            </button>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="w-12 h-12 text-muted mx-auto mb-4" />
            <p className="text-lg text-foreground mb-6">No points yet. Start searching to earn points!</p>
            <Link
              href="/ai-search"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors"
            >
              Start exploring
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-elimux-card overflow-hidden">
            <div className="grid grid-cols-[3rem_1fr_5rem_5rem] gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted border-b border-border">
              <span>Rank</span>
              <span>Name</span>
              <span className="text-right">Points</span>
              <span className="text-right">Actions</span>
            </div>
            {entries.map((entry) => {
              const style = RANK_STYLES[entry.rank]
              return (
                <div
                  key={entry.rank}
                  className={`grid grid-cols-[3rem_1fr_5rem_5rem] gap-2 items-center px-4 py-3 border-b border-border last:border-b-0 ${style?.row ?? ''}`}
                >
                  <span>
                    {style ? (
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full border ${style.badge}`}>
                        <Medal className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="text-muted font-medium pl-2">{entry.rank}</span>
                    )}
                  </span>
                  <span className="text-foreground font-medium truncate">{entry.display_name}</span>
                  <span className="text-right font-bold text-primary-400">{entry.total_points}</span>
                  <span className="text-right text-muted text-sm">{entry.actions_count}</span>
                </div>
              )
            })}
          </div>
        )}

        <BadgeShowcase className="mt-12" />
      </div>
    </main>
  )
}
