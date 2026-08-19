'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAdminKey } from '@/components/admin/AdminKeyContext'
import {
  fetchAdminBursaryApplication,
  approveAdminBursaryApplication,
  rejectAdminBursaryApplication,
  type AdminBursaryApplicationDetail,
} from '@/lib/api'
import { ArrowLeft, CheckCircle2, XCircle, FileText } from 'lucide-react'

export default function AdminBursaryApplicationDetailPage() {
  const { adminKey } = useAdminKey()
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [application, setApplication] = useState<AdminBursaryApplicationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [acting, setActing] = useState(false)

  const load = useCallback(async () => {
    if (!adminKey) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetchAdminBursaryApplication(params.id, adminKey)
      setApplication(res.application)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load application')
    } finally {
      setLoading(false)
    }
  }, [adminKey, params.id])

  useEffect(() => {
    load()
  }, [load])

  async function handleApprove() {
    if (!adminKey || !confirm('Approve this application?')) return
    setActing(true)
    try {
      await approveAdminBursaryApplication(params.id, adminKey)
      toast.success('Application approved')
      router.push('/admin/bursary/applications')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve')
    } finally {
      setActing(false)
    }
  }

  async function handleReject() {
    if (!adminKey) return
    const reason = prompt('Reason for rejecting this application?')
    if (reason === null) return
    setActing(true)
    try {
      await rejectAdminBursaryApplication(params.id, adminKey, reason || undefined)
      toast.success('Application rejected')
      router.push('/admin/bursary/applications')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject')
    } finally {
      setActing(false)
    }
  }

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto text-center py-20">
        <div className="animate-spin w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full mx-auto" />
      </main>
    )
  }

  if (error || !application) {
    return (
      <main className="max-w-4xl mx-auto">
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error || 'Application not found'}</div>
      </main>
    )
  }

  const personal = (application.applicant.personal_info as Record<string, unknown>) || {}
  const academic = (application.applicant.academic_info as Record<string, unknown>) || {}
  const fund = application.fund as Record<string, unknown>

  return (
    <main className="max-w-4xl mx-auto">
      <Link href="/admin/bursary/applications" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" />
        Back to Applications
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{(personal.full_name as string) || 'Unnamed applicant'}</h1>
          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
            {application.status}
          </span>
        </div>
        {application.status === 'submitted' && (
          <div className="flex gap-2">
            <button
              onClick={handleApprove}
              disabled={acting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve
            </button>
            <button
              onClick={handleReject}
              disabled={acting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Applicant</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-gray-400">Email</dt>
              <dd className="text-gray-700">{(personal.email as string) || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Phone</dt>
              <dd className="text-gray-700">{(personal.phone as string) || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Institution</dt>
              <dd className="text-gray-700">{(academic.institution as string) || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Course</dt>
              <dd className="text-gray-700">{(academic.course as string) || '—'}</dd>
            </div>
          </dl>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Fund</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-gray-400">Name</dt>
              <dd className="text-gray-700">{(fund.name as string) || '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Type</dt>
              <dd className="text-gray-700 capitalize">{(fund.fund_type as string) || '—'}</dd>
            </div>
          </dl>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-5 sm:col-span-2">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-400" />
            Documents
          </h2>
          {application.documents.length === 0 ? (
            <p className="text-sm text-gray-400">No documents uploaded.</p>
          ) : (
            <ul className="space-y-2">
              {application.documents.map((d) => (
                <li key={d.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 capitalize">{d.type.replace(/_/g, ' ')}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">{d.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
