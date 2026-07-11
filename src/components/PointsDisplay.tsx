'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Trophy } from 'lucide-react'
import { getMyGamificationState } from '@/lib/api'

export default function PointsDisplay() {
  const [points, setPoints] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false

    getMyGamificationState()
      .then((state) => {
        if (!cancelled) setPoints(state.total_points)
      })
      .catch(() => {
        // Non-critical widget - fail silently and just stay hidden.
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (points === null) return null

  return (
    <Link
      href="/leaderboard"
      className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border text-primary-400 hover:bg-primary-500/10 transition-colors"
      title={`${points} point${points === 1 ? '' : 's'} - view leaderboard`}
    >
      <Trophy className="w-4 h-4" />
      <span className="text-sm font-semibold text-foreground">{points}</span>
    </Link>
  )
}
