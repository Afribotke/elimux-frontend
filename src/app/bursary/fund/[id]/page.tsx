'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getUserWithTimeout } from '@/lib/client-auth'
import { getBursaryFund, applyToBursary, getBursaryApplicantProfile, addBursaryBookmark, removeBursaryBookmark, getMyBursaryBookmarks } from '@/lib/api'
import type { BursaryFund } from '@/types/bursary'
import { ArrowLeft, Wallet, Calendar, Tag, UserCircle2, Heart } from 'lucide-react'

export default function BursaryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const fundId = params.id as string

  const [fund, setFund] = useState<BursaryFund | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loggedIn, setLoggedIn] = useState(false)
  const [profileComplete, setProfileComplete] = useState(false)
  const [applying, setApplying] = useState(false)
  const [applyError, setApplyError] = useState<string | null>(null)
  const [applySuccess, setApplySuccess] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [bookmarking, setBookmarking] = useState(false)

  useEffect(() => {
    fetchFund()
    checkAuth()
  }, [fundId])

  async function checkAuth() {
    const { data } = await getUserWithTimeout()
    setLoggedIn(Boolean(data.user))
    if (!data.user) return

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    try {
      const { profile } = await getBursaryApplicantProfile(session.access_token)
      setProfileComplete(Boolean(profile?.fullName))
    } catch {
      setProfileComplete(false)
    }
    try {
      const { bookmarks } = await getMyBursaryBookmarks(session.access_token)
      setBookmarked(bookmarks.some((b) => b.fund.id === fundId))
    } catch {
      // non-fatal
    }
  }

  async function toggleBookmark() {
    if (!loggedIn) {
      router.push(`/auth/login?redirect=/bursary/fund/${fundId}`)
      return
    }
    setBookmarking(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      if (bookmarked) {
        await removeBursaryBookmark(fundId, session.access_token)
        setBookmarked(false)
      } else {
        await addBursaryBookmark(fundId, session.access_token)
        setBookmarked(true)
      }
    } catch {
      // leave state unchanged on failure
    } finally {
      setBookmarking(false)
    }
  }

  async function fetchFund() {
    setLoading(true)
    setError(null)
    try {
      const data = await getBursaryFund(fundId)
      setFund(data.fund)
    } catch (err: any) {
      setError(err.message || 'Failed to load bursary details')
    } finally {
      setLoading(false)
    }
  }

  async function handleApply() {
    setApplying(true)
    setApplyError(null)
    setApplySuccess(false)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setApplyError('You need to log in to apply.')
        return
      }
      await applyToBursary(fundId, session.access_token)
      setApplySuccess(true)
    } catch (err: any) {
      setApplyError(err.message || 'Failed to submit application')
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-elimux-dark flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </main>
    )
  }

  if (error || !fund) {
    return (
      <main className="min-h-screen bg-elimux-dark flex justify-center items-center">
        <div className="text-center">
          <p className="text-red-400 text-lg">{error || 'Bursary not found'}</p>
          <Link href="/bursary" className="mt-4 inline-block text-primary-400 hover:text-primary-300 font-medium">
            ← Back to bursaries
          </Link>
        </div>
      </main>
    )
  }

  const isDeadlinePassed = fund.deadline ? new Date(fund.deadline) < new Date() : false
  const canApply = fund.status === 'open' && !isDeadlinePassed
  const requiredDocs: unknown[] = Array.isArray(fund.requiredDocuments) ? fund.requiredDocuments : []

  return (
    <main className="min-h-screen bg-elimux-dark">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/bursary" className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary-400 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to all bursaries
        </Link>

        <div className="bg-elimux-card border border-border rounded-xl p-8">
          <div className="border-b border-border pb-6 mb-6">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{fund.name}</h1>
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${
                    fund.status === 'open' && !isDeadlinePassed
                      ? 'bg-primary-500/10 text-primary-400'
                      : 'bg-elimux-dark text-muted'
                  }`}
                >
                  {isDeadlinePassed ? 'Closed' : fund.status === 'open' ? 'Open' : fund.status}
                </span>
              </div>
              <button
                onClick={toggleBookmark}
                disabled={bookmarking}
                aria-label={bookmarked ? 'Remove bookmark' : 'Save bursary'}
                className="p-2 rounded-full hover:bg-elimux-dark transition-colors shrink-0"
              >
                <Heart className={`w-5 h-5 ${bookmarked ? 'fill-primary-500 text-primary-500' : 'text-muted'}`} />
              </button>
            </div>
            {fund.providerName && <p className="text-primary-400 font-medium">{fund.providerName}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {fund.totalAmount ? (
              <div className="bg-elimux-dark border border-border rounded-lg p-4">
                <p className="text-sm text-primary-400 font-medium flex items-center gap-1">
                  <Wallet className="w-4 h-4" /> Award Amount
                </p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {fund.currency || 'KES'} {fund.totalAmount.toLocaleString()}
                </p>
              </div>
            ) : null}
            {fund.deadline && (
              <div className="bg-elimux-dark border border-border rounded-lg p-4">
                <p className={`text-sm font-medium flex items-center gap-1 ${isDeadlinePassed ? 'text-red-400' : 'text-amber-400'}`}>
                  <Calendar className="w-4 h-4" /> Application Deadline
                </p>
                <p className="text-lg font-semibold text-foreground mt-1">
                  {new Date(fund.deadline).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            )}
            {fund.fundType && (
              <div className="bg-elimux-dark border border-border rounded-lg p-4">
                <p className="text-sm text-purple-400 font-medium flex items-center gap-1">
                  <Tag className="w-4 h-4" /> Fund Type
                </p>
                <p className="text-lg font-semibold text-foreground mt-1 capitalize">{fund.fundType}</p>
              </div>
            )}
          </div>

          {fund.description && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-foreground mb-3">About this Bursary</h2>
              <p className="text-muted whitespace-pre-wrap">{fund.description}</p>
            </div>
          )}

          {fund.eligibilityRules && Object.keys(fund.eligibilityRules).length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-foreground mb-3">Eligibility Criteria</h2>
              <div className="bg-elimux-dark border border-border rounded-lg p-4">
                <pre className="text-muted text-sm whitespace-pre-wrap">{JSON.stringify(fund.eligibilityRules, null, 2)}</pre>
              </div>
            </div>
          )}

          {requiredDocs.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-foreground mb-3">Required Documents</h2>
              <div className="bg-elimux-dark border border-border rounded-lg p-4">
                <ul className="list-disc list-inside space-y-1">
                  {requiredDocs.map((doc, i) => (
                    <li key={i} className="text-muted text-sm">{String(doc)}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="border-t border-border pt-6">
            {applySuccess ? (
              <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4">
                <p className="text-primary-400 font-medium">Application submitted successfully!</p>
                <p className="text-muted text-sm mt-1">
                  You can track your application status in{' '}
                  <Link href="/bursary/my-applications" className="underline font-medium text-primary-400">
                    My Applications
                  </Link>
                  .
                </p>
              </div>
            ) : loggedIn && canApply && !profileComplete ? (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-center gap-3">
                <UserCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                <p className="text-amber-400 text-sm">
                  Complete your profile to apply —{' '}
                  <Link href={`/bursary/profile?redirect=/bursary/fund/${fundId}`} className="underline font-medium">
                    fill in your applicant profile
                  </Link>
                  .
                </p>
              </div>
            ) : (
              <>
                {applyError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
                    <p className="text-red-400">{applyError}</p>
                  </div>
                )}
                <button
                  onClick={handleApply}
                  disabled={!canApply || applying}
                  className={`w-full md:w-auto px-8 py-3 rounded-xl font-semibold text-white transition-colors ${
                    canApply ? 'bg-primary-500 hover:bg-primary-600 disabled:opacity-50' : 'bg-elimux-dark border border-border cursor-not-allowed text-muted'
                  }`}
                >
                  {applying ? 'Submitting...' : canApply ? 'Apply Now' : 'Applications Closed'}
                </button>
                {!loggedIn && canApply && (
                  <p className="text-sm text-muted mt-2">
                    You need to{' '}
                    <Link href={`/auth/login?redirect=/bursary/fund/${fundId}`} className="text-primary-400 hover:underline">
                      log in
                    </Link>{' '}
                    to apply.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
