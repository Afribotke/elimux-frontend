import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import FeaturedInstitutionCard from '@/components/FeaturedInstitutionCard'
import InstitutionsBrowser from '@/components/institutions/InstitutionsBrowser'
import SponsorAdBanner from '@/components/SponsorAdBanner'
import { Building2 } from 'lucide-react'

export const revalidate = 60

export default async function InstitutionsPage() {
  const [{ data: institutions }, { data: featuredData }] = await Promise.all([
    supabase
      .from('institutions')
      .select(
        '*, type:institution_types(name, icon), country:countries(name, flag_emoji), accreditations:institution_accreditations(accreditation_status)'
      )
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(24),
    supabase
      .from('institutions')
      .select(
        '*, type:institution_types(name, icon), country:countries(name, flag_emoji), accreditations:institution_accreditations(accreditation_status)'
      )
      .eq('is_active', true)
      .eq('is_featured', true)
      .limit(4),
  ])

  const featuredInstitutions = featuredData || []

  return (
    <main className='min-h-screen py-12 px-4 max-w-6xl mx-auto'>
      <h1 className='text-3xl font-bold text-foreground mb-2 flex items-center gap-3'>
        <Building2 className='w-8 h-8 text-primary-400' />
        All Institutions
      </h1>
      <p className='text-muted mb-8'>Browse universities, colleges, TVET institutes, and more</p>

      <div className='mb-8 bg-elimux-card border border-border rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4'>
        <div>
          <div className='text-foreground font-bold text-lg mb-1 flex items-center gap-2'>
            <Building2 className='w-5 h-5 text-primary-400' />
            Institution Representative?
          </div>
          <div className='text-muted text-sm'>Claim your institution profile to manage programs, update information, and connect with prospective students.</div>
        </div>
        <Link
          href='/institution/register'
          className='bg-primary-600 hover:bg-primary-700 text-elimux-dark px-6 py-3 rounded-xl font-semibold text-sm transition-colors shrink-0'
        >
          Claim Your Institution →
        </Link>
      </div>

      <div className='mb-8'>
        <SponsorAdBanner placement='search' />
      </div>

      {featuredInstitutions.length > 0 && (
        <div className='mb-10'>
          <h2 className='text-lg font-bold text-foreground mb-4'>Featured Institutions</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {featuredInstitutions.map((inst) => (
              <Link key={inst.id} href={`/institutions/${inst.id}/`}>
                <FeaturedInstitutionCard institution={inst} />
              </Link>
            ))}
          </div>
        </div>
      )}

      <InstitutionsBrowser initialInstitutions={institutions || []} />
    </main>
  )
}
