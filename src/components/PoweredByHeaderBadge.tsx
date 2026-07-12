'use client'

import { useMajorSponsor } from '@/lib/useMajorSponsor'

export default function PoweredByHeaderBadge() {
  const { sponsor } = useMajorSponsor()

  if (!sponsor || !sponsor.show_in_header) return null

  return (
    <a
      href={sponsor.website_url || undefined}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 min-w-0 text-muted hover:text-foreground transition-colors"
      title={sponsor.tagline ? `${sponsor.name} — ${sponsor.tagline}` : `Powered by ${sponsor.name}`}
    >
      <span className="hidden sm:inline text-xs whitespace-nowrap">Powered by</span>
      {sponsor.logo_url ? (
        <img src={sponsor.logo_url} alt={sponsor.name} className="h-5 w-auto object-contain flex-shrink-0" loading="lazy" decoding="async" />
      ) : (
        <span className="text-xs font-semibold truncate">{sponsor.name}</span>
      )}
    </a>
  )
}
