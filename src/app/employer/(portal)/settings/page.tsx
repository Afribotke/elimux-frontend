'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getUserWithTimeout } from '@/lib/client-auth';
import {
  Building2,
  Save,
  Loader2,
  Plus,
  X,
  Trash2,
  Palette,
  Users,
  Briefcase
} from 'lucide-react';
import BrandingPanel from '@/components/employer/BrandingPanel';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

type Department = {
  id: string;
  name: string;
  description: string | null;
  head_name: string | null;
  head_email: string | null;
  max_interns: number;
};

// Field names below match the live `employers` table columns (confirmed via
// schema introspection) - this page used to send name/website/phone/address/
// email, none of which exist as columns, so every save silently failed.
type EmployerProfile = {
  id: string;
  company_name: string;
  description: string | null;
  industry: string | null;
  website_url: string | null;
  company_email: string;
  company_phone: string | null;
  location_address: string | null;
  company_size: string | null;
  nita_employer_number: string | null;
  year_established: number | null;
  registration_number: string | null;
  county: string | null;
  town: string | null;
  branding_primary_color: string | null;
  logo_url: string | null;
  brand_colors: Partial<{
    primary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    heading: string;
  }> | null;
};

export default function SettingsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'company' | 'departments' | 'branding'>('company');
  const [employer, setEmployer] = useState<EmployerProfile | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [userRole, setUserRole] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await getUserWithTimeout();
    if (!user) return;

    const { data: me } = await supabase
      .from('employer_team_members')
      .select('role, employer_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!me) return;
    setUserRole(me.role);

    const { data: emp } = await supabase
      .from('employers')
      .select('*')
      .eq('id', me.employer_id)
      .single();

    if (emp) setEmployer(emp);

    const { data: depts } = await supabase
      .from('employer_departments')
      .select('*')
      .eq('employer_id', me.employer_id)
      .order('name');

    setDepartments(depts || []);
    setLoading(false);
  }

  async function saveCompany(e: React.FormEvent) {
    e.preventDefault();
    if (!employer) return;
    setSaving(true);
    setMessage('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setMessage('Error: Please log in again');
        setSaving(false);
        return;
      }

      const res = await fetch(`${API_URL}/api/employers/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          company_name: employer.company_name,
          description: employer.description,
          industry: employer.industry,
          website_url: employer.website_url,
          company_phone: employer.company_phone,
          company_email: employer.company_email,
          location_address: employer.location_address,
          company_size: employer.company_size,
          nita_employer_number: employer.nita_employer_number,
          year_established: employer.year_established,
          registration_number: employer.registration_number,
          county: employer.county,
          town: employer.town,
        }),
      });

      if (res.status === 401) {
        setMessage('Error: Please log in again');
      } else if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setMessage(`Error: ${body.error || 'Failed to save company details'}`);
      } else {
        setMessage('Company details saved successfully');
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message || 'Network error'}`);
    } finally {
      setSaving(false);
    }
  }

  async function addDepartment(e: React.FormEvent) {
    e.preventDefault();
    if (!employer) return;

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const { error } = await supabase
      .from('employer_departments')
      .insert({
        employer_id: employer.id,
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        head_name: formData.get('head_name') as string,
        head_email: formData.get('head_email') as string,
        max_interns: parseInt(formData.get('max_interns') as string) || 5,
      });

    if (!error) {
      form.reset();
      loadData();
      setMessage('Department added');
    } else {
      setMessage(`Error: ${error.message}`);
    }
  }

  async function deleteDepartment(id: string) {
    if (!confirm('Delete this department?')) return;
    const { error } = await supabase
      .from('employer_departments')
      .delete()
      .eq('id', id);

    if (!error) {
      loadData();
      setMessage('Department deleted');
    }
  }

  const canEdit = ['super_admin', 'admin'].includes(userRole);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your organization profile and preferences</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg text-sm ${
          message.includes('Error')
            ? 'bg-red-50 border border-red-200 text-red-700'
            : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-8 w-fit">
        {[
          { id: 'company' as const, label: 'Company', icon: Building2 },
          { id: 'departments' as const, label: 'Departments', icon: Briefcase },
          { id: 'branding' as const, label: 'Branding', icon: Palette },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Company Tab */}
      {activeTab === 'company' && employer && (
        <form onSubmit={saveCompany} className="max-w-2xl space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Company Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  value={employer.company_name}
                  onChange={e => setEmployer({ ...employer, company_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={!canEdit}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={employer.description || ''}
                  onChange={e => setEmployer({ ...employer, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!canEdit}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                <input
                  type="text"
                  value={employer.industry || ''}
                  onChange={e => setEmployer({ ...employer, industry: e.target.value })}
                  placeholder="e.g., Government, Technology, Finance"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!canEdit}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  type="url"
                  value={employer.website_url || ''}
                  onChange={e => setEmployer({ ...employer, website_url: e.target.value })}
                  placeholder="https://"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!canEdit}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={employer.company_phone || ''}
                  onChange={e => setEmployer({ ...employer, company_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!canEdit}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={employer.company_email}
                  onChange={e => setEmployer({ ...employer, company_email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!canEdit}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={employer.location_address || ''}
                  onChange={e => setEmployer({ ...employer, location_address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!canEdit}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
                <select
                  value={employer.company_size || ''}
                  onChange={e => setEmployer({ ...employer, company_size: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!canEdit}
                  aria-label="Company Size"
                >
                  <option value="">Select...</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501-1000">501-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year Established</label>
                <input
                  type="number"
                  value={employer.year_established || ''}
                  onChange={e => setEmployer({ ...employer, year_established: parseInt(e.target.value) || null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!canEdit}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NITA Employer Number</label>
                <input
                  type="text"
                  value={employer.nita_employer_number || ''}
                  onChange={e => setEmployer({ ...employer, nita_employer_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!canEdit}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                <input
                  type="text"
                  value={employer.registration_number || ''}
                  onChange={e => setEmployer({ ...employer, registration_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!canEdit}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">County</label>
                <input
                  type="text"
                  value={employer.county || ''}
                  onChange={e => setEmployer({ ...employer, county: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!canEdit}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Town/City</label>
                <input
                  type="text"
                  value={employer.town || ''}
                  onChange={e => setEmployer({ ...employer, town: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!canEdit}
                />
              </div>
            </div>

            {canEdit && (
              <div className="mt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            )}
          </div>
        </form>
      )}

      {/* Departments Tab */}
      {activeTab === 'departments' && (
        <div className="space-y-6">
          {/* Add Department */}
          {canEdit && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Add Department</h2>
              <form onSubmit={addDepartment} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Head Name</label>
                  <input
                    type="text"
                    name="head_name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Head Email</label>
                  <input
                    type="email"
                    name="head_email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Interns</label>
                  <input
                    type="number"
                    name="max_interns"
                    defaultValue={5}
                    min={1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add Department
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Department List */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Departments ({departments.length})</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {departments.map(dept => (
                <div key={dept.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <h3 className="font-medium text-gray-900">{dept.name}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {dept.head_name || 'No head assigned'} · Max {dept.max_interns} interns
                    </p>
                    {dept.description && (
                      <p className="text-sm text-gray-400 mt-1">{dept.description}</p>
                    )}
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => deleteDepartment(dept.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {departments.length === 0 && (
                <div className="px-6 py-8 text-center text-gray-400">
                  <Briefcase className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                  <p>No departments yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Branding Tab */}
      {activeTab === 'branding' && employer && (
        <BrandingPanel
          employer={employer}
          canEdit={canEdit}
          onSaved={(msg) => {
            setMessage(msg);
            loadData();
          }}
        />
      )}
    </div>
  );
}
