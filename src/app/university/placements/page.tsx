'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, hasValidSessionMarkers } from '@/lib/supabase/client';

const supabase = createClient();

interface Student {
  id: string;
  user_id: string;
  student_name: string;
  registration_number: string;
  email: string;
  course: string;
  department: string;
  year_of_study: number;
  attachment_status: string;
}

interface Employer {
  id: string;
  company_name: string;
  location_county: string | null;
  industry: string;
}

interface Placement {
  id: string;
  student_id: string;
  status: string;
  start_date: string;
  end_date: string | null;
  department: string | null;
  supervisor_name: string | null;
  evaluation_score: number | null;
  student: { email: string } | null;
  employer: { company_name: string } | null;
}

export default function UniversityPlacementsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !hasValidSessionMarkers()) { router.push('/login'); return; }

    const placementsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attachments`, {
      headers: { Authorization: `Bearer ${session.access_token}` }
    });
    if (placementsRes.ok) {
      const data = await placementsRes.json();
      setPlacements(data.data || []);
    }

    const empRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/employers`, {
      headers: { Authorization: `Bearer ${session.access_token}` }
    });
    if (empRes.ok) {
      const data = await empRes.json();
      setEmployers(data.data || []);
    }

    // Scope eligible students to this admin's own institution - RLS backs
    // this up, but filtering here too keeps the dropdown correct even if a
    // policy is ever loosened.
    const { data: inst } = await supabase
      .from('institutions')
      .select('id')
      .eq('admin_user_id', session.user.id)
      .maybeSingle();

    if (inst) {
      // 'pending' isn't a legal attachment_status value (CHECK constraint
      // allows not_placed/applied/interview/accepted/rejected/completed) -
      // 'not_placed' is the actual "eligible, not yet assigned" state.
      const { data: eligibleData } = await supabase
        .from('attachment_eligible_students')
        .select('*')
        .eq('institution_id', inst.id)
        .eq('attachment_status', 'not_placed');
      setStudents(eligibleData || []);
    }

    setLoading(false);
  }

  async function createPlacement(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // university_id is derived server-side from the caller's own institution
    // (POST /api/attachments ignores any university_id sent from the client).
    const body = {
      student_id: fd.get('student_id'),
      employer_id: fd.get('employer_id'),
      department: fd.get('department'),
      supervisor_name: fd.get('supervisor_name'),
      supervisor_email: fd.get('supervisor_email'),
      supervisor_phone: fd.get('supervisor_phone'),
      start_date: fd.get('start_date'),
      end_date: fd.get('end_date') || null
    };

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attachments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      setMessage('✅ Placement created successfully');
      setShowForm(false);
      form.reset();
      fetchData();
    } else {
      const err = await res.json();
      setMessage(`❌ Error: ${err.error || 'Failed to create placement'}`);
    }
  }

  async function markComplete(id: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attachments/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ status: 'completed', certificate_issued: true })
    });
    if (res.ok) {
      setMessage('✅ Placement marked as completed');
      fetchData();
    }
  }

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Student Placements</h1>
        <p className="text-gray-500 mb-6">Assign eligible students to employers and track progress</p>

        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            {message}
          </div>
        )}

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + Create New Placement
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Create Placement</h2>
            <form onSubmit={createPlacement} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
                <select name="student_id" required className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Select student...</option>
                  {students.map(s => (
                    <option key={s.user_id} value={s.user_id}>{s.student_name} — {s.course} ({s.registration_number})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employer *</label>
                <select name="employer_id" required className="w-full px-3 py-2 border rounded-lg">
                  <option value="">Select employer...</option>
                  {employers.map(e => (
                    <option key={e.id} value={e.id}>{e.company_name} — {e.industry}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input type="text" name="department" className="w-full px-3 py-2 border rounded-lg" placeholder="e.g. IT Department" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor Name</label>
                <input type="text" name="supervisor_name" className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor Email</label>
                <input type="email" name="supervisor_email" className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor Phone</label>
                <input type="tel" name="supervisor_phone" className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                <input type="date" name="start_date" required className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input type="date" name="end_date" className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="md:col-span-2 flex gap-2">
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Create Placement</button>
                <button type="button" onClick={() => setShowForm(false)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Student</th>
                <th className="px-4 py-3 text-left">Employer</th>
                <th className="px-4 py-3 text-left">Department</th>
                <th className="px-4 py-3 text-left">Dates</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Score</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {placements.map(p => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-3">{p.student?.email || 'Unknown'}</td>
                  <td className="px-4 py-3">{p.employer?.company_name || 'Unknown'}</td>
                  <td className="px-4 py-3">{p.department || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{p.start_date} → {p.end_date || 'Ongoing'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      p.status === 'active' ? 'bg-green-100 text-green-700' :
                      p.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3">{p.evaluation_score ?? '-'}</td>
                  <td className="px-4 py-3">
                    {p.status === 'active' && (
                      <button
                        onClick={() => markComplete(p.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Mark Complete
                      </button>
                    )}
                    {p.status === 'completed' && <span className="text-green-600 text-sm">✓ Done</span>}
                  </td>
                </tr>
              ))}
              {placements.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No placements created yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
