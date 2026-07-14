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

export interface SearchAnalyticsPayload {
  query?: string
  category_id?: string
  country_id?: string
  level?: string
  results_count: number
  user_country?: string
}

// Fire-and-forget, dedicated search-analytics beacon (POST /api/analytics/search,
// backed by the search_analytics table) - separate from trackEvent's generic
// analytics_events log, which trackEvent still also feeds for the existing
// /admin/searches term-frequency dashboard.
export function trackSearchAnalytics(payload: SearchAnalyticsPayload): void {
  fetch(`${API_URL}/api/analytics/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {})
}

const SESSION_ID_KEY = 'elimux-session-id'

// Per-tab session id, generated once and cached in sessionStorage - finer
// grain than device_id (a persistent IP+user-agent fingerprint shared across
// visits, computed server-side in every other analytics-adjacent feature).
function getSessionId(): string | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    let id = window.sessionStorage.getItem(SESSION_ID_KEY)
    if (!id) {
      id = crypto.randomUUID()
      window.sessionStorage.setItem(SESSION_ID_KEY, id)
    }
    return id
  } catch {
    return undefined
  }
}

export interface ProgramViewPayload {
  program_id: string
  institution_id?: string | null
  user_country?: string
  source_query?: string
  view_source?: string
}

// Fire-and-forget (POST /api/analytics/view, backed by the program_views table).
// Auto-attaches session_id, and falls back to the `?from=` query param for
// view_source when the caller doesn't pass one explicitly.
export function trackProgramView(payload: ProgramViewPayload): void {
  const fromParam = typeof window !== 'undefined' ? new URL(window.location.href).searchParams.get('from') : null

  fetch(`${API_URL}/api/analytics/view`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      session_id: getSessionId(),
      view_source: payload.view_source || fromParam || undefined,
    }),
  }).catch(() => {})
}
