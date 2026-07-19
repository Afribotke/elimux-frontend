'use client'

import { GraduationCap, Wrench } from 'lucide-react'
import type { InstitutionMode } from '@/lib/aiSearch'

interface SearchModeToggleProps {
  value: InstitutionMode | null
  onChange: (mode: InstitutionMode | null) => void
}

// Tri-state toggle: click a mode to activate it, click it again to go back to
// "All" (no filter). Null means existing behavior - every institution type.
export default function SearchModeToggle({ value, onChange }: SearchModeToggleProps) {
  const modes: { key: InstitutionMode; label: string; icon: typeof GraduationCap }[] = [
    { key: 'academic', label: 'University & College', icon: GraduationCap },
    { key: 'skills', label: 'Skills & Trades', icon: Wrench },
  ]

  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-elimux-card border border-border">
      {modes.map(({ key, label, icon: Icon }) => {
        const active = value === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(active ? null : key)}
            aria-pressed={active}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              active
                ? 'bg-primary-600 text-white shadow-lg'
                : 'text-muted hover:text-foreground hover:bg-muted/10'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        )
      })}
    </div>
  )
}
