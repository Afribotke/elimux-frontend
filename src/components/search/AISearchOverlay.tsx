'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { runAISearch } from '@/lib/aiSearch';
import ProgramCard from '@/components/ProgramCard';
import InstitutionCard from '@/components/InstitutionCard';

export default function AISearchOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [programs, setPrograms] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleKey);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  const runSearch = useCallback((q: string) => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setHasSearched(true);
    setError(null);

    runAISearch(q, [], null, {})
      .then((result) => {
        if (requestId !== requestIdRef.current) return;
        setPrograms(result.programs);
        setInstitutions(result.institutions);
      })
      .catch((err) => {
        if (requestId !== requestIdRef.current) return;
        setError(err instanceof Error ? err.message : 'Search failed. Please try again.');
        setPrograms([]);
        setInstitutions([]);
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setHasSearched(false);
      setPrograms([]);
      setInstitutions([]);
      setError(null);
      return;
    }
    const timer = setTimeout(() => runSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, runSearch]);

  const handleSubmit = () => {
    if (query.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(query)}`;
    }
  };

  if (!isOpen) {
    return (
      <div
        onClick={() => setIsOpen(true)}
        className="relative max-w-2xl mx-auto cursor-text"
      >
        <div className="flex items-center gap-3 bg-slate-800/80 backdrop-blur-md border border-slate-600 rounded-2xl pl-4 pr-2 py-4 transition-all">
          <span className="text-lg">✨</span>
          <span className="text-gray-400 text-lg flex-1">
            Ask anything... e.g., &quot;I want to study medicine in Kenya&quot;
          </span>
          <div className="mr-1 bg-primary-600 hover:bg-primary-500 text-white rounded-xl px-4 py-2 text-sm font-semibold transition-colors">
            🔍 Search
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-background">
      {/* Header */}
      <div className="border-b border-gray-100 dark:border-border px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0">
            🎓
          </div>
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-muted">✨</span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Ask anything..."
              className="w-full bg-gray-50 dark:bg-elimux-card border border-gray-200 dark:border-border rounded-xl pl-10 pr-4 py-3 text-gray-800 dark:text-white text-base outline-none focus:border-gray-400 transition-all focus-visible:ring-2 focus-visible:ring-primary-400"
            />
            {isLoading && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-muted text-xs animate-pulse">
                Searching...
              </span>
            )}
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 dark:text-muted hover:text-gray-600 dark:hover:text-white text-sm font-medium px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-1 rounded"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Results Area */}
      <div className="max-w-3xl mx-auto px-4 py-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
        {!hasSearched && (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">✨</div>
            <div className="text-gray-400 dark:text-muted text-lg">Type your question above to get started</div>
          </div>
        )}

        {hasSearched && error && !isLoading && (
          <div className="text-center py-10">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {hasSearched && !error && isLoading && programs.length === 0 && institutions.length === 0 && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-elimux-card border border-gray-100 dark:border-border rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2 mb-3" />
                <div className="flex gap-2">
                  <div className="h-5 bg-gray-100 rounded w-20" />
                  <div className="h-5 bg-gray-100 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        )}

        {hasSearched && !error && !isLoading && (
          <>
            {programs.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm">📋</span>
                  <span className="text-gray-900 dark:text-white text-sm font-semibold">Programs ({programs.length})</span>
                </div>
                <div className="flex flex-col gap-3">
                  {programs.map((program) => (
                    <Link key={program.id} href={`/programs/${program.id}/`} onClick={() => setIsOpen(false)}>
                      <ProgramCard program={program} />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {institutions.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm">🏛️</span>
                  <span className="text-gray-900 dark:text-white text-sm font-semibold">Institutions ({institutions.length})</span>
                </div>
                <div className="flex flex-col gap-3">
                  {institutions.map((inst) => (
                    <Link key={inst.id} href={`/institutions/${inst.id}/`} onClick={() => setIsOpen(false)}>
                      <InstitutionCard institution={inst} />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {programs.length === 0 && institutions.length === 0 && (
              <div className="text-center py-16">
                <div className="text-3xl mb-3">😕</div>
                <p className="text-gray-400 dark:text-muted text-sm">No results found. Try a different search.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
