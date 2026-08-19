'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getUserWithTimeout } from '@/lib/client-auth'
import { getMyBursaryApplications } from '@/lib/api'
import type { BursaryApplication } from '@/types/bursary'

const STATUS_STYLES: Record<string, string> = {
  submitted: 'bg-yellow-500/10 text-yellow-400',
  document_check: 'bg-orange-500/10 text-orange-400',
  institution_verify: 'bg-blue-500/10 text-blue-400',
  govt_verify: 'bg-indigo-500/10 text-indigo-400',
  provider_review: 'bg-cyan-500/10 text-cyan-400',
  approved: 'bg-primary-500/10 text-primary-400',
  rejected: 'bg-red-500/10 text-red-400',
  waitlisted: 'bg-elimux-dark text-muted',
  disbursed: 'bg-purple-500/10 text-purple-400',
  appealed: 'bg-pink-500/10 text-pink-400',
}

function formatStatus(status: string | null | undefined) {
  if (!status) return 'Unknown'
  return status.replace(/_/g, ' ')
}

export default function MyApplicationsPage() {
  const router = useRouter()
  const [applications, setApplications] = useState<BursaryApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAuthAndLoad()
  }, [])

  async function checkAuthAndLoad() {
    const { data } = await getUserWithTimeout()
    if (!data.user) {
      router.push('/auth/login?redirect=/bursary/my-applications')
      return
    }
    fetchApplications()
  }

  async function fetchApplications() {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login?redirect=/bursary/my-applications')
        return
      }
      const data = await getMyBursaryApplications(session.access_token)
      setApplications(data.applications || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-elimux-dark flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-elimux-dark">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Bursary Applications</h1>
            <p className="text-muted mt-1">Track the status of your applications.</p>
          </div>
          <Link href="/bursary" className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium">
            Browse Bursaries
          </Link>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-red-400">{error}</div>}

        {applications.length === 0 ? (
          <div className="bg-elimux-card border border-border rounded-xl p-12 text-center">
            <p className="text-muted text-lg">You haven't applied to any bursaries yet.</p>
            <Link href="/bursary" className="mt-4 inline-block text-primary-400 hover:text-primary-300 font-medium">
              Browse available bursaries →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app.id} className="bg-elimux-card border border-border rounded-xl p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">{app.fundName || 'Unknown Fund'}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${STATUS_STYLES[app.status || ''] || 'bg-elimux-dark text-muted'}`}>
                        {formatStatus(app.status)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted">
                      {app.fundAmount ? <span>{app.fundCurrency || 'KES'} {app.fundAmount.toLocaleString()}</span> : null}
                      {app.fundDeadline && <span>Deadline: {new Date(app.fundDeadline).toLocaleDateString()}</span>}
                      <span>Applied: {new Date(app.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Link href={`/bursary/fund/${app.fundId}`} className="text-primary-400 hover:text-primary-300 font-medium text-sm whitespace-nowrap">
                    View Fund →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
