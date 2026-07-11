import { getOrCreatePwaDeviceId, bufferActionLocally } from './pwaDevice'

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

// Matches elimux-backend's queued_actions_action_type_check constraint
// (src/routes/pwa.ts's QUEUEABLE_ACTION_TYPES) - keep in sync if it changes.
export type QueueableActionType = 'favorite' | 'review' | 'application' | 'share'

export interface QueuedAction {
  id: string
  device_id: string
  action_type: QueueableActionType
  payload: Record<string, unknown> | null
  status: string
  retry_count: number
  created_at: string
  synced_at: string | null
}

// A plain function, not a hook - it has no listeners and needs none. Any
// component can call this directly (FavoriteButton, ReviewForm, ...) without
// each one standing up its own 'online' listener. The reconnect-driven flush
// + replay logic lives solely in useBackgroundSync/BackgroundSyncManager,
// which is mounted exactly once - see that file for why mounting it in more
// than one place caused duplicate-flush races in practice.
export async function queueAction(actionType: QueueableActionType, payload?: Record<string, unknown>): Promise<QueuedAction | null> {
  const deviceId = getOrCreatePwaDeviceId()
  try {
    const res = await fetch(`${API_URL}/api/pwa/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: deviceId, action_type: actionType, payload }),
    })
    if (!res.ok) throw new Error('Failed to queue action')
    return ((await res.json()).data as QueuedAction) || null
  } catch {
    // POST /api/pwa/queue is a network call too - it fails the same way the
    // original action's request did when genuinely offline (confirmed with
    // a real offline test: the server-side queue came back empty after
    // reconnecting because this call had silently failed). Buffer locally so
    // the action survives until BackgroundSyncManager flushes it.
    bufferActionLocally(actionType, payload)
    return null
  }
}
