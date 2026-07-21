'use client'

import { GraduationCap, Wrench } from 'lucide-react'
import type { InstitutionMode } from '@/lib/aiSearch'

interface HeroModePillProps {
  value: InstitutionMode | null
  onChange: (mode: InstitutionMode | null) => void
}

// Same tri-state contract as SearchModeToggle (click to activate, click again
// to clear back to "All") — restyled for the Skolex hero, not a fork of it.
export default function HeroModePill({ value, onChange }: HeroModePillProps) {
  const modes: { key: InstitutionMode; label: string; icon: typeof GraduationCap }[] = [
    { key: 'academic', label: 'University & College', icon: GraduationCap },
    { key: 'skills', label: 'Skills & Trades', icon: Wrench },
  ]

  return (
    <div
      className="inline-flex items-center gap-1 p-1 rounded-full"
      style={{ background: 'var(--skolex-white)', border: '1px solid var(--skolex-g2)', boxShadow: 'var(--skolex-shadow)' }}
    >
      {modes.map(({ key, label, icon: Icon }) => {
        const active = value === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(active ? null : key)}
            aria-pressed={active}
            className="skolex-sans flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors"
            style={
              active
                ? { background: 'var(--skolex-navy)', color: 'var(--skolex-white)' }
                : { color: 'var(--skolex-t2)' }
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        )
      })}
    </div>
  )
}
