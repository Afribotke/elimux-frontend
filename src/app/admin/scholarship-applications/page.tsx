'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAdminKey } from '@/components/admin/AdminKeyContext'
import { listAdminScholarshipApplications, reviewScholarshipApplication, getAdminDocumentUrl } from '@/lib/api'
import type { AdminApplicationReview } from '@/lib/api'

export default function AdminScholarshipApplicationsPage() {
  const { adminKey } = useAdminKey()
  const [applications, setApplications] = useState<AdminApplicationReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [reviewing, setReviewing] = useState<Record<string, boolean>>({})
  const [reviewScore, setReviewScore] = useState<Record<string, string>>({})
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})
  const [docUrls, setDocUrls] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    if (!adminKey) return
    try {
      setLoading(true)
      setError('')
      const params: Record<string, string> = {}
      if (statusFilter) params.status = statusFilter
      const { data } = await listAdminScholarshipApplications(params, adminKey)
      setApplications(data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load applications')
    } finally {
      setLoading(false)
    }
  }, [adminKey, statusFilter])

  useEffect(() => {
    load()
  }, [load])

  const handleReview = async (id: string, status: string) => {
    if (!adminKey) return
    try {
      setReviewing(prev => ({ ...prev, [id]: true }))
      setError('')
      const score = reviewScore[id] ? parseInt(reviewScore[id]) : undefined
      const notes = reviewNotes[id] || undefined
      await reviewScholarshipApplication(id, { status, review_score: score, review_notes: notes }, adminKey)
      setReviewScore(prev => ({ ...prev, [id]: '' }))
      setReviewNotes(prev => ({ ...prev, [id]: '' }))
      await load()
    } catch (err: any) {
      setError(err.message || 'Review failed')
    } finally {
      setReviewing(prev => ({ ...prev, [id]: false }))
    }
  }

  const handleDocClick = async (appId: string, docName: string) => {
    if (!adminKey) return
    try {
      const { url } = await getAdminDocumentUrl(appId, docName, adminKey)
      setDocUrls(prev => ({ ...prev, [`${appId}-${docName}`]: url }))
      window.open(url, '_blank')
    } catch (err: any) {
      setError(err.message || 'Failed to get document URL')
    }
  }

  function statusBadge(status: string) {
    const map: Record<string, string> = {
      submitted: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      under_review: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      awarded: 'bg-green-500/20 text-green-300 border-green-500/30',
      rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
      draft: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
      withdrawn: 'bg-gray-500/20 text-gray-500 border-gray-500/30',
    }
    return map[status] || map.draft
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-elimux-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-elimux-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-elimux-dark">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Review Applications</h1>
            <p className="text-gray-400">Review and manage submitted scholarship applications</p>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-elimux-card border border-gray-700 text-white rounded-lg px-4 py-2 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="awarded">Awarded</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {applications.length === 0 ? (
          <div className="bg-elimux-card rounded-xl border border-gray-800 p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-xl font-semibold text-white mb-2">No applications to review</h2>
            <p className="text-gray-400">Applications will appear here once students submit them.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map(app => {
              const isExpanded = expandedId === app.id
              const deadline = app.scholarship?.application_deadline
                ? new Date(app.scholarship.application_deadline).toLocaleDateString()
                : 'Rolling'
              const student = app.student

              return (
                <div key={app.id} className="bg-elimux-card rounded-xl border border-gray-800 overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-lg font-semibold text-white truncate">
                            {app.scholarship?.title || 'Unknown Scholarship'}
                          </h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadge(app.status)}`}>
                            {app.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap">
                          <span className="text-white font-medium">
                            {student?.full_name || 'Unknown Student'}
                          </span>
                          <span>{student?.email || 'No email'}</span>
                          <span>{student?.university_name || 'No university'}</span>
                          <span>{student?.course_name}{student?.year_of_study ? `, Year ${student.year_of_study}` : ''}</span>
                          <span>{app.scholarship?.provider || 'Unknown provider'}</span>
                          <span>{app.scholarship?.amount ? `${app.scholarship.currency} ${app.scholarship.amount}` : 'Amount not specified'}</span>
                          <span>Deadline: {deadline}</span>
                          <span>{app.documents_uploaded?.length || 0} docs</span>
                          {app.ai_match_score !== null && app.ai_match_score !== undefined && (
                            <span className="text-emerald-400">Match: {app.ai_match_score}%</span>
                          )}
                          {app.review_score !== null && app.review_score !== undefined && (
                            <span className="text-yellow-400">Score: {app.review_score}/100</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : app.id)}
                        className="text-gray-400 hover:text-white text-sm font-medium shrink-0"
                      >
                        {isExpanded ? 'Collapse' : 'Review'}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-800 p-6 bg-gray-900/50">
                      {app.ai_guidance && (
                        <div className="mb-6 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                          <h4 className="font-semibold text-blue-300 mb-2">🤖 AI Guidance</h4>
                          <p className="text-blue-200 text-sm whitespace-pre-wrap">{app.ai_guidance}</p>
                        </div>
                      )}

                      {app.documents_uploaded?.length > 0 && (
                        <div className="mb-6">
                          <h4 className="font-semibold text-white mb-3">Uploaded Documents</h4>
                          <div className="space-y-2">
                            {app.documents_uploaded.map((doc, i) => (
                              <div key={i} className="bg-gray-800 rounded-lg p-3 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <span className="text-green-400">✓</span>
                                  <span className="text-gray-300">{doc.name}</span>
                                  <span className="text-xs text-gray-500">{new Date(doc.uploaded_at).toLocaleDateString()}</span>
                                </div>
                                <button
                                  onClick={() => handleDocClick(app.id, doc.name)}
                                  className="text-xs font-medium text-blue-400 hover:text-blue-300"
                                >
                                  {docUrls[`${app.id}-${doc.name}`] ? 'Open Again' : 'View Document'}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="bg-gray-800 rounded-lg p-4">
                        <h4 className="font-semibold text-white mb-3">Review Decision</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">Score (0–100)</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={reviewScore[app.id] || ''}
                              onChange={(e) => setReviewScore(prev => ({ ...prev, [app.id]: e.target.value }))}
                              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                              placeholder="Optional"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm text-gray-400 mb-1">Notes</label>
                            <input
                              type="text"
                              value={reviewNotes[app.id] || ''}
                              onChange={(e) => setReviewNotes(prev => ({ ...prev, [app.id]: e.target.value }))}
                              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                              placeholder="Optional review notes"
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { status: 'under_review', label: 'Mark Under Review', color: 'bg-purple-600/20 text-purple-300 border-purple-600/30 hover:bg-purple-600/30' },
                            { status: 'awarded', label: 'Award', color: 'bg-green-600/20 text-green-300 border-green-600/30 hover:bg-green-600/30' },
                            { status: 'rejected', label: 'Reject', color: 'bg-red-600/20 text-red-300 border-red-600/30 hover:bg-red-600/30' },
                          ].map(({ status, label, color }) => (
                            <button
                              key={status}
                              onClick={() => handleReview(app.id, status)}
                              disabled={reviewing[app.id]}
                              className={`px-4 py-2 border rounded-lg text-sm font-medium disabled:opacity-50 ${color}`}
                            >
                              {reviewing[app.id] ? 'Saving…' : label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
