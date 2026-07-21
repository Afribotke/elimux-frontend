'use client'
import { useEffect, useState } from 'react'
import type { HomepageAd } from './useHomepageAds'

export default function FeaturedCarousel({ ads }: { ads: HomepageAd[] }) {
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (ads.length < 2 || paused) return
    const t = setInterval(() => setIdx(i => (i + 1) % ads.length), 6000)
    return () => clearInterval(t)
  }, [ads.length, paused])

  if (ads.length === 0) return null
  const ad = ads[idx % ads.length]

  return (
    <div className="skolex-sans rounded-2xl p-5 mt-4 flex items-center gap-4 flex-wrap" style={{ background: 'var(--skolex-navy, #0D1F3C)', color: '#fff' }}>
      <div className="flex-1 min-w-[200px]">
        <p className="text-[10px] tracking-widest uppercase" style={{ color: 'var(--skolex-gold, #C8973A)' }}>Now featuring</p>
        <p className="font-semibold">{ad.name} — {ad.title}</p>
        {ad.description && <p className="text-sm opacity-80">{ad.description}</p>}
      </div>
      <div className="flex items-center gap-2">
        {ads.length > 1 && (
          <>
            <button aria-label="Previous" onClick={() => setIdx((idx - 1 + ads.length) % ads.length)} className="px-2 py-1 rounded-full" style={{ border: '1px solid rgba(255,255,255,0.3)' }}>‹</button>
            <span className="text-xs opacity-70">{idx + 1}/{ads.length}</span>
            <button aria-label="Next" onClick={() => setIdx((idx + 1) % ads.length)} className="px-2 py-1 rounded-full" style={{ border: '1px solid rgba(255,255,255,0.3)' }}>›</button>
            <button aria-label={paused ? 'Play' : 'Pause'} aria-pressed={paused} onClick={() => setPaused(p => !p)} className="px-2 py-1 rounded-full" style={{ border: '1px solid rgba(255,255,255,0.3)' }}>
              {paused ? '▶' : '❚❚'}
            </button>
          </>
        )}
        <a href={ad.cta_url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold rounded-full px-4 py-2" style={{ background: 'var(--skolex-gold, #C8973A)', color: 'var(--skolex-navy, #0D1F3C)' }}>{ad.cta_label}</a>
      </div>
    </div>
  )
}
