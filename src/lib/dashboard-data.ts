import { supabase } from './supabase'

export interface DashboardStats {
  institutions: number
  programs: number
  students: number
  applications: number
  revenue: number
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    { count: institutions },
    { count: programs },
    { count: students },
    { count: applications },
    { count: revenue }
  ] = await Promise.all([
    supabase.from('institutions').select('*', { count: 'exact', head: true }),
    supabase.from('programs').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('applications').select('*', { count: 'exact', head: true }),
    supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'completed')
  ])

  return {
    institutions: institutions || 0,
    programs: programs || 0,
    students: students || 0,
    applications: applications || 0,
    revenue: revenue || 0
  }
}
