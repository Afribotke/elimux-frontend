'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { listAdminReviews, updateReviewStatus, deleteReview, type AdminReview } from '@/lib/api'
import { useAdminKey } from '@/components/admin/AdminKeyContext'
import { downloadCsv } from '@/lib/csv'
import { ArrowLeft, MessageSquare, Star, CheckCircle2, XCircle, Trash2, Download } from 'lucide-react'

type TabStatus = 'all' | 'pending' | 'approved' | 'rejected'

const TABS: { value: TabStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

export default function AdminReviewsPage() {
  const { adminKey } = useAdminKey()
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [tab, setTab] = useState<TabStatus>('pending')

  const loadReviews = useCallback(async () => {
    if (!adminKey) return
    setLoading(true)
    setError(null)
    try {
      if (tab === 'all') {
        const [pending, approved, rejected] = await Promise.all([
          listAdminReviews(adminKey, 'pending'),
          listAdminReviews(adminKey, 'approved'),
          listAdminReviews(adminKey, 'rejected'),
        ])
        const merged = [...pending.data, ...approved.data, ...rejected.data].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        setReviews(merged)
      } else {
        const { data } = await listAdminReviews(adminKey, tab)
        setReviews(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }, [adminKey, tab])

  useEffect(() => {
    loadReviews()
  }, [loadReviews])

  function exportCsv() {
    downloadCsv(
      `reviews-${tab}`,
      ['Date', 'Reviewer', 'Rating', 'Status', 'Institution', 'Program', 'Title', 'Content'],
      reviews.map((r) => [
        new Date(r.created_at).toISOString(),
        r.is_anonymous ? 'Anonymous' : r.reviewer_name || 'Anonymous',
        r.rating,
        r.status,
        r.institution?.name || '',
        r.program?.name || '',
        r.title || '',
        r.content,
      ])
    )
  }

  async function handleDecision(id: string, status: 'approved' | 'rejected') {
    if (!adminKey) return
    setBusyId(id)
    try {
      await updateReviewStatus(id, status, adminKey)
      setReviews((prev) =>
        tab === 'all' ? prev.map((r) => (r.id === id ? { ...r, status } : r)) : prev.filter((r) => r.id !== id)
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${status === 'approved' ? 'approve' : 'reject'} review`)
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(id: string) {
    if (!adminKey) return
    if (!window.confirm('Permanently delete this review?')) return
    setBusyId(id)
    try {
      await deleteReview(id, adminKey)
      setReviews((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete review')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <main className="min-h-screen py-12 px-4 max-w-4xl mx-auto">
      <Link href="/admin" className="text-sm text-muted hover:text-foreground flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="flex items-center justify-between mb-2 flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-primary-400" />
          Reviews
          {reviews.length > 0 && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400">
              {reviews.length}
            </span>
          )}
        </h1>
        <button
          onClick={exportCsv}
          disabled={reviews.length === 0}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted hover:text-foreground hover:bg-muted/10 disabled:opacity-50"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>
      <p className="text-muted mb-4">Reviews awaiting approval before they appear on the site.</p>

      <div className="flex items-center gap-1 mb-6 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.value
                ? 'border-primary-400 text-primary-400'
                : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 px-4 py-2 rounded-lg bg-elimux-danger/10 border border-elimux-danger/30 text-elimux-danger text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted">Loading reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-muted text-sm bg-elimux-card rounded-xl p-4 border border-border">
          {tab === 'all' ? 'No reviews found.' : `No ${tab} reviews found.`}
        </p>
      ) : (
        <div className="bg-elimux-card border border-border rounded-xl divide-y divide-border">
          {reviews.map((review) => (
            <div key={review.id} className="p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground">
                      {review.is_anonymous ? 'Anonymous' : review.reviewer_name || 'Anonymous'}
                    </p>
                    <span className="flex items-center gap-0.5 text-elimux-warning">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-elimux-warning' : 'fill-none'}`}
                        />
                      ))}
                    </span>
                    {tab === 'all' && (
                      <span
                        className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full ${
                          review.status === 'approved'
                            ? 'bg-elimux-success/10 text-elimux-success'
                            : review.status === 'rejected'
                              ? 'bg-elimux-danger/10 text-elimux-danger'
                              : 'bg-elimux-warning/10 text-elimux-warning'
                        }`}
                      >
                        {review.status}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted">
                    {review.institution?.name || review.program?.name || '—'}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {review.status !== 'approved' && (
                    <button
                      onClick={() => handleDecision(review.id, 'approved')}
                      disabled={busyId === review.id}
                      className="px-3 py-1.5 min-h-[36px] rounded-lg bg-elimux-success/10 text-elimux-success text-xs font-medium disabled:opacity-50 flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </button>
                  )}
                  {review.status !== 'rejected' && (
                    <button
                      onClick={() => handleDecision(review.id, 'rejected')}
                      disabled={busyId === review.id}
                      className="px-3 py-1.5 min-h-[36px] rounded-lg bg-elimux-danger/10 text-elimux-danger text-xs font-medium disabled:opacity-50 flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(review.id)}
                    disabled={busyId === review.id}
                    className="px-3 py-1.5 min-h-[36px] rounded-lg bg-elimux-danger/10 text-elimux-danger text-xs font-medium disabled:opacity-50 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>

              {review.title && <p className="text-sm font-medium text-foreground mt-2">{review.title}</p>}
              <p className="text-sm text-muted mt-1">{review.content}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
