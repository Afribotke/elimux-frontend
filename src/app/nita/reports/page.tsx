'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export default function NitaReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReports(); }, []);
  async function fetchReports() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/nita/login'); return; }
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nita/reports`, { headers: { Authorization: `Bearer ${session.access_token}` } });
    if (res.ok) { const data = await res.json(); setReports(data.data || []); }
    setLoading(false);
  }
  function downloadCSV() {
    if (reports.length === 0) return;
    const headers = Object.keys(reports[0]).join(',');
    const rows = reports.map(r => Object.values(r).join(','));
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `nita_report_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  }
  if (loading) return <div className="p-8">Loading reports...</div>;
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">NITA Reports Archive</h1>
          <button onClick={downloadCSV} disabled={reports.length === 0} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">Download CSV</button>
        </div>
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr><th className="px-4 py-3 text-left">Date</th><th className="px-4 py-3 text-left">Total</th><th className="px-4 py-3 text-left">Active</th><th className="px-4 py-3 text-left">Completed</th><th className="px-4 py-3 text-left">Employers</th><th className="px-4 py-3 text-left">Compliant</th><th className="px-4 py-3 text-left">Avg Score</th></tr>
            </thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3">{new Date(r.snapshot_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{r.total_attachments}</td>
                  <td className="px-4 py-3">{r.active_attachments}</td>
                  <td className="px-4 py-3">{r.completed_attachments}</td>
                  <td className="px-4 py-3">{r.total_employers}</td>
                  <td className="px-4 py-3">{r.compliant_employers}</td>
                  <td className="px-4 py-3">{r.avg_evaluation_score || 'N/A'}</td>
                </tr>
              ))}
              {reports.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No snapshots yet. Run Generate Snapshot from the dashboard.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
