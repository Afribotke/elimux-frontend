'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

interface Department {
  id: string;
  name: string;
}

interface Requisition {
  id: string;
  title: string;
  description: string;
  requirements: string[] | null;
  skills_required: string[] | null;
  status: string;
  number_of_slots: number;
  duration_months: number;
  stipend_amount: number | null;
  stipend_currency: string | null;
  location_type: string | null;
  location_city: string | null;
  start_date: string | null;
  created_at: string;
  hr_notes: string | null;
  rejection_reason: string | null;
  department: { id: string; name: string } | null;
}

export default function EmployerRequisitionsPage() {
  const router = useRouter();
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [canCreate, setCanCreate] = useState(false);
  const [canApprove, setCanApprove] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedReq, setSelectedReq] = useState<Requisition | null>(null);
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/login'); return; }
    const headers = { Authorization: `Bearer ${session.access_token}` };

    const [reqRes, deptRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/requisitions`, { headers }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employers/me/departments`, { headers })
    ]);

    if (reqRes.ok) {
      const data = await reqRes.json();
      setRequisitions(data.data || []);
      setCanCreate(!!data.can_create);
      setCanApprove(!!data.can_approve);
    }
    if (deptRes.ok) {
      const data = await deptRes.json();
      setDepartments(data.data || []);
    }
    setLoading(false);
  }

  async function submitRequisition(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const requirements = (fd.get('requirements') as string).split(',').map(s => s.trim()).filter(Boolean);
    const skills_required = (fd.get('skills_required') as string).split(',').map(s => s.trim()).filter(Boolean);

    const body = {
      department_id: fd.get('department_id') || null,
      title: fd.get('title'),
      description: fd.get('description'),
      requirements,
      skills_required,
      duration_months: parseInt(fd.get('duration_months') as string),
      number_of_slots: parseInt(fd.get('number_of_slots') as string),
      stipend_amount: fd.get('stipend_amount') ? parseInt(fd.get('stipend_amount') as string) : null,
      stipend_currency: fd.get('stipend_currency') || 'KES',
      location_type: fd.get('location_type'),
      location_city: fd.get('location_city'),
      start_date: fd.get('start_date') || null
    };

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/requisitions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      setMessage('✅ Requisition submitted for approval');
      setShowForm(false);
      form.reset();
      fetchData();
    } else {
      const err = await res.json();
      setMessage(`❌ Error: ${err.error || 'Failed to submit'}`);
    }
  }

  async function approve(id: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/requisitions/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ notes })
    });

    if (res.ok) {
      setMessage('✅ Requisition approved and internship posted');
      setSelectedReq(null);
      setNotes('');
      fetchData();
    } else {
      const err = await res.json();
      setMessage(`❌ Error: ${err.error || 'Failed'}`);
    }
  }

  async function reject(id: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/requisitions/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ notes })
    });

    if (res.ok) {
      setMessage('❌ Requisition rejected');
      setSelectedReq(null);
      setNotes('');
      fetchData();
    } else {
      const err = await res.json();
      setMessage(`❌ Error: ${err.error || 'Failed'}`);
    }
  }

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Internship Requisitions</h1>
        <p className="text-gray-500 mb-6">
          {canApprove ? 'Review requests and approve to post live internships' : 'Request interns for your department'}
        </p>

        {message && <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-4">{message}</div>}

        {canCreate && (
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mb-6">
            + New Requisition
          </button>
        )}

        {showForm && (
          <form onSubmit={submitRequisition} className="bg-white rounded-xl shadow p-6 mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select name="department_id" className="w-full px-3 py-2 border rounded-lg">
                <option value="">No specific department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input type="text" name="title" required className="w-full px-3 py-2 border rounded-lg" placeholder="e.g. IT Support Intern" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea name="description" required rows={3} className="w-full px-3 py-2 border rounded-lg" placeholder="Role overview and expectations..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Requirements (comma separated)</label>
              <input type="text" name="requirements" className="w-full px-3 py-2 border rounded-lg" placeholder="Python, SQL, Problem solving" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skills Required (comma separated)</label>
              <input type="text" name="skills_required" className="w-full px-3 py-2 border rounded-lg" placeholder="Communication, Teamwork, Excel" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (months) *</label>
                <input type="number" name="duration_months" required defaultValue={3} min={1} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slots *</label>
                <input type="number" name="number_of_slots" required defaultValue={1} min={1} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stipend (KES)</label>
                <input type="number" name="stipend_amount" className="w-full px-3 py-2 border rounded-lg" placeholder="15000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location Type</label>
                <select name="location_type" className="w-full px-3 py-2 border rounded-lg">
                  <option value="on_site">On-site</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location City</label>
                <input type="text" name="location_city" className="w-full px-3 py-2 border rounded-lg" placeholder="Nairobi" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" name="start_date" className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Submit</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">Cancel</button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Department</th>
                <th className="px-4 py-3 text-left">Slots</th>
                <th className="px-4 py-3 text-left">Duration</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requisitions.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{r.title}</td>
                  <td className="px-4 py-3 text-gray-500">{r.department?.name || '-'}</td>
                  <td className="px-4 py-3">{r.number_of_slots}</td>
                  <td className="px-4 py-3">{r.duration_months} mo</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      r.status === 'pending_approval' ? 'bg-amber-100 text-amber-700' :
                      r.status === 'published' ? 'bg-green-100 text-green-700' :
                      r.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{r.status.replace('_', ' ')}</span>
                  </td>
                  <td className="px-4 py-3">
                    {r.status === 'pending_approval' && canApprove && (
                      <button onClick={() => setSelectedReq(r)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Review</button>
                    )}
                    {r.status === 'published' && <span className="text-green-600 text-sm">✓ Posted</span>}
                    {r.status === 'rejected' && <span className="text-red-600 text-sm">✗ Rejected</span>}
                  </td>
                </tr>
              ))}
              {requisitions.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No requisitions found.</td></tr>}
            </tbody>
          </table>
        </div>

        {selectedReq && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-2">{selectedReq.title}</h2>
              <p className="text-gray-600 mb-4">{selectedReq.description}</p>

              {selectedReq.requirements && selectedReq.requirements.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700">Requirements:</p>
                  <ul className="text-sm text-gray-600 list-disc list-inside">{selectedReq.requirements.map((req, i) => <li key={i}>{req}</li>)}</ul>
                </div>
              )}

              {selectedReq.skills_required && selectedReq.skills_required.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700">Skills:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedReq.skills_required.map((skill, i) => (
                      <span key={i} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div><span className="text-gray-400">Department:</span> {selectedReq.department?.name || 'N/A'}</div>
                <div><span className="text-gray-400">Slots:</span> {selectedReq.number_of_slots}</div>
                <div><span className="text-gray-400">Duration:</span> {selectedReq.duration_months} months</div>
                <div><span className="text-gray-400">Location:</span> {selectedReq.location_type || 'N/A'} {selectedReq.location_city ? `(${selectedReq.location_city})` : ''}</div>
                <div><span className="text-gray-400">Stipend:</span> {selectedReq.stipend_amount ? `${selectedReq.stipend_amount} ${selectedReq.stipend_currency}` : 'Unpaid'}</div>
                <div><span className="text-gray-400">Start:</span> {selectedReq.start_date || 'Not set'}</div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 border rounded-lg" placeholder="Reason for approval or rejection..." />
              </div>

              <div className="flex gap-2">
                <button onClick={() => approve(selectedReq.id)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Approve & Post</button>
                <button onClick={() => reject(selectedReq.id)} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">Reject</button>
                <button onClick={() => setSelectedReq(null)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
