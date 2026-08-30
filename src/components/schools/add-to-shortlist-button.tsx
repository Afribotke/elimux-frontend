'use client';

import { useEffect, useState } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export function AddToShortlistButton({ schoolId }: { schoolId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [shortlisted, setShortlisted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!user) { setChecked(true); return; }
    let cancelled = false;
    fetch('/api/schools/selections')
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const ids: string[] = (json.data || []).map((f: { school_id: string }) => f.school_id);
        setShortlisted(ids.includes(schoolId));
      })
      .finally(() => { if (!cancelled) setChecked(true); });
    return () => { cancelled = true; };
  }, [user, schoolId]);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      router.push('/auth/login?redirect=/schools');
      return;
    }
    setLoading(true);
    try {
      if (shortlisted) {
        await fetch(`/api/schools/selections?school_id=${schoolId}`, { method: 'DELETE' });
        setShortlisted(false);
      } else {
        await fetch('/api/schools/selections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ school_id: schoolId }),
        });
        setShortlisted(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading || !checked}
      aria-label={shortlisted ? 'Remove from shortlist' : 'Add to shortlist'}
      className={`p-2 rounded-full transition-colors ${
        shortlisted ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400 hover:text-red-500'
      }`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" fill={shortlisted ? 'currentColor' : 'none'} />}
    </button>
  );
}
