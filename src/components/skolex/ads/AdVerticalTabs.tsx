'use client'
import { VERTICALS } from './useHomepageAds'

export default function AdVerticalTabs({ active, onChange }: { active: string; onChange: (key: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4" role="tablist" aria-label="Advertiser categories">
      {VERTICALS.map(v => {
        const isActive = v.key === active
        return (
          <button
            key={v.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(v.key)}
            className="skolex-sans whitespace-nowrap text-sm px-4 py-2 rounded-full border transition-colors"
            style={isActive
              ? { background: 'var(--skolex-navy, #0D1F3C)', color: '#fff', borderColor: 'var(--skolex-navy, #0D1F3C)' }
              : { background: '#fff', color: 'var(--skolex-navy, #0D1F3C)', borderColor: 'var(--skolex-border, #e5e0d5)' }}
          >
            <span className="mr-1.5">{v.icon}</span>{v.label}
          </button>
        )
      })}
    </div>
  )
}
