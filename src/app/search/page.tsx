'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { runAISearch } from '@/lib/aiSearch';
import ProgramCard from '@/components/ProgramCard';
import InstitutionCard from '@/components/InstitutionCard';

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [inputValue, setInputValue] = useState(query);
  const [programs, setPrograms] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setPrograms([]);
      setInstitutions([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    runAISearch(query, [], null, {})
      .then((result) => {
        if (cancelled) return;
        setPrograms(result.programs);
        setInstitutions(result.institutions);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Search failed. Please try again.');
        setPrograms([]);
        setInstitutions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(inputValue)}`;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-700 rounded-md flex items-center justify-center text-white text-xs font-bold">
              🎓
            </div>
            <span className="text-gray-900 font-bold text-base">ElimuX</span>
          </Link>
          <form onSubmit={handleSubmit} className="flex-1">
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
              <span className="text-gray-400 text-sm mr-2">🔍</span>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 bg-transparent border-none text-gray-800 text-sm outline-none"
                placeholder="Search..."
              />
            </div>
          </form>
        </div>
      </header>

      {/* Results */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-gray-900 text-xl font-bold mb-2">
          Results for &quot;{query}&quot;
        </h1>
        <p className="text-gray-400 text-sm mb-8">
          Showing results across courses, careers, and institutions.
        </p>

        {loading && (
          <div className="text-center py-16">
            <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full mx-auto mb-4" />
            <p className="text-gray-400 text-sm">Searching...</p>
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-16">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {programs.length > 0 && (
              <div className="mb-10">
                <h2 className="text-gray-900 text-sm font-semibold mb-3">
                  Programs ({programs.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {programs.map((program) => (
                    <Link key={program.id} href={`/programs/${program.id}/`}>
                      <ProgramCard program={program} />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {institutions.length > 0 && (
              <div className="mb-10">
                <h2 className="text-gray-900 text-sm font-semibold mb-3">
                  Institutions ({institutions.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {institutions.map((inst) => (
                    <Link key={inst.id} href={`/institutions/${inst.id}/`}>
                      <InstitutionCard institution={inst} />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {programs.length === 0 && institutions.length === 0 && (
              <div className="text-center py-16">
                <div className="text-3xl mb-3">😕</div>
                <p className="text-gray-400 text-sm">
                  {query.trim() ? 'No results found. Try a different search.' : 'Type a search above to get started.'}
                </p>
              </div>
            )}
          </>
        )}

        <div className="text-center mt-8">
          <Link href="/" className="text-blue-600 text-sm font-medium hover:underline">
            ← Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-400">Loading search...</div>
      </div>
    }>
      <SearchResults />
    </Suspense>
  );
}
