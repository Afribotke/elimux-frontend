'use client'

import FavoriteButton from './FavoriteButton'
import { ShareButton } from './share'

interface DetailActionsProps {
  itemId: string
  itemType: 'program' | 'institution'
  name: string
  description: string | null
}

export default function DetailActions({ itemId, itemType, name, description }: DetailActionsProps) {
  const path = itemType === 'program' ? 'programs' : 'institutions'

  return (
    <div className="flex items-center gap-2">
      <ShareButton
        shareData={{
          title: name,
          description: description || `Check out ${name} on ElimuX.`,
          url: `https://www.elimux.ke/${path}/${itemId}`,
        }}
        variant="icon-only"
        contentType={itemType}
        contentId={itemId}
        className="!p-2 !rounded-full !bg-elimux-card !border !border-border !text-muted hover:!bg-muted/10 hover:!text-foreground"
      />
      <FavoriteButton itemId={itemId} itemType={itemType} />
    </div>
  )
}
