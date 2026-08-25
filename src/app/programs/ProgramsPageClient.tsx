'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ProgramCard from '@/components/ProgramCard';
import ProgramCardSkeleton from '@/components/ProgramCardSkeleton';
import { useCompareSelection } from '@/components/CompareProvider';
import CompareDrawer from '@/components/CompareDrawer';
import { trackSearchAnalytics } from '@/lib/analytics';
import { Loader2, Filter, Search, SearchX, ShieldCheck } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { KCSE_GRADES, gradeToNumeric, type KcseGrade } from '@/lib/kcse-grades';

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
  // classify real institution_types rows by name pattern (see page.tsx's
  // server-side resolution of this) rather than assuming fixed enum values,
  // since institution_types is an admin-managed table, not a fixed set.
  type: string;
  // KCSE grade letter (e.g. "C-"), set by the TVET "Match Your Grade" hero.
  // Filters via programs.minimum_kcse_grade_numeric, the same real column
  // GradeMatcher.tsx already queries on the homepage.
  grade: string;
}

interface ProgramsPageClientProps {
  initialPrograms: Program[];
  initialTotalCount: number;
  initialCategories: { id: string; name: string }[];
  initialCountries: { id: string; name: string }[];
  initialLevels: string[];
  initialInstitutionTypeIds: { university: string[]; tvet: string[] };
  initialFilters: FilterState;
  initialPage: number;
}

function ProgramsPageInner({
  initialPrograms,
  initialTotalCount,
  initialCategories,
  initialCountries,
  initialLevels,
  initialInstitutionTypeIds,
  initialFilters,
  initialPage,
}: ProgramsPageClientProps) {
  const searchParams = useSearchParams();
  const { selectedIds, isSelected, canAddMore, toggle } = useCompareSelection();

  const [programs, setPrograms] = useState<Program[]>(initialPrograms);
  const [categories] = useState(initialCategories);
  const [countries] = useState(initialCountries);
  const [levels] = useState(initialLevels);
  const [institutionTypeIds] = useState(initialInstitutionTypeIds);
  // The server already fetched the first page before this component ever mounts, so
  // there's nothing to show a spinner for on load - only later filter/page changes
  // set this true.
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [heroGrade, setHeroGrade] = useState<KcseGrade>('C+');
  const [page, setPage] = useState(initialPage);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const PAGE_SIZE = 12;
  // Results grid sits well below the fold under the TVET hero (badge,
  // headline, subheadline, credibility line, grade selector, button,
  // divider, browse link) - "Find My TVET Path" scrolls to this so the
  // filtered grid is actually visible after the state update, instead of
  // updating silently off-screen and looking like the click did nothing.
  const resultsRef = useRef<HTMLDivElement | null>(null);

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
    if (filters.grade) params.set('grade', filters.grade);
    if (page > 1) params.set('page', page.toString());

    const query = params.toString();
    const newUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }, [filters, page]);

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
    if (filters.grade) {
      query = query.lte('minimum_kcse_grade_numeric', gradeToNumeric(filters.grade));
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

  // Server component already ran this exact query for the initial filters/page before
  // this component mounted (see page.tsx), so the first run of this effect has nothing
  // to do - only re-fetch when filters/page actually change after mount.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    fetchPrograms();
  }, [fetchPrograms]);

  // Stable "Discover N programs" count for the TVET hero credibility line -
  // scoped only by the TVET institution-type filter (not category/level/
  // search/grade), so it reads as "size of the whole TVET catalog" rather
  // than fluctuating as the visitor narrows the results below. Real,
  // freshly-queried count (see docs/bridge.md for why: 89% of active TVET
  // programs sit under institutions not currently tveta_accredited, so
  // this line intentionally does not claim per-program accreditation -
  // it states the regulatory framework TVET training in Kenya operates
  // under, same distinction TvetaBadge.tsx already draws elsewhere).
  const [tvetTotalCount, setTvetTotalCount] = useState<number | null>(null);

  useEffect(() => {
    if (filters.type !== 'tvet' || institutionTypeIds.tvet.length === 0) return;
    let cancelled = false;
    const fetchCount = () => {
      supabase
        .from('programs')
        .select('id, institution:institutions!inner(type_id)', { count: 'exact', head: true })
        .eq('is_active', true)
        .in('institution.type_id', institutionTypeIds.tvet)
        .then(({ count }) => {
          if (!cancelled) setTvetTotalCount(count ?? null);
        });
    };
    fetchCount();
    // Re-poll while the visitor stays on the TVET page, so the count ticks
    // up as the TVETA scraper adds institutions without needing a refresh.
    const interval = setInterval(fetchCount, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [filters.type, institutionTypeIds.tvet]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const clearFilters = () => {
    setFilters({ category: '', country: '', level: '', search: '', minFees: '', maxFees: '', type: '', grade: '' });
    setPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  const handleFindTvetPath = () => {
    setFilters((f) => ({ ...f, grade: heroGrade }));
    setPage(1);
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleBrowseAllTvet = () => {
    setFilters((f) => ({ ...f, grade: '' }));
    setPage(1);
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className={`min-h-screen bg-muted ${selectedIds.length > 0 ? 'pb-20' : ''}`}>
      {/* Header — TVET gets the "Match Your Grade" hero instead of the
          generic header, since this shared /programs?type=tvet view is
          the only TVET entry point (no dedicated /tvet route exists). */}
      {filters.type === 'tvet' ? (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900">
          <div className="max-w-3xl mx-auto py-16 px-4 text-center">
            <div className="flex items-center gap-2 mx-auto mb-4 w-fit bg-primary-500/20 text-primary-300 border border-primary-500/30 rounded-full px-4 py-1.5 text-sm font-medium">
              <span>🎯 Match Your Grade</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold text-white text-balance">
              Your Grade Opens Doors — Find Your Path
            </h1>

            <p className="text-lg text-gray-300 mt-4 max-w-xl mx-auto">
              TVET programs welcome all KCSE grades. Discover what you can become.
            </p>

            {tvetTotalCount === null ? (
              <div className="h-4 w-64 bg-slate-700/60 rounded animate-pulse mx-auto mt-2 mb-6" aria-hidden="true" />
            ) : (
              <p className="flex items-center justify-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 mt-2 mb-6">
                <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Discover {tvetTotalCount.toLocaleString()} programs from top TVET institutions — TVET training in Kenya is regulated by the TVET Authority
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
              <span className="text-gray-300 text-lg">I got</span>
              <div className="relative">
                <select
                  value={heroGrade}
                  onChange={(e) => setHeroGrade(e.target.value as KcseGrade)}
                  aria-label="My KCSE Grade"
                  className="bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-lg min-w-[140px] outline-none appearance-none text-center focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                >
                  {KCSE_GRADES.map((g) => (
                    <option key={g.grade} value={g.grade}>{g.grade}</option>
                  ))}
                </select>
              </div>
              <span className="text-gray-300 text-lg">What can I study?</span>
            </div>

            <button
              onClick={handleFindTvetPath}
              disabled={loading}
              className="mt-6 bg-primary-600 hover:bg-primary-500 text-white rounded-xl px-8 py-3 text-lg font-semibold transition-colors disabled:opacity-70 disabled:cursor-wait focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            >
              {loading ? '⏳ Finding your path...' : '🔍 Find My TVET Path'}
            </button>

            <div className="flex items-center gap-4 max-w-xs mx-auto mt-8">
              <div className="h-px bg-gray-700 flex-1" />
              <span className="text-gray-500 text-sm">or</span>
              <div className="h-px bg-gray-700 flex-1" />
            </div>

            <button
              onClick={handleBrowseAllTvet}
              className="mt-3 text-primary-400 hover:text-primary-300 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded"
            >
              Browse All TVET Programs →
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-background border-b">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-balance text-display-2 font-bold text-foreground">Explore Programs</h1>
            <p className="mt-2 text-muted-foreground">Discover {totalCount.toLocaleString()} programs from top institutions worldwide</p>
          </div>
        </div>
      )}

      <div ref={resultsRef} className="max-w-7xl mx-auto px-4 py-6 scroll-mt-4">
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
          filters.type === 'tvet' && filters.grade ? (
            <EmptyState
              icon={<SearchX className="w-8 h-8" />}
              title="No programs found for this exact grade"
              description="Try browsing all TVET programs or contact institutions directly."
              action={<Button onClick={handleBrowseAllTvet}>Browse All TVET Programs</Button>}
            />
          ) : (
            <EmptyState
              icon={<SearchX className="w-8 h-8" />}
              title="No programs found"
              description="No programs match your current filters. Try adjusting or clearing them."
              action={<Button onClick={clearFilters}>Clear filters and try again</Button>}
            />
          )
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

export default function ProgramsPageClient(props: ProgramsPageClientProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-muted flex justify-center py-24" role="status" aria-label="Loading programs">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      }
    >
      <ProgramsPageInner {...props} />
    </Suspense>
  );
}
