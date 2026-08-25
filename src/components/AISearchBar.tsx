'use client'

import { useState, useRef } from 'react'
import { Search, Sparkles, X } from 'lucide-react'

interface AISearchBarProps {
  onSearch: (query: string) => void
  // Fires when the query goes back to empty - either the X button or deleting
  // all input text. Lets the parent drop its stale result state (resultCount,
  // result lists, the ?q= URL param) instead of leaving "N Results" showing
  // for an input that no longer has a query behind it.
  onClear?: () => void
  loading?: boolean
  // Total result count from the last completed search. Undefined/null (the
  // default) means "no search has completed yet" and the button just reads
  // "Search" - callers that never pass this (e.g. the homepage) are
  // unaffected. 0 is a valid, distinct value and renders as "0 Results".
  resultCount?: number | null
  placeholder?: string
  initialQuery?: string
  // Opt-in hardcoded-dark styling for permanently-dark hero sections (e.g.
  // /ai-search's Cycle 030 redesign), matching the homepage hero's own
  // bg-slate-800/80 + border-slate-600 treatment. Defaults to false so the
  // other consumer (the legacy SKOLEX_HOME=false fallback in
  // src/app/page.tsx) keeps its existing theme-adaptive styling unchanged.
  dark?: boolean
}

const DEFAULT_PLACEHOLDER = 'Ask anything... e.g., "I want to study medicine in Kenya"'

const SUGGESTIONS = [
  'I want to study medicine in Kenya',
  'Computer science programs under $5000',
  'Best universities for business in Africa',
  'TVET courses in electrical engineering',
  'Nursing programs with low fees',
  'How to become a software engineer',
  'Data science masters in South Africa',
  'Affordable MBA programs',
]

export default function AISearchBar({ onSearch, onClear, loading, resultCount, placeholder, initialQuery, dark }: AISearchBarProps) {
  const [query, setQuery] = useState(initialQuery ?? '')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const buttonLabel = loading
    ? 'Searching...'
    : resultCount !== undefined && resultCount !== null
      ? `${resultCount} Result${resultCount !== 1 ? 's' : ''}`
      : 'Search'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    onSearch(query)
    setShowSuggestions(false)
  }

  function applySuggestion(suggestion: string) {
    setQuery(suggestion)
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const filteredSuggestions = SUGGESTIONS.filter(
    (s) => query.length < 3 || s.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className={dark
          ? "bg-slate-800/80 backdrop-blur-md rounded-2xl p-2 shadow-2xl border border-slate-600"
          : "bg-elimux-card/70 backdrop-blur-md rounded-2xl p-2 shadow-2xl border border-border"
        }>
          <div className="flex items-center gap-2 px-3">
            <Sparkles className="w-5 h-5 text-primary-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                const val = e.target.value
                setQuery(val)
                setShowSuggestions(val.length > 0)
                if (val.trim() === '') onClear?.()
              }}
              onFocus={() => setShowSuggestions(query.length > 0)}
              placeholder={placeholder ?? DEFAULT_PLACEHOLDER}
              className={dark
                ? "flex-1 bg-transparent text-white placeholder-gray-400 py-3 focus:outline-none text-lg min-w-0"
                : "flex-1 bg-transparent text-foreground placeholder-muted py-3 focus:outline-none text-lg min-w-0"
              }
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(''); setShowSuggestions(false); onClear?.() }}
                className={dark
                  ? "text-gray-400 hover:text-white transition-colors flex-shrink-0"
                  : "text-muted hover:text-foreground transition-colors flex-shrink-0"
                }
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold transition-colors shadow-lg flex items-center gap-2 flex-shrink-0 disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              {buttonLabel}
            </button>
          </div>
        </div>

        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className={dark
            ? "absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-600 rounded-xl shadow-2xl z-50 overflow-hidden"
            : "absolute top-full left-0 right-0 mt-2 bg-elimux-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
          }>
            <div className="p-3">
              <p className={dark ? "text-xs text-gray-400 uppercase tracking-wider mb-2" : "text-xs text-muted uppercase tracking-wider mb-2"}>Try asking</p>
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => applySuggestion(suggestion)}
                  className={dark
                    ? "w-full text-left px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                    : "w-full text-left px-3 py-2 rounded-lg text-sm text-muted hover:bg-muted/10 hover:text-foreground transition-colors flex items-center gap-2"
                  }
                >
                  <Search className="w-3.5 h-3.5 flex-shrink-0" />
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
