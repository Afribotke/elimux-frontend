'use client'

import { useState } from 'react'
import { X, Link2, Check, MessageCircle, Mail } from 'lucide-react'

interface ShareItem {
  name: string
  description: string | null
  url: string
  type: 'program' | 'institution'
}

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  item: ShareItem
}

export default function ShareModal({ isOpen, onClose, item }: ShareModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const shareText = `Check out ${item.name} on ElimuX`

  async function handleCopyLink() {
    await navigator.clipboard.writeText(item.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleWhatsApp() {
    const message = encodeURIComponent(`${shareText}\n${item.url}`)
    window.open(`https://wa.me/?text=${message}`, '_blank', 'noopener,noreferrer')
  }

  function handleEmail() {
    const subject = encodeURIComponent(shareText)
    const body = encodeURIComponent(`${shareText}\n\n${item.description || ''}\n\n${item.url}`)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-elimux-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-foreground">Share</h2>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-elimux-dark border border-border rounded-xl p-4 mb-5">
          <p className="text-xs text-muted uppercase tracking-wider mb-1">
            {item.type === 'program' ? 'Program' : 'Institution'}
          </p>
          <p className="font-semibold text-foreground mb-1">{item.name}</p>
          {item.description && (
            <p className="text-sm text-muted line-clamp-2">{item.description}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-elimux-dark border border-border text-foreground hover:border-primary-500/50 transition-all"
          >
            {copied ? (
              <Check className="w-5 h-5 text-success flex-shrink-0" />
            ) : (
              <Link2 className="w-5 h-5 text-primary-400 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{copied ? 'Link copied!' : 'Copy link'}</span>
          </button>

          <button
            onClick={handleWhatsApp}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-elimux-dark border border-border text-foreground hover:border-primary-500/50 transition-all"
          >
            <MessageCircle className="w-5 h-5 text-primary-400 flex-shrink-0" />
            <span className="text-sm font-medium">Share on WhatsApp</span>
          </button>

          <button
            onClick={handleEmail}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-elimux-dark border border-border text-foreground hover:border-primary-500/50 transition-all"
          >
            <Mail className="w-5 h-5 text-primary-400 flex-shrink-0" />
            <span className="text-sm font-medium">Share via Email</span>
          </button>
        </div>
      </div>
    </div>
  )
}
