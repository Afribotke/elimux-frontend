import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import FeaturedInstitutionCard from '@/components/FeaturedInstitutionCard'
import InstitutionsBrowser from '@/components/institutions/InstitutionsBrowser'
import SponsorAdBanner from '@/components/SponsorAdBanner'
import { listInstitutions } from '@/lib/api'
import { Building2 } from 'lucide-react'

export const revalidate = 60

export default async function InstitutionsPage() {
  const [{ data: institutions }, featuredResult] = await Promise.all([
    supabase
      .from('institutions')
      .select(
        '*, type:institution_types(name, icon), country:countries(name, flag_emoji), accreditations:institution_accreditations(accreditation_status, body:accreditation_bodies(name, code, logo_url))'
      )
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(24),
    listInstitutions({ featured: true, limit: 4 }).catch(() => ({ data: [] })),
  ])

  const featuredInstitutions = featuredResult.data

  return (
    <main className='min-h-screen py-12 px-4 max-w-6xl mx-auto'>
      <h1 className='text-3xl font-bold text-foreground mb-2 flex items-center gap-3'>
        <Building2 className='w-8 h-8 text-primary-400' />
        All Institutions
      </h1>
      <p className='text-muted mb-8'>Browse universities, colleges, TVET institutes, and more</p>

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
