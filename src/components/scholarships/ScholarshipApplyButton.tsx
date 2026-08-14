'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { startScholarshipApplication } from '@/lib/api'

interface Props {
  scholarshipId: string
}

export default function ScholarshipApplyButton({ scholarshipId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleApply() {
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data: session } = await supabase.auth.getSession()
      const token = session?.session?.access_token

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
        disabled={loading}
        className="inline-flex items-center gap-2 px-5 py-3 min-h-[44px] rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors disabled:opacity-50"
      >
        {loading ? 'Starting…' : 'Apply on ElimuX'}
      </button>
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
    </div>
  )
}
