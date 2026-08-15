'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

// Deliberately does not use useBackgroundSync() here even though it already
// tracks online/offline state - that hook is documented "mount exactly once"
// (its reconnect flush logic caused duplicate-flush races when mounted
// twice), so a second mount just to read connectivity would reintroduce
// that. A standalone navigator.onLine listener is a few extra lines but
// avoids the hazard.
export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    setIsOffline(!navigator.onLine)

    function handleOnline() {
      setIsOffline(false)
    }
    function handleOffline() {
      setIsOffline(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div className="fixed top-14 left-0 right-0 z-50 bg-elimux-warning text-elimux-dark text-sm font-medium py-2 px-4 flex items-center justify-center gap-2">
      <WifiOff className="w-4 h-4" />
      You&apos;re offline — showing cached content
    </div>
  )
}
