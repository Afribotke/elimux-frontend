import { supabase } from '@/lib/supabase'
import InstitutionCard from '@/components/InstitutionCard'
import { Building2 } from 'lucide-react'

export const revalidate = 60

export default async function InstitutionsPage() {
  const { data: institutions } = await supabase
    .from('institutions')
    .select('*, type:institution_types(name, icon), country:countries(name, flag_emoji)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(24)

  return (
    <main className='min-h-screen py-12 px-4 max-w-6xl mx-auto'>
      <h1 className='text-3xl font-bold text-white mb-2 flex items-center gap-3'>
        <Building2 className='w-8 h-8 text-primary-400' />
        All Institutions
      </h1>
      <p className='text-gray-400 mb-8'>Browse universities, colleges, TVET institutes, and more</p>

      {institutions && institutions.length > 0 ? (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {institutions.map((inst) => (
            <InstitutionCard key={inst.id} institution={inst} />
          ))}
        </div>
      ) : (
        <div className='text-center py-12'>
          <p className='text-gray-400 text-lg'>No institutions available yet.</p>
          <p className='text-sm text-gray-500 mt-2'>Institutions will appear here once added to the database.</p>
        </div>
      )}
    </main>
  )
}
