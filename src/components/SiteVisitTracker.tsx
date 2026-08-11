'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackEvent } from '@/lib/analytics'

// Site-wide page view tracking, mounted once in the root layout. Skips:
// - /admin, /nita: internal/staff traffic, would pollute visitor counts
// - /institutions/[id], /programs/[id]: these already fire their own
//   page_view via TrackPageView with institution_id/program_id metadata
//   (consumed by admin-analytics.ts's /institutions ranking endpoint) -
//   tracking here too would double-count every view of those two page types.
export default function SiteVisitTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return
    if (pathname.startsWith('/admin') || pathname.startsWith('/nita')) return
    if (/^\/institutions\/[^/]+/.test(pathname)) return
    if (/^\/programs\/[^/]+/.test(pathname)) return

    trackEvent('page_view')
  }, [pathname])

  return null
}
