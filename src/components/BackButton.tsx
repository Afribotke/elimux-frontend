'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { ArrowLeft } from 'lucide-react'

interface BackButtonProps {
  fallbackHref?: string
  label?: string
  className?: string
}

export default function BackButton({
  fallbackHref = '/',
  label = 'Back',
  className = ''
}: BackButtonProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleBack = useCallback(() => {
    // window.history.length is unreliable for detecting in-app navigation —
    // it's typically >= 2 even on a fresh direct page load, so router.back()
    // would land on about:blank instead of using fallbackHref. Check the
    // referrer's origin instead.
    const referrer = document.referrer
    const isSameOrigin = referrer && new URL(referrer).origin === window.location.origin

    if (isSameOrigin) {
      router.back()
    } else {
      router.push(fallbackHref)
    }
  }, [router, fallbackHref])

  if (pathname === '/') return null

  return (
    <button
      onClick={handleBack}
      className={`inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors ${className}`}
      aria-label="Go back"
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </button>
  )
}
