import type { HomepageAd } from './useHomepageAds'

export default function SponsoredCard({ ad }: { ad: HomepageAd }) {
  return (
    <div className="skolex-sans bg-white rounded-2xl p-4 flex flex-col" style={{ border: '1px solid var(--skolex-border, #e5e0d5)', boxShadow: 'var(--shadow, 0 1px 3px rgba(13,31,60,0.08))' }}>
      <span className="text-[10px] font-semibold tracking-widest uppercase mb-2" style={{ color: 'var(--skolex-gold, #C8973A)' }}>Sponsored</span>
      <p className="font-semibold text-sm" style={{ color: 'var(--skolex-navy, #0D1F3C)' }}>{ad.name}</p>
      <p className="text-sm mt-1" style={{ color: 'var(--skolex-navy, #0D1F3C)' }}>{ad.title}</p>
      {ad.description && <p className="text-xs mt-1 opacity-70" style={{ color: 'var(--skolex-navy, #0D1F3C)' }}>{ad.description}</p>}
      {ad.chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {ad.chips.map(c => (
            <span key={c} className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'var(--skolex-parchment, #F8F5EE)', color: 'var(--skolex-navy, #0D1F3C)', border: '1px solid var(--skolex-border, #e5e0d5)' }}>{c}</span>
          ))}
        </div>
      )}
      <a href={ad.cta_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-center text-sm font-semibold rounded-full px-4 py-2" style={{ background: 'var(--skolex-navy, #0D1F3C)', color: '#fff' }}>
        {ad.cta_label}
      </a>
    </div>
  )
}
