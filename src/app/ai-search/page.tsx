'use client'

import { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { runAISearch, type SearchIntent, type InstitutionMode } from '@/lib/aiSearch'
import { awardPoints } from '@/lib/api'
import AISearchBar from '@/components/AISearchBar'
import SearchModeToggle from '@/components/SearchModeToggle'
import InterestSelector from '@/components/InterestSelector'
import CareerPathway from '@/components/CareerPathway'
import ProgramCard from '@/components/ProgramCard'
import InstitutionCard from '@/components/InstitutionCard'
import { Sparkles, GraduationCap, Building2, MapPin, DollarSign, BarChart3 } from 'lucide-react'

// Feature flag: the University/Skills toggle only renders when this is 'true'
// in the environment (Vercel env var). Absent/false = page identical to before.
const SKILLS_TOGGLE_ENABLED = process.env.NEXT_PUBLIC_FEATURE_SKILLS_TOGGLE === 'true'

function AISearchContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') ?? ''
  const initialMode = searchParams.get('mode')

  const [countries, setCountries] = useState<{ id: string; name: string }[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])

  const [careerGoal, setCareerGoal] = useState<string | null>(null)

  const [countryId, setCountryId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [level, setLevel] = useState('')
  const [maxBudget, setMaxBudget] = useState<number | null>(null)
  const [institutionMode, setInstitutionMode] = useState<InstitutionMode | null>(
    SKILLS_TOGGLE_ENABLED && (initialMode === 'academic' || initialMode === 'skills') ? initialMode : null
  )

  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [intent, setIntent] = useState<SearchIntent | null>(null)
  const [programs, setPrograms] = useState<any[]>([])
  const [institutions, setInstitutions] = useState<any[]>([])

  useEffect(() => {
    async function loadReferenceData() {
      const [{ data: countryData }, { data: categoryData }] = await Promise.all([
        supabase.from('countries').select('id, name').eq('is_active', true).order('name'),
        supabase.from('program_categories').select('id, name').eq('is_active', true).order('name'),
      ])
      if (countryData) setCountries(countryData)
      if (categoryData) setCategories(categoryData)
    }
    loadReferenceData()
  }, [])

  // Auto-run search when arriving with a ?q= param (e.g. from the homepage
  // hero). No-op when absent, so direct visits to /ai-search are unaffected.
  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSearch(query: string) {
    setLoading(true)
    setHasSearched(true)
    setError(null)
    try {
      const result = await runAISearch(query, [], careerGoal, {
        countryId: countryId || null,
        categoryId: categoryId || null,
        level: level || null,
        maxBudget,
        institutionMode: SKILLS_TOGGLE_ENABLED ? institutionMode : null,
      })
      setIntent(result.intent)
      setPrograms(result.programs)
      setInstitutions(result.institutions)
      awardPoints('search').catch(() => {})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI search failed')
    } finally {
      setLoading(false)
    }
  }

  function handleCareerSelect(label: string) {
    setCareerGoal(label)
  }

  const searchPlaceholder =
    institutionMode === 'skills'
      ? 'Try: "plumbing course in Nairobi" or "welding certificate"'
      : institutionMode === 'academic'
        ? 'Try: "I want to study medicine in Kenya" or "MBA under $10,000"'
        : undefined

  return (
    <main className="min-h-screen py-16 px-4">
      <div className="max-w-6xl mx-auto text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm mb-6">
          <Sparkles className="w-4 h-4" />
          AI-Powered Education Discovery
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
          Tell us what you&apos;re looking for
        </h1>
        <p className="text-lg text-muted mb-10 max-w-2xl mx-auto">
          Describe it in your own words, pick your interests, or tell us your dream career - we&apos;ll match you to real programs.
        </p>

        {SKILLS_TOGGLE_ENABLED && (
          <div className="mb-6">
            <SearchModeToggle value={institutionMode} onChange={setInstitutionMode} />
          </div>
        )}

        <AISearchBar onSearch={handleSearch} loading={loading} placeholder={searchPlaceholder} initialQuery={initialQuery} />
      </div>

      <div className="max-w-4xl mx-auto mb-10">
        <InterestSelector />
      </div>

      <div className="max-w-4xl mx-auto mb-12">
        <CareerPathway onSelect={handleCareerSelect} />
      </div>

      <div className="max-w-4xl mx-auto mb-12">
        <p className="text-center text-xs text-muted uppercase tracking-wider mb-3">Smart filters</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <select
              value={countryId}
              onChange={(e) => setCountryId(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl bg-elimux-card border border-border text-muted text-sm focus:outline-none focus:border-primary-500 appearance-none cursor-pointer"
            >
              <option value="">All Countries</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl bg-elimux-card border border-border text-muted text-sm focus:outline-none focus:border-primary-500 appearance-none cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <BarChart3 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl bg-elimux-card border border-border text-muted text-sm focus:outline-none focus:border-primary-500 appearance-none cursor-pointer"
            >
              <option value="">Any Level</option>
              <option value="Certificate">Certificate</option>
              <option value="Diploma">Diploma</option>
              <option value="Bachelor's">Bachelor&apos;s</option>
              <option value="Master's">Master&apos;s</option>
              <option value="PhD">PhD</option>
            </select>
          </div>

          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <select
              value={maxBudget ?? ''}
              onChange={(e) => setMaxBudget(e.target.value ? parseInt(e.target.value, 10) : null)}
              className="pl-9 pr-4 py-2 rounded-xl bg-elimux-card border border-border text-muted text-sm focus:outline-none focus:border-primary-500 appearance-none cursor-pointer"
            >
              <option value="">Any Budget</option>
              <option value="1000">Under $1,000</option>
              <option value="5000">Under $5,000</option>
              <option value="10000">Under $10,000</option>
              <option value="20000">Under $20,000</option>
              <option value="50000">Under $50,000</option>
            </select>
          </div>
        </div>
      </div>

      {hasSearched && (
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted">Understanding your search...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-elimux-danger text-lg">{error}</p>
            </div>
          ) : (
            <>
              {intent && (
                <div className="mb-8 px-4 py-3 rounded-xl bg-elimux-card border border-border text-sm text-muted flex flex-wrap items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary-400 flex-shrink-0" />
                  <span>Understood as:</span>
                  {intent.category && <span className="px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400">{intent.category}</span>}
                  {intent.country && <span className="px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400">{intent.country}</span>}
                  {intent.level && <span className="px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400">{intent.level}</span>}
                  {intent.maxBudget && <span className="px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400">Under ${intent.maxBudget.toLocaleString()}</span>}
                  {intent.keywords.length > 0 && <span className="text-muted">&ldquo;{intent.keywords.join(', ')}&rdquo;</span>}
                </div>
              )}

              {programs.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <GraduationCap className="w-6 h-6 text-primary-400" />
                    Programs ({programs.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {programs.map((program) => (
                      <Link key={program.id} href={`/programs/${program.id}/`}>
                        <ProgramCard program={program} />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {institutions.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-primary-400" />
                    Institutions ({institutions.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {institutions.map((inst) => (
                      <Link key={inst.id} href={`/institutions/${inst.id}/`}>
                        <InstitutionCard institution={inst} />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {programs.length === 0 && institutions.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted text-lg">No results found. Try a different search or fewer filters.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </main>
  )
}

export default function AISearchPage() {
  return (
    <Suspense fallback={null}>
      <AISearchContent />
    </Suspense>
  )
}
