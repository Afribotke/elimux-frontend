'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, GitCompare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { SchoolSearchFilters, SeniorSchool } from '@/lib/schools-data';
import { SchoolSearchBar } from '@/components/schools/search-bar';
import { FilterPanel } from '@/components/schools/filter-panel';
import { SchoolCard } from '@/components/schools/school-card';
import { PathwayRecommendations } from '@/components/schools/pathway-recommendations';
import { MySchoolShortlist } from '@/components/schools/my-school-shortlist';
import { ComparisonDrawer } from '@/components/schools/comparison-drawer';

type Tab = 'discover' | 'pathway' | 'shortlist';

function SchoolsPageInner() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = (searchParams.get('tab') as Tab) || 'discover';

  const [filters, setFilters] = useState<SchoolSearchFilters>({ page: 1, limit: 24 });
  const [schools, setSchools] = useState<SeniorSchool[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const setTab = (t: Tab) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set('tab', t);
    router.push(`/schools?${sp.toString()}`);
  };

  const fetchSchools = useCallback(async (f: SchoolSearchFilters) => {
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      if (f.region) sp.set('region', f.region);
      if (f.county) sp.set('county', f.county);
      if (f.gender) sp.set('gender', f.gender);
      if (f.accommodation_type) sp.set('accommodation_type', f.accommodation_type);
      if (f.cluster_type) sp.set('cluster_type', f.cluster_type);
      if (f.q) sp.set('q', f.q);
      sp.set('page', String(f.page || 1));
      sp.set('limit', String(f.limit || 24));

      const res = await fetch(`/api/schools/search?${sp.toString()}`);
      const json = await res.json();
      setSchools(json.data || []);
      setTotal(json.meta?.total || 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'discover') fetchSchools(filters);
  }, [tab, filters, fetchSchools]);

  const handleSearch = (query: string) => {
    setFilters({ page: 1, limit: 24, q: query || undefined });
  };

  const toggleCompare = (id: string) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const compareSchools = schools.filter((s) => compareIds.includes(s.id));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Senior School Discovery</h1>
        <p className="text-gray-600 mt-1 text-sm">
          Browse public C1 senior schools, get pathway-matched recommendations, and build your shortlist.
        </p>
      </div>

      <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
        {([
          ['discover', 'Discover'],
          ['pathway', 'My Pathway'],
          ['shortlist', 'My Shortlist'],
        ] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              tab === key ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'discover' && (
        <div>
          <div className="mb-6">
            <SchoolSearchBar onSearch={handleSearch} initialValue={filters.q} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
            <FilterPanel filters={filters} onChange={setFilters} />
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">{loading ? 'Searching…' : `${total} school${total === 1 ? '' : 's'} found`}</p>
                {compareIds.length > 0 && (
                  <button
                    onClick={() => setCompareOpen(true)}
                    className="flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:underline"
                  >
                    <GitCompare className="w-4 h-4" /> Compare ({compareIds.length})
                  </button>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16 text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : schools.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-16">No schools match these filters yet.</p>
              ) : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {schools.map((s) => (
                    <div key={s.id} className="relative">
                      <label className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-white/90 rounded px-1.5 py-1 text-xs text-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={compareIds.includes(s.id)}
                          onChange={() => toggleCompare(s.id)}
                          disabled={!compareIds.includes(s.id) && compareIds.length >= 3}
                          className="w-3.5 h-3.5"
                        />
                        Compare
                      </label>
                      <SchoolCard school={s} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'pathway' && (
        user ? <PathwayRecommendations /> : (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <p className="text-sm text-gray-500 mb-4">Sign in to see recommendations for your chosen pathway.</p>
            <a href="/auth/login?redirect=/schools?tab=pathway" className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              Sign In
            </a>
          </div>
        )
      )}

      {tab === 'shortlist' && (
        user ? <MySchoolShortlist /> : (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <p className="text-sm text-gray-500 mb-4">Sign in to save schools to your shortlist.</p>
            <a href="/auth/login?redirect=/schools?tab=shortlist" className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              Sign In
            </a>
          </div>
        )
      )}

      <ComparisonDrawer
        schools={compareSchools}
        onRemove={(id) => setCompareIds((prev) => prev.filter((c) => c !== id))}
        onClose={() => setCompareOpen(false)}
        open={compareOpen}
      />
    </div>
  );
}

export default function SchoolsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>}>
      <SchoolsPageInner />
    </Suspense>
  );
}
