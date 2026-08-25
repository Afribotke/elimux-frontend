'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { runAISearch, type SearchIntent, type InstitutionMode } from '@/lib/aiSearch'
import { awardPoints } from '@/lib/api'
import AISearchBar from '@/components/AISearchBar'
import InterestSelector from '@/components/InterestSelector'
import CareerPathway from '@/components/CareerPathway'
import ProgramCard from '@/components/ProgramCard'
import InstitutionCard from '@/components/InstitutionCard'
import { Footer } from '@/components/layout/Footer'
import { Sparkles, GraduationCap, Building2, MapPin, DollarSign, BarChart3 } from 'lucide-react'

// Cycle 030: same 6 categories/hrefs/colors as NewHomePage.tsx's own
// HERO_CATEGORIES - kept as a local copy rather than importing that
// module's internals, matching the exact precedent NewHomePage.tsx itself
// set when it copied UnifiedNavBar's PILLS locally for the same reason
// (see NewHomePage.tsx's own comment on this).
const HERO_CATEGORIES = [
  {
    label: 'Universities & College', icon: '🎓', href: '/programs?type=university',
    topBorder: 'border-t-blue-500', iconBg: 'bg-blue-500',
    glow: 'hover:shadow-[0_10px_40px_-4px_rgba(59,130,246,0.3)]', ring: 'focus-visible:ring-blue-400',
  },
  {
    label: 'Skills & Trades (TVET)', icon: '🔧', href: '/programs?type=tvet',
    topBorder: 'border-t-orange-500', iconBg: 'bg-orange-500',
    glow: 'hover:shadow-[0_10px_40px_-4px_rgba(249,115,22,0.3)]', ring: 'focus-visible:ring-orange-400',
  },
  {
    label: 'Scholarships', icon: '🏆', href: '/scholarships',
    topBorder: 'border-t-yellow-500', iconBg: 'bg-yellow-500',
    glow: 'hover:shadow-[0_10px_40px_-4px_rgba(234,179,8,0.3)]', ring: 'focus-visible:ring-yellow-400',
  },
  {
    label: 'Internship', icon: '💼', href: '/internships',
    topBorder: 'border-t-emerald-500', iconBg: 'bg-emerald-500',
    glow: 'hover:shadow-[0_10px_40px_-4px_rgba(16,185,129,0.3)]', ring: 'focus-visible:ring-emerald-400',
  },
  {
    label: 'Attachment', icon: '📎', href: '/attachments',
    topBorder: 'border-t-violet-500', iconBg: 'bg-violet-500',
    glow: 'hover:shadow-[0_10px_40px_-4px_rgba(139,92,246,0.3)]', ring: 'focus-visible:ring-violet-400',
  },
  {
    label: 'Bursary', icon: '💰', href: '/bursary',
    topBorder: 'border-t-rose-500', iconBg: 'bg-rose-500',
    glow: 'hover:shadow-[0_10px_40px_-4px_rgba(244,63,94,0.3)]', ring: 'focus-visible:ring-rose-400',
  },
]

// Feature flag: the University/Skills toggle only renders when this is 'true'
// in the environment (Vercel env var). Absent/false = page identical to before.
const SKILLS_TOGGLE_ENABLED = process.env.NEXT_PUBLIC_FEATURE_SKILLS_TOGGLE === 'true'

function AISearchContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') ?? ''
  const initialMode = searchParams.get('mode')

  const [countries, setCountries] = useState<{ id: string; name: string }[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])

  const [careerGoal, setCareerGoal] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

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
  const [resultCount, setResultCount] = useState<number | null>(null)

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

  async function handleSearch(query: string, careerGoalOverride?: string | null) {
    // Cancel a still-in-flight previous search before starting a new one -
    // without this, a slow first response could resolve after a faster
    // second one and overwrite fresher results with stale ones.
    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    setLoading(true)
    setHasSearched(true)
    setError(null)

    if (query.trim()) {
      router.push(`${pathname}?q=${encodeURIComponent(query)}`, { scroll: false })
    }

    try {
      const result = await runAISearch(
        query,
        [],
        careerGoalOverride !== undefined ? careerGoalOverride : careerGoal,
        {
          countryId: countryId || null,
          categoryId: categoryId || null,
          level: level || null,
          maxBudget,
          institutionMode: SKILLS_TOGGLE_ENABLED ? institutionMode : null,
        },
        controller.signal
      )
      setIntent(result.intent)
      setPrograms(result.programs)
      setInstitutions(result.institutions)
      setResultCount(result.programs.length + result.institutions.length)
      awardPoints('search').catch(() => {})
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return // superseded by a newer search
      setError(err instanceof Error ? err.message : 'AI search failed')
      setResultCount(null)
    } finally {
      // Only this call's own controller is still current if it wasn't the
      // one just aborted above by a newer search - otherwise clearing
      // loading here would incorrectly stop the newer search's spinner.
      if (abortControllerRef.current === controller) setLoading(false)
    }
  }

  function handleCareerSelect(label: string) {
    setCareerGoal(label)
    handleSearch('', label)
  }

  const searchPlaceholder =
    institutionMode === 'skills'
      ? 'Try: "plumbing course in Nairobi" or "welding certificate"'
      : institutionMode === 'academic'
        ? 'Try: "I want to study medicine in Kenya" or "MBA under $10,000"'
        : undefined

  return (
    <main className="min-h-screen">
      {/* Hero — matches NewHomePage.tsx's own hero gradient exactly
          (from-gray-900 via-slate-900 to-gray-950), not the instruction's
          restated "from-slate-950 via-slate-900 to-black" - checked the
          real homepage source rather than the instruction's paraphrase of
          it, since "match the current homepage aesthetic" means matching
          what the homepage actually ships, not a close approximation of
          it. Permanently dark, same deliberate pattern as the homepage
          hero (not theme-toggle-adaptive). */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950">
        <div
          className="pointer-events-none absolute left-1/2 top-24 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary-500/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative max-w-5xl mx-auto px-4 pt-14 pb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white text-center drop-shadow-lg text-balance max-w-3xl mx-auto">
            AI-Powered Education Search
          </h1>

          <p className="text-lg text-gray-300 text-center mt-4 mb-10 max-w-2xl mx-auto">
            Describe what you&apos;re looking for in your own words. Our AI matches you to universities, TVET institutes, scholarships, internships, attachments, and bursaries.
          </p>

          <AISearchBar onSearch={handleSearch} loading={loading} resultCount={resultCount} placeholder={searchPlaceholder} initialQuery={initialQuery} dark />

          {hasSearched && (
            <div className="mt-6 w-full max-w-4xl mx-auto text-left transition-all duration-300 ease-out animate-fade-in">
              {loading ? (
                <div className="text-center py-12 text-gray-400">
                  <div className="animate-spin inline-block w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mb-4" />
                  <p>Finding the best matches for you...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50">
                  <p className="text-orange-400 text-lg">{error}</p>
                </div>
              ) : programs.length === 0 && institutions.length === 0 ? (
                <div className="text-center py-12 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50">
                  <p className="text-xl text-white mb-2">No results found</p>
                  <p className="text-gray-400">Try adjusting your search or browse categories below</p>
                </div>
              ) : (
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                  {intent && (
                    <div className="mb-6 px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700 text-sm text-gray-300 flex flex-wrap items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary-400 flex-shrink-0" />
                      <span>Understood as:</span>
                      {intent.category && <span className="px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400">{intent.category}</span>}
                      {intent.country && <span className="px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400">{intent.country}</span>}
                      {intent.level && <span className="px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400">{intent.level}</span>}
                      {intent.maxBudget && <span className="px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400">Under ${intent.maxBudget.toLocaleString()}</span>}
                      {intent.keywords.length > 0 && <span className="text-gray-400">&ldquo;{intent.keywords.join(', ')}&rdquo;</span>}
                    </div>
                  )}

                  {programs.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-primary-400" />
                        Programs ({programs.length})
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary-400" />
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
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-4 max-w-[560px] mx-auto mt-8 mb-4">
            <div className="h-px bg-gray-700 flex-1" />
            <span className="text-sm text-gray-400 text-center shrink-0">Or browse by category</span>
            <div className="h-px bg-gray-700 flex-1" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-5 max-w-[560px] mx-auto">
            {HERO_CATEGORIES.map((cat) => (
              <a
                key={cat.href}
                href={cat.href}
                className={`flex flex-col items-center text-center bg-slate-800 border border-slate-700 hover:border-slate-500 border-t-4 ${cat.topBorder} rounded-2xl p-6 min-h-[160px] justify-center transition-all duration-300 hover:-translate-y-2 hover:bg-slate-700 ${cat.glow} focus-visible:outline-none focus-visible:ring-2 ${cat.ring} focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900`}
              >
                <div className={`w-14 h-14 rounded-full ${cat.iconBg} text-white flex items-center justify-center mx-auto mb-3`}>
                  <span className="text-2xl">{cat.icon}</span>
                </div>
                <span className="text-white font-semibold text-base">{cat.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="py-12 px-4">
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
              aria-label="Country"
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
              aria-label="Category"
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
              aria-label="Education Level"
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
              aria-label="Maximum Budget"
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

      </div>
    </main>
  )
}

export default function AISearchPage() {
  return (
    <>
      <Suspense fallback={null}>
        <AISearchContent />
      </Suspense>
      <Footer />
    </>
  )
}
