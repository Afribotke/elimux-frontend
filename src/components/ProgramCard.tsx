import { Clock, DollarSign, MapPin, BookOpen } from 'lucide-react'

interface ProgramCardProps {
  program: {
    id: string
    name: string
    description: string | null
    duration_months: number | null
    tuition_fees: number | null
    currency: string | null
    level: string | null
    mode: string | null
    institution?: {
      name: string
      city: string | null
      country?: { name: string } | null
    } | null
    category?: {
      name: string
      color: string | null
      icon: string | null
    } | null
  }
}

export default function ProgramCard({ program }: ProgramCardProps) {
  const categoryColor = program.category?.color || '#3b82f6'

  return (
    <div className="bg-elimux-card rounded-xl p-5 border border-gray-700/50 hover:border-primary-500/50 transition-all hover:shadow-lg hover:shadow-primary-500/10">
      {/* Category Badge */}
      {program.category && (
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-3"
          style={{ backgroundColor: categoryColor + '20', color: categoryColor }}
        >
          <BookOpen className="w-3 h-3" />
          {program.category.name}
        </div>
      )}

      {/* Program Name */}
      <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
        {program.name}
      </h3>

      {/* Institution */}
      {program.institution && (
        <p className="text-sm text-gray-400 mb-3 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" />
          {program.institution.name}
          {program.institution.city && `, ${program.institution.city}`}
          {program.institution.country?.name && `, ${program.institution.country.name}`}
        </p>
      )}

      {/* Description */}
      {program.description && (
        <p className="text-sm text-gray-400 mb-4 line-clamp-2">
          {program.description}
        </p>
      )}

      {/* Details Row */}
      <div className="flex flex-wrap gap-3 text-sm">
        {program.duration_months && (
          <span className="flex items-center gap-1 text-gray-300">
            <Clock className="w-4 h-4 text-primary-400" />
            {program.duration_months} months
          </span>
        )}
        {program.tuition_fees && (
          <span className="flex items-center gap-1 text-gray-300">
            <DollarSign className="w-4 h-4 text-success" />
            {program.currency || 'USD'} {program.tuition_fees.toLocaleString()}
          </span>
        )}
        {program.level && (
          <span className="px-2 py-0.5 rounded bg-gray-700 text-gray-300 text-xs">
            {program.level}
          </span>
        )}
        {program.mode && (
          <span className="px-2 py-0.5 rounded bg-gray-700 text-gray-300 text-xs">
            {program.mode}
          </span>
        )}
      </div>
    </div>
  )
}
