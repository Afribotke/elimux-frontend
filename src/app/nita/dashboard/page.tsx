'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

interface DashboardStats {
  summary: {
    total_attachments: number; active_attachments: number; completed_attachments: number;
    completion_rate: number; avg_evaluation_score: number; total_employers: number;
    nita_registered_employers: number; compliance_rate: number; open_flags: number;
  };
  open_flags: any[];
}

export default function NitaDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { checkAuth(); }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/nita/login'); return; }

    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).single();
    if (!['nita_admin', 'elimux_admin', 'admin'].includes(roleData?.role)) {
      router.push('/'); return;
    }
    fetchDashboard(session.access_token);
  }

  async function fetchDashboard(token: string) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nita/dashboard`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to load dashboard');
      setStats(await res.json());
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  }

  if (loading) return <div className="p-8 text-center">Loading NITA dashboard...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!stats) return null;

  const s = stats.summary;
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">NITA National Dashboard</h1>
        <p className="text-gray-500 mb-8">Real-time attachment and compliance intelligence</p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Attachments" value={s.total_attachments} color="blue" />
          <StatCard label="Active Now" value={s.active_attachments} color="green" />
          <StatCard label="Completed" value={s.completed_attachments} color="purple" />
          <StatCard label="Completion Rate" value={`${s.completion_rate}%`} color="indigo" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Employers" value={s.total_employers} color="gray" />
          <StatCard label="NITA Registered" value={s.nita_registered_employers} color="emerald" />
          <StatCard label="Compliance Rate" value={`${s.compliance_rate}%`} color={s.compliance_rate > 80 ? 'emerald' : 'amber'} />
          <StatCard label="Open Flags" value={s.open_flags} color={s.open_flags > 0 ? 'red' : 'emerald'} />
        </div>

        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Open Compliance Flags</h2>
          {stats.open_flags.length === 0 ? (
            <p className="text-green-600">All employers are compliant. No flags raised.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr><th className="px-4 py-2 text-left">Employer</th><th className="px-4 py-2 text-left">Flag Type</th><th className="px-4 py-2 text-left">Reason</th><th className="px-4 py-2 text-left">Severity</th></tr>
                </thead>
                <tbody>
                  {stats.open_flags.map((flag: any) => (
                    <tr key={flag.id} className="border-t">
                      <td className="px-4 py-2">{flag.employer?.company_name || 'Unknown'}</td>
                      <td className="px-4 py-2 capitalize">{flag.flag_type.replace('_', ' ')}</td>
                      <td className="px-4 py-2">{flag.flag_reason}</td>
                      <td className="px-4 py-2"><SeverityBadge severity={flag.severity} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button onClick={() => router.push('/nita/compliance')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">View Full Compliance Report</button>
          <button onClick={() => router.push('/nita/reports')} className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900">Export Reports</button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700', green: 'bg-green-50 text-green-700', purple: 'bg-purple-50 text-purple-700',
    indigo: 'bg-indigo-50 text-indigo-700', gray: 'bg-gray-50 text-gray-700', emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700', red: 'bg-red-50 text-red-700',
  };
  return (
    <div className={`rounded-xl p-4 ${colorMap[color] || colorMap.gray}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = { critical: 'bg-red-100 text-red-700', warning: 'bg-amber-100 text-amber-700', info: 'bg-blue-100 text-blue-700' };
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[severity] || styles.info}`}>{severity}</span>;
}
