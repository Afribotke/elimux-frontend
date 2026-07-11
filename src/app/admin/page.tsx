'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { checkApiHealth, createInstitution, createProgram, getAnalyticsOverview, getAnalyticsSearches, type AnalyticsOverview, type SearchTrendPoint } from '@/lib/api'
import { useAdminKey } from '@/components/admin/AdminKeyContext'
import InstitutionForm, { type InstitutionFormData } from '@/components/InstitutionForm'
import ProgramForm, { type ProgramFormData } from '@/components/ProgramForm'
import AdminApplications from '@/components/admin/AdminApplications'
import StatCard from '@/components/admin/StatCard'
import LineChart from '@/components/admin/charts/LineChart'
import { LayoutDashboard, Users, Building2, GraduationCap, MessageSquare, TrendingUp, Shield, Server, CheckCircle2, Settings2, Star, ShieldQuestion, DollarSign, Search, FileCheck2 } from 'lucide-react'

interface RecentReview {
  id: string
  title: string | null
  rating: number
  reviewer_name: string | null
  is_verified: boolean
  created_at: string
  program: { name: string } | null
  institution: { name: string } | null
}

interface TopProgram {
  id: string
  name: string
  review_count: number
  avg_rating: number
}

export default function AdminPage() {
  const [stats, setStats] = useState({
    countries: 0,
    institutions: 0,
    programs: 0,
    reviews: 0,
    messages: 0,
    institutionTypes: 0,
    categories: 0,
  })
  const [loading, setLoading] = useState(true)
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  const { adminKey } = useAdminKey()
  const [showInstitutionForm, setShowInstitutionForm] = useState(false)
  const [showProgramForm, setShowProgramForm] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [institutionTypes, setInstitutionTypes] = useState<{ id: string; name: string }[]>([])
  const [countries, setCountries] = useState<{ id: string; name: string }[]>([])
  const [institutionsList, setInstitutionsList] = useState<{ id: string; name: string }[]>([])
  const [programCategories, setProgramCategories] = useState<{ id: string; name: string }[]>([])

  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [topPrograms, setTopPrograms] = useState<TopProgram[]>([])
  const [topProgramsLoading, setTopProgramsLoading] = useState(true)

  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null)
  const [searchTrend, setSearchTrend] = useState<SearchTrendPoint[]>([])
  const [analyticsLoading, setAnalyticsLoading] = useState(true)

  useEffect(() => {
    checkApiHealth().then(({ ok }) => setApiStatus(ok ? 'online' : 'offline'))
  }, [])

  useEffect(() => {
    async function loadReferenceData() {
      const [{ data: types }, { data: countryList }, { data: instList }, { data: catList }] = await Promise.all([
        supabase.from('institution_types').select('id, name').order('name'),
        supabase.from('countries').select('id, name').eq('is_active', true).order('name'),
        supabase.from('institutions').select('id, name').eq('is_active', true).order('name'),
        supabase.from('program_categories').select('id, name').eq('is_active', true).order('name'),
      ])

      if (types) setInstitutionTypes(types)
      if (countryList) setCountries(countryList)
      if (instList) setInstitutionsList(instList)
      if (catList) setProgramCategories(catList)
    }

    loadReferenceData()
  }, [])

  async function loadStats() {
    const [
      { count: countries },
      { count: institutions },
      { count: programs },
      { count: reviews },
      { count: messages },
      { count: institutionTypes },
      { count: categories },
    ] = await Promise.all([
      supabase.from('countries').select('*', { count: 'exact', head: true }),
      supabase.from('institutions').select('*', { count: 'exact', head: true }),
      supabase.from('programs').select('*', { count: 'exact', head: true }),
      supabase.from('reviews').select('*', { count: 'exact', head: true }),
      supabase.from('contact_messages').select('*', { count: 'exact', head: true }),
      supabase.from('institution_types').select('*', { count: 'exact', head: true }),
      supabase.from('program_categories').select('*', { count: 'exact', head: true }),
    ])

    setStats({
      countries: countries || 0,
      institutions: institutions || 0,
      programs: programs || 0,
      reviews: reviews || 0,
      messages: messages || 0,
      institutionTypes: institutionTypes || 0,
      categories: categories || 0,
    })
    setLoading(false)
  }

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    if (!adminKey) return
    async function loadAnalytics() {
      setAnalyticsLoading(true)
      try {
        const [overviewRes, searchesRes] = await Promise.all([getAnalyticsOverview(adminKey), getAnalyticsSearches(adminKey)])
        setAnalytics(overviewRes.data)
        setSearchTrend(searchesRes.data.trend)
      } catch {
        setAnalytics(null)
      } finally {
        setAnalyticsLoading(false)
      }
    }
    loadAnalytics()
  }, [adminKey])

  useEffect(() => {
    async function loadRecentReviews() {
      const { data } = await supabase
        .from('reviews')
        .select('id, title, rating, reviewer_name, is_verified, created_at, program:programs(name), institution:institutions(name)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5)
      if (data) setRecentReviews(data as unknown as RecentReview[])
      setReviewsLoading(false)
    }
    loadRecentReviews()
  }, [])

  useEffect(() => {
    // program_ratings is a view (no FK), so top program names need a second lookup query.
    async function loadTopPrograms() {
      const { data: ratings } = await supabase
        .from('program_ratings')
        .select('program_id, review_count, avg_rating')
        .order('review_count', { ascending: false })
        .limit(5)

      if (!ratings || ratings.length === 0) {
        setTopProgramsLoading(false)
        return
      }

      const ids = ratings.map((r) => r.program_id)
      const { data: programs } = await supabase.from('programs').select('id, name').in('id', ids)
      const nameById = new Map((programs || []).map((p) => [p.id, p.name]))

      setTopPrograms(
        ratings.map((r) => ({
          id: r.program_id,
          name: nameById.get(r.program_id) || 'Unknown program',
          review_count: r.review_count,
          avg_rating: r.avg_rating,
        }))
      )
      setTopProgramsLoading(false)
    }
    loadTopPrograms()
  }, [])

  function flashSuccess(message: string) {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(null), 4000)
  }

  async function handleAddInstitution(data: InstitutionFormData) {
    await createInstitution(data, adminKey)
    setShowInstitutionForm(false)
    flashSuccess('Institution added successfully.')
    await loadStats()
    const { data: instList } = await supabase.from('institutions').select('id, name').eq('is_active', true).order('name')
    if (instList) setInstitutionsList(instList)
  }

  async function handleAddProgram(data: ProgramFormData) {
    await createProgram(data, adminKey)
    setShowProgramForm(false)
    flashSuccess('Program added successfully.')
    await loadStats()
  }

  const statCards = [
    { icon: Shield, label: 'Countries', value: stats.countries, color: 'text-primary-400' },
    { icon: Building2, label: 'Institutions', value: stats.institutions, color: 'text-elimux-success' },
    { icon: GraduationCap, label: 'Programs', value: stats.programs, color: 'text-elimux-warning' },
    { icon: Users, label: 'Reviews', value: stats.reviews, color: 'text-primary-400' },
    { icon: MessageSquare, label: 'Messages', value: stats.messages, color: 'text-elimux-danger' },
    { icon: TrendingUp, label: 'Inst. Types', value: stats.institutionTypes, color: 'text-elimux-success' },
    { icon: LayoutDashboard, label: 'Categories', value: stats.categories, color: 'text-elimux-warning' },
  ]

  return (
    <main className='min-h-screen py-12 px-4 max-w-6xl mx-auto'>
      <h1 className='text-3xl font-bold text-foreground mb-2 flex items-center gap-3'>
        <LayoutDashboard className='w-8 h-8 text-primary-400' />
        Admin Dashboard
      </h1>
      <p className='text-muted mb-2'>Overview of your ElimuX platform data</p>
      <div className='flex items-center gap-2 mb-4 text-sm'>
        <Server className='w-4 h-4 text-muted' />
        <span className='text-muted'>Backend API:</span>
        {apiStatus === 'checking' && <span className='text-muted'>Checking...</span>}
        {apiStatus === 'online' && <span className='text-elimux-success flex items-center gap-1'><span className='w-2 h-2 rounded-full bg-elimux-success inline-block' />Connected</span>}
        {apiStatus === 'offline' && <span className='text-elimux-danger flex items-center gap-1'><span className='w-2 h-2 rounded-full bg-elimux-danger inline-block' />Offline</span>}
      </div>

      {successMessage && (
        <div className='mb-6 px-4 py-2 rounded-lg bg-elimux-success/10 border border-elimux-success/30 text-elimux-success text-sm flex items-center gap-2'>
          <CheckCircle2 className='w-4 h-4' />
          {successMessage}
        </div>
      )}

      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-xl font-bold text-foreground'>Platform Analytics</h2>
        <div className='flex gap-3 text-sm'>
          <Link href='/admin/revenue' className='text-primary-400 hover:text-primary-300'>Revenue</Link>
          <Link href='/admin/users' className='text-primary-400 hover:text-primary-300'>Users</Link>
          <Link href='/admin/searches' className='text-primary-400 hover:text-primary-300'>Searches</Link>
          <Link href='/admin/institutions-performance' className='text-primary-400 hover:text-primary-300'>Institutions</Link>
        </div>
      </div>

      {analyticsLoading ? (
        <div className='text-center py-8 mb-12'>
          <div className='animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto' />
        </div>
      ) : !analytics ? (
        <p className='text-sm text-muted bg-elimux-card rounded-xl p-4 border border-border mb-12'>Failed to load analytics.</p>
      ) : (
        <>
          <div className='grid grid-cols-2 md:grid-cols-5 gap-4 mb-6'>
            <StatCard icon={Users} label='Users (device IDs)' value={analytics.total_users.toLocaleString()} />
            <StatCard icon={DollarSign} label='Revenue (KES)' value={analytics.total_revenue_kes.toLocaleString()} color='text-elimux-success' />
            <StatCard icon={Search} label='Searches (month)' value={analytics.total_searches.month.toLocaleString()} color='text-elimux-warning' />
            <StatCard icon={Star} label='Reviews' value={analytics.total_reviews.toLocaleString()} />
            <StatCard icon={FileCheck2} label='Applications' value={analytics.total_applications.total.toLocaleString()} color='text-elimux-success' />
          </div>

          <div className='bg-elimux-card rounded-xl p-5 border border-border mb-12'>
            <h3 className='text-sm font-medium text-foreground mb-4'>Search activity (last 30 days)</h3>
            <LineChart data={searchTrend.map((t) => ({ date: t.date, value: t.count }))} label='searches per day' />
          </div>
        </>
      )}

      {loading ? (
        <div className='text-center py-12'>
          <div className='animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4' />
          <p className='text-muted'>Loading stats...</p>
        </div>
      ) : (
        <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-12'>
          {statCards.map((stat, index) => (
            <div key={index} className='bg-elimux-card rounded-xl p-4 border border-border text-center'>
              <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
              <p className='text-2xl font-bold text-foreground'>{stat.value}</p>
              <p className='text-xs text-muted'>{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className='mb-12'>
        <AdminApplications />
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12'>
        {/* Recent Reviews (pending moderation) */}
        <div>
          <h2 className='text-xl font-bold text-foreground mb-4 flex items-center gap-2'>
            <ShieldQuestion className='w-5 h-5 text-primary-400' />
            Recent Reviews
          </h2>
          {reviewsLoading ? (
            <div className='text-center py-8'>
              <div className='animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto' />
            </div>
          ) : recentReviews.length === 0 ? (
            <p className='text-muted text-sm bg-elimux-card rounded-xl p-4 border border-border'>No reviews yet.</p>
          ) : (
            <div className='bg-elimux-card border border-border rounded-xl divide-y divide-border'>
              {recentReviews.map((review) => (
                <div key={review.id} className='p-4'>
                  <div className='flex items-start justify-between gap-2 mb-1'>
                    <p className='text-sm font-medium text-foreground'>
                      {review.title || 'Untitled review'}
                    </p>
                    <span
                      className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full flex-shrink-0 ${
                        review.is_verified
                          ? 'bg-elimux-success/10 text-elimux-success'
                          : 'bg-elimux-warning/10 text-elimux-warning'
                      }`}
                    >
                      {review.is_verified ? 'Verified' : 'Unverified'}
                    </span>
                  </div>
                  <p className='text-xs text-muted mb-1'>
                    {review.program?.name || review.institution?.name || 'Unknown target'} &middot;{' '}
                    {review.reviewer_name || 'Anonymous'} &middot; {review.rating}/5
                  </p>
                  <p className='text-xs text-muted'>{new Date(review.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Most Reviewed Programs - real search-query analytics don't exist yet
            (no search-logging table), so this uses actual review counts instead
            of fabricating "top searches" data. */}
        <div>
          <h2 className='text-xl font-bold text-foreground mb-4 flex items-center gap-2'>
            <Star className='w-5 h-5 text-primary-400' />
            Most Reviewed Programs
          </h2>
          {topProgramsLoading ? (
            <div className='text-center py-8'>
              <div className='animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto' />
            </div>
          ) : topPrograms.length === 0 ? (
            <p className='text-muted text-sm bg-elimux-card rounded-xl p-4 border border-border'>No reviewed programs yet.</p>
          ) : (
            <div className='bg-elimux-card border border-border rounded-xl divide-y divide-border'>
              {topPrograms.map((program) => (
                <div key={program.id} className='p-4 flex items-center justify-between gap-2'>
                  <p className='text-sm font-medium text-foreground'>{program.name}</p>
                  <p className='text-xs text-muted flex-shrink-0'>
                    {program.avg_rating.toFixed(1)} <Star className='w-3 h-3 inline text-elimux-warning fill-elimux-warning -mt-0.5' />{' '}
                    ({program.review_count})
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className='text-xl font-bold text-foreground mb-4'>Quick Actions</h2>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <div className='bg-elimux-card rounded-xl p-5 border border-border'>
          <Building2 className='w-8 h-8 text-primary-400 mb-3' />
          <h3 className='text-lg font-bold text-foreground mb-1'>Add Institution</h3>
          <p className='text-sm text-muted mb-3'>Add a new university, college, or TVET institute</p>
          <div className='flex gap-2'>
            <button
              onClick={() => setShowInstitutionForm(true)}
              className='px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors'
            >
              Add Institution
            </button>
            <Link
              href='/admin/institutions'
              className='px-4 py-2 rounded-lg border border-border text-muted hover:text-foreground text-sm font-medium transition-colors flex items-center gap-1'
            >
              <Settings2 className='w-4 h-4' /> Manage
            </Link>
          </div>
        </div>
        <div className='bg-elimux-card rounded-xl p-5 border border-border'>
          <GraduationCap className='w-8 h-8 text-elimux-success mb-3' />
          <h3 className='text-lg font-bold text-foreground mb-1'>Add Program</h3>
          <p className='text-sm text-muted mb-3'>Add a new course or program to an institution</p>
          <div className='flex gap-2'>
            <button
              onClick={() => setShowProgramForm(true)}
              className='px-4 py-2 rounded-lg bg-elimux-success/20 text-elimux-success text-sm font-medium'
            >
              Add Program
            </button>
            <Link
              href='/admin/programs'
              className='px-4 py-2 rounded-lg border border-border text-muted hover:text-foreground text-sm font-medium transition-colors flex items-center gap-1'
            >
              <Settings2 className='w-4 h-4' /> Manage
            </Link>
          </div>
        </div>
        <div className='bg-elimux-card rounded-xl p-5 border border-border'>
          <MessageSquare className='w-8 h-8 text-elimux-warning mb-3' />
          <h3 className='text-lg font-bold text-foreground mb-1'>View Messages</h3>
          <p className='text-sm text-muted mb-3'>Check contact form submissions</p>
          <button className='px-4 py-2 rounded-lg bg-elimux-warning/20 text-elimux-warning text-sm font-medium'>
            Coming Soon
          </button>
        </div>
      </div>

      {showInstitutionForm && (
        <InstitutionForm
          types={institutionTypes}
          countries={countries}
          onSubmit={handleAddInstitution}
          onClose={() => setShowInstitutionForm(false)}
        />
      )}

      {showProgramForm && (
        <ProgramForm
          institutions={institutionsList}
          categories={programCategories}
          onSubmit={handleAddProgram}
          onClose={() => setShowProgramForm(false)}
        />
      )}
    </main>
  )
}
