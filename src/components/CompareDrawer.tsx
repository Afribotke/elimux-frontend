'use client'

import { useEffect, useState } from 'react'
import { X, Scale, Share2, Star, Award } from 'lucide-react'
import { useCompareSelection, MAX_COMPARE } from './CompareProvider'
import ShareResultsModal from './ShareResultsModal'
import { supabase } from '@/lib/supabase'

export interface CompareProgram {
  id: string
  name: string
  duration_months: number | null
  tuition_fees: number | null
  currency: string | null
  level: string | null
  mode: string | null
  institution?: { id?: string; name: string; city?: string | null; country?: { name: string } | null } | null
  category?: { name: string } | null
}

interface CompareDrawerProps {
  // The currently-loaded program list on the page (e.g. the Explore Programs
  // grid). The drawer resolves the selected IDs against this list rather than
  // fetching separately, since the calling page already has the data in memory.
  programs: CompareProgram[]
}

interface EnrichedStats {
  rating: number | null
  reviewCount: number
  hasScholarships: boolean
}

export default function CompareDrawer({ programs }: CompareDrawerProps) {
  const { selectedIds, remove, clear } = useCompareSelection()
  const [expanded, setExpanded] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [stats, setStats] = useState<Record<string, EnrichedStats>>({})

  const selected = selectedIds
    .map((id) => programs.find((p) => p.id === id))
    .filter((p): p is CompareProgram => Boolean(p))

  const selectedKey = selected.map((p) => p.id).join(',')

  useEffect(() => {
    if (!expanded || selected.length === 0) return
    let cancelled = false

    async function loadStats() {
      const programIds = selected.map((p) => p.id)
      const institutionIds = Array.from(new Set(selected.map((p) => p.institution?.id).filter(Boolean))) as string[]

      const [{ data: ratings }, { data: scholarships }] = await Promise.all([
        supabase.from('program_ratings').select('program_id, avg_rating, review_count').in('program_id', programIds),
        institutionIds.length
          ? supabase.from('scholarships').select('institution_id').eq('status', 'active').in('institution_id', institutionIds)
          : Promise.resolve({ data: [] as { institution_id: string }[] }),
      ])

      if (cancelled) return

      const ratingByProgram = new Map((ratings || []).map((r: any) => [r.program_id, r]))
      const institutionsWithScholarships = new Set((scholarships || []).map((s: any) => s.institution_id))

      const next: Record<string, EnrichedStats> = {}
      for (const program of selected) {
        const rating = ratingByProgram.get(program.id)
        next[program.id] = {
          rating: rating?.avg_rating ?? null,
          reviewCount: rating?.review_count ?? 0,
          hasScholarships: program.institution?.id ? institutionsWithScholarships.has(program.institution.id) : false,
        }
      }
      setStats(next)
    }

    loadStats()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, selectedKey])

  if (selectedIds.length === 0) return null

  const rows: { label: string; render: (p: CompareProgram) => React.ReactNode }[] = [
    { label: 'Institution', render: (p) => p.institution?.name || '-' },
    { label: 'Category', render: (p) => p.category?.name || '-' },
    {
      label: 'Tuition',
      render: (p) => (p.tuition_fees ? `${p.currency || 'USD'} ${p.tuition_fees.toLocaleString()}` : '-'),
    },
    { label: 'Duration', render: (p) => (p.duration_months ? `${p.duration_months} months` : '-') },
    { label: 'Level', render: (p) => p.level || '-' },
    { label: 'Mode', render: (p) => p.mode || '-' },
    {
      label: 'Location',
      render: (p) => [p.institution?.city, p.institution?.country?.name].filter(Boolean).join(', ') || '-',
    },
    {
      label: 'Rating',
      render: (p) => {
        const s = stats[p.id]
        if (!s || s.rating === null) return '-'
        return (
          <span className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-elimux-warning fill-elimux-warning" />
            {s.rating.toFixed(1)} ({s.reviewCount})
          </span>
        )
      },
    },
    {
      label: 'Scholarships',
      render: (p) => {
        const s = stats[p.id]
        if (!s) return '-'
        return s.hasScholarships ? (
          <span className="flex items-center gap-1 text-elimux-success">
            <Award className="w-3.5 h-3.5" /> Available
          </span>
        ) : (
          <span className="text-muted">None found</span>
        )
      },
    },
  ]

  return (
    <>
      {/* Bottom selection bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-elimux-card/95 backdrop-blur-sm shadow-2xl">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <Scale className="w-5 h-5 text-primary-400 flex-shrink-0" />
          <span className="text-sm text-muted flex-shrink-0">
            {selectedIds.length}/{MAX_COMPARE} selected
          </span>

          <div className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto">
            {selected.map((p) => (
              <span
                key={p.id}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-elimux-dark border border-border text-xs text-foreground whitespace-nowrap flex-shrink-0"
              >
                {p.name}
                <button onClick={() => remove(p.id)} aria-label={`Remove ${p.name} from comparison`}>
                  <X className="w-3 h-3 text-muted hover:text-foreground" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={clear}
              className="px-3 py-2 rounded-lg text-xs text-muted hover:text-foreground transition-colors"
            >
              Clear
            </button>
            <button
              onClick={() => setExpanded(true)}
              disabled={selectedIds.length < 2}
              className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              Compare
            </button>
          </div>
        </div>
      </div>

      {/* Comparison table modal */}
      {expanded && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-elimux-card border border-border rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 pb-4 sticky top-0 bg-elimux-card border-b border-border">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary-400" />
                Compare Programs
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShareOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-muted hover:text-foreground hover:border-primary-500/50 text-sm transition-all"
                >
                  <Share2 className="w-4 h-4" /> Share
                </button>
                <button onClick={() => setExpanded(false)} className="text-muted hover:text-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto p-6 pt-4">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr>
                    <th className="text-left text-muted font-medium py-2 pr-4 w-32">&nbsp;</th>
                    {selected.map((p) => (
                      <th key={p.id} className="text-left text-foreground font-semibold py-2 px-4 min-w-[160px]">
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((row) => (
                    <tr key={row.label}>
                      <td className="text-muted py-3 pr-4 font-medium">{row.label}</td>
                      {selected.map((p) => (
                        <td key={p.id} className="text-foreground py-3 px-4">
                          {row.render(p)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <ShareResultsModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        programs={selected}
        query={`Comparing ${selected.length} programs`}
      />
    </>
  )
}
