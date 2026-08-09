'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getUserWithTimeout } from '@/lib/client-auth';
import {
  ArrowLeft,
  Plus,
  X,
  Loader2,
  Building2,
  MapPin,
  Clock,
  Users,
  Coins
} from 'lucide-react';
import Link from 'next/link';

const ROLES_ALLOWED_TO_CREATE = ['super_admin', 'admin', 'manager'];

export default function NewRequisitionPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    department_id: '',
    duration_months: 3,
    number_of_slots: 1,
    stipend_amount: '',
    stipend_currency: 'KES',
    location_type: 'on_site' as const,
    location_city: 'Nairobi',
    start_date: '',
    requirements: [''] as string[],
    skills_required: [''] as string[],
  });

  const [departments, setDepartments] = useState<{id: string; name: string}[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [roleChecked, setRoleChecked] = useState(false);

  const canCreate = role !== null && ROLES_ALLOWED_TO_CREATE.includes(role);

  // Load departments and the current user's employer role on mount
  useEffect(() => {
    async function loadDepts() {
      const { data } = await supabase.from('employer_departments').select('id, name');
      if (data) setDepartments(data);
    }

    async function loadRole() {
      const { data: { user } } = await getUserWithTimeout();
      if (!user) {
        setRoleChecked(true);
        return;
      }
      const { data: teamMember } = await supabase
        .from('employer_team_members')
        .select('role')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();
      setRole(teamMember?.role ?? null);
      setRoleChecked(true);
    }

    loadDepts();
    loadRole();
  }, []);

  const addField = (field: 'requirements' | 'skills_required') => {
    setForm(prev => ({ ...prev, [field]: [...prev[field], ''] }));
  };

  const removeField = (field: 'requirements' | 'skills_required', index: number) => {
    setForm(prev => ({ ...prev, [field]: prev[field].filter((_, i) => i !== index) }));
  };

  const updateField = (field: 'requirements' | 'skills_required', index: number, value: string) => {
    setForm(prev => {
      const updated = [...prev[field]];
      updated[index] = value;
      return { ...prev, [field]: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'pending_approval') => {
    e.preventDefault();

    if (!canCreate) {
      setError('You do not have permission to create requisitions. Contact an employer admin or manager.');
      return;
    }

    setLoading(true);
    setError('');

    const { data: { user } } = await getUserWithTimeout();
    if (!user) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    // Get employer_id from team member
    const { data: teamMember } = await supabase
      .from('employer_team_members')
      .select('employer_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!teamMember) {
      setError('Not associated with an employer');
      setLoading(false);
      return;
    }

    const payload = {
      employer_id: teamMember.employer_id,
      requested_by: user.id,
      title: form.title,
      description: form.description,
      department_id: form.department_id || null,
      duration_months: form.duration_months,
      number_of_slots: form.number_of_slots,
      stipend_amount: form.stipend_amount ? parseInt(form.stipend_amount) : null,
      stipend_currency: form.stipend_currency,
      location_type: form.location_type,
      location_city: form.location_city,
      start_date: form.start_date || null,
      requirements: form.requirements.filter(r => r.trim()),
      skills_required: form.skills_required.filter(s => s.trim()),
      status,
    };

    const { error: insertError } = await supabase
      .from('internship_requisitions')
      .insert(payload);

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push('/employer/requisitions');
    router.refresh();
  };

  return (
    <div>
      <div className="mb-8">
        <Link href="/employer/requisitions" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Requisitions
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Requisition</h1>
        <p className="text-gray-500 mt-1">Request interns for your department</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {roleChecked && !canCreate && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
          Only employer admins and managers can create requisitions. You can view existing requisitions, but you won't be able to submit this form.
        </div>
      )}

      <form className="max-w-3xl space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileTextIcon className="w-5 h-5 text-blue-600" />
            Position Details
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Data Analysis Intern"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the role, responsibilities, and what the intern will learn..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={form.department_id}
                onChange={e => setForm(prev => ({ ...prev, department_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="Department"
              >
                <option value="">Select department...</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Logistics */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Logistics
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (months) *</label>
              <input
                type="number"
                min={1}
                max={12}
                value={form.duration_months}
                onChange={e => setForm(prev => ({ ...prev, duration_months: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Slots *</label>
              <input
                type="number"
                min={1}
                max={50}
                value={form.number_of_slots}
                onChange={e => setForm(prev => ({ ...prev, number_of_slots: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stipend (KES)</label>
              <input
                type="number"
                value={form.stipend_amount}
                onChange={e => setForm(prev => ({ ...prev, stipend_amount: e.target.value }))}
                placeholder="e.g., 15000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={form.start_date}
                onChange={e => setForm(prev => ({ ...prev, start_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location Type</label>
              <select
                value={form.location_type}
                onChange={e => setForm(prev => ({ ...prev, location_type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="Location Type"
              >
                <option value="on_site">On-site</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={form.location_city}
                onChange={e => setForm(prev => ({ ...prev, location_city: e.target.value }))}
                placeholder="e.g., Nairobi"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Requirements & Skills
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Requirements</label>
              {form.requirements.map((req, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={req}
                    onChange={e => updateField('requirements', i, e.target.value)}
                    placeholder={`Requirement ${i + 1}`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {form.requirements.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeField('requirements', i)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addField('requirements')}
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium mt-1"
              >
                <Plus className="w-3 h-3" />
                Add requirement
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Skills Required</label>
              {form.skills_required.map((skill, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={skill}
                    onChange={e => updateField('skills_required', i, e.target.value)}
                    placeholder={`Skill ${i + 1} (e.g., Python, Excel)`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {form.skills_required.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeField('skills_required', i)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addField('skills_required')}
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium mt-1"
              >
                <Plus className="w-3 h-3" />
                Add skill
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={e => handleSubmit(e, 'draft')}
            disabled={loading || !canCreate}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={e => handleSubmit(e, 'pending_approval')}
            disabled={loading || !canCreate}
            className="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Submit for Approval
          </button>
        </div>
      </form>
    </div>
  );
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
