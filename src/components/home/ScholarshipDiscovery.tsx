'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { listScholarships, matchScholarships, type ScholarshipRow, type ScholarshipMatchResult } from '@/lib/api';

function getDeadlineStatus(deadline: string | null) {
  if (!deadline) return { text: 'Rolling', color: 'bg-blue-100 text-blue-700' };
  const d = new Date(deadline);
  const days = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  if (days < 0) return { text: 'Closed', color: 'bg-gray-100 text-gray-500' };
  if (days <= 7) return { text: `${days}d left`, color: 'bg-red-100 text-red-700' };
  if (days <= 30) return { text: `${days}d left`, color: 'bg-yellow-100 text-yellow-700' };
  return { text: d.toLocaleDateString(), color: 'bg-green-100 text-green-700' };
}

function getCoverageLabel(type: string | null) {
  switch (type) {
    case 'full': return 'Full Ride';
    case 'partial': return 'Partial';
    case 'stipend': return 'Stipend';
    case 'variable': return 'Variable';
    default: return 'See Details';
  }
}

export default function ScholarshipDiscovery() {
  const [scholarships, setScholarships] = useState<ScholarshipRow[]>([]);
  const [featured, setFeatured] = useState<ScholarshipRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [filters, setFilters] = useState({
    study_level: '',
    discipline: '',
    deadline_after: '',
  });

  const [showMatcher, setShowMatcher] = useState(false);
  const [matchProfile, setMatchProfile] = useState({
    gpa: '',
    course_field: '',
    county: '',
    financial_need: false,
    gender: '',
  });
  const [matchResults, setMatchResults] = useState<ScholarshipMatchResult[]>([]);
  const [matching, setMatching] = useState(false);
  const [matchError, setMatchError] = useState('');

  const handleMatch = async () => {
    try {
      setMatching(true);
      setMatchError('');
      const result = await matchScholarships({
        gpa: matchProfile.gpa ? parseFloat(matchProfile.gpa) : undefined,
        course_field: matchProfile.course_field || undefined,
        county: matchProfile.county || undefined,
        financial_need: matchProfile.financial_need,
        gender: matchProfile.gender || undefined,
      });
      setMatchResults(result.data);
      setShowMatcher(false);
    } catch (err) {
      setMatchError(err instanceof Error ? err.message : 'Matching failed');
    } finally {
      setMatching(false);
    }
  };

  useEffect(() => {
    listScholarships({ limit: 3, offset: 0 })
      .then((res) => setFeatured(res.data.filter((s) => s.is_featured).slice(0, 3)))
      .catch((err) => console.error('Featured scholarships fetch error:', err));
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params: Record<string, string | number> = { limit: 20, offset: 0 };
      if (keyword) params.keyword = keyword;
      if (filters.study_level) params.study_level = filters.study_level;
      if (filters.discipline) params.discipline = filters.discipline;
      if (filters.deadline_after) params.deadline_after = filters.deadline_after;

      const res = await listScholarships(params);
      setScholarships(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scholarships');
      setScholarships([]);
    } finally {
      setLoading(false);
    }
  }, [keyword, filters]);

  // Matches AISearchOverlay's 300ms debounce pattern (src/components/search/AISearchOverlay.tsx)
  useEffect(() => {
    const timer = setTimeout(fetchAll, 300);
    return () => clearTimeout(timer);
  }, [fetchAll]);

  return (
    <div className="space-y-8">
      {/* Match Results */}
      {matchResults.length > 0 && (
        <div className="bg-white dark:bg-elimux-card border border-gray-200 dark:border-border rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">🎯 Your Top Matches</h3>
            <button onClick={() => setMatchResults([])} className="text-gray-500 dark:text-muted hover:text-gray-900 dark:hover:text-white text-sm">
              Clear
            </button>
          </div>
          <div className="space-y-3">
            {matchResults.slice(0, 5).map((r) => (
              <div key={r.scholarship_id} className="bg-gray-50 dark:bg-elimux-card border border-gray-200 dark:border-border rounded-lg p-4 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">{r.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-muted">{r.provider}</p>
                  {r.matched_criteria.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {r.matched_criteria.slice(0, 3).map((c) => (
                        <span key={c} className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">{c}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0 space-y-1">
                  <div
                    className={`text-2xl font-bold ${
                      r.match_score >= 80 ? 'text-green-600' : r.match_score >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}
                  >
                    {r.match_score}%
                  </div>
                  <Link href={`/scholarships/${r.scholarship_id}/`} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors">
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Match Me */}
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={() => setShowMatcher(!showMatcher)}
          className="bg-gray-900 text-white px-8 py-3 rounded-full font-bold hover:bg-gray-700 transition-colors"
        >
          {showMatcher ? 'Cancel' : '🎯 Match Me to Scholarships'}
        </button>

        {showMatcher && (
          <div className="bg-gray-50 dark:bg-elimux-card border border-gray-200 dark:border-border rounded-xl p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tell us about yourself</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-muted mb-1">GPA (0.0 - 4.0)</label>
                <input
                  type="number"
                  step="0.1"
                  max="4"
                  min="0"
                  value={matchProfile.gpa}
                  onChange={(e) => setMatchProfile({ ...matchProfile, gpa: e.target.value })}
                  className="w-full bg-white dark:bg-elimux-card border border-gray-200 dark:border-border rounded-lg px-4 py-2 text-gray-800 dark:text-white outline-none focus:border-gray-400"
                  placeholder="3.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-muted mb-1">Course / Field</label>
                <input
                  type="text"
                  value={matchProfile.course_field}
                  onChange={(e) => setMatchProfile({ ...matchProfile, course_field: e.target.value })}
                  className="w-full bg-white dark:bg-elimux-card border border-gray-200 dark:border-border rounded-lg px-4 py-2 text-gray-800 dark:text-white outline-none focus:border-gray-400"
                  placeholder="Computer Science"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-muted mb-1">County</label>
                <input
                  type="text"
                  value={matchProfile.county}
                  onChange={(e) => setMatchProfile({ ...matchProfile, county: e.target.value })}
                  className="w-full bg-white dark:bg-elimux-card border border-gray-200 dark:border-border rounded-lg px-4 py-2 text-gray-800 dark:text-white outline-none focus:border-gray-400"
                  placeholder="Nairobi"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-muted mb-1">Gender</label>
                <select
                  value={matchProfile.gender}
                  onChange={(e) => setMatchProfile({ ...matchProfile, gender: e.target.value })}
                  className="w-full bg-white dark:bg-elimux-card border border-gray-200 dark:border-border rounded-lg px-4 py-2 text-gray-700 dark:text-white outline-none focus:border-gray-400"
                >
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-3 text-gray-700 dark:text-muted">
                  <input
                    type="checkbox"
                    checked={matchProfile.financial_need}
                    onChange={(e) => setMatchProfile({ ...matchProfile, financial_need: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  I require financial assistance
                </label>
              </div>
            </div>

            {matchError && <p className="text-red-600 text-sm mt-4">{matchError}</p>}

            <button
              onClick={handleMatch}
              disabled={matching}
              className="mt-6 w-full bg-gray-900 text-white py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {matching ? 'Matching...' : 'Find My Scholarships'}
            </button>
          </div>
        )}
      </div>

      {/* Featured Strip */}
      {featured.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Featured Scholarships</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featured.map((s) => (
              <div key={s.id} className="bg-[#fef3c7]/40 dark:bg-[#fbbf24]/10 border border-[#fbbf24]/40 rounded-xl p-5 hover:border-[#fbbf24] transition-colors">
                <div className="flex items-start justify-between mb-3 gap-2">
                  <h4 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">{s.title}</h4>
                  <span className="shrink-0 px-2 py-1 bg-[#fef3c7] text-[#92400e] text-xs rounded-full">Featured</span>
                </div>
                <p className="text-gray-600 dark:text-muted text-sm mb-2">{s.provider}</p>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-green-700 dark:text-green-400 font-medium">{s.amount || 'See details'}</span>
                  <span className="text-gray-300 dark:text-muted">·</span>
                  <span className="text-gray-500 dark:text-muted">{getCoverageLabel(s.coverage_type)}</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getDeadlineStatus(s.application_deadline).color}`}>
                    {getDeadlineStatus(s.application_deadline).text}
                  </span>
                  <Link href={`/scholarships/${s.id}/`} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors">
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-50 dark:bg-elimux-card border border-gray-200 dark:border-border rounded-xl p-4">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search scholarships..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="flex-1 min-w-[200px] bg-white dark:bg-elimux-card border border-gray-200 dark:border-border rounded-lg px-4 py-2 text-gray-800 dark:text-white placeholder-gray-400 outline-none focus:border-gray-400 transition-colors"
          />
          <select
            value={filters.study_level}
            onChange={(e) => setFilters({ ...filters, study_level: e.target.value })}
            className="bg-white dark:bg-elimux-card border border-gray-200 dark:border-border rounded-lg px-4 py-2 text-gray-700 dark:text-white outline-none focus:border-gray-400"
          >
            <option value="">All Levels</option>
            <option value="bachelor">Undergraduate</option>
            <option value="master">Masters</option>
            <option value="phd">PhD</option>
            <option value="diploma">Diploma</option>
          </select>
          <select
            value={filters.discipline}
            onChange={(e) => setFilters({ ...filters, discipline: e.target.value })}
            className="bg-white dark:bg-elimux-card border border-gray-200 dark:border-border rounded-lg px-4 py-2 text-gray-700 dark:text-white outline-none focus:border-gray-400"
          >
            <option value="">All Fields</option>
            <option value="engineering">Engineering</option>
            <option value="medicine">Medicine</option>
            <option value="business">Business</option>
            <option value="arts">Arts</option>
            <option value="science">Science</option>
            <option value="law">Law</option>
          </select>
          <input
            type="date"
            value={filters.deadline_after}
            onChange={(e) => setFilters({ ...filters, deadline_after: e.target.value })}
            className="bg-white dark:bg-elimux-card border border-gray-200 dark:border-border rounded-lg px-4 py-2 text-gray-700 dark:text-white outline-none focus:border-gray-400"
          />
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin inline-block w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full mb-4" />
          <p className="text-gray-400 dark:text-muted">Loading scholarships...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      ) : scholarships.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-muted">
          <p className="text-lg mb-2">No scholarships found</p>
          <p className="text-sm">Try adjusting your filters or search terms</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scholarships.map((s) => {
            const deadline = getDeadlineStatus(s.application_deadline);
            return (
              <div key={s.id} className="bg-white dark:bg-elimux-card border border-gray-200 dark:border-border rounded-xl p-5 hover:border-gray-300 dark:hover:border-primary-400 transition-colors group">
                <div className="flex items-start justify-between mb-3 gap-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white leading-tight group-hover:text-gray-700 dark:group-hover:text-primary-400 transition-colors">{s.title}</h4>
                  {s.is_featured && <span className="shrink-0 px-2 py-0.5 bg-[#fef3c7] text-[#92400e] text-xs rounded-full">★</span>}
                </div>

                <p className="text-gray-500 dark:text-muted text-sm mb-1">{s.provider}</p>
                {s.institution?.name && (
                  <p className="text-gray-400 dark:text-muted text-xs mb-3">{s.institution.name}</p>
                )}

                <div className="flex flex-wrap gap-2 mb-3">
                  {s.study_levels?.map((level) => (
                    <span key={level} className="px-2 py-0.5 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-muted text-xs rounded">{level}</span>
                  ))}
                  {s.disciplines?.slice(0, 2).map((d) => (
                    <span key={d} className="px-2 py-0.5 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-muted text-xs rounded">{d}</span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-border">
                  <div className="space-y-1">
                    <p className="text-green-700 font-medium text-sm">{s.amount || 'See details'}</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${deadline.color}`}>
                      {deadline.text}
                    </span>
                  </div>
                  <Link href={`/scholarships/${s.id}/`} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors">
                    View Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
