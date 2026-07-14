'use client'

import { useEffect } from 'react'
import { trackEvent, trackProgramView, type TrackableEventType } from '@/lib/analytics'

interface TrackPageViewProps {
  eventType?: TrackableEventType
  metadata?: Record<string, unknown>
  // When set, also records a row in program_views (dedicated analytics table
  // for the university dashboard), in addition to the generic page_view event.
  programView?: { program_id: string; institution_id?: string | null }
}

// Renders nothing - fires a tracking event once on mount. Exists because the pages
// that need this (e.g. institutions/[id]/page.tsx) are async server components,
// statically exported at build time - calling trackEvent directly in their body
// would fire once per build, not once per real visitor. This component defers the
// call to the browser via useEffect, same as any other client-only side effect.
export default function TrackPageView({ eventType = 'page_view', metadata, programView }: TrackPageViewProps) {
  useEffect(() => {
    trackEvent(eventType, metadata)
    if (programView) trackProgramView(programView)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
