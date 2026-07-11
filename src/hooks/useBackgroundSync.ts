'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { getOrCreatePwaDeviceId } from '@/lib/pwaDevice'

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

async function apiQueueAction(deviceId: string, actionType: QueueableActionType, payload?: Record<string, unknown>) {
  const res = await fetch(`${API_URL}/api/pwa/queue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_id: deviceId, action_type: actionType, payload }),
  })
  if (!res.ok) throw new Error('Failed to queue action')
  return ((await res.json()).data as QueuedAction) || null
}

async function apiGetQueue(deviceId: string): Promise<QueuedAction[]> {
  const res = await fetch(`${API_URL}/api/pwa/queue?device_id=${encodeURIComponent(deviceId)}`)
  if (!res.ok) return []
  return ((await res.json()).data as QueuedAction[]) || []
}

async function apiMarkSynced(deviceId: string) {
  await fetch(`${API_URL}/api/pwa/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_id: deviceId }),
  }).catch(() => {})
}

/**
 * Queues an action while offline (or when a live request fails) and replays
 * it once connectivity returns.
 *
 * `syncPendingActions` needs a `replay` callback because this hook can't know
 * how to redo a domain-specific mutation (a review submission needs
 * createReview() with its own fields, a favorite needs a different call
 * entirely) - only the calling component knows that. The backend's
 * POST /api/pwa/sync has no per-action granularity (it marks a device's
 * *entire* pending batch synced at once), so if any replay in a batch throws,
 * none of that batch is marked synced - they all retry together next time,
 * rather than risk silently losing a failed one.
 */
export function useBackgroundSync() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const deviceIdRef = useRef('')

  const refreshPendingCount = useCallback(async () => {
    if (!deviceIdRef.current) return
    const pending = await apiGetQueue(deviceIdRef.current)
    setPendingCount(pending.length)
  }, [])

  useEffect(() => {
    deviceIdRef.current = getOrCreatePwaDeviceId()
    setIsOnline(navigator.onLine)
    refreshPendingCount()

    function handleOnline() {
      setIsOnline(true)
      registerBackgroundSync()
    }
    function handleOffline() {
      setIsOnline(false)
    }
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === 'BACKGROUND_SYNC') refreshPendingCount()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    navigator.serviceWorker?.addEventListener('message', handleMessage)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      navigator.serviceWorker?.removeEventListener('message', handleMessage)
    }
  }, [refreshPendingCount])

  const queueAction = useCallback(
    async (actionType: QueueableActionType, payload?: Record<string, unknown>) => {
      const action = await apiQueueAction(deviceIdRef.current, actionType, payload)
      refreshPendingCount()
      return action
    },
    [refreshPendingCount]
  )

  const syncPendingActions = useCallback(
    async (replay: (action: QueuedAction) => Promise<void>) => {
      const pending = await apiGetQueue(deviceIdRef.current)
      if (pending.length === 0) return { synced: 0, failed: 0 }

      let failed = 0
      for (const action of pending) {
        try {
          await replay(action)
        } catch {
          failed++
        }
      }

      if (failed === 0) {
        await apiMarkSynced(deviceIdRef.current)
      }
      await refreshPendingCount()
      return { synced: failed === 0 ? pending.length : 0, failed }
    },
    [refreshPendingCount]
  )

  return { isOnline, pendingCount, queueAction, syncPendingActions }
}

function registerBackgroundSync() {
  navigator.serviceWorker?.ready
    .then((registration: any) => {
      if ('sync' in registration) {
        return registration.sync.register('elimux-sync')
      }
    })
    .catch(() => {})
}
