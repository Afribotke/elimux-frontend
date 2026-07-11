'use client'

import { useState, useEffect } from 'react'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { addFavorite, removeFavorite } from '@/lib/api'
import { useBackgroundSync } from '@/hooks/useBackgroundSync'

interface FavoriteButtonProps {
  itemId: string
  itemType: 'program' | 'institution'
  onToggle?: (isFavorite: boolean) => void
}

export default function FavoriteButton({ itemId, itemType, onToggle }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const storageKey = `elimux-favorites-${itemType}`
  const { queueAction } = useBackgroundSync()

  useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      const favorites = JSON.parse(stored)
      setIsFavorite(favorites.includes(itemId))
    }
  }, [itemId, storageKey])

  const toggleFavorite = async () => {
    const nextState = !isFavorite

    // localStorage stays the instant, always-available source of truth for
    // "is this starred" - the backend call (and its offline queue fallback)
    // is what makes that state durable server-side across devices/sessions,
    // but the button itself never waits on it.
    const stored = localStorage.getItem(storageKey)
    const favorites = stored ? JSON.parse(stored) : []
    const newFavorites = nextState ? [...favorites, itemId] : favorites.filter((id: string) => id !== itemId)
    localStorage.setItem(storageKey, JSON.stringify(newFavorites))
    setIsFavorite(nextState)
    onToggle?.(nextState)

    try {
      if (!navigator.onLine) throw new TypeError('offline')
      if (nextState) {
        await addFavorite(itemId, itemType)
      } else {
        await removeFavorite(itemId, itemType)
      }
    } catch (err) {
      if (!navigator.onLine || err instanceof TypeError) {
        queueAction('favorite', { item_id: itemId, item_type: itemType, action: nextState ? 'add' : 'remove' }).catch(() => {})
      }
      // A real server rejection (not a network failure) is silently dropped
      // here - the local star already flipped and there's no error UI on
      // this button to surface it to. Acceptable for a low-stakes bookmark
      // toggle; revisit if that turns out to matter in practice.
    }
  }

  return (
    <button
      onClick={toggleFavorite}
      className={`p-2 rounded-full transition-all ${
        isFavorite
          ? 'bg-primary-500/20 text-primary-400 hover:bg-primary-500/30'
          : 'bg-elimux-card text-muted hover:bg-muted/10 hover:text-foreground'
      }`}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      {isFavorite ? (
        <BookmarkCheck className="w-5 h-5" />
      ) : (
        <Bookmark className="w-5 h-5" />
      )}
    </button>
  )
}
