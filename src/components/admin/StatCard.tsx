import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string
  color?: string
}

export default function StatCard({ icon: Icon, label, value, color = 'text-primary-400' }: StatCardProps) {
  return (
    <div className="bg-elimux-card rounded-xl p-4 border border-border">
      <Icon className={`w-6 h-6 ${color} mb-2`} />
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  )
}
