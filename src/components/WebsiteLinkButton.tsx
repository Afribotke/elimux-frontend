'use client'

import { Globe } from 'lucide-react'

interface WebsiteLinkButtonProps {
  url: string
  className?: string
}

// Renders as a span, not <a>, because this sits inside a card that is
// itself wrapped in a Next.js <Link> (an <a>) — nested anchors are invalid
// HTML and cause a hydration mismatch once the browser silently repairs them.
export default function WebsiteLinkButton({ url, className }: WebsiteLinkButtonProps) {
  const open = () => window.open(url, '_blank', 'noopener,noreferrer')

  return (
    <span
      role="link"
      tabIndex={0}
      className={className}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        open()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          e.stopPropagation()
          open()
        }
      }}
    >
      <Globe className="w-4 h-4" />
      Website
    </span>
  )
}
