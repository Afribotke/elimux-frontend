'use client'

import { useState } from 'react'
import { X, Link2, Check, MessageCircle, Mail, FileDown, Loader2 } from 'lucide-react'
import { createSharedSearch, type SharedProgramSnapshot } from '@/lib/api'
import { trackEvent } from '@/lib/analytics'

export interface ShareableProgram {
  id: string
  name: string
  duration_months?: number | null
  tuition_fees?: number | null
  currency?: string | null
  institution?: { name: string; city?: string | null; country?: { name: string } | null } | null
}

interface ShareResultsModalProps {
  isOpen: boolean
  onClose: () => void
  programs: ShareableProgram[]
  query?: string
}

// Shares a set of programs (a search's top picks, or a comparison) as one
// link - distinct from ShareModal.tsx, which shares a single program or
// institution's own page URL. Keeping this as a separate component avoids
// overwriting ShareModal.tsx, which DetailActions.tsx already relies on for
// single-item sharing on program/institution detail pages.
export default function ShareResultsModal({ isOpen, onClose, programs, query }: ShareResultsModalProps) {
  const [copied, setCopied] = useState(false)
  const [creating, setCreating] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const summaryText = query
    ? `I found ${programs.length} programs for "${query}" on ElimuX! Here are my top picks:`
    : `Check out these ${programs.length} programs I'm comparing on ElimuX:`

  async function ensureShareLink(): Promise<string | null> {
    if (shareUrl) return shareUrl
    setCreating(true)
    setError(null)
    try {
      const res = await createSharedSearch({ program_ids: programs.map((p) => p.id), query })
      setShareUrl(res.shareUrl)
      return res.shareUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create share link')
      return null
    } finally {
      setCreating(false)
    }
  }

  async function handleCopyLink() {
    const url = await ensureShareLink()
    if (!url) return
    await navigator.clipboard.writeText(url)
    setCopied(true)
    trackEvent('share', { platform: 'copy_link', url, item_type: 'search_results' })
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleWhatsApp() {
    const url = await ensureShareLink()
    if (!url) return
    trackEvent('share', { platform: 'whatsapp', url, item_type: 'search_results' })
    window.open(`https://wa.me/?text=${encodeURIComponent(`${summaryText}\n${url}`)}`, '_blank', 'noopener,noreferrer')
  }

  async function handleEmail() {
    const url = await ensureShareLink()
    if (!url) return
    trackEvent('share', { platform: 'email', url, item_type: 'search_results' })
    const subject = encodeURIComponent('Programs I found on ElimuX')
    const body = encodeURIComponent(`${summaryText}\n\n${url}`)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  function handleDownloadPdf() {
    trackEvent('share', { platform: 'pdf', item_type: 'search_results' })
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const rows = programs
      .map(
        (p) => `
        <tr>
          <td>${escapeHtml(p.name)}</td>
          <td>${escapeHtml(p.institution?.name || '-')}</td>
          <td>${escapeHtml([p.institution?.city, p.institution?.country?.name].filter(Boolean).join(', ') || '-')}</td>
          <td>${p.duration_months ? `${p.duration_months} months` : '-'}</td>
          <td>${p.tuition_fees ? `${p.currency || 'USD'} ${p.tuition_fees.toLocaleString()}` : '-'}</td>
        </tr>`
      )
      .join('')

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>ElimuX Program Report</title>
          <style>
            body { font-family: -apple-system, Segoe UI, Arial, sans-serif; color: #111; padding: 32px; }
            h1 { font-size: 20px; margin-bottom: 4px; }
            p.meta { color: #555; margin-top: 0; margin-bottom: 24px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #ddd; font-size: 13px; }
            th { background: #f5f5f5; }
          </style>
        </head>
        <body>
          <h1>ElimuX Program Report</h1>
          <p class="meta">${escapeHtml(summaryText)}</p>
          <table>
            <thead><tr><th>Program</th><th>Institution</th><th>Location</th><th>Duration</th><th>Tuition</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-elimux-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-foreground">Share Results</h2>
          <button onClick={onClose} className="text-muted hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-elimux-dark border border-border rounded-xl p-4 mb-5">
          <p className="text-sm text-foreground">{summaryText}</p>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-elimux-danger/10 border border-elimux-danger/30 text-elimux-danger text-xs">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <button
            onClick={handleCopyLink}
            disabled={creating}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-elimux-dark border border-border text-foreground hover:border-primary-500/50 transition-all disabled:opacity-50"
          >
            {creating ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary-400 flex-shrink-0" />
            ) : copied ? (
              <Check className="w-5 h-5 text-elimux-success flex-shrink-0" />
            ) : (
              <Link2 className="w-5 h-5 text-primary-400 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{copied ? 'Link copied!' : 'Copy link'}</span>
          </button>

          <button
            onClick={handleWhatsApp}
            disabled={creating}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-elimux-dark border border-border text-foreground hover:border-primary-500/50 transition-all disabled:opacity-50"
          >
            <MessageCircle className="w-5 h-5 text-primary-400 flex-shrink-0" />
            <span className="text-sm font-medium">Share on WhatsApp</span>
          </button>

          <button
            onClick={handleEmail}
            disabled={creating}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-elimux-dark border border-border text-foreground hover:border-primary-500/50 transition-all disabled:opacity-50"
          >
            <Mail className="w-5 h-5 text-primary-400 flex-shrink-0" />
            <span className="text-sm font-medium">Share via Email</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-elimux-dark border border-border text-foreground hover:border-primary-500/50 transition-all"
          >
            <FileDown className="w-5 h-5 text-primary-400 flex-shrink-0" />
            <span className="text-sm font-medium">Download PDF report</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)
}

// Re-exported so callers building the `programs` prop from API data don't
// need to import SharedProgramSnapshot separately.
export type { SharedProgramSnapshot }
