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
          <h3 className="text-display-3 text-gray-900 dark:text-white">🔥 Popular Programs</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (programs.length === 0) return null;

  return (
    <div className="mt-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-display-3 text-gray-900 dark:text-white">🔥 Popular Programs</h3>
        <a href="/programs" className="text-gray-400 text-sm hover:text-gray-600 dark:hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-1 rounded">Explore all →</a>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {programs.map((p) => {
          const categoryColor = p.category?.color || '#6b7280';
          return (
            <Link
              key={p.id}
              href={`/programs/${p.id}/`}
              className="block bg-white border border-gray-200 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 dark:bg-elimux-card dark:border-border rounded-2xl overflow-hidden transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
            >
              {/* No image field exists on programs in this data model
                  (checked ProgramRow/ProgramCard - neither has one) - a
                  category-colored placeholder block stands in rather than
                  a broken/fake <img>, keeping the same aspect ratio a real
                  image would use. */}
              <div
                className="aspect-video flex items-center justify-center text-3xl"
                style={{ backgroundColor: categoryColor + '1a' }}
              >
                🎓
              </div>
              <div className="p-4">
                <span className="text-gray-900 dark:text-white text-sm font-medium leading-tight block mb-1">{p.name}</span>
                <div className="text-gray-500 dark:text-muted text-xs mb-3">{p.institution?.name || 'Unknown Institution'}</div>
                <div className="flex items-center justify-between">
                  {p.category?.name ? (
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                      style={{ backgroundColor: categoryColor + '1a', color: categoryColor }}
                    >
                      {p.category.name}
                    </span>
                  ) : <span />}
                  {p.duration_months && (
                    <span className="text-gray-400 dark:text-muted text-xs">{p.duration_months} months</span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
