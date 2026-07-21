'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send } from 'lucide-react'
import type { InstitutionMode } from '@/lib/aiSearch'
import HeroModePill from './HeroModePill'

const EXAMPLE_CHIPS = [
  'Medicine in Kenya under KES 500k',
  'MBA with scholarship in Germany',
  'Online nursing from Africa',
  'Short tech course, 3 months online',
]

// The AI search results page does not present a ranked top-10 shortlist
// (plain result grids, no numbered/truncated ranking) — verified against
// src/app/ai-search/page.tsx before writing this copy. Using the truthful
// fallback headline per the spec's verify-first instruction.
const HEADLINE = 'Ask anything. Find your perfect course.'
const SUBCOPY =
  'Tell us in plain language what you want to study, where, and your budget. We find your best matches — ready to share.'

export default function HeroSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<InstitutionMode | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function submit() {
    const trimmed = query.trim()
    if (!trimmed) return
    const params = new URLSearchParams({ q: trimmed })
    if (mode) params.set('mode', mode)
    router.push(`/ai-search?${params.toString()}`)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    submit()
  }

  function applyChip(text: string) {
    setQuery(text)
    textareaRef.current?.focus()
  }

  return (
    <div className="w-full">
      <h1 className="skolex-serif text-4xl md:text-5xl text-center leading-tight" style={{ color: 'var(--skolex-navy)' }}>
        {HEADLINE}
      </h1>
      <p className="skolex-sans text-center text-base md:text-lg mt-4 max-w-xl mx-auto" style={{ color: 'var(--skolex-t2)' }}>
        {SUBCOPY}
      </p>

      <div className="flex justify-center mt-6">
        <HeroModePill value={mode} onChange={setMode} />
      </div>

      <form onSubmit={handleSubmit} className="mt-6 max-w-2xl mx-auto">
        <div
          className="flex items-end gap-2 p-2 rounded-2xl"
          style={{ background: 'var(--skolex-white)', boxShadow: 'var(--skolex-shadow-lg)', border: '1px solid var(--skolex-g2)' }}
        >
          <textarea
            ref={textareaRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
            rows={2}
            placeholder='e.g. "I want to study medicine in Kenya"'
            className="skolex-sans flex-1 bg-transparent resize-none py-2 px-3 focus:outline-none text-base"
            style={{ color: 'var(--skolex-text)' }}
          />
          <button
            type="submit"
            aria-label="Search"
            className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-shadow"
            style={{ background: 'var(--skolex-navy)', color: 'var(--skolex-white)' }}
            onFocus={(e) => (e.currentTarget.style.boxShadow = '0 0 0 3px rgba(200,151,58,.4)')}
            onBlur={(e) => (e.currentTarget.style.boxShadow = 'none')}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
        {EXAMPLE_CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => applyChip(chip)}
            className="skolex-sans text-sm px-3 py-1.5 rounded-full transition-colors"
            style={{ background: 'var(--skolex-g1)', border: '1px solid var(--skolex-g2)', color: 'var(--skolex-t2)' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--skolex-gold)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--skolex-g2)')}
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  )
}
