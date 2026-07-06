'use client'

import { useState, useEffect } from 'react'
import { Bookmark, BookmarkCheck } from 'lucide-react'

interface FavoriteButtonProps {
  itemId: string
  itemType: 'program' | 'institution'
  onToggle?: (isFavorite: boolean) => void
}

export default function FavoriteButton({ itemId, itemType, onToggle }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const storageKey = `elimux-favorites-${itemType}`

  useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      const favorites = JSON.parse(stored)
      setIsFavorite(favorites.includes(itemId))
    }
  }, [itemId, storageKey])

  const toggleFavorite = () => {
    const stored = localStorage.getItem(storageKey)
    const favorites = stored ? JSON.parse(stored) : []

    let newFavorites
    if (isFavorite) {
      newFavorites = favorites.filter((id: string) => id !== itemId)
    } else {
      newFavorites = [...favorites, itemId]
    }

    localStorage.setItem(storageKey, JSON.stringify(newFavorites))
    setIsFavorite(!isFavorite)
    onToggle?.(!isFavorite)
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
