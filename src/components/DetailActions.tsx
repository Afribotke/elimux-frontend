'use client'

import { useState } from 'react'
import { Share2 } from 'lucide-react'
import FavoriteButton from './FavoriteButton'
import ShareModal from './ShareModal'

interface DetailActionsProps {
  itemId: string
  itemType: 'program' | 'institution'
  name: string
  description: string | null
}

export default function DetailActions({ itemId, itemType, name, description }: DetailActionsProps) {
  const [shareOpen, setShareOpen] = useState(false)

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setShareOpen(true)}
        className="p-2 rounded-full bg-elimux-card border border-border text-muted hover:bg-muted/10 hover:text-foreground transition-all"
        title="Share"
      >
        <Share2 className="w-5 h-5" />
      </button>
      <FavoriteButton itemId={itemId} itemType={itemType} />

      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        item={{
          name,
          description,
          url: typeof window !== 'undefined' ? window.location.href : '',
          type: itemType,
        }}
      />
    </div>
  )
}
