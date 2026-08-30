'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Sparkles } from 'lucide-react';
import type { CareerPathway, SeniorSchool } from '@/lib/schools-data';
import { SchoolCard } from '@/components/schools/school-card';

export function PathwayRecommendations() {
  const [loading, setLoading] = useState(true);
  const [pathway, setPathway] = useState<CareerPathway | null>(null);
  const [schools, setSchools] = useState<SeniorSchool[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/schools/pathway-recommendations')
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        setPathway(json.pathway || null);
        setSchools(json.schools || []);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!pathway) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
        <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-purple-500" />
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">No Active Career Pathway</h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
          Choose a pathway to get school recommendations matched to it.
        </p>
        <Link
          href="/pathways"
          className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Take Career Pathway Assessment
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-5 mb-6 flex items-center gap-4">
        <span className="text-3xl">{pathway.icon}</span>
        <div className="flex-1">
          <p className="text-xs text-gray-500">Your active pathway</p>
          <h3 className="font-bold text-gray-900">{pathway.name}</h3>
        </div>
        <Link href="/pathways" className="text-sm text-blue-700 font-medium hover:underline">Change</Link>
      </div>

      {schools.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-12">No matching schools found yet for this pathway.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {schools.map((s) => <SchoolCard key={s.id} school={s} />)}
        </div>
      )}
    </div>
  );
}
