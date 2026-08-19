'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useAdminKey } from '@/components/admin/AdminKeyContext'
import { listAdminBursaryApplications, type AdminBursaryApplicationRow } from '@/lib/api'
import { ClipboardList, ChevronRight } from 'lucide-react'

const TABS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All' },
]

// bursary_applications.status has no literal 'pending' value in its own
// right - the closest pre-decision states are 'submitted'/'document_check'/
// 'institution_verify'/'govt_verify'/'provider_review'. Task 3 asked for a
// "Pending" tab; mapped it to 'submitted' (the actual first post-draft
// state an admin would see something to review in), flagged here rather
// than silently picking one of five candidate statuses.
const STATUS_FOR_TAB: Record<string, string> = {
  pending: 'submitted',
  approved: 'approved',
  rejected: 'rejected',
  all: 'all',
}

export default function AdminBursaryApplicationsPage() {
  const { adminKey } = useAdminKey()
  const [tab, setTab] = useState('pending')
  const [applications, setApplications] = useState<AdminBursaryApplicationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!adminKey) return
    setLoading(true)
    setError(null)
    try {
      const res = await listAdminBursaryApplications({ status: STATUS_FOR_TAB[tab], limit: 50 }, adminKey)
      setApplications(res.applications)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications')
    } finally {
      setLoading(false)
    }
  }, [adminKey, tab])

  useEffect(() => {
    load()
  }, [load])

  return (
    <main className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-1">
        <ClipboardList className="w-6 h-6 text-amber-600" />
        Bursary Applications
      </h1>
      <p className="text-sm text-gray-500 mb-6">Review and decide on bursary applications.</p>

      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 mb-4 w-fit">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="mb-4 px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-3" />
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-sm">No applications in this view.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Applicant</th>
                  <th className="px-4 py-3 font-medium">Fund</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                  <th className="px-4 py-3 font-medium text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applications.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{a.applicant.fullName || 'Unnamed applicant'}</p>
                      <p className="text-xs text-gray-500">{a.applicant.email || a.applicant.phone || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{a.fund.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">{a.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{new Date(a.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/bursary/applications/${a.id}`}
                        className="inline-flex items-center gap-1 text-amber-700 hover:text-amber-800 text-xs font-medium"
                      >
                        Review
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
