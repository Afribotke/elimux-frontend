'use client';
import { useEffect, useState } from 'react';

interface NitaBadgeProps { employerId: string; showDetails?: boolean; }

export default function NitaComplianceBadge({ employerId, showDetails = false }: NitaBadgeProps) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStatus(); }, [employerId]);
  async function fetchStatus() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nita/employer/${employerId}/status`);
      if (res.ok) { const data = await res.json(); setStatus(data); }
    } catch (e) { console.error('NITA status fetch failed', e); } finally { setLoading(false); }
  }

  if (loading) return <span className="text-xs text-gray-400">Checking NITA...</span>;
  const isCompliant = status?.nita_compliant;
  const flags = status?.open_flags || [];

  return (
    <div className="inline-flex flex-col gap-1">
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${isCompliant ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>
        {isCompliant ? '✓ NITA Verified' : '⚠ NITA Unverified'}
      </span>
      {showDetails && flags.length > 0 && (
        <ul className="text-xs text-amber-700 mt-1 space-y-1">{flags.map((f: any) => <li key={f.id}>• {f.flag_reason}</li>)}</ul>
      )}
    </div>
  );
}
