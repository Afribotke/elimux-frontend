'use client'

import { useEffect } from 'react'
import { trackEvent, type TrackableEventType } from '@/lib/analytics'

interface TrackPageViewProps {
  eventType?: TrackableEventType
  metadata?: Record<string, unknown>
}

// Renders nothing - fires a tracking event once on mount. Exists because the pages
// that need this (e.g. institutions/[id]/page.tsx) are async server components,
// statically exported at build time - calling trackEvent directly in their body
// would fire once per build, not once per real visitor. This component defers the
// call to the browser via useEffect, same as any other client-only side effect.
export default function TrackPageView({ eventType = 'page_view', metadata }: TrackPageViewProps) {
  useEffect(() => {
    trackEvent(eventType, metadata)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
