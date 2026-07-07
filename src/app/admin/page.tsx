'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { checkApiHealth, createInstitution, createProgram } from '@/lib/api'
import InstitutionForm, { type InstitutionFormData } from '@/components/InstitutionForm'
import ProgramForm, { type ProgramFormData } from '@/components/ProgramForm'
import { LayoutDashboard, Users, Building2, GraduationCap, MessageSquare, TrendingUp, Shield, Server, KeyRound, CheckCircle2, Settings2 } from 'lucide-react'

const ADMIN_KEY_STORAGE = 'elimux-admin-key'

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

  const [adminKey, setAdminKey] = useState('')
  const [showInstitutionForm, setShowInstitutionForm] = useState(false)
  const [showProgramForm, setShowProgramForm] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [institutionTypes, setInstitutionTypes] = useState<{ id: string; name: string }[]>([])
  const [countries, setCountries] = useState<{ id: string; name: string }[]>([])
  const [institutionsList, setInstitutionsList] = useState<{ id: string; name: string }[]>([])
  const [programCategories, setProgramCategories] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    checkApiHealth().then(({ ok }) => setApiStatus(ok ? 'online' : 'offline'))
  }, [])

  useEffect(() => {
    const stored = window.sessionStorage.getItem(ADMIN_KEY_STORAGE)
    if (stored) setAdminKey(stored)
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

  function handleAdminKeyChange(value: string) {
    setAdminKey(value)
    window.sessionStorage.setItem(ADMIN_KEY_STORAGE, value)
  }

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

      <div className='flex items-center gap-2 mb-8'>
        <KeyRound className='w-4 h-4 text-muted flex-shrink-0' />
        <input
          type='password'
          value={adminKey}
          onChange={(e) => handleAdminKeyChange(e.target.value)}
          placeholder='Admin key (required to add institutions/programs)'
          className='w-full max-w-sm px-3 py-1.5 text-sm rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500'
        />
      </div>

      {successMessage && (
        <div className='mb-6 px-4 py-2 rounded-lg bg-elimux-success/10 border border-elimux-success/30 text-elimux-success text-sm flex items-center gap-2'>
          <CheckCircle2 className='w-4 h-4' />
          {successMessage}
        </div>
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
