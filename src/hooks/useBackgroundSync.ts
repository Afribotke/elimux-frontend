'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { getOrCreatePwaDeviceId, getLocalBuffer, removeFromLocalBuffer } from '@/lib/pwaDevice'
import { queueAction, type QueueableActionType, type QueuedAction } from '@/lib/pwaQueue'

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

export type { QueueableActionType, QueuedAction }
export { queueAction }

async function apiGetQueue(deviceId: string): Promise<QueuedAction[]> {
  try {
    const res = await fetch(`${API_URL}/api/pwa/queue?device_id=${encodeURIComponent(deviceId)}`)
    if (!res.ok) return []
    return ((await res.json()).data as QueuedAction[]) || []
  } catch {
    return [] // network unreachable - nothing server-side is visible right now
  }
}

async function apiMarkSynced(deviceId: string) {
  await fetch(`${API_URL}/api/pwa/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_id: deviceId }),
  }).catch(() => {})
}

// Pushes whatever queueAction (lib/pwaQueue.ts) couldn't reach the server for
// up to POST /api/pwa/queue now that we're back online. Stops at the first
// failure and leaves the rest buffered - still offline, or a blip - rather
// than lose ordering or drop items past a failure.
async function flushLocalBuffer(deviceId: string) {
  const buffered = getLocalBuffer()
  let flushed = 0
  for (const item of buffered) {
    try {
      await queueAction(item.action_type as QueueableActionType, item.payload)
      flushed++
    } catch {
      break
    }
  }
  if (flushed > 0) removeFromLocalBuffer(flushed)
}

/**
 * Owns the reconnect-triggered replay of queued actions. Mount this exactly
 * once (BackgroundSyncManager does, in the root layout) - it registers
 * 'online'/'offline' listeners and flushes the local buffer on reconnect,
 * and mounting it more than once was confirmed (via a real offline test) to
 * cause duplicate flushes: two instances both read the same localStorage
 * buffer before either had cleared it, and both pushed the same action to
 * POST /api/pwa/queue. Components that only need to *queue* an action (not
 * react to connectivity) should import queueAction from lib/pwaQueue
 * directly instead of calling this hook - it needs no listeners of its own.
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
    setPendingCount(pending.length + getLocalBuffer().length)
  }, [])

  useEffect(() => {
    deviceIdRef.current = getOrCreatePwaDeviceId()
    setIsOnline(navigator.onLine)
    refreshPendingCount()

    function handleOnline() {
      setIsOnline(true)
      flushLocalBuffer(deviceIdRef.current)
        .catch(() => {})
        .finally(() => {
          refreshPendingCount()
          registerBackgroundSync()
        })
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

  return { isOnline, pendingCount, syncPendingActions }
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
