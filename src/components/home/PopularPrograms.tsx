'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { listPrograms, type ProgramRow } from '@/lib/api';

export default function PopularPrograms() {
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPrograms({ limit: 4 })
      .then((res) => setPrograms(res.data))
      .catch((err) => console.error('Popular programs fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mt-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-900 text-sm font-semibold">🔥 Popular Programs</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (programs.length === 0) return null;

  return (
    <div className="mt-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-900 text-sm font-semibold">🔥 Popular Programs</h3>
        <a href="/programs" className="text-gray-400 text-xs hover:text-gray-600 transition-colors">Explore all →</a>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {programs.map((p) => (
          <Link
            key={p.id}
            href={`/programs/${p.id}/`}
            className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-400 hover:shadow-sm transition-all"
          >
            <div className="flex justify-between items-start mb-1">
              <span className="text-gray-900 text-sm font-medium leading-tight">{p.name}</span>
            </div>
            <div className="text-gray-500 text-xs mb-2">{p.institution?.name || 'Unknown Institution'}</div>
            <div className="flex items-center justify-between">
              {p.category?.name ? (
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                  style={{ backgroundColor: (p.category.color || '#6b7280') + '1a', color: p.category.color || '#6b7280' }}
                >
                  {p.category.name}
                </span>
              ) : <span />}
              {p.duration_months && (
                <span className="text-gray-400 text-xs">{p.duration_months} months</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
