'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { getOrCreatePwaDeviceId, urlBase64ToUint8Array } from '@/lib/pwaDevice'
import { subscribePush, unsubscribePush } from '@/lib/api'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

type Status = 'unsupported' | 'checking' | 'subscribed' | 'unsubscribed'

export default function PushNotificationToggle() {
  const [status, setStatus] = useState<Status>('checking')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }

    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((sub) => setStatus(sub ? 'subscribed' : 'unsubscribed'))
      .catch(() => setStatus('unsubscribed'))
  }, [])

  async function handleSubscribe() {
    setBusy(true)
    setError(null)
    try {
      if (Notification.permission === 'denied') {
        throw new Error('Notifications are blocked in your browser settings')
      }
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        throw new Error('Permission not granted')
      }

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      const deviceId = getOrCreatePwaDeviceId()
      await subscribePush(deviceId, subscription.toJSON() as PushSubscriptionJSON)
      setStatus('subscribed')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enable notifications')
    } finally {
      setBusy(false)
    }
  }

  async function handleUnsubscribe() {
    setBusy(true)
    setError(null)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) await subscription.unsubscribe()

      const deviceId = getOrCreatePwaDeviceId()
      await unsubscribePush(deviceId)
      setStatus('unsubscribed')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable notifications')
    } finally {
      setBusy(false)
    }
  }

  if (status === 'unsupported') return null

  return (
    <div>
      <button
        onClick={status === 'subscribed' ? handleUnsubscribe : handleSubscribe}
        disabled={busy || status === 'checking'}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-muted/10 transition-colors disabled:opacity-50"
        aria-pressed={status === 'subscribed'}
      >
        {busy ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : status === 'subscribed' ? (
          <Bell className="w-4 h-4 text-primary-400" />
        ) : (
          <BellOff className="w-4 h-4 text-muted" />
        )}
        {status === 'subscribed' ? 'Notifications on' : 'Enable notifications'}
      </button>
      {error && <p className="text-xs text-elimux-danger mt-1 px-3">{error}</p>}
    </div>
  )
}
