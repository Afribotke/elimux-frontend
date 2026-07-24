'use client'

// ============================================
// /register -> /auth/register
// Short-URL alias, preserves query string.
// ============================================

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function RegisterRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const qs = searchParams.toString()
    router.replace(qs ? `/auth/register?${qs}` : '/auth/register')
  }, [router, searchParams])

  return null
}

export default function RegisterRedirectPage() {
  return (
    <Suspense fallback={null}>
      <RegisterRedirect />
    </Suspense>
  )
}
