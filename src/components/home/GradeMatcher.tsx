'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { KCSE_GRADES, gradeToNumeric, getGradeColor, type KcseGrade } from '@/lib/kcse-grades';
import type { Program } from '@/types/home';

const FALLBACK_PROGRAMS: Program[] = [
  {
    id: '1', name: 'Diploma in Business Management', minimum_kcse_grade: 'C-', kcse_grade_is_estimated: true,
    duration: '2 Years', category: 'Business',
    institution: { name: 'Kenya Institute of Management', location: 'Nairobi', country: 'Kenya' },
  },
  {
    id: '2', name: 'Certificate in Information Technology', minimum_kcse_grade: 'D+', kcse_grade_is_estimated: true,
    duration: '1 Year', category: 'Technology',
    institution: { name: 'Technical University of Kenya', location: 'Nairobi', country: 'Kenya' },
  },
  {
    id: '3', name: 'Craft Certificate in Electrical Installation', minimum_kcse_grade: 'D', kcse_grade_is_estimated: true,
    duration: '18 Months', category: 'Engineering',
    institution: { name: 'Sample Training Institute', location: 'Ruaraka', country: 'Kenya' },
  },
  {
    id: '4', name: 'Diploma in Journalism & Media', minimum_kcse_grade: 'C-', kcse_grade_is_estimated: true,
    duration: '2 Years', category: 'Arts & Design',
    institution: { name: 'Multimedia University of Kenya', location: 'Athi River', country: 'Kenya' },
  },
  {
    id: '5', name: 'Certificate in Hospitality Management', minimum_kcse_grade: 'D+', kcse_grade_is_estimated: true,
    duration: '1 Year', category: 'Business',
    institution: { name: 'Kenya Utalii College', location: 'Nairobi', country: 'Kenya' },
  },
  {
    id: '6', name: 'Diploma in Pharmacy', minimum_kcse_grade: 'C', kcse_grade_is_estimated: true,
    duration: '3 Years', category: 'Medicine & Health',
    institution: { name: 'Kenya Medical Training College', location: 'Nairobi', country: 'Kenya' },
  },
];

const CATEGORY_ICONS: Record<string, string> = {
  'Medicine & Health': '💊', 'Technology': '⚙️', 'Business': '💼',
  'Engineering': '🔧', 'Law': '⚖️', 'Education': '🎓',
  'Arts & Design': '🎨', 'Science': '🧪',
};

export default function GradeMatcher() {
  const [selectedGrade, setSelectedGrade] = useState<KcseGrade>('C-');
  const [results, setResults] = useState<Program[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function findCourses() {
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const supabase = createClient();
      const studentNumeric = gradeToNumeric(selectedGrade);

      const { data, error: dbError } = await supabase
        .from('programs')
        .select(`
          id,
          name,
          minimum_kcse_grade,
          kcse_grade_is_estimated,
          duration,
          category:program_categories ( name ),
          institutions ( name, location, country )
        `)
        .lte('minimum_kcse_grade_numeric', studentNumeric)
        .order('minimum_kcse_grade_numeric', { ascending: false })
        .limit(50);

      if (dbError) {
        console.warn('Supabase query failed, using fallback:', dbError.message);
        const filtered = FALLBACK_PROGRAMS.filter(p =>
          gradeToNumeric(p.minimum_kcse_grade) <= studentNumeric
        );
        setResults(filtered);
      } else if (data && data.length > 0) {
        const programs: Program[] = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          minimum_kcse_grade: item.minimum_kcse_grade,
          kcse_grade_is_estimated: item.kcse_grade_is_estimated ?? true,
          duration: item.duration || 'N/A',
          category: item.category?.name || 'General',
          institution: {
            name: item.institutions?.name || 'Unknown Institution',
            location: item.institutions?.location || 'N/A',
            country: item.institutions?.country || 'Kenya',
          },
        }));
        setResults(programs);
      } else {
        const filtered = FALLBACK_PROGRAMS.filter(p =>
          gradeToNumeric(p.minimum_kcse_grade) <= studentNumeric
        );
        setResults(filtered);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      const filtered = FALLBACK_PROGRAMS.filter(p =>
        gradeToNumeric(p.minimum_kcse_grade) <= gradeToNumeric(selectedGrade)
      );
      setResults(filtered);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="text-left">
      {/* Grade Matcher Card */}
      <div className="bg-[#fafaf9] dark:bg-elimux-card border border-gray-200 dark:border-border rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">🎓</span>
          <span className="text-gray-900 dark:text-white text-lg font-semibold">
            What can I study with my KCSE grade?
          </span>
        </div>
        <p className="text-gray-500 dark:text-muted text-sm leading-relaxed mb-4">
          Enter your KCSE grade below. We&apos;ll show you every course and institution you qualify for — across ALL categories.
        </p>

        <div className="mb-4">
          <label className="block text-gray-500 dark:text-muted text-xs font-medium mb-1.5 uppercase tracking-wide">My KCSE Grade</label>
          <div className="relative">
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value as KcseGrade)}
              className="w-full bg-white dark:bg-background border border-gray-200 dark:border-border rounded-xl px-4 py-3 text-gray-800 dark:text-white text-sm outline-none appearance-none focus:border-gray-400 transition-all focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-1"
              aria-label="My KCSE Grade"
            >
              {KCSE_GRADES.map((g) => (
                <option key={g.grade} value={g.grade}>{g.label}</option>
              ))}
            </select>
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-muted text-xs pointer-events-none">▼</span>
          </div>
        </div>

        <button
          onClick={findCourses}
          disabled={loading}
          className="w-full bg-primary-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2"
        >
          {loading ? '⏳ Searching...' : '🔍 Find My Courses'}
        </button>

        {error && <div className="mt-3 text-red-500 text-xs text-center">{error}</div>}
      </div>

      {/* Results */}
      {hasSearched && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-base">📋</span>
            <span className="text-gray-900 dark:text-white text-base font-semibold">
              Courses you qualify for with <span className="text-[#7c6f50] dark:text-primary-400">{selectedGrade}</span>
            </span>
          </div>

          {results.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-3xl mb-2">😕</div>
              <div className="text-gray-400 dark:text-muted text-sm">
                No courses found for grade {selectedGrade}.<br />Try a different grade or browse all programs.
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3">
                {results.map((program) => {
                  const pColor = getGradeColor(program.minimum_kcse_grade);
                  return (
                    <div
                      key={program.id}
                      className="bg-white dark:bg-elimux-card border border-gray-200 dark:border-border rounded-xl p-4 cursor-pointer hover:border-gray-400 dark:hover:border-primary-400 hover:shadow-sm transition-all"
                      onClick={() => { window.location.href = `/programs/${program.id}`; }}
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="text-gray-900 dark:text-white text-sm font-semibold leading-tight">{program.name}</span>
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-md font-semibold shrink-0 ml-2"
                          style={{ backgroundColor: pColor.bg, color: pColor.text }}
                          title={
                            program.kcse_grade_is_estimated
                              ? 'AI-estimated based on program level and field, not an official cutoff. Confirm with the institution before applying.'
                              : undefined
                          }
                        >
                          {program.minimum_kcse_grade}
                          {program.kcse_grade_is_estimated && <span className="opacity-70"> (est.)</span>}
                        </span>
                      </div>
                      <div className="text-gray-500 dark:text-muted text-xs mb-2">{program.institution.name}</div>
                      <div className="flex gap-2 flex-wrap">
                        <span className="bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-muted text-[10px] px-2.5 py-1 rounded-md">
                          {CATEGORY_ICONS[program.category] || '📚'} {program.category}
                        </span>
                        <span className="bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-muted text-[10px] px-2.5 py-1 rounded-md">
                          📍 {program.institution.location}
                        </span>
                        <span className="bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-muted text-[10px] px-2.5 py-1 rounded-md">
                          ⏱ {program.duration}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-center mt-4">
                <a href="/programs" className="text-[#7c6f50] dark:text-primary-400 text-sm font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-1 rounded">
                  See all courses matching {selectedGrade} →
                </a>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

