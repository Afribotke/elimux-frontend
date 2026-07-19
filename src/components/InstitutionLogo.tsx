'use client'

import { useState } from 'react'
import { Globe } from 'lucide-react'

// 3-tier logo strategy:
// 1. The institution's own logo_url (claimed institutions upload via the portal)
// 2. Clearbit's free logo API, derived from the institution's website domain
// 3. Google's favicon service as a second source, then the Globe icon as final fallback
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
    domain ? `https://logo.clearbit.com/${domain}` : null,
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
