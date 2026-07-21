import type { HomepageAd } from './useHomepageAds'
import { VERTICALS } from './useHomepageAds'

export default function SponsorTicker({ ads }: { ads: HomepageAd[] }) {
  const names = [...new Set(ads.map(a => a.name))]
  if (names.length < 4) return null
  const label = (key: string) => VERTICALS.find(v => v.key === key)?.label || key

  return (
    <div className="mt-6 py-3 overflow-x-auto" style={{ borderTop: '1px solid var(--skolex-border, #e5e0d5)', borderBottom: '1px solid var(--skolex-border, #e5e0d5)' }}>
      <div className="flex gap-8 whitespace-nowrap">
        {ads.map(a => (
          <span key={a.id} className="skolex-sans text-xs" style={{ color: 'var(--skolex-navy, #0D1F3C)' }}>
            {a.name} <span className="opacity-50">· {label(a.vertical)}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
