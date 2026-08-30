'use client';

import { useEffect, useState } from 'react';
import { Loader2, Heart } from 'lucide-react';
import type { StudentSchoolSelection } from '@/lib/schools-data';
import { SchoolCard } from '@/components/schools/school-card';

export function MySchoolShortlist() {
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<StudentSchoolSelection[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/schools/selections')
      .then((r) => r.json())
      .then((json) => { if (!cancelled) setFavorites(json.data || []); })
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

  if (favorites.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
        <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
          <Heart className="w-7 h-7 text-red-400" />
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">Your Shortlist Is Empty</h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          Tap the heart icon on any school in the Discover tab to save it here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {favorites.filter((f) => f.school).map((f) => (
        <SchoolCard key={f.id} school={f.school!} />
      ))}
    </div>
  );
}
