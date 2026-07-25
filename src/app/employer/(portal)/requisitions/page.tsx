import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Eye
} from 'lucide-react';

export default async function RequisitionsListPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: teamMember } = await supabase
    .from('employer_team_members')
    .select('employer_id, role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (!teamMember) redirect('/employer');

  const { data: requisitions } = await supabase
    .from('internship_requisitions')
    .select('*, employer_departments(name)')
    .eq('employer_id', teamMember.employer_id)
    .order('created_at', { ascending: false });

  const canCreate = ['super_admin', 'admin', 'manager'].includes(teamMember.role);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Requisitions</h1>
          <p className="text-gray-500 mt-1">Manage intern requests across all departments</p>
        </div>
        {canCreate && (
          <Link
            href="/employer/requisitions/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Requisition
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['all', 'pending_approval', 'approved', 'published', 'filled', 'rejected'].map((filter) => (
          <button
            key={filter}
            className="px-3 py-1.5 text-sm rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors capitalize"
          >
            {filter.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Slots</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requisitions?.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{req.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{req.location_city || 'Nairobi'} · {req.location_type}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{req.employer_departments?.name || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{req.number_of_slots}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{req.duration_months} months</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(req.created_at).toLocaleDateString('en-KE')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      {teamMember.role === 'super_admin' && req.status === 'pending_approval' && (
                        <>
                          <button className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {(!requisitions || requisitions.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    <FileText className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                    <p>No requisitions yet.</p>
                    {canCreate && (
                      <Link href="/employer/requisitions/new" className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block">
                        Create your first requisition →
                      </Link>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
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
  const labels: Record<string, string> = {
    draft: 'Draft',
    pending_approval: 'Pending',
    approved: 'Approved',
    published: 'Published',
    filled: 'Filled',
    closed: 'Closed',
    rejected: 'Rejected',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
      {labels[status] || status}
    </span>
  );
}
