'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Globe, Building2, Briefcase, ArrowRight } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { listInstitutions, listEmployersPublic } from '@/lib/api';

interface SearchResult {
  id: string;
  name: string;
  entityType: 'institution' | 'employer';
  typeLabel: string;
  city: string | null;
  country: string | null;
  websiteUrl: string | null;
  logoUrl: string | null;
}

export default function JoinPage() {
  const [searchBy, setSearchBy] = useState<'name' | 'domain'>('name');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const debouncedQuery = useDebounce(query, 400);

  // Schools still have no search endpoint at all (see Cycle 176-C's audit -
  // zero backend infrastructure exists for the schools table) - kept as a
  // static link in the not-found state, same as before.
  const performSearch = useCallback(async (searchQuery: string, by: 'name' | 'domain') => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      let allResults: SearchResult[] = [];

      // allSettled, not all - one source failing (e.g. employer search having a
      // transient issue) must not take down the other, working one. Verified this
      // matters live, not just in theory: testing locally against a backend that
      // didn't have the new employer endpoint deployed yet turned a working
      // institution search into a blank "no results" via Promise.all's fail-fast
      // behavior.
      if (by === 'name') {
        const [institutionsResult, employersResult] = await Promise.allSettled([
          listInstitutions({ search: searchQuery, limit: 10 }),
          listEmployersPublic({ search: searchQuery, limit: 10 }),
        ]);
        if (institutionsResult.status === 'rejected') console.error('Institution search failed:', institutionsResult.reason);
        if (employersResult.status === 'rejected') console.error('Employer search failed:', employersResult.reason);

        const institutions = institutionsResult.status === 'fulfilled' ? institutionsResult.value.data || [] : [];
        const employers = employersResult.status === 'fulfilled' ? employersResult.value.data || [] : [];

        allResults = [
          ...institutions.map((i): SearchResult => ({
            id: i.id,
            name: i.name,
            entityType: 'institution',
            typeLabel: i.type?.name || 'Institution',
            city: i.city,
            country: i.country?.name || null,
            websiteUrl: i.website_url,
            logoUrl: i.logo_url,
          })),
          ...employers.map((e): SearchResult => ({
            id: e.id,
            name: e.company_name,
            entityType: 'employer',
            typeLabel: e.industry || 'Employer',
            city: e.location_county,
            country: null,
            websiteUrl: e.website_url,
            logoUrl: null,
          })),
        ];
      } else {
        // No server-side domain filter on either endpoint yet - fetch a page
        // and filter client-side on website_url.
        const domain = searchQuery.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
        const [institutionsResult, employersResult] = await Promise.allSettled([
          listInstitutions({ limit: 100 }),
          listEmployersPublic({ limit: 100 }),
        ]);
        if (institutionsResult.status === 'rejected') console.error('Institution domain search failed:', institutionsResult.reason);
        if (employersResult.status === 'rejected') console.error('Employer domain search failed:', employersResult.reason);

        const institutions = institutionsResult.status === 'fulfilled' ? institutionsResult.value.data || [] : [];
        const employers = employersResult.status === 'fulfilled' ? employersResult.value.data || [] : [];

        allResults = [
          ...institutions
            .filter((i) => i.website_url?.toLowerCase().includes(domain))
            .map((i): SearchResult => ({
              id: i.id,
              name: i.name,
              entityType: 'institution',
              typeLabel: i.type?.name || 'Institution',
              city: i.city,
              country: i.country?.name || null,
              websiteUrl: i.website_url,
              logoUrl: i.logo_url,
            })),
          ...employers
            .filter((e) => e.website_url?.toLowerCase().includes(domain))
            .map((e): SearchResult => ({
              id: e.id,
              name: e.company_name,
              entityType: 'employer',
              typeLabel: e.industry || 'Employer',
              city: e.location_county,
              country: null,
              websiteUrl: e.website_url,
              logoUrl: null,
            })),
        ].slice(0, 10);
      }

      setResults(allResults);
      setHasSearched(true);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
      setHasSearched(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    performSearch(debouncedQuery, searchBy);
  }, [debouncedQuery, searchBy, performSearch]);

  const normalizeDomain = (url?: string | null) => {
    if (!url) return '';
    return url.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  };

  // Employers don't have a seamless pre-select handoff yet (institution/register
  // does, per Cycle 176-C-A - employer/register doesn't read an employer_id
  // param), so this just routes there and the user finds their company again.
  const getClaimUrl = (result: SearchResult) =>
    result.entityType === 'institution' ? `/institution/register?institution_id=${result.id}` : '/employer/register';

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Join ElimuX</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Search to see if your institution or company is already listed. Claim your profile or request to be onboarded.
          </p>
        </div>

        <div className="flex justify-center mb-6">
          <div className="bg-gray-900 rounded-lg p-1 flex gap-1">
            <button
              onClick={() => { setSearchBy('name'); setQuery(''); setResults([]); setHasSearched(false); }}
              className={`px-6 py-2 rounded-md flex items-center gap-2 transition-all ${
                searchBy === 'name' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Building2 size={18} /> Search by Name
            </button>
            <button
              onClick={() => { setSearchBy('domain'); setQuery(''); setResults([]); setHasSearched(false); }}
              className={`px-6 py-2 rounded-md flex items-center gap-2 transition-all ${
                searchBy === 'domain' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Globe size={18} /> Search by Domain
            </button>
          </div>
        </div>

        <div className="relative max-w-2xl mx-auto mb-8">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            {searchBy === 'domain' ? <Globe size={20} /> : <Search size={20} />}
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              searchBy === 'domain'
                ? 'Enter your website domain (e.g., mku.ac.ke)'
                : 'Enter your institution or company name'
            }
            className="w-full bg-gray-900 border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
          {isLoading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {hasSearched && (
          <div className="max-w-2xl mx-auto">
            {results.length > 0 ? (
              <div className="space-y-4">
                <p className="text-gray-400 mb-4">We found {results.length} matching {results.length === 1 ? 'result' : 'results'}:</p>
                {results.map((result) => (
                  <div
                    key={`${result.entityType}-${result.id}`}
                    className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex items-start gap-4 hover:border-gray-700 transition-colors"
                  >
                    <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center shrink-0">
                      {result.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={result.logoUrl} alt="" className="w-8 h-8 object-contain" />
                      ) : result.entityType === 'employer' ? (
                        <Briefcase className="text-gray-400" size={20} />
                      ) : (
                        <Building2 className="text-gray-400" size={20} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{result.name}</h3>
                      <p className="text-gray-400 text-sm">
                        {result.typeLabel} • {result.city ? `${result.city}, ` : ''}{result.country || ''}
                      </p>
                      {result.websiteUrl && (
                        <p className="text-gray-500 text-sm mt-1">{normalizeDomain(result.websiteUrl)}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <a
                        href={getClaimUrl(result)}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium text-center transition-colors"
                      >
                        Claim Profile
                      </a>
                      {result.entityType === 'institution' && (
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch('/api/invites/institution', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ institution_id: result.id }),
                              });
                              const json = await res.json();
                              if (json.success) {
                                await navigator.clipboard.writeText(json.data.url);
                                alert(`Invite link copied: ${json.data.url}`);
                              } else {
                                alert(json.error === 'Unauthorized' ? 'Sign in to generate an invite link' : 'Failed to generate invite');
                              }
                            } catch {
                              alert('Failed to generate invite');
                            }
                          }}
                          className="border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                        >
                          Generate Invite Link
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-900/50 rounded-xl border border-gray-800">
                <Search className="mx-auto text-gray-600 mb-4" size={48} />
                <h3 className="text-xl font-semibold mb-2">No results found</h3>
                <p className="text-gray-400 mb-6">
                  We couldn&apos;t find any institution or company matching &quot;{query}&quot;
                </p>
                <div className="space-y-3">
                  <a
                    href="/institution-onboarding"
                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2"
                  >
                    Apply as New Institution <ArrowRight size={18} />
                  </a>
                  <p className="text-gray-500 text-sm mt-4">
                    Are you an employer? <a href="/employer/register" className="text-orange-400 hover:text-orange-300">Register here</a>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {hasSearched && results.length > 0 && (
          <div className="max-w-2xl mx-auto mt-8 text-center">
            <p className="text-gray-500 mb-4">Can&apos;t find what you&apos;re looking for?</p>
            <a href="/institution-onboarding" className="text-orange-400 hover:text-orange-300 font-medium">
              Apply as a new institution →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
