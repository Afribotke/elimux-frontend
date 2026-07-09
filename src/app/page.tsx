'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import SearchBar from '@/components/SearchBar'
import ProgramCard from '@/components/ProgramCard'
import InstitutionCard from '@/components/InstitutionCard'
import { GraduationCap, Building2, Globe, Sparkles, TrendingUp, Award, ArrowRight } from 'lucide-react'

interface StatCounts {
  programs: number
  institutions: number
  countries: number
  categories: number
}

export default function HomePage() {
  const [countries, setCountries] = useState<{ id: string; name: string; iso_code: string }[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string; icon: string | null }[]>([])
  const [programs, setPrograms] = useState<any[]>([])
  const [institutions, setInstitutions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [statCounts, setStatCounts] = useState<StatCounts | null>(null)

  useEffect(() => {
    async function loadReferenceData() {
      const { data: countriesData } = await supabase
        .from('countries')
        .select('id, name, iso_code')
        .eq('is_active', true)
        .order('name')

      const { data: categoriesData } = await supabase
        .from('program_categories')
        .select('id, name, icon')
        .eq('is_active', true)
        .order('name')

      if (countriesData) setCountries(countriesData)
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

  async function handleSearch(query: string, countryId: string, categoryId: string) {
    setLoading(true)
    setHasSearched(true)

    try {
      let programsQuery = supabase
        .from('programs')
        .select('*, institution:institutions!inner(name, city, country:countries(name)), category:program_categories(name, color, icon)')
        .eq('is_active', true)

      if (query) programsQuery = programsQuery.ilike('name', `%${query}%`)
      if (countryId) programsQuery = programsQuery.eq('institution.country_id', countryId)
      if (categoryId) programsQuery = programsQuery.eq('category_id', categoryId)

      const { data: programsData } = await programsQuery.limit(12)

      let institutionsQuery = supabase
        .from('institutions')
        .select('*, type:institution_types(name, icon), country:countries(name, flag_emoji)')
        .eq('is_active', true)

      if (query) institutionsQuery = institutionsQuery.ilike('name', `%${query}%`)
      if (countryId) institutionsQuery = institutionsQuery.eq('country_id', countryId)

      const { data: institutionsData } = await institutionsQuery.limit(6)

      setPrograms(programsData || [])
      setInstitutions(institutionsData || [])
    } catch (error) {
      console.error('Search error:', error)
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
          <SearchBar onSearch={handleSearch} countries={countries} categories={categories} />

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

      {hasSearched && (
        <section className='py-12 px-4 max-w-6xl mx-auto'>
          {loading ? (
            <div className='text-center py-12'>
              <div className='animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4' />
              <p className='text-muted'>Searching...</p>
            </div>
          ) : (
            <>
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
                        <InstitutionCard institution={inst} />
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
        <section className='py-12 px-4 max-w-6xl mx-auto'>
          <h2 className='text-2xl font-bold text-foreground mb-6 flex items-center gap-2'>
            <TrendingUp className='w-6 h-6 text-primary-400' />
            Browse by Category
          </h2>
          <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4'>
            {categories.slice(0, 10).map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleSearch('', '', cat.id)}
                className='p-4 rounded-xl bg-elimux-card border border-border hover:border-primary-500/50 transition-all text-left'
              >
                <p className='text-sm font-medium text-foreground'>{cat.name}</p>
                <p className='text-xs text-muted mt-1'>Click to explore</p>
              </button>
            ))}
          </div>
        </section>
      )}

      <footer className='py-8 px-4 border-t border-border bg-elimux-dark'>
        <div className='max-w-6xl mx-auto text-center'>
          <p className='text-muted text-sm mb-2'>&copy; 2026 ElimuX. Discover global education opportunities.</p>
          <Link href='/institution-onboarding' className='text-sm text-primary-400 hover:text-primary-300 transition-colors'>
            Are you an institution? List your programs on ElimuX
          </Link>
        </div>
      </footer>
    </main>
  )
}
