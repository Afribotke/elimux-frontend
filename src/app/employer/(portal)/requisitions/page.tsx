'use client';

import { Fragment, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getUserWithTimeout } from '@/lib/client-auth';
import Link from 'next/link';
import { Plus, Clock, CheckCircle2, XCircle, FileText, Eye, Loader2 } from 'lucide-react';

export default function RequisitionsListPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [teamMember, setTeamMember] = useState<any>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function actOnRequisition(id: string, action: 'approve' | 'reject') {
    setError('');
    setActioningId(id);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setActioningId(null); return; }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/requisitions/${id}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({})
    });

    if (res.ok) {
      await loadData();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error || `Failed to ${action} requisition`);
    }
    setActioningId(null);
  }

  async function loadData() {
    const { data: { user } } = await getUserWithTimeout();
    if (!user) return;

    const { data: me } = await supabase
      .from('employer_team_members')
      .select('employer_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!me) return;
    setTeamMember(me);

    const { data: reqs } = await supabase
      .from('internship_requisitions')
      .select('*, employer_departments(name)')
      .eq('employer_id', me.employer_id)
      .order('created_at', { ascending: false });

    setRequisitions(reqs || []);
    setLoading(false);
  }

  const canCreate = teamMember && ['super_admin', 'admin', 'manager'].includes(teamMember.role);
  const canApprove = teamMember && ['super_admin', 'admin'].includes(teamMember.role);

  const filteredRequisitions = statusFilter === 'all'
    ? requisitions
    : requisitions.filter((r) => r.status === statusFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Requisitions</h1>
          <p className="text-gray-500 mt-1">Manage intern requests across all departments</p>
        </div>
        {canCreate && (
          <Link href="/employer/requisitions/new" className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            New Requisition
          </Link>
        )}
      </div>

      <div className="flex gap-2 mb-6">
        {['all', 'pending_approval', 'approved', 'published', 'filled', 'rejected'].map((filter) => (
          <button
            key={filter}
            onClick={() => setStatusFilter(filter)}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors capitalize ${
              statusFilter === filter
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {filter.replace('_', ' ')}
          </button>
        ))}
      </div>

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
              {filteredRequisitions.map((req) => (
                <Fragment key={req.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{req.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{req.location_city || 'Nairobi'} · {req.location_type}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{req.employer_departments?.name || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{req.number_of_slots}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{req.duration_months} months</td>
                    <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
                    <td className="px-6 py-4 text-sm text-gray-400">{new Date(req.created_at).toLocaleDateString('en-KE')}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpandedId(expandedId === req.id ? null : req.id)}
                          title="View details"
                          className={`p-1.5 rounded-lg transition-colors ${expandedId === req.id ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canApprove && req.status === 'pending_approval' && (
                          <>
                            <button
                              onClick={() => actOnRequisition(req.id, 'approve')}
                              disabled={actioningId === req.id}
                              title="Approve and post as a live internship"
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {actioningId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => actOnRequisition(req.id, 'reject')}
                              disabled={actioningId === req.id}
                              title="Reject"
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedId === req.id && (
                    <tr key={`${req.id}-detail`} className="bg-gray-50">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Description</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{req.description || 'No description provided.'}</p>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Requirements</p>
                              {req.requirements?.length ? (
                                <ul className="list-disc list-inside text-sm text-gray-700 space-y-0.5">
                                  {req.requirements.map((r: string, i: number) => <li key={i}>{r}</li>)}
                                </ul>
                              ) : <p className="text-sm text-gray-400">None listed.</p>}
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Skills</p>
                              {req.skills_required?.length ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {req.skills_required.map((s: string, i: number) => (
                                    <span key={i} className="px-2 py-0.5 bg-white border border-gray-200 rounded-full text-xs text-gray-600">{s}</span>
                                  ))}
                                </div>
                              ) : <p className="text-sm text-gray-400">None listed.</p>}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {filteredRequisitions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    <FileText className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                    <p>{requisitions.length === 0 ? 'No requisitions yet.' : `No ${statusFilter.replace('_', ' ')} requisitions.`}</p>
                    {canCreate && requisitions.length === 0 && <Link href="/employer/requisitions/new" className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2 inline-block">Create your first requisition →</Link>}
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
    draft: 'Draft', pending_approval: 'Pending', approved: 'Approved', published: 'Published', filled: 'Filled', closed: 'Closed', rejected: 'Rejected',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
      {labels[status] || status}
    </span>
  );
}
