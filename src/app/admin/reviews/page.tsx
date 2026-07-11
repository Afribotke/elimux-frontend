'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { listAdminReviews, updateReviewStatus, type AdminReview } from '@/lib/api'
import { useAdminKey } from '@/components/admin/AdminKeyContext'
import { ArrowLeft, MessageSquare, Star, CheckCircle2, XCircle } from 'lucide-react'

export default function AdminReviewsPage() {
  const { adminKey } = useAdminKey()
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const loadReviews = useCallback(async () => {
    if (!adminKey) return
    setLoading(true)
    setError(null)
    try {
      const { data } = await listAdminReviews(adminKey, 'pending')
      setReviews(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }, [adminKey])

  useEffect(() => {
    loadReviews()
  }, [loadReviews])

  async function handleDecision(id: string, status: 'approved' | 'rejected') {
    if (!adminKey) return
    setBusyId(id)
    try {
      await updateReviewStatus(id, status, adminKey)
      setReviews((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${status === 'approved' ? 'approve' : 'reject'} review`)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <main className="min-h-screen py-12 px-4 max-w-4xl mx-auto">
      <Link href="/admin" className="text-sm text-muted hover:text-foreground flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold text-foreground flex items-center gap-3 mb-2">
        <MessageSquare className="w-8 h-8 text-primary-400" />
        Pending Reviews
        {reviews.length > 0 && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400">
            {reviews.length}
          </span>
        )}
      </h1>
      <p className="text-muted mb-6">Reviews awaiting approval before they appear on the site.</p>

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
          No pending reviews.
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
                  </div>
                  <p className="text-xs text-muted">
                    {review.institution?.name || review.program?.name || '—'}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleDecision(review.id, 'approved')}
                    disabled={busyId === review.id}
                    className="px-3 py-1.5 min-h-[36px] rounded-lg bg-elimux-success/10 text-elimux-success text-xs font-medium disabled:opacity-50 flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => handleDecision(review.id, 'rejected')}
                    disabled={busyId === review.id}
                    className="px-3 py-1.5 min-h-[36px] rounded-lg bg-elimux-danger/10 text-elimux-danger text-xs font-medium disabled:opacity-50 flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
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
