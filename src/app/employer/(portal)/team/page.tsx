'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getUserWithTimeout } from '@/lib/client-auth';
import {
  Users,
  Plus,
  Mail,
  Shield,
  UserCheck,
  UserX,
  Building2,
  Loader2,
  X,
  ChevronDown,
  Search
} from 'lucide-react';
import Link from 'next/link';

type TeamMember = {
  id: string;
  user_id: string;
  role: string;
  is_active: boolean;
  invited_at: string;
  joined_at: string | null;
  department_id: string | null;
  department_name?: string;
  user_email?: string;
  user_name?: string;
};

type Department = {
  id: string;
  name: string;
};

export default function TeamPage() {
  const supabase = createClient();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const { data: { user } } = await getUserWithTimeout();
    if (!user) return;

    // Get current user's role
    const { data: me } = await supabase
      .from('employer_team_members')
      .select('role, employer_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!me) return;
    setUserRole(me.role);

    // Get departments
    const { data: depts } = await supabase
      .from('employer_departments')
      .select('id, name')
      .eq('employer_id', me.employer_id);

    setDepartments(depts || []);

    // Get team members with profiles
    const { data: team } = await supabase
      .from('employer_team_members')
      .select(`
        id, user_id, role, is_active, invited_at, joined_at, department_id,
        employer_departments(name)
      `)
      .eq('employer_id', me.employer_id)
      .order('created_at', { ascending: false });

    // Fetch user emails/names from auth (best effort)
    const enriched = await Promise.all((team || []).map(async (m: any) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', m.user_id)
        .single();

      return {
        ...m,
        department_name: m.employer_departments?.name,
        user_name: profile?.full_name || 'Unknown',
        user_email: profile?.email || '',
      };
    }));

    setMembers(enriched);
    setLoading(false);
  }

  const canManage = ['super_admin', 'admin'].includes(userRole);

  const filteredMembers = members.filter(m => {
    const matchesSearch =
      (m.user_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (m.user_email?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || m.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const roleLabels: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    manager: 'Manager',
    supervisor: 'Supervisor',
    viewer: 'Viewer',
  };

  const roleColors: Record<string, string> = {
    super_admin: 'bg-purple-100 text-purple-700',
    admin: 'bg-blue-100 text-blue-700',
    manager: 'bg-green-100 text-green-700',
    supervisor: 'bg-amber-100 text-amber-700',
    viewer: 'bg-gray-100 text-gray-600',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team</h1>
          <p className="text-gray-500 mt-1">Manage who can access your employer portal</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Invite Member
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          aria-label="Filter by role"
        >
          <option value="all">All Roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="supervisor">Supervisor</option>
          <option value="viewer">Viewer</option>
        </select>
      </div>

      {/* Team Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map(member => (
            <div key={member.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-700 font-semibold text-sm">
                    {(member.user_name || '?').charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[member.role] || roleColors.viewer}`}>
                  {roleLabels[member.role] || member.role}
                </span>
              </div>

              <h3 className="font-semibold text-gray-900">{member.user_name}</h3>
              <p className="text-sm text-gray-500 mb-3">{member.user_email}</p>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  {member.department_name || 'No department'}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  {member.is_active ? (
                    <>
                      <UserCheck className="w-4 h-4 text-green-500" />
                      <span className="text-green-600">Active</span>
                    </>
                  ) : (
                    <>
                      <UserX className="w-4 h-4 text-amber-500" />
                      <span className="text-amber-600">Pending invite</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-xs">
                  <Mail className="w-3 h-3" />
                  Joined {member.joined_at ? new Date(member.joined_at).toLocaleDateString('en-KE') : 'Not yet'}
                </div>
              </div>

              {canManage && member.role !== 'super_admin' && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                  <button
                    onClick={() => handleToggleActive(member.id, !member.is_active)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      member.is_active
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                  >
                    {member.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleRemove(member.id)}
                    className="text-xs px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100 font-medium transition-colors"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}

          {filteredMembers.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-400">
              <Users className="w-8 h-8 mx-auto mb-3 text-gray-300" />
              <p>No team members found.</p>
              {canManage && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2"
                >
                  Invite your first team member →
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteModal
          departments={departments}
          onClose={() => setShowInviteModal(false)}
          onInvited={loadData}
          canManage={canManage}
        />
      )}
    </div>
  );

  async function handleToggleActive(memberId: string, active: boolean) {
    const { error } = await supabase
      .from('employer_team_members')
      .update({ is_active: active })
      .eq('id', memberId);

    if (!error) loadData();
  }

  async function handleRemove(memberId: string) {
    if (!confirm('Remove this team member?')) return;
    const { error } = await supabase
      .from('employer_team_members')
      .delete()
      .eq('id', memberId);

    if (!error) loadData();
  }
}

// Invite Modal Component
function InviteModal({
  departments,
  onClose,
  onInvited,
  canManage
}: {
  departments: Department[];
  onClose: () => void;
  onInvited: () => void;
  canManage: boolean;
}) {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [departmentId, setDepartmentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!canManage) return null;

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data: { user } } = await getUserWithTimeout();
    if (!user) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    // Get employer_id
    const { data: me } = await supabase
      .from('employer_team_members')
      .select('employer_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!me) {
      setError('Not associated with an employer');
      setLoading(false);
      return;
    }

    // Check if user exists
    const { data: existingUsers } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .single();

    let targetUserId = existingUsers?.id;

    // If user doesn't exist, we can't invite them via this simple flow
    // In production, you'd send a magic link or invite email
    if (!targetUserId) {
      setError('User not found. They must register on ElimuX first.');
      setLoading(false);
      return;
    }

    // Check if already on team
    const { data: existing } = await supabase
      .from('employer_team_members')
      .select('id')
      .eq('employer_id', me.employer_id)
      .eq('user_id', targetUserId)
      .single();

    if (existing) {
      setError('This user is already on your team.');
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from('employer_team_members')
      .insert({
        employer_id: me.employer_id,
        user_id: targetUserId,
        role,
        department_id: departmentId || null,
        invited_by: user.id,
        is_active: true,
      });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    onInvited();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Invite Team Member</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleInvite} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="colleague@company.co.ke"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="text-xs text-gray-400 mt-1">User must already have an ElimuX account</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-label="Role"
            >
              <option value="viewer">Viewer — Can view only</option>
              <option value="supervisor">Supervisor — Can manage assigned interns</option>
              <option value="manager">Manager — Can create requisitions</option>
              <option value="admin">Admin — Full access except billing</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={departmentId}
              onChange={e => setDepartmentId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-label="Department"
            >
              <option value="">No department</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Send Invite
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
