'use client'

import { useState, useRef } from 'react'
import { Search, Sparkles, X } from 'lucide-react'

interface AISearchBarProps {
  onSearch: (query: string) => void
  loading?: boolean
  placeholder?: string
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

export default function AISearchBar({ onSearch, loading, placeholder }: AISearchBarProps) {
  const [query, setQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

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
        <div className="bg-elimux-card/70 backdrop-blur-md rounded-2xl p-2 shadow-2xl border border-border">
          <div className="flex items-center gap-2 px-3">
            <Sparkles className="w-5 h-5 text-primary-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setShowSuggestions(e.target.value.length > 0)
              }}
              onFocus={() => setShowSuggestions(query.length > 0)}
              placeholder={placeholder ?? DEFAULT_PLACEHOLDER}
              className="flex-1 bg-transparent text-foreground placeholder-muted py-3 focus:outline-none text-lg min-w-0"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(''); setShowSuggestions(false) }}
                className="text-muted hover:text-foreground transition-colors flex-shrink-0"
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
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-elimux-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="p-3">
              <p className="text-xs text-muted uppercase tracking-wider mb-2">Try asking</p>
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => applySuggestion(suggestion)}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-muted hover:bg-muted/10 hover:text-foreground transition-colors flex items-center gap-2"
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
