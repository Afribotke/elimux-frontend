import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string
  color?: string
  trendPct?: number | null
}

export default function StatCard({ icon: Icon, label, value, color = 'text-primary-400', trendPct }: StatCardProps) {
  return (
    <div className="bg-elimux-card rounded-xl p-4 border border-border">
      <div className="flex items-start justify-between">
        <Icon className={`w-6 h-6 ${color} mb-2`} />
        {trendPct != null && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-medium ${
              trendPct >= 0 ? 'text-elimux-success' : 'text-elimux-danger'
            }`}
          >
            {trendPct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trendPct)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  )
}
