'use client'

// ============================================
// ELIMUX ADVERTISER PORTAL - INDEX
// /advertiser
// Redirects to the dashboard if signed in, else to login.
// ============================================

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AdvertiserIndexPage() {
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      router.replace(session ? '/advertiser/dashboard' : '/advertiser/login')
    })
  }, [router])

  return (
    <div className="min-h-screen bg-elimux-dark flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
    </div>
  )
}
