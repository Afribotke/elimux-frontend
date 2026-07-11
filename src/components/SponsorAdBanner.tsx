'use client'

import { useEffect, useState } from 'react'
import { listSponsorAds, trackAdClick, type SponsorAdRow } from '@/lib/api'
import { Megaphone } from 'lucide-react'

interface SponsorAdBannerProps {
  placement: string
}

export default function SponsorAdBanner({ placement }: SponsorAdBannerProps) {
  const [ads, setAds] = useState<SponsorAdRow[]>([])

  useEffect(() => {
    let cancelled = false
    listSponsorAds(placement)
      .then((res) => {
        if (!cancelled) setAds(res.data)
      })
      .catch(() => {
        if (!cancelled) setAds([])
      })
    return () => {
      cancelled = true
    }
  }, [placement])

  if (ads.length === 0) return null
  const ad = ads[0]

  function handleClick() {
    trackAdClick(ad.id).catch(() => {})
  }

  return (
    <a
      href={ad.target_url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={handleClick}
      className="block bg-elimux-card rounded-xl border border-amber-400/40 hover:border-amber-400/70 transition-all overflow-hidden"
    >
      <div className="flex items-center gap-4 p-4">
        {ad.image_url ? (
          <img src={ad.image_url} alt={ad.title} className="w-20 h-20 rounded-lg object-cover flex-shrink-0" loading="lazy" />
        ) : (
          <div className="w-20 h-20 rounded-lg bg-muted/20 flex items-center justify-center flex-shrink-0">
            <Megaphone className="w-8 h-8 text-muted" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-400 font-bold">
              Sponsored
            </span>
            {ad.sponsor?.name && <span className="text-xs text-muted truncate">{ad.sponsor.name}</span>}
          </div>
          <h3 className="text-base font-bold text-foreground truncate">{ad.title}</h3>
          {ad.description && <p className="text-sm text-muted line-clamp-1">{ad.description}</p>}
        </div>
      </div>
    </a>
  )
}
