'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getUserWithTimeout } from '@/lib/client-auth'
import { favoriteScholarship, unfavoriteScholarship, listScholarshipFavorites } from '@/lib/api'

interface ScholarshipFavoriteButtonProps {
  scholarshipId: string
}

export default function ScholarshipFavoriteButton({ scholarshipId }: ScholarshipFavoriteButtonProps) {
  const router = useRouter()
  const [isFavorite, setIsFavorite] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    checkStatus()
  }, [scholarshipId])

  async function checkStatus() {
    const { data } = await getUserWithTimeout()
    setLoggedIn(Boolean(data.user))
    if (!data.user) return

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    try {
      const { data: favorites } = await listScholarshipFavorites(session.access_token)
      setIsFavorite(favorites.some((f) => f.scholarship?.id === scholarshipId))
    } catch {
      // leave as not-favorited on failure
    }
  }

  async function toggleFavorite() {
    if (!loggedIn) {
      router.push(`/auth/login?redirect=/scholarships/${scholarshipId}`)
      return
    }

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push(`/auth/login?redirect=/scholarships/${scholarshipId}`)
      return
    }

    const nextState = !isFavorite
    setIsFavorite(nextState)
    setBusy(true)
    try {
      if (nextState) {
        await favoriteScholarship(scholarshipId, session.access_token)
      } else {
        await unfavoriteScholarship(scholarshipId, session.access_token)
      }
    } catch {
      setIsFavorite(!nextState)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={toggleFavorite}
      disabled={busy}
      className={`p-2 rounded-full transition-all disabled:opacity-50 ${
        isFavorite
          ? 'bg-primary-500/20 text-primary-400 hover:bg-primary-500/30'
          : 'bg-elimux-card border border-border text-muted hover:bg-muted/10 hover:text-foreground'
      }`}
      title={loggedIn ? (isFavorite ? 'Remove from favorites' : 'Save this scholarship') : 'Log in to save this scholarship'}
    >
      {isFavorite ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
    </button>
  )
}
