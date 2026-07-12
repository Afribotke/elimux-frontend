import { Award, Calendar, MapPin, Wallet } from 'lucide-react'
import type { ScholarshipRow } from '@/lib/api'

interface ScholarshipCardProps {
  scholarship: ScholarshipRow
}

function daysUntil(deadline: string): number {
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export default function ScholarshipCard({ scholarship }: ScholarshipCardProps) {
  const daysLeft = daysUntil(scholarship.application_deadline)

  return (
    <div className="bg-elimux-card rounded-xl p-5 border border-border hover:border-primary-500/50 transition-all hover:shadow-lg hover:shadow-primary-500/10">
      {scholarship.is_featured && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-3 bg-warning/20 text-warning">
          <Award className="w-3 h-3" />
          Featured
        </div>
      )}

      <h3 className="text-lg font-bold text-foreground mb-1 line-clamp-2">{scholarship.title}</h3>
      <p className="text-sm text-primary-400 mb-3">{scholarship.provider}</p>

      <div className="flex flex-wrap gap-3 text-sm text-muted mb-3">
        {(scholarship.institution?.name || scholarship.country?.name) && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {scholarship.institution?.name}
            {scholarship.institution?.name && scholarship.country?.name && ', '}
            {scholarship.country?.name}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          {daysLeft > 0 ? `${daysLeft} days left` : 'Deadline passed'}
        </span>
      </div>

      {scholarship.amount && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded bg-success/20 text-success text-xs font-medium">
            <Wallet className="w-3.5 h-3.5" />
            {scholarship.currency} {scholarship.amount}
          </span>
          {scholarship.coverage_type && (
            <span className="px-2.5 py-1 rounded bg-muted/20 text-muted text-xs">{scholarship.coverage_type}</span>
          )}
        </div>
      )}
    </div>
  )
}
