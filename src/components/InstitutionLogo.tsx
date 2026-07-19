'use client'

import { useState } from 'react'
import { Globe } from 'lucide-react'

// 2-tier logo strategy:
// 1. The institution's own logo_url (claimed institutions upload via the portal,
//    or scraped by fetch_logos.js)
// 2. Google's favicon service, derived from the institution's website domain,
//    then the Globe icon as final fallback
// Clearbit's free logo API was dropped 2026-07-19 — it was returning broken
// (0x0) images for every domain we sampled, effectively dead.
function domainFromUrl(url: string | null): string | null {
  if (!url) return null
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`)
    return u.hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

interface InstitutionLogoProps {
  name: string
  logoUrl?: string | null
  websiteUrl?: string | null
}

export default function InstitutionLogo({ name, logoUrl, websiteUrl }: InstitutionLogoProps) {
  const domain = domainFromUrl(websiteUrl ?? null)

  const sources = [
    logoUrl || null,
    domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=128` : null,
  ].filter((s): s is string => !!s)

  const [idx, setIdx] = useState(0)

  if (idx >= sources.length) {
    return <Globe className="w-8 h-8 text-muted" />
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={sources[idx]}
      alt={name}
      onError={() => setIdx(idx + 1)}
      className="w-full h-full object-contain"
      loading="lazy"
      decoding="async"
    />
  )
}
