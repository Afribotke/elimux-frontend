'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, Loader2, GraduationCap, ChevronLeft, ChevronRight, MapPin, Clock, Award } from 'lucide-react';
import Link from 'next/link';

const ITEMS_PER_PAGE = 24;

const GRADE_MAP: Record<string, number> = {
  'A': 12, 'A-': 11, 'B+': 10, 'B': 9, 'B-': 8,
  'C+': 7, 'C': 6, 'C-': 5, 'D+': 4, 'D': 3, 'D-': 2, 'E': 1,
};

interface Program {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  institution_id: string;
  minimum_kcse_grade: string | null;
  minimum_kcse_grade_numeric: number | null;
  kcse_grade_is_estimated: boolean | null;
  duration_months: number | null;
  mode: string | null;
  institution?: { name: string; city: string | null; country?: { name: string } | null } | null;
  category?: { name: string } | null;
}

export default function GradeSearch() {
  const [grade, setGrade] = useState('C+');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  const studentNumeric = GRADE_MAP[grade] || 7;

  const fetchPrograms = useCallback(async (targetPage: number) => {
    try {
      setLoading(true);
      setError(null);

      const from = (targetPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const supabase = createClient();
      const { data, error: sbError, count } = await supabase
        .from('programs')
        .select(`
          id, name, slug, description, institution_id,
          minimum_kcse_grade, minimum_kcse_grade_numeric, kcse_grade_is_estimated,
          duration_months, mode,
          institution:institutions(name, city, country:countries(name)),
          category:program_categories(name)
        `, { count: 'exact' })
        .lte('minimum_kcse_grade_numeric', studentNumeric)
        .eq('is_active', true)
        .order('minimum_kcse_grade_numeric', { ascending: false })
        .range(from, to);

      if (sbError) throw sbError;

      setPrograms((data as unknown as Program[]) || []);
      setTotalCount(count || 0);
      setPage(targetPage);
      setHasSearched(true);
    } catch (err: any) {
      console.error('Grade search error:', err);
      setError(err.message || 'Failed to load programs');
    } finally {
      setLoading(false);
    }
  }, [studentNumeric]);

  const handleSearch = () => {
    setPage(1);
    fetchPrograms(1);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="bg-elimux-card border border-border rounded-2xl p-6 md:p-8 mb-8 shadow-sm">
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-primary-600" />
          What can I study with my KCSE grade?
        </h2>
        <p className="text-muted text-sm md:text-base mb-6">
          Enter your KCSE grade below. We will show you every course and institution you qualify for across ALL categories.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-muted uppercase tracking-wide mb-1.5">
              My KCSE Grade
            </label>
            <select
              value={grade}
              onChange={(e) => { setGrade(e.target.value); setHasSearched(false); }}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            >
              <option value="A">A (Plain)</option>
              <option value="A-">A- (Minus)</option>
              <option value="B+">B+ (Plus)</option>
              <option value="B">B (Plain)</option>
              <option value="B-">B- (Minus)</option>
              <option value="C+">C+ (Plus)</option>
              <option value="C">C (Plain)</option>
              <option value="C-">C- (Minus)</option>
              <option value="D+">D+ (Plus)</option>
              <option value="D">D (Plain)</option>
              <option value="D-">D- (Minus)</option>
              <option value="E">E</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-h-[48px]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm">
          {error}
        </div>
      )}

      {hasSearched && !loading && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Award className="w-5 h-5 text-primary-600" />
              Courses you qualify for with {grade}
            </h3>
            <span className="text-sm text-muted font-medium bg-elimux-card px-3 py-1 rounded-full border border-border">
              {totalCount.toLocaleString()} result{totalCount !== 1 ? 's' : ''}
            </span>
          </div>

          {programs.length === 0 ? (
            <div className="text-center py-16 bg-elimux-card rounded-2xl border border-border">
              <GraduationCap className="w-14 h-14 text-muted mx-auto mb-4" />
              <p className="text-foreground font-semibold text-lg">No courses found for grade {grade}.</p>
              <p className="text-muted text-sm mt-1">Try a different grade or browse all programs.</p>
              <Link
                href="/programs"
                className="inline-block mt-4 bg-primary-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                Browse All Programs
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
                {programs.map((prog) => (
                  <Link
                    key={prog.id}
                    href={`/programs/${prog.id}`}
                    className="bg-elimux-card border border-border rounded-xl p-5 hover:border-primary-500 hover:shadow-md transition-all group flex flex-col h-full"
                  >
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-semibold text-foreground group-hover:text-primary-600 transition-colors line-clamp-2 text-sm leading-snug">
                          {prog.name}
                        </h4>
                      </div>

                      <p className="text-sm text-muted flex items-center gap-1.5 mb-2">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">
                          {prog.institution?.name}
                          {prog.institution?.city && `, ${prog.institution.city}`}
                          {prog.institution?.country?.name && `, ${prog.institution.country.name}`}
                        </span>
                      </p>

                      {prog.description && (
                        <p className="text-xs text-muted line-clamp-2 mb-3">{prog.description}</p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-auto pt-3 border-t border-border/50">
                      <span
                        className="text-[11px] font-medium bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full"
                        title={
                          prog.kcse_grade_is_estimated
                            ? 'AI-estimated based on program level and field, not an official cutoff. Confirm with the institution before applying.'
                            : undefined
                        }
                      >
                        Min: {prog.minimum_kcse_grade || 'N/A'}
                        {prog.kcse_grade_is_estimated && <span className="opacity-70"> (est.)</span>}
                      </span>
                      {prog.mode && (
                        <span className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          {prog.mode}
                        </span>
                      )}
                      {prog.duration_months && (
                        <span className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {prog.duration_months} months
                        </span>
                      )}
                      {prog.category?.name && (
                        <span className="text-[11px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                          {prog.category.name}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pb-8">
                  <button
                    onClick={() => fetchPrograms(page - 1)}
                    disabled={page === 1}
                    className="p-2.5 rounded-xl border border-border hover:bg-elimux-card disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let p: number;
                      if (totalPages <= 5) p = i + 1;
                      else if (page <= 3) p = i + 1;
                      else if (page >= totalPages - 2) p = totalPages - 4 + i;
                      else p = page - 2 + i;

                      return (
                        <button
                          key={p}
                          onClick={() => fetchPrograms(p)}
                          disabled={loading}
                          className={`min-w-[40px] h-10 rounded-xl text-sm font-semibold transition-colors ${
                            p === page
                              ? 'bg-primary-600 text-white shadow-sm'
                              : 'border border-border hover:bg-elimux-card text-foreground'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => fetchPrograms(page + 1)}
                    disabled={page === totalPages}
                    className="p-2.5 rounded-xl border border-border hover:bg-elimux-card disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
