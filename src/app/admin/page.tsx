'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { checkApiHealth } from '@/lib/api'
import { LayoutDashboard, Users, Building2, GraduationCap, MessageSquare, TrendingUp, Shield, Server } from 'lucide-react'

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

  useEffect(() => {
    checkApiHealth().then(({ ok }) => setApiStatus(ok ? 'online' : 'offline'))
  }, [])

  useEffect(() => {
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

    loadStats()
  }, [])

  const statCards = [
    { icon: Shield, label: 'Countries', value: stats.countries, color: 'text-primary-400' },
    { icon: Building2, label: 'Institutions', value: stats.institutions, color: 'text-success' },
    { icon: GraduationCap, label: 'Programs', value: stats.programs, color: 'text-warning' },
    { icon: Users, label: 'Reviews', value: stats.reviews, color: 'text-primary-400' },
    { icon: MessageSquare, label: 'Messages', value: stats.messages, color: 'text-danger' },
    { icon: TrendingUp, label: 'Inst. Types', value: stats.institutionTypes, color: 'text-success' },
    { icon: LayoutDashboard, label: 'Categories', value: stats.categories, color: 'text-warning' },
  ]

  return (
    <main className='min-h-screen py-12 px-4 max-w-6xl mx-auto'>
      <h1 className='text-3xl font-bold text-foreground mb-2 flex items-center gap-3'>
        <LayoutDashboard className='w-8 h-8 text-primary-400' />
        Admin Dashboard
      </h1>
      <p className='text-muted mb-2'>Overview of your ElimuX platform data</p>
      <div className='flex items-center gap-2 mb-8 text-sm'>
        <Server className='w-4 h-4 text-muted' />
        <span className='text-muted'>Backend API:</span>
        {apiStatus === 'checking' && <span className='text-muted'>Checking...</span>}
        {apiStatus === 'online' && <span className='text-success flex items-center gap-1'><span className='w-2 h-2 rounded-full bg-success inline-block' />Connected</span>}
        {apiStatus === 'offline' && <span className='text-danger flex items-center gap-1'><span className='w-2 h-2 rounded-full bg-danger inline-block' />Offline</span>}
      </div>

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
          <button className='px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors'>
            Coming Soon
          </button>
        </div>
        <div className='bg-elimux-card rounded-xl p-5 border border-border'>
          <GraduationCap className='w-8 h-8 text-success mb-3' />
          <h3 className='text-lg font-bold text-foreground mb-1'>Add Program</h3>
          <p className='text-sm text-muted mb-3'>Add a new course or program to an institution</p>
          <button className='px-4 py-2 rounded-lg bg-success/20 text-success text-sm font-medium'>
            Coming Soon
          </button>
        </div>
        <div className='bg-elimux-card rounded-xl p-5 border border-border'>
          <MessageSquare className='w-8 h-8 text-warning mb-3' />
          <h3 className='text-lg font-bold text-foreground mb-1'>View Messages</h3>
          <p className='text-sm text-muted mb-3'>Check contact form submissions</p>
          <button className='px-4 py-2 rounded-lg bg-warning/20 text-warning text-sm font-medium'>
            Coming Soon
          </button>
        </div>
      </div>
    </main>
  )
}
