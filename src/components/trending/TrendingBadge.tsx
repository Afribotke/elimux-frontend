'use client'

import { Flame } from 'lucide-react'

interface TrendingBadgeProps {
  clicks24h?: number | null
  size?: 'sm' | 'md'
}

export default function TrendingBadge({ clicks24h, size = 'sm' }: TrendingBadgeProps) {
  if (!clicks24h || clicks24h < 5) return null

  const isHot = clicks24h >= 20

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full ${
        isHot
          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
          : 'bg-orange-500/15 text-orange-400'
      } ${size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[10px]'}`}
    >
      <Flame className={size === 'md' ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5'} />
      {isHot ? 'Hot' : 'Trending'}
    </span>
  )
}
