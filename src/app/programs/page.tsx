import { supabase } from '@/lib/supabase'
import ProgramCard from '@/components/ProgramCard'
import { GraduationCap } from 'lucide-react'

export const revalidate = 60

export default async function ProgramsPage() {
  const { data: programs } = await supabase
    .from('programs')
    .select('*, institution:institutions(name, city, country:countries(name)), category:program_categories(name, color, icon)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(24)

  return (
    <main className='min-h-screen py-12 px-4 max-w-6xl mx-auto'>
      <h1 className='text-3xl font-bold text-white mb-2 flex items-center gap-3'>
        <GraduationCap className='w-8 h-8 text-primary-400' />
        All Programs
      </h1>
      <p className='text-gray-400 mb-8'>Browse all available programs from institutions worldwide</p>

      {programs && programs.length > 0 ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {programs.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
        </div>
      ) : (
        <div className='text-center py-12'>
          <p className='text-gray-400 text-lg'>No programs available yet.</p>
        </div>
      )}
    </main>
  )
}
