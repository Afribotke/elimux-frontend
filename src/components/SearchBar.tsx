'use client';

import { useState, FormEvent } from 'react';
import { useSearch } from '@/hooks/useSearch';
import { SearchFilters } from '@/types';

interface SearchBarProps {
  onSearch?: (query: string, filters: SearchFilters) => void;
  variant?: 'hero' | 'compact';
}

export default function SearchBar({ onSearch, variant = 'hero' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const { search, loading } = useSearch();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    if (onSearch) {
      onSearch(query, filters);
    } else {
      await search(query, filters, true);
    }
  };

  const isHero = variant === 'hero';

  return (
    <div className={`w-full ${isHero ? 'max-w-3xl' : 'max-w-2xl'} mx-auto`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className={`relative flex items-center ${isHero ? 'shadow-lg' : 'shadow-md'} rounded-2xl bg-background`}>
          <div className="pl-5 text-muted-foreground">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search programs, universities, courses..."
            className="flex-1 px-4 py-4 text-foreground placeholder-gray-400 bg-transparent border-none focus:outline-none focus:ring-0 text-lg"
          />
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-2 text-muted-foreground hover:text-blue-600 transition-colors"
            title="Filters"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="m-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              'Search'
            )}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-background rounded-xl shadow-lg border border-border p-4 z-40">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <select
                value={filters.country || ''}
                onChange={(e) => setFilters({ ...filters, country: e.target.value || undefined })}
                className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Country"
              >
                <option value="">All Countries</option>
                <option value="Kenya">Kenya</option>
                <option value="South Africa">South Africa</option>
                <option value="Nigeria">Nigeria</option>
                <option value="Ghana">Ghana</option>
                <option value="UK">UK</option>
                <option value="USA">USA</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
                <option value="India">India</option>
              </select>
              <select
                value={filters.level || ''}
                onChange={(e) => setFilters({ ...filters, level: e.target.value || undefined })}
                className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Education Level"
              >
                <option value="">All Levels</option>
                <option value="Certificate">Certificate</option>
                <option value="Diploma">Diploma</option>
                <option value="Bachelor">Bachelor</option>
                <option value="Masters">Masters</option>
                <option value="PhD">PhD</option>
              </select>
              <select
                value={filters.duration || ''}
                onChange={(e) => setFilters({ ...filters, duration: e.target.value || undefined })}
                className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Duration"
              >
                <option value="">Any Duration</option>
                <option value="6 months">6 Months</option>
                <option value="1 year">1 Year</option>
                <option value="2 years">2 Years</option>
                <option value="3 years">3 Years</option>
                <option value="4 years">4+ Years</option>
              </select>
              <select
                value={filters.field || ''}
                onChange={(e) => setFilters({ ...filters, field: e.target.value || undefined })}
                className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Field of Study"
              >
                <option value="">All Fields</option>
                <option value="Technology">Technology</option>
                <option value="Business">Business</option>
                <option value="Medicine">Medicine</option>
                <option value="Engineering">Engineering</option>
                <option value="Arts">Arts</option>
                <option value="Science">Science</option>
              </select>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

