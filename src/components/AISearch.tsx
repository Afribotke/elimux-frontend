'use client';

import { useState, FormEvent } from 'react';
import { queryAI, AIQueryResponse } from '@/lib/ai';
import Link from 'next/link';

export default function AISearch() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<AIQueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await queryAI({ query });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center shadow-lg rounded-2xl bg-background border border-border">
          <div className="pl-5 text-purple-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything... e.g. 'Best computer science programs in Kenya under $5000'"
            className="flex-1 px-4 py-5 text-foreground placeholder-gray-400 bg-transparent border-none focus:outline-none focus:ring-0 text-lg"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="m-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Thinking...' : 'Ask AI'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-6 space-y-6">
          {/* AI Answer */}
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-semibold text-purple-900">AI Answer</span>
              <span className="text-xs bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">
                {Math.round(result.confidence * 100)}% confidence
              </span>
            </div>
            <p className="text-foreground leading-relaxed">{result.answer}</p>
          </div>

          {/* Programs */}
          {result.programs.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-foreground mb-3">Recommended Programs</h3>
              <div className="grid gap-3">
                {result.programs.map((program) => (
                  <Link key={program.id} href={`/programs/${program.id}`} className="block">
                    <div className="bg-background border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-foreground">{program.name}</h4>
                          <p className="text-sm text-muted-foreground">{program.institution_name} · {program.country}</p>
                          <div className="flex gap-2 mt-2">
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{program.level}</span>
                            <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                              {program.currency.toUpperCase()} {program.tuition_fees.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-purple-600">{Math.round(program.match_score * 100)}% match</div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Institutions */}
          {result.institutions.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-foreground mb-3">Recommended Institutions</h3>
              <div className="grid gap-3">
                {result.institutions.map((inst) => (
                  <Link key={inst.id} href={`/institutions/${inst.id}`} className="block">
                    <div className="bg-background border border-border rounded-xl p-4 hover:shadow-md transition-shadow flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-foreground">{inst.name}</h4>
                        <p className="text-sm text-muted-foreground">{inst.city}, {inst.country}</p>
                      </div>
                      <div className="flex items-center gap-1 text-yellow-600">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="font-medium">{inst.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

