import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import EmployerSidebar from '@/components/employer/EmployerSidebar';

export default async function EmployerPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?redirect=/employer/dashboard');
  }

  // Check if user is part of any employer team
  const { data: teamMember } = await supabase
    .from('employer_team_members')
    .select('id, role, employer_id, is_active')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (!teamMember) {
    redirect('/employer?error=not_associated');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployerSidebar />
      <main className="lg:ml-64 min-h-screen transition-all duration-300">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
