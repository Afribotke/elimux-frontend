'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ProgramCard from '@/components/ProgramCard';
import ProgramCardSkeleton from '@/components/ProgramCardSkeleton';
import { CompareProvider, useCompareSelection } from '@/components/CompareProvider';
import CompareDrawer from '@/components/CompareDrawer';
import { trackSearchAnalytics } from '@/lib/analytics';
import { Loader2, Filter, Search, SearchX } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';

interface Program {
  id: string;
  name: string;
  slug: string;
  description: string;
  duration_months: number;
  tuition_fees: number;
  currency: string;
  level: string;
  mode: string;
  is_ai_generated: boolean;
  is_verified: boolean;
  institution: {
    id: string;
    name: string;
    city: string;
    country: { name: string; flag_emoji: string };
  };
  category: {
    id: string;
    name: string;
    color: string;
    icon: string;
  };
}

interface FilterState {
  category: string;
  country: string;
  level: string;
  search: string;
  minFees: string;
  maxFees: string;
  // 'university' | 'tvet' | '' — driven by the UnifiedNavBar pills, which
  // classify real institution_types rows by name pattern (see the
  // fetchFilters effect below) rather than assuming fixed enum values,
  // since institution_types is an admin-managed table, not a fixed set.
  type: string;
}

function ProgramsPageInner() {
  const searchParams = useSearchParams();
  const { selectedIds, isSelected, canAddMore, toggle } = useCompareSelection();

  const [programs, setPrograms] = useState<Program[]>([]);
  const [categories, setCategories] = useState<{id: string; name: string}[]>([]);
  const [countries, setCountries] = useState<{id: string; name: string}[]>([]);
  const [levels, setLevels] = useState<string[]>([]);
  const [institutionTypeIds, setInstitutionTypeIds] = useState<{ university: string[]; tvet: string[] }>({ university: [], tvet: [] });
  const [loading, setLoading] = useState(true);
  // Seeded from the URL on first render (not a useEffect) so a shared/bookmarked
  // link with ?country=... renders filtered immediately, instead of fetching
  // once unfiltered and then re-fetching filtered a moment later.
  const [filters, setFilters] = useState<FilterState>(() => ({
    category: searchParams.get('category') || '',
    country: searchParams.get('country') || '',
    level: searchParams.get('level') || '',
    search: searchParams.get('search') || '',
    minFees: searchParams.get('minFees') || '',
    maxFees: searchParams.get('maxFees') || '',
    type: searchParams.get('type') || '',
  }));
  const [page, setPage] = useState(() => {
    const fromUrl = parseInt(searchParams.get('page') || '1', 10);
    return Number.isFinite(fromUrl) && fromUrl > 0 ? fromUrl : 1;
  });
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 12;

  // UnifiedNavBar navigates to /programs?type=... with router.push even when
  // already on this route. Since the route itself doesn't remount, the
  // useState initializer above won't re-run — this effect is what actually
  // applies a pill click made while already on /programs. It only reacts to
  // real Next.js navigations (useSearchParams), not the URL-sync effect
  // below (which uses raw history.replaceState and doesn't feed back here).
  useEffect(() => {
    const urlType = searchParams.get('type') || '';
    setFilters((f) => (f.type === urlType ? f : { ...f, type: urlType }));
  }, [searchParams]);

  // Keep the URL in sync as filters/page change, so the current view stays
  // shareable/bookmarkable. replaceState (not push) so filtering doesn't spam
  // browser history, and it doesn't feed back into useSearchParams() above.
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.country) params.set('country', filters.country);
    if (filters.category) params.set('category', filters.category);
    if (filters.level) params.set('level', filters.level);
    if (filters.search) params.set('search', filters.search);
    if (filters.minFees) params.set('minFees', filters.minFees);
    if (filters.maxFees) params.set('maxFees', filters.maxFees);
    if (filters.type) params.set('type', filters.type);
    if (page > 1) params.set('page', page.toString());

    const query = params.toString();
    const newUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }, [filters, page]);

  // Fetch filter options
  useEffect(() => {
    async function fetchFilters() {
      const [{ data: cats }, { data: ctry }, { data: lvls }, { data: instTypes }] = await Promise.all([
        supabase.from('program_categories').select('id,name').eq('is_active', true).order('name'),
        supabase.from('countries').select('id,name').eq('is_active', true).order('name'),
        supabase.from('programs').select('level').eq('is_active', true).not('level', 'is', null),
        supabase.from('institution_types').select('id,name'),
      ]);
      setCategories(cats || []);
      setCountries(ctry || []);
      const uniqueLevels = [...new Set((lvls || []).map((l: any) => l.level))].sort();
      setLevels(uniqueLevels);

      // institution_types is admin-managed (no fixed enum), so bucket by
      // name pattern rather than assuming specific ids/strings exist.
      const university: string[] = [];
      const tvet: string[] = [];
      for (const t of instTypes || []) {
        if (/tvet|technical|vocational|polytechnic/i.test(t.name)) tvet.push(t.id);
        else if (/universit|college/i.test(t.name)) university.push(t.id);
      }
      setInstitutionTypeIds({ university, tvet });
    }
    fetchFilters();
  }, []);

  // Fetch programs with filters
  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('programs')
      .select(
        'id,name,slug,description,duration_months,tuition_fees,currency,level,mode,is_ai_generated,is_verified,institution:institutions!inner(id,name,city,country:countries(name,flag_emoji)),category:program_categories(id,name,color,icon)',
        { count: 'exact' }
      )
      .eq('is_active', true)
      .order('name');

    if (filters.category) query = query.eq('category_id', filters.category);
    if (filters.country) query = query.eq('institution.country_id', filters.country);
    if (filters.level) query = query.eq('level', filters.level);
    if (filters.search) query = query.ilike('name', `%${filters.search}%`);
    if (filters.minFees) query = query.gte('tuition_fees', parseFloat(filters.minFees));
    if (filters.maxFees) query = query.lte('tuition_fees', parseFloat(filters.maxFees));
    if (filters.type === 'university' || filters.type === 'tvet') {
      const ids = institutionTypeIds[filters.type];
      // No matching institution_types rows yet (still loading, or none
      // configured) - filter to zero results rather than silently ignoring
      // the pill and showing everything.
      query = query.in('institution.type_id', ids.length > 0 ? ids : ['00000000-0000-0000-0000-000000000000']);
    }

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, count, error } = await query.range(from, to);

    if (error) {
      console.error('Error fetching programs:', error);
    } else {
      // The untyped supabase client can't infer embedded-relation cardinality,
      // so it types to-one joins (institution, category) as arrays; PostgREST
      // actually returns a single object for each here.
      setPrograms((data as unknown as Program[]) || []);
      setTotalCount(count || 0);
      trackSearchAnalytics({
        query: filters.search || undefined,
        category_id: filters.category || undefined,
        country_id: filters.country || undefined,
        level: filters.level || undefined,
        results_count: count || 0,
      });
    }
    setLoading(false);
  }, [filters, page, institutionTypeIds]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const clearFilters = () => {
    setFilters({ category: '', country: '', level: '', search: '', minFees: '', maxFees: '', type: '' });
    setPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  return (
    <div className={`min-h-screen bg-muted ${selectedIds.length > 0 ? 'pb-20' : ''}`}>
      {/* Header */}
      <div className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-balance text-display-2 font-bold text-foreground">Explore Programs</h1>
          <p className="mt-2 text-muted-foreground">Discover {totalCount.toLocaleString()} programs from top institutions worldwide</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters Bar */}
        <div className="bg-background rounded-lg shadow-card border p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-primary-600" />
            <h2 className="font-semibold text-foreground">Filters</h2>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="ml-auto text-sm text-primary-600 hover:text-primary-700 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search programs..."
                value={filters.search}
                onChange={(e) => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }}
                className="w-full pl-10 pr-4 py-3 min-h-[44px] border rounded-lg transition-all focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Category */}
            <select
              value={filters.category}
              onChange={(e) => { setFilters(f => ({ ...f, category: e.target.value })); setPage(1); }}
              className="w-full px-4 py-3 min-h-[44px] border rounded-lg transition-all focus:ring-2 focus:ring-primary-500"
              aria-label="Category"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Country */}
            <select
              value={filters.country}
              onChange={(e) => { setFilters(f => ({ ...f, country: e.target.value })); setPage(1); }}
              className="w-full px-4 py-3 min-h-[44px] border rounded-lg transition-all focus:ring-2 focus:ring-primary-500"
              aria-label="Country"
            >
              <option value="">All Countries</option>
              {countries.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* Level */}
            <select
              value={filters.level}
              onChange={(e) => { setFilters(f => ({ ...f, level: e.target.value })); setPage(1); }}
              className="w-full px-4 py-3 min-h-[44px] border rounded-lg transition-all focus:ring-2 focus:ring-primary-500"
              aria-label="Education Level"
            >
              <option value="">All Levels</option>
              {levels.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          {/* Fee Range */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <input
              type="number"
              placeholder="Min fees (USD)"
              value={filters.minFees}
              onChange={(e) => { setFilters(f => ({ ...f, minFees: e.target.value })); setPage(1); }}
              className="w-full px-4 py-3 min-h-[44px] border rounded-lg transition-all focus:ring-2 focus:ring-primary-500"
            />
            <input
              type="number"
              placeholder="Max fees (USD)"
              value={filters.maxFees}
              onChange={(e) => { setFilters(f => ({ ...f, maxFees: e.target.value })); setPage(1); }}
              className="w-full px-4 py-3 min-h-[44px] border rounded-lg transition-all focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {programs.length} of {totalCount.toLocaleString()} programs
          {hasActiveFilters && ' (filtered)'}
        </div>

        {/* Programs Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <ProgramCardSkeleton key={i} />
            ))}
          </div>
        ) : programs.length === 0 ? (
          <EmptyState
            icon={<SearchX className="w-8 h-8" />}
            title="No programs found"
            description="No programs match your current filters. Try adjusting or clearing them."
            action={<Button onClick={clearFilters}>Clear filters and try again</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program) => (
              <Link
                key={program.id}
                href={`/programs/${program.id}/?from=list`}
                className="rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <ProgramCard
                  program={program}
                  compareMode
                  compareSelected={isSelected(program.id)}
                  compareDisabled={!canAddMore}
                  onToggleCompare={toggle}
                />
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2.5 min-h-[44px] border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2.5 min-h-[44px] border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <CompareDrawer programs={programs} />
    </div>
  );
}

export default function ProgramsPage() {
  return (
    <CompareProvider>
      <Suspense
        fallback={
          <div className="min-h-screen bg-muted flex justify-center py-24" role="status" aria-label="Loading programs">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        }
      >
        <ProgramsPageInner />
      </Suspense>
    </CompareProvider>
  );
}

