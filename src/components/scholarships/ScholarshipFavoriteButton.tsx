'use client'

import { useState, useEffect } from 'react'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { favoriteScholarship, unfavoriteScholarship } from '@/lib/api'

interface ScholarshipFavoriteButtonProps {
  scholarshipId: string
}

const STORAGE_KEY = 'elimux-favorites-scholarship'

export default function ScholarshipFavoriteButton({ scholarshipId }: ScholarshipFavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) setIsFavorite(JSON.parse(stored).includes(scholarshipId))
  }, [scholarshipId])

  const toggleFavorite = async () => {
    const nextState = !isFavorite

    // Optimistic: localStorage flips immediately, same pattern as
    // FavoriteButton.tsx. No offline-queue integration here (unlike
    // FavoriteButton) - that infra is keyed to the generic
    // item_id/item_type shape in QueueableActionType's 'favorite' payload,
    // not scholarship_id, and scholarships don't need offline support yet.
    const stored = localStorage.getItem(STORAGE_KEY)
    const favorites = stored ? JSON.parse(stored) : []
    const updated = nextState ? [...favorites, scholarshipId] : favorites.filter((id: string) => id !== scholarshipId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    setIsFavorite(nextState)

    try {
      if (nextState) {
        await favoriteScholarship(scholarshipId)
      } else {
        await unfavoriteScholarship(scholarshipId)
      }
    } catch {
      // Local star already flipped; no error UI on this button to surface a
      // server-side failure to, same tradeoff as FavoriteButton.tsx.
    }
  }

  return (
    <button
      onClick={toggleFavorite}
      className={`p-2 rounded-full transition-all ${
        isFavorite
          ? 'bg-primary-500/20 text-primary-400 hover:bg-primary-500/30'
          : 'bg-elimux-card border border-border text-muted hover:bg-muted/10 hover:text-foreground'
      }`}
      title={isFavorite ? 'Remove from favorites' : 'Save this scholarship'}
    >
      {isFavorite ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
    </button>
  )
}
