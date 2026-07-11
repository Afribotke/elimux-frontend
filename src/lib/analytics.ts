const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

export type TrackableEventType = 'search' | 'page_view' | 'click' | 'application' | 'review' | 'share' | 'payment'

// Fire-and-forget: posts to the backend's public POST /api/admin/analytics/track
// (public despite the /admin/ prefix - see elimux-backend's admin-analytics.ts).
// user_device_id is intentionally omitted; the backend derives it server-side from
// the request's IP + user-agent via the same fingerprint every other device-scoped
// feature (favorites, gamification) already uses, so callers never need to compute
// or pass one. Never throws - a tracking failure must not break the calling page.
export function trackEvent(eventType: TrackableEventType, metadata?: Record<string, unknown>): void {
  fetch(`${API_URL}/api/admin/analytics/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_type: eventType, metadata }),
  }).catch(() => {})
}
