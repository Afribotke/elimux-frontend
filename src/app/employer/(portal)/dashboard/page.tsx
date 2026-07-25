import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import StatsCard from '@/components/employer/StatsCard';
import {
  Users,
  FileText,
  Clock,
  CheckCircle2,
  TrendingUp,
  Building2
} from 'lucide-react';
import Link from 'next/link';

export default async function EmployerDashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Get user's employer
  const { data: teamMember } = await supabase
    .from('employer_team_members')
    .select('employer_id, role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (!teamMember) redirect('/employer');

  const employerId = teamMember.employer_id;

  // Fetch stats in parallel
  const [
    { data: requisitions },
    { data: departments },
    { data: team },
    { data: employer },
  ] = await Promise.all([
    supabase
      .from('internship_requisitions')
      .select('status, department_id')
      .eq('employer_id', employerId),
    supabase
      .from('employer_departments')
      .select('id, name')
      .eq('employer_id', employerId),
    supabase
      .from('employer_team_members')
      .select('id')
      .eq('employer_id', employerId)
      .eq('is_active', true),
    supabase
      .from('employers')
      .select('name, logo_url, verification_status')
      .eq('id', employerId)
      .single(),
  ]);

  const stats = {
    totalRequisitions: requisitions?.length || 0,
    pendingApproval: requisitions?.filter(r => r.status === 'pending_approval').length || 0,
    approved: requisitions?.filter(r => r.status === 'approved').length || 0,
    published: requisitions?.filter(r => r.status === 'published').length || 0,
    filled: requisitions?.filter(r => r.status === 'filled').length || 0,
    totalDepartments: departments?.length || 0,
    totalTeam: team?.length || 0,
  };

  // Recent requisitions
  const { data: recentRequisitions } = await supabase
    .from('internship_requisitions')
    .select('*, employer_departments(name)')
    .eq('employer_id', employerId)
    .order('created_at', { ascending: false })
    .limit(5);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">
              {employer?.name || 'Your Organization'} — {teamMember.role.replace('_', ' ').toUpperCase()}
            </p>
          </div>
          {employer?.verification_status !== 'verified' && (
            <div className="px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm font-medium">
              ⚠️ Account pending verification
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Open Positions"
          value={stats.published}
          subtitle="Live on ElimuX"
          icon={FileText}
          trend="3 new this week"
          trendUp={true}
        />
        <StatsCard
          title="Pending Approval"
          value={stats.pendingApproval}
          subtitle="Awaiting HR review"
          icon={Clock}
        />
        <StatsCard
          title="Filled Positions"
          value={stats.filled}
          subtitle="Interns placed"
          icon={CheckCircle2}
          trend="12% conversion"
          trendUp={true}
        />
        <StatsCard
          title="Team Members"
          value={stats.totalTeam}
          subtitle="Active users"
          icon={Users}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Requisition Pipeline</h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <PipelineBar label="Draft" value={requisitions?.filter(r => r.status === 'draft').length || 0} total={stats.totalRequisitions} color="bg-gray-400" />
            <PipelineBar label="Pending Approval" value={stats.pendingApproval} total={stats.totalRequisitions} color="bg-amber-400" />
            <PipelineBar label="Approved" value={stats.approved} total={stats.totalRequisitions} color="bg-blue-400" />
            <PipelineBar label="Published" value={stats.published} total={stats.totalRequisitions} color="bg-green-400" />
            <PipelineBar label="Filled" value={stats.filled} total={stats.totalRequisitions} color="bg-purple-400" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Departments</h3>
            <Building2 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-2">
            {departments?.map((dept) => (
              <div key={dept.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-700">{dept.name}</span>
                <span className="text-xs text-gray-400">
                  {requisitions?.filter(r => r.department_id === dept.id).length || 0} reqs
                </span>
              </div>
            ))}
            {(!departments || departments.length === 0) && (
              <p className="text-sm text-gray-400 italic">No departments yet</p>
            )}
          </div>
          <Link
            href="/employer/settings"
            className="mt-4 inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Manage Departments →
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="space-y-3">
            <Link
              href="/employer/requisitions/new"
              className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <FileText className="w-5 h-5" />
              <span className="text-sm font-medium">Create Requisition</span>
            </Link>
            <Link
              href="/employer/team"
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium">Invite Team Member</span>
            </Link>
            <Link
              href="/employer/settings"
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Building2 className="w-5 h-5" />
              <span className="text-sm font-medium">Company Settings</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Requisitions */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Recent Requisitions</h3>
          <Link href="/employer/requisitions" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View All →
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {recentRequisitions?.map((req) => (
            <div key={req.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium text-gray-900">{req.title}</h4>
                  <StatusBadge status={req.status} />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {req.employer_departments?.name || 'No department'} · {req.number_of_slots} slot{req.number_of_slots !== 1 ? 's' : ''} · {req.duration_months} months
                </p>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(req.created_at).toLocaleDateString('en-KE')}
              </span>
            </div>
          ))}
          {(!recentRequisitions || recentRequisitions.length === 0) && (
            <div className="px-6 py-8 text-center text-gray-400">
              <p>No requisitions yet.</p>
              <Link href="/employer/requisitions/new" className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block">
                Create your first requisition →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PipelineBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-28 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-700 w-6 text-right">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    pending_approval: 'bg-amber-100 text-amber-700',
    approved: 'bg-blue-100 text-blue-700',
    published: 'bg-green-100 text-green-700',
    filled: 'bg-purple-100 text-purple-700',
    closed: 'bg-red-100 text-red-700',
    rejected: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
