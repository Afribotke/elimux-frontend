'use client'

import { useEffect, useState } from 'react'
import { useMajorSponsor } from '@/lib/useMajorSponsor'

const SESSION_FLAG = 'elimux-loading-screen-shown'
const DISPLAY_MS = 1000

export default function AppLoadingScreen() {
  const { sponsor } = useMajorSponsor()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem(SESSION_FLAG)) return

    sessionStorage.setItem(SESSION_FLAG, '1')
    setVisible(true)

    const timer = setTimeout(() => setVisible(false), DISPLAY_MS)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null
  if (sponsor && !sponsor.show_in_loading) return null

  return (
    <div className="fixed inset-0 z-[60] bg-elimux-dark flex flex-col items-center justify-center gap-4 transition-opacity duration-300">
      <span className="text-2xl font-bold text-foreground">ElimuX</span>
      <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
      {sponsor && (
        <div className="flex flex-col items-center gap-1.5 mt-2">
          <span className="text-xs text-muted">Powered by</span>
          {sponsor.logo_url ? (
            <img src={sponsor.logo_url} alt={sponsor.name} className="h-6 w-auto object-contain" />
          ) : (
            <span className="text-sm font-semibold text-foreground">{sponsor.name}</span>
          )}
        </div>
      )}
    </div>
  )
}
