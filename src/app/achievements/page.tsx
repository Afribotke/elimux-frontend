'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Trophy, Star, Medal, ArrowRight, Zap } from 'lucide-react'
import {
  getMyGamificationState,
  listLeaderboard,
  listGamificationActions,
  type MyGamificationState,
  type LeaderboardEntry,
  type GamificationActionRow,
} from '@/lib/api'
import BadgeShowcase from '@/components/BadgeShowcase'
import ReferralGenerator from '@/components/ReferralGenerator'

const TABS = [
  { value: 'achievements', label: 'My Achievements' },
  { value: 'leaderboard', label: 'Leaderboard' },
  { value: 'how-to-earn', label: 'How to Earn' },
] as const

type Tab = (typeof TABS)[number]['value']

const RANK_STYLES: Record<number, { badge: string; row: string }> = {
  1: { badge: 'bg-yellow-500/15 border-yellow-500/40 text-yellow-400', row: 'border-yellow-500/20 bg-yellow-500/5' },
  2: { badge: 'bg-gray-400/15 border-gray-400/40 text-gray-300', row: 'border-gray-400/20 bg-gray-400/5' },
  3: { badge: 'bg-orange-500/15 border-orange-500/40 text-orange-400', row: 'border-orange-500/20 bg-orange-500/5' },
}

function AchievementsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const activeTab: Tab = TABS.some((t) => t.value === tabParam) ? (tabParam as Tab) : 'achievements'

  const [state, setState] = useState<MyGamificationState | null>(null)
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [actions, setActions] = useState<GamificationActionRow[]>([])
  const [loading, setLoading] = useState(true)

  function setTab(tab: Tab) {
    router.push(tab === 'achievements' ? '/achievements' : `/achievements?tab=${tab}`)
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getMyGamificationState().catch(() => null),
      listLeaderboard(50).catch(() => ({ data: [] })),
      listGamificationActions().catch(() => ({ data: [] })),
    ]).then(([myState, leaderboard, gamActions]) => {
      setState(myState)
      setEntries(leaderboard.data)
      setActions(gamActions.data)
      setLoading(false)
    })
  }, [])

  return (
    <div className="min-h-screen bg-muted">
      <section className="bg-amber-500 py-16 px-4 text-center">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">Your Achievements</h1>
        <p className="mt-4 max-w-2xl mx-auto text-amber-100">
          Earn badges, climb leaderboards, and unlock rewards as you explore education opportunities.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-center gap-1 bg-background rounded-lg p-1 mb-8 w-fit mx-auto border border-border">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setTab(tab.value)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.value ? 'bg-amber-500 text-white' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : activeTab === 'achievements' ? (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="rounded-xl bg-background border border-border p-6 flex items-center gap-4">
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                <Zap className="w-7 h-7 text-amber-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{state?.total_points ?? 0}</p>
                <p className="text-muted-foreground">Total Points</p>
              </div>
            </div>
            <BadgeShowcase />
            <ReferralGenerator />
          </div>
        ) : activeTab === 'leaderboard' ? (
          <div className="max-w-2xl mx-auto">
            {entries.length === 0 ? (
              <div className="text-center py-16">
                <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-foreground mb-6">No points yet. Start searching to earn points!</p>
                <Link
                  href="/ai-search"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-colors"
                >
                  Start exploring
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-background overflow-hidden">
                <div className="grid grid-cols-[3rem_1fr_5rem_5rem] gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border">
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
                          <span className="text-muted-foreground font-medium pl-2">{entry.rank}</span>
                        )}
                      </span>
                      <span className="text-foreground font-medium truncate">{entry.display_name}</span>
                      <span className="text-right font-bold text-amber-600">{entry.total_points}</span>
                      <span className="text-right text-muted-foreground text-sm">{entry.actions_count}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="rounded-2xl border border-border bg-background p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4">
                <Star className="w-5 h-5" />
                Ways to Earn Points
              </h2>
              <div className="space-y-3">
                {actions.map((action) => (
                  <div key={action.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">{action.action_name}</p>
                      {action.daily_limit && <p className="text-xs text-muted-foreground">Limit: {action.daily_limit}/day</p>}
                    </div>
                    <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                      +{action.points} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

export default function AchievementsPage() {
  return (
    <Suspense fallback={null}>
      <AchievementsContent />
    </Suspense>
  )
}
