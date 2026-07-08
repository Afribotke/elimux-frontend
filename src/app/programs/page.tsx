'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ProgramCard from '@/components/ProgramCard';
import { Loader2, Filter, Search } from 'lucide-react';

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
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [categories, setCategories] = useState<{id: string; name: string}[]>([]);
  const [countries, setCountries] = useState<{id: string; name: string}[]>([]);
  const [levels, setLevels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    category: '',
    country: '',
    level: '',
    search: '',
    minFees: '',
    maxFees: '',
  });
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 12;

  // Fetch filter options
  useEffect(() => {
    async function fetchFilters() {
      const [{ data: cats }, { data: ctry }, { data: lvls }] = await Promise.all([
        supabase.from('program_categories').select('id,name').eq('is_active', true).order('name'),
        supabase.from('countries').select('id,name').eq('is_active', true).order('name'),
        supabase.from('programs').select('level').eq('is_active', true).not('level', 'is', null),
      ]);
      setCategories(cats || []);
      setCountries(ctry || []);
      const uniqueLevels = [...new Set((lvls || []).map((l: any) => l.level))].sort();
      setLevels(uniqueLevels);
    }
    fetchFilters();
  }, []);

  // Fetch programs with filters
  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('programs')
      .select(
        'id,name,slug,description,duration_months,tuition_fees,currency,level,mode,institution:institutions!inner(id,name,city,country:countries(name,flag_emoji)),category:program_categories(id,name,color,icon)',
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
    }
    setLoading(false);
  }, [filters, page]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const clearFilters = () => {
    setFilters({ category: '', country: '', level: '', search: '', minFees: '', maxFees: '' });
    setPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Explore Programs</h1>
          <p className="mt-2 text-gray-600">Discover {totalCount.toLocaleString()} programs from top institutions worldwide</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters Bar */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-800">Filters</h2>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="ml-auto text-sm text-blue-600 hover:text-blue-800">
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search programs..."
                value={filters.search}
                onChange={(e) => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Category */}
            <select
              value={filters.category}
              onChange={(e) => { setFilters(f => ({ ...f, category: e.target.value })); setPage(1); }}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Max fees (USD)"
              value={filters.maxFees}
              onChange={(e) => { setFilters(f => ({ ...f, maxFees: e.target.value })); setPage(1); }}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {programs.length} of {totalCount.toLocaleString()} programs
          {hasActiveFilters && ' (filtered)'}
        </div>

        {/* Programs Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : programs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No programs found matching your criteria.</p>
            <button onClick={clearFilters} className="mt-4 text-blue-600 hover:text-blue-800">
              Clear filters and try again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program) => (
              <Link key={program.id} href={`/programs/${program.id}/`}>
                <ProgramCard program={program} />
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
              className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
