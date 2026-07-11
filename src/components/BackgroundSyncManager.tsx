'use client'

import { useEffect, useRef } from 'react'
import { useBackgroundSync, type QueuedAction } from '@/hooks/useBackgroundSync'
import { addFavorite, removeFavorite, createReview, applyProgram } from '@/lib/api'

// The one place that knows how to redo each queueable action_type - see
// useBackgroundSync's doc comment for why this can't live in the hook itself.
async function replayAction(action: QueuedAction): Promise<void> {
  const payload = (action.payload || {}) as Record<string, any>

  switch (action.action_type) {
    case 'favorite':
      if (payload.action === 'remove') {
        await removeFavorite(payload.item_id, payload.item_type)
      } else {
        await addFavorite(payload.item_id, payload.item_type)
      }
      return
    case 'review':
      await createReview(payload as Parameters<typeof createReview>[0])
      return
    case 'application':
      // Only program applications are ever queued (institution-onboarding's
      // handleFinalSubmit) - the institution_application itself has to exist
      // online-first (step 1 gates step 2 in the UI), so there's nothing
      // upstream of this that could fail offline and need replaying.
      await applyProgram(payload as Parameters<typeof applyProgram>[0])
      return
    default:
      // share is never queued - ShareModal's three actions (copy link,
      // WhatsApp, mailto:) don't call the backend at all, so there's no
      // network mutation to protect. Throw rather than silently drop, so if
      // that changes before a replay handler is added, the action stays
      // pending (and visibly unsynced) instead of vanishing.
      throw new Error(`No replay handler for action_type "${action.action_type}"`)
  }
}

// Renders nothing - owns the online-triggered sync so queued actions replay
// even if the component that originally queued them (a closed review form, a
// favorite button on a page the user navigated away from) has unmounted.
export default function BackgroundSyncManager() {
  const { isOnline, pendingCount, syncPendingActions } = useBackgroundSync()
  const syncingRef = useRef(false)

  useEffect(() => {
    if (!isOnline || pendingCount === 0 || syncingRef.current) return

    syncingRef.current = true
    syncPendingActions(replayAction)
      .catch(() => {})
      .finally(() => {
        syncingRef.current = false
      })
  }, [isOnline, pendingCount, syncPendingActions])

  return null
}
