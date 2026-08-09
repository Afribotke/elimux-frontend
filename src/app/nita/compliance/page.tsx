'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export default function NitaCompliancePage() {
  const router = useRouter();
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchFlags(); }, []);
  async function fetchFlags() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/nita/login'); return; }
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nita/compliance`, { headers: { Authorization: `Bearer ${session.access_token}` } });
    if (res.ok) { const data = await res.json(); setFlags(data.data || []); }
    setLoading(false);
  }
  async function resolveFlag(id: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nita/compliance/${id}/resolve`, { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` } });
    if (res.ok) fetchFlags();
  }
  if (loading) return <div className="p-8">Loading compliance data...</div>;
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Employer Compliance Monitor</h1>
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr><th className="px-4 py-3 text-left">Employer</th><th className="px-4 py-3 text-left">NITA Reg #</th><th className="px-4 py-3 text-left">Flag</th><th className="px-4 py-3 text-left">Severity</th><th className="px-4 py-3 text-left">Date</th><th className="px-4 py-3 text-left">Action</th></tr>
            </thead>
            <tbody>
              {flags.map(flag => (
                <tr key={flag.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{flag.employer?.company_name}</td>
                  <td className="px-4 py-3 text-gray-500">{flag.employer?.nita_registration_number || 'N/A'}</td>
                  <td className="px-4 py-3 capitalize">{flag.flag_type.replace('_', ' ')}</td>
                  <td className="px-4 py-3"><SeverityBadge severity={flag.severity} /></td>
                  <td className="px-4 py-3 text-gray-500">{new Date(flag.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><button onClick={() => resolveFlag(flag.id)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Mark Resolved</button></td>
                </tr>
              ))}
              {flags.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-green-600">All clear. No compliance flags.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = { critical: 'bg-red-100 text-red-700', warning: 'bg-amber-100 text-amber-700', info: 'bg-blue-100 text-blue-700' };
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[severity] || styles.info}`}>{severity}</span>;
}
