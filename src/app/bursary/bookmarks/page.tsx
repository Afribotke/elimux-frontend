'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getUserWithTimeout } from '@/lib/client-auth'
import { getMyBursaryBookmarks, removeBursaryBookmark } from '@/lib/api'
import type { BursaryBookmark } from '@/types/bursary'
import { Building2, Wallet, Calendar, ArrowRight, Heart } from 'lucide-react'

export default function BursaryBookmarksPage() {
  const router = useRouter()
  const [bookmarks, setBookmarks] = useState<BursaryBookmark[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAuthAndLoad()
  }, [])

  async function checkAuthAndLoad() {
    const { data } = await getUserWithTimeout()
    if (!data.user) {
      router.push('/auth/login?redirect=/bursary/bookmarks')
      return
    }
    fetchBookmarks()
  }

  async function fetchBookmarks() {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login?redirect=/bursary/bookmarks')
        return
      }
      const { bookmarks } = await getMyBursaryBookmarks(session.access_token)
      setBookmarks(bookmarks)
    } catch (err: any) {
      setError(err.message || 'Failed to load saved bursaries')
    } finally {
      setLoading(false)
    }
  }

  async function handleUnbookmark(fundId: string) {
    setBookmarks((prev) => prev.filter((b) => b.fund.id !== fundId))
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      await removeBursaryBookmark(fundId, session.access_token)
    } catch {
      fetchBookmarks()
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
            <h1 className="text-2xl font-bold text-foreground">My Saved Bursaries</h1>
            <p className="text-muted mt-1">Bursaries you've bookmarked for later.</p>
          </div>
          <Link href="/bursary" className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium">
            Browse Bursaries
          </Link>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-red-400">{error}</div>}

        {bookmarks.length === 0 ? (
          <div className="bg-elimux-card border border-border rounded-xl p-12 text-center">
            <p className="text-muted text-lg">You haven't saved any bursaries yet.</p>
            <Link href="/bursary" className="mt-4 inline-block text-primary-400 hover:text-primary-300 font-medium">
              Browse available bursaries →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookmarks.map(({ fund, bookmarkId }) => (
              <div key={bookmarkId} className="bg-elimux-card border border-border rounded-xl p-6">
                <div className="flex items-start justify-between gap-4">
                  <Link href={`/bursary/fund/${fund.id}`} className="flex-1 min-w-0 group">
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary-400 transition-colors">{fund.name}</h3>
                    <p className="text-muted text-sm line-clamp-2 mt-1 mb-3">{fund.description || 'No description available.'}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-muted">
                      {fund.providerName && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          {fund.providerName}
                        </span>
                      )}
                      {fund.totalAmount ? (
                        <span className="flex items-center gap-1">
                          <Wallet className="w-4 h-4" />
                          {fund.currency || 'KES'} {fund.totalAmount.toLocaleString()}
                        </span>
                      ) : null}
                      {fund.deadline && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Deadline: {new Date(fund.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleUnbookmark(fund.id)}
                      aria-label="Remove bookmark"
                      className="p-2 rounded-full hover:bg-elimux-dark transition-colors"
                    >
                      <Heart className="w-5 h-5 fill-primary-500 text-primary-500" />
                    </button>
                    <Link href={`/bursary/fund/${fund.id}`}>
                      <ArrowRight className="w-5 h-5 text-muted" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
