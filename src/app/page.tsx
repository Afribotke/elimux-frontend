'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import AISearchBar from '@/components/AISearchBar'
import { runAISearch } from '@/lib/aiSearch'
import ProgramCard from '@/components/ProgramCard'
import InstitutionCard from '@/components/InstitutionCard'
import FeaturedInstitutionCard from '@/components/FeaturedInstitutionCard'
import SponsorAdBanner from '@/components/SponsorAdBanner'
import TrustBar from '@/components/home/TrustBar'
import HowItWorks from '@/components/home/HowItWorks'
import FeatureShowcase from '@/components/home/FeatureShowcase'
import PricingTeaser from '@/components/home/PricingTeaser'
import FAQSection from '@/components/home/FAQSection'
import FinalCTA from '@/components/home/FinalCTA'
import { GraduationCap, Building2, Globe, Sparkles, TrendingUp, Award, ArrowRight } from 'lucide-react'
import SkolexHome from '@/components/skolex/SkolexHome'

const EXAMPLE_SEARCHES = ['Computer Science in Kenya', 'Business Administration', 'Engineering']

interface StatCounts {
  programs: number
  institutions: number
  countries: number
  categories: number
}

// Preview-only hero port (ELIMUX_STATE.md §11, Skolex Harvest P1). Unset/false
// in production => CurrentHome renders exactly as before, byte-for-byte.
const SKOLEX_HOME = process.env.NEXT_PUBLIC_FEATURE_SKOLEX_HOME === 'true'

export default function HomePage() {
  if (SKOLEX_HOME) return <SkolexHome />
  return <CurrentHome />
}

function CurrentHome() {
  const [categories, setCategories] = useState<{ id: string; name: string; icon: string | null }[]>([])
  const [programs, setPrograms] = useState<any[]>([])
  const [institutions, setInstitutions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [statCounts, setStatCounts] = useState<StatCounts | null>(null)

  useEffect(() => {
    async function loadReferenceData() {
      const { data: categoriesData } = await supabase
        .from('program_categories')
        .select('id, name, icon')
        .eq('is_active', true)
        .order('name')

      if (categoriesData) setCategories(categoriesData)
    }

    async function loadStats() {
      const [programsRes, institutionsRes, countriesRes, categoriesRes] = await Promise.all([
        supabase.from('programs').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('institutions').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('countries').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('program_categories').select('*', { count: 'exact', head: true }).eq('is_active', true),
      ])

      setStatCounts({
        programs: programsRes.count ?? 0,
        institutions: institutionsRes.count ?? 0,
        countries: countriesRes.count ?? 0,
        categories: categoriesRes.count ?? 0,
      })
    }

    loadReferenceData()
    loadStats()
  }, [])

  async function handleSearch(query: string, options?: { categoryId?: string }) {
    setLoading(true)
    setHasSearched(true)

    try {
      const result = await runAISearch(query, [], null, { categoryId: options?.categoryId || null })
      setPrograms(result.programs)
      setInstitutions(result.institutions)
    } catch (error) {
      console.error('Search error:', error)
      setPrograms([])
      setInstitutions([])
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    { icon: Globe, label: 'Countries', value: statCounts ? statCounts.countries.toLocaleString() : '…' },
    { icon: Building2, label: 'Institutions', value: statCounts ? statCounts.institutions.toLocaleString() : '…' },
    { icon: GraduationCap, label: 'Programs', value: statCounts ? statCounts.programs.toLocaleString() : '…' },
    { icon: Award, label: 'Categories', value: statCounts ? statCounts.categories.toLocaleString() : '…' },
  ]

  return (
    <main className='min-h-screen'>
      <section className='relative py-20 px-4 bg-gradient-to-b from-elimux-dark to-elimux-card'>
        <div className='max-w-6xl mx-auto text-center'>
          <div className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm mb-6'>
            <Sparkles className='w-4 h-4' />
            AI-Powered Education Discovery
          </div>
          <h1 className='text-4xl md:text-6xl font-bold text-foreground mb-4 leading-tight'>
            Discover Your Perfect{' '}
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600'>
              Education
            </span>
          </h1>
          <p className='text-lg md:text-xl text-muted mb-10 max-w-2xl mx-auto'>
            Find universities, colleges, TVET institutes, and programs worldwide.
          </p>
          <AISearchBar onSearch={handleSearch} loading={loading} />

          <div className='flex flex-wrap items-center justify-center gap-2 mt-4 text-sm'>
            <span className='text-muted'>Try:</span>
            {EXAMPLE_SEARCHES.map((example) => (
              <button
                key={example}
                onClick={() => handleSearch(example)}
                className='px-3 py-1 rounded-full bg-elimux-card border border-border text-muted hover:text-primary-400 hover:border-primary-500/50 transition-colors'
              >
                {example}
              </button>
            ))}
          </div>

          <div className='flex flex-col sm:flex-row items-center justify-center gap-4 mt-6'>
            <Link
              href='/programs'
              className='inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors'
            >
              <GraduationCap className='w-4 h-4' />
              Explore Programs
            </Link>
            <Link
              href='/ai-search'
              className='inline-flex items-center gap-2 text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors'
            >
              <Sparkles className='w-4 h-4' />
              Or describe what you want in your own words with AI Search
              <ArrowRight className='w-4 h-4' />
            </Link>
          </div>
        </div>
      </section>

      <TrustBar />

      <section className='py-12 px-4 bg-elimux-dark border-y border-border'>
        <div className='max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6'>
          {stats.map((stat, index) => (
            <div key={index} className='text-center'>
              <stat.icon className='w-8 h-8 text-primary-400 mx-auto mb-2' />
              <p className='text-2xl font-bold text-foreground'>{stat.value}</p>
              <p className='text-sm text-muted'>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className='py-8 px-4 max-w-6xl mx-auto'>
        <SponsorAdBanner placement='homepage' />
      </section>

      {hasSearched && (
        <section className='py-12 px-4 max-w-6xl mx-auto'>
          {loading ? (
            <div className='text-center py-12'>
              <div className='animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4' />
              <p className='text-muted'>Searching...</p>
            </div>
          ) : (
            <>
              <div className='mb-8'>
                <SponsorAdBanner placement='search' />
              </div>
              {programs.length > 0 && (
                <div className='mb-12'>
                  <h2 className='text-2xl font-bold text-foreground mb-6 flex items-center gap-2'>
                    <GraduationCap className='w-6 h-6 text-primary-400' />
                    Programs ({programs.length})
                  </h2>
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
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
                  <h2 className='text-2xl font-bold text-foreground mb-6 flex items-center gap-2'>
                    <Building2 className='w-6 h-6 text-primary-400' />
                    Institutions ({institutions.length})
                  </h2>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {institutions.map((inst) => (
                      <Link key={inst.id} href={`/institutions/${inst.id}/`}>
                        {inst.is_featured ? (
                          <FeaturedInstitutionCard institution={inst} />
                        ) : (
                          <InstitutionCard institution={inst} />
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {programs.length === 0 && institutions.length === 0 && (
                <div className='text-center py-12'>
                  <p className='text-muted text-lg'>No results found. Try a different search.</p>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {!hasSearched && (
        <>
          <HowItWorks />
          <FeatureShowcase />

          <section className='py-12 px-4 max-w-6xl mx-auto'>
            <h2 className='text-2xl font-bold text-foreground mb-6 flex items-center gap-2'>
              <TrendingUp className='w-6 h-6 text-primary-400' />
              Browse by Category
            </h2>
            <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4'>
              {categories.slice(0, 10).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleSearch('', { categoryId: cat.id })}
                  className='p-4 rounded-xl bg-elimux-card border border-border hover:border-primary-500/50 transition-all text-left'
                >
                  <p className='text-sm font-medium text-foreground'>{cat.name}</p>
                  <p className='text-xs text-muted mt-1'>Click to explore</p>
                </button>
              ))}
            </div>
          </section>

          <PricingTeaser />
          <FAQSection />
          <FinalCTA />
        </>
      )}

    </main>
  )
}
