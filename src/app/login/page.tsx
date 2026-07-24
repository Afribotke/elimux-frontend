'use client'

// ============================================
// /login -> /auth/login
// Short-URL alias, preserves query string (e.g. ?redirect=).
// ============================================

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const qs = searchParams.toString()
    router.replace(qs ? `/auth/login?${qs}` : '/auth/login')
  }, [router, searchParams])

  return null
}

export default function LoginRedirectPage() {
  return (
    <Suspense fallback={null}>
      <LoginRedirect />
    </Suspense>
  )
}
