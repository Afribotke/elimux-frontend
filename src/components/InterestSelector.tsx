'use client'

import { HeartPulse, Cpu, Briefcase, Cog, Scale, GraduationCap, Palette, FlaskConical } from 'lucide-react'

export interface Interest {
  id: string
  label: string
  icon: typeof HeartPulse
}

export const INTERESTS: Interest[] = [
  { id: 'medicine', label: 'Medicine & Health', icon: HeartPulse },
  { id: 'tech', label: 'Technology', icon: Cpu },
  { id: 'business', label: 'Business', icon: Briefcase },
  { id: 'engineering', label: 'Engineering', icon: Cog },
  { id: 'law', label: 'Law', icon: Scale },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'arts', label: 'Arts & Design', icon: Palette },
  { id: 'science', label: 'Science', icon: FlaskConical },
]

interface InterestSelectorProps {
  selected: string[]
  onToggle: (interestId: string) => void
}

export default function InterestSelector({ selected, onToggle }: InterestSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {INTERESTS.map((interest) => {
        const isSelected = selected.includes(interest.id)
        const Icon = interest.icon
        return (
          <button
            key={interest.id}
            type="button"
            onClick={() => onToggle(interest.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
              isSelected
                ? 'bg-primary-500 text-black shadow-lg shadow-primary-500/20'
                : 'bg-elimux-card border border-border text-muted hover:border-primary-500/50'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {interest.label}
          </button>
        )
      })}
    </div>
  )
}
