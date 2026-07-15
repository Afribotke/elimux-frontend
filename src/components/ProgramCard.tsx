'use client'

import { useState } from 'react'
import { Clock, DollarSign, MapPin, BookOpen, Check, Share2 } from 'lucide-react'
import ShareModal from './ShareModal'
import ProgramVerificationBadge from './ProgramVerificationBadge'

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
    is_ai_generated?: boolean | null
    is_verified?: boolean | null
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
  // Compare-selection checkbox, opt-in per caller (only wired up on the
  // Explore Programs page) - every other ProgramCard usage is unaffected
  // when these are omitted.
  compareMode?: boolean
  compareSelected?: boolean
  compareDisabled?: boolean
  onToggleCompare?: (id: string) => void
}

export default function ProgramCard({
  program,
  compareMode = false,
  compareSelected = false,
  compareDisabled = false,
  onToggleCompare,
}: ProgramCardProps) {
  const categoryColor = program.category?.color || '#FFC107'
  const [shareOpen, setShareOpen] = useState(false)

  return (
    <div className="relative bg-elimux-card rounded-xl p-5 border border-border hover:border-primary-500/50 transition-all hover:shadow-lg hover:shadow-primary-500/10">
      <div
        className="absolute top-3 left-3 z-10"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        <button
          type="button"
          onClick={() => setShareOpen(true)}
          aria-label="Share this program"
          title="Share"
          className="w-6 h-6 rounded-md border border-border bg-elimux-dark text-muted hover:text-foreground hover:border-primary-500/50 flex items-center justify-center transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        item={{
          name: program.name,
          description: program.description,
          url: typeof window !== 'undefined' ? `${window.location.origin}/programs/${program.id}/` : '',
          type: 'program',
        }}
      />

      {compareMode && (
        <div
          className="absolute top-3 right-3 z-10"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <button
            type="button"
            disabled={compareDisabled && !compareSelected}
            onClick={() => onToggleCompare?.(program.id)}
            aria-pressed={compareSelected}
            aria-label={compareSelected ? 'Remove from comparison' : 'Add to comparison'}
            className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
              compareSelected
                ? 'bg-primary-600 border-primary-600 text-white'
                : 'bg-elimux-dark border-border text-transparent hover:border-primary-500/50'
            } ${compareDisabled && !compareSelected ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {compareSelected && <Check className="w-4 h-4" />}
          </button>
        </div>
      )}
      {/* Category + Verification Badges */}
      {(program.category || program.is_verified || program.is_ai_generated) && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {program.category && (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: categoryColor + '20', color: categoryColor }}
            >
              <BookOpen className="w-3 h-3" />
              {program.category.name}
            </div>
          )}
          <ProgramVerificationBadge
            isVerified={!!program.is_verified}
            isAiGenerated={!!program.is_ai_generated}
          />
        </div>
      )}

      {/* Program Name */}
      <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2">
        {program.name}
      </h3>

      {/* Institution */}
      {program.institution && (
        <p className="text-sm text-muted mb-3 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" />
          {program.institution.name}
          {program.institution.city && `, ${program.institution.city}`}
          {program.institution.country?.name && `, ${program.institution.country.name}`}
        </p>
      )}

      {/* Description */}
      {program.description && (
        <p className="text-sm text-muted mb-4 line-clamp-2">
          {program.description}
        </p>
      )}

      {/* Details Row */}
      <div className="flex flex-wrap gap-3 text-sm">
        {program.duration_months && (
          <span className="flex items-center gap-1 text-muted">
            <Clock className="w-4 h-4 text-primary-400" />
            {program.duration_months} months
          </span>
        )}
        {program.tuition_fees && (
          <span className="flex items-center gap-1 text-muted">
            <DollarSign className="w-4 h-4 text-success" />
            {program.currency || 'USD'} {program.tuition_fees.toLocaleString()}
          </span>
        )}
        {program.level && (
          <span className="px-2 py-0.5 rounded bg-muted/20 text-muted text-xs">
            {program.level}
          </span>
        )}
        {program.mode && (
          <span className="px-2 py-0.5 rounded bg-muted/20 text-muted text-xs">
            {program.mode}
          </span>
        )}
      </div>
    </div>
  )
}
