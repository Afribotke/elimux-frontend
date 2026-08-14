'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthContext } from '@/context/AuthContext'
import { startScholarshipApplication } from '@/lib/api'

interface Props {
  scholarshipId: string
}

export default function ScholarshipApplyButton({ scholarshipId }: Props) {
  const router = useRouter()
  // Read the session AuthContext already resolved on mount instead of
  // calling supabase.auth.getSession() again here - a second concurrent
  // call on the shared singleton client (src/lib/supabase/client.ts) while
  // AuthContext's own getSession() is still in flight left this button
  // stuck on "Starting..." forever with the promise never settling.
  const { session, loading: authLoading } = useAuthContext()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleApply() {
    if (authLoading) return

    setLoading(true)
    setError('')

    try {
      const token = session?.access_token

      if (!token) {
        router.push(`/login?redirect=/scholarships/${scholarshipId}`)
        return
      }

      await startScholarshipApplication(scholarshipId, token)
      router.push('/applications')
    } catch (err: any) {
      if (err.message?.includes('already exists')) {
        router.push('/applications')
      } else {
        setError(err.message || 'Failed to start application')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleApply}
        disabled={loading || authLoading}
        className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors disabled:opacity-50"
      >
        {loading ? 'Starting…' : 'Apply on ElimuX'}
      </button>
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
    </div>
  )
}
