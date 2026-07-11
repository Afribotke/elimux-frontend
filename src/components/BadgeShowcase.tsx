'use client'

import { useEffect, useState } from 'react'
import {
  Award,
  Star,
  Trophy,
  Medal,
  Flame,
  Zap,
  Target,
  Crown,
  Sparkles,
  Gem,
  Rocket,
  Heart,
  ThumbsUp,
  Share2,
  Search,
  Users,
  Lock,
  type LucideIcon,
} from 'lucide-react'
import { getMyGamificationState, listBadges, type GamificationBadge } from '@/lib/api'

// badge.icon is a kebab-case name (same convention as institution_types.icon) -
// map the ones we expect gamification badges to use, default to Award for
// anything else so a new badge never renders blank.
const BADGE_ICONS: Record<string, LucideIcon> = {
  award: Award,
  star: Star,
  trophy: Trophy,
  medal: Medal,
  flame: Flame,
  zap: Zap,
  target: Target,
  crown: Crown,
  sparkles: Sparkles,
  gem: Gem,
  rocket: Rocket,
  heart: Heart,
  'thumbs-up': ThumbsUp,
  share: Share2,
  search: Search,
  users: Users,
}

interface BadgeShowcaseProps {
  className?: string
}

export default function BadgeShowcase({ className = '' }: BadgeShowcaseProps) {
  const [badges, setBadges] = useState<GamificationBadge[]>([])
  const [earnedIds, setEarnedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false

    Promise.all([listBadges(), getMyGamificationState()])
      .then(([badgesRes, state]) => {
        if (cancelled) return
        setBadges(badgesRes.data)
        setEarnedIds(new Set(state.badges.map((b) => b.badge_id)))
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (loading || failed || badges.length === 0) return null

  return (
    <div className={className}>
      <h2 className="text-xl font-bold text-foreground mb-4">Badges</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {badges.map((badge) => {
          const earned = earnedIds.has(badge.id)
          const Icon = (badge.icon && BADGE_ICONS[badge.icon]) || Award

          return (
            <div
              key={badge.id}
              title={badge.description || badge.name}
              className={`flex flex-col items-center text-center gap-2 rounded-2xl border p-4 transition-colors ${
                earned
                  ? 'border-primary-500/40 bg-primary-500/10'
                  : 'border-border bg-elimux-card opacity-50'
              }`}
            >
              <span
                className={`inline-flex items-center justify-center w-12 h-12 rounded-full border ${
                  earned
                    ? 'border-primary-500/40 bg-primary-500/15 text-primary-400'
                    : 'border-border text-muted'
                }`}
              >
                {earned ? <Icon className="w-6 h-6" /> : <Lock className="w-5 h-5" />}
              </span>
              <span className="text-sm font-semibold text-foreground">{badge.name}</span>
              {!earned && (
                <span className="text-xs text-muted">{badge.criteria_threshold} pts</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
