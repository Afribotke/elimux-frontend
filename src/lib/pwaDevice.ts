// The PWA endpoints (subscribe/cache/queue/sync) take device_id explicitly in
// the request body rather than deriving it server-side from IP+UA the way
// favorites/gamification/analytics-track do - intentional, since a client
// device's IP changes across networks (wifi <-> mobile data) in exactly the
// situations offline/PWA features need to survive. This is a separate,
// persisted identity from that fingerprint, not a replacement for it.
const DEVICE_ID_KEY = 'elimux-pwa-device-id'

export function getOrCreatePwaDeviceId(): string {
  if (typeof window === 'undefined') return ''

  let id = localStorage.getItem(DEVICE_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, id)
  }
  return id
}

// POST /api/pwa/queue is itself a network call - it fails the same way the
// original action did when genuinely offline (confirmed with Playwright:
// context.setOffline(true), click favorite, go back online, GET
// /api/pwa/queue came back empty - the queue call had silently failed too).
// This buffer is the local, always-available fallback: queueAction() writes
// here first when the server call fails, and the online handler flushes it
// to POST /api/pwa/queue before the normal sync/replay path runs.
const LOCAL_QUEUE_KEY = 'elimux-local-pending-actions'

export interface LocalPendingAction {
  action_type: string
  payload: Record<string, unknown> | undefined
  queued_at: string
}

export function bufferActionLocally(actionType: string, payload: Record<string, unknown> | undefined) {
  const buffered = getLocalBuffer()
  buffered.push({ action_type: actionType, payload, queued_at: new Date().toISOString() })
  localStorage.setItem(LOCAL_QUEUE_KEY, JSON.stringify(buffered))
}

export function getLocalBuffer(): LocalPendingAction[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_QUEUE_KEY) || '[]')
  } catch {
    return []
  }
}

export function removeFromLocalBuffer(count: number) {
  const remaining = getLocalBuffer().slice(count)
  if (remaining.length === 0) {
    localStorage.removeItem(LOCAL_QUEUE_KEY)
  } else {
    localStorage.setItem(LOCAL_QUEUE_KEY, JSON.stringify(remaining))
  }
}

// PushManager.subscribe's applicationServerKey wants a Uint8Array, VAPID keys
// are distributed as URL-safe base64 - standard conversion, not app-specific.
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
