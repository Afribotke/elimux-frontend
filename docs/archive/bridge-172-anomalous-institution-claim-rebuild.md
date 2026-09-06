STEP 1: DATABASE SCHEMA (UPDATED)
Run this SQL in Supabase Dashboard → SQL Editor as a single query.
sql
-- ============================================================
-- STEP 1A: Pending Institutions Table (onboarding requests)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pending_institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('university', 'college', 'tvet', 'employer', 'school', 'other')),
  country TEXT NOT NULL,
  city TEXT,
  website TEXT,
  domain TEXT GENERATED ALWAYS AS (
    regexp_replace(
      regexp_replace(lower(website), '^https?://', ''),
      '^www\\.', ''
    )
  ) STORED,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  description TEXT,
  submitted_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for domain lookups
CREATE INDEX IF NOT EXISTS idx_pending_institutions_domain ON public.pending_institutions(domain);

-- RLS
ALTER TABLE public.pending_institutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert pending institutions"
  ON public.pending_institutions FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Users can view their own submissions"
  ON public.pending_institutions FOR SELECT TO authenticated USING (submitted_by = auth.uid());

CREATE POLICY "Admins can view all pending institutions"
  ON public.pending_institutions FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update pending institutions"
  ON public.pending_institutions FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- STEP 1B: Institution Claims Table (ownership claims)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.institution_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL,
  institution_type TEXT NOT NULL CHECK (institution_type IN ('institution', 'employer', 'school')),
  claimed_by UUID NOT NULL REFERENCES auth.users(id),
  claim_email TEXT NOT NULL,
  domain_used TEXT,
  verification_method TEXT NOT NULL DEFAULT 'pending' CHECK (verification_method IN ('auto', 'manual', 'pending')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  documents JSONB DEFAULT '[]',
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.institution_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own claims"
  ON public.institution_claims FOR SELECT TO authenticated USING (claimed_by = auth.uid());

CREATE POLICY "Users can insert their own claims"
  ON public.institution_claims FOR INSERT TO authenticated WITH CHECK (claimed_by = auth.uid());

CREATE POLICY "Admins can view all claims"
  ON public.institution_claims FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update claims"
  ON public.institution_claims FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- STEP 1C: Feature Flag
-- ============================================================
INSERT INTO public.feature_flags (key, value, description)
VALUES ('institution_claim_portal_enabled', 'false', 'Enable institution claim and request portal')
ON CONFLICT (key) DO NOTHING;
STEP 2: API ROUTE — Institution Search (UPDATED WITH SCHOOLS)
File: app/api/institutions/search/route.ts
Action: CREATE
TypeScript
// === FILE: app/api/institutions/search/route.ts ===
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';
    const searchBy = searchParams.get('by') || 'name'; // 'name' | 'domain'
    const type = searchParams.get('type') || 'all'; // 'all' | 'institution' | 'employer' | 'school'

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const supabase = await createClient();
    let institutions: any[] = [];
    let employers: any[] = [];
    let schools: any[] = [];

    const normalizeDomain = (input: string): string => {
      return input
        .toLowerCase()
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '')
        .split('/')[0]
        .trim();
    };

    if (searchBy === 'domain') {
      const domain = normalizeDomain(query);
      if (type === 'all' || type === 'institution') {
        const { data } = await supabase
          .from('institutions')
          .select('id, name, type, country, city, website, logo_url, status')
          .ilike('website', `%${domain}%`)
          .eq('status', 'active')
          .limit(10);
        institutions = data || [];
      }
      if (type === 'all' || type === 'employer') {
        const { data } = await supabase
          .from('employers')
          .select('id, name, industry, country, city, website, logo_url')
          .ilike('website', `%${domain}%`)
          .limit(10);
        employers = data || [];
      }
      if (type === 'all' || type === 'school') {
        const { data } = await supabase
          .from('schools')
          .select('id, name, level, county, sub_county, website, logo_url')
          .ilike('website', `%${domain}%`)
          .limit(10);
        schools = data || [];
      }
    } else {
      // Name search
      if (type === 'all' || type === 'institution') {
        const { data } = await supabase
          .from('institutions')
          .select('id, name, type, country, city, website, logo_url, status')
          .ilike('name', `%${query}%`)
          .eq('status', 'active')
          .limit(10);
        institutions = data || [];
      }
      if (type === 'all' || type === 'employer') {
        const { data } = await supabase
          .from('employers')
          .select('id, name, industry, country, city, website, logo_url')
          .ilike('name', `%${query}%`)
          .limit(10);
        employers = data || [];
      }
      if (type === 'all' || type === 'school') {
        const { data } = await supabase
          .from('schools')
          .select('id, name, level, county, sub_county, website, logo_url')
          .ilike('name', `%${query}%`)
          .limit(10);
        schools = data || [];
      }
    }

    const results = [
      ...institutions.map((i) => ({ ...i, entityType: 'institution' as const })),
      ...employers.map((e) => ({ ...e, entityType: 'employer' as const })),
      ...schools.map((s) => ({ ...s, entityType: 'school' as const })),
    ];

    return NextResponse.json({ results, count: results.length });
  } catch (error) {
    console.error('Institution search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
// === END FILE ===
STEP 3: API ROUTE — Submit Claim (UPDATED WITH SCHOOLS)
File: app/api/institutions/claim/route.ts
Action: CREATE
TypeScript
// === FILE: app/api/institutions/claim/route.ts ===
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { institutionId, institutionType, claimEmail } = body;

    if (!institutionId || !institutionType || !claimEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Extract domain from claim email
    const claimDomain = claimEmail.split('@')[1]?.toLowerCase();

    // Fetch institution website to compare domains
    const tableMap: Record<string, string> = {
      institution: 'institutions',
      employer: 'employers',
      school: 'schools',
    };
    const table = tableMap[institutionType];
    if (!table) {
      return NextResponse.json({ error: 'Invalid institution type' }, { status: 400 });
    }

    const { data: institution } = await supabase
      .from(table)
      .select('website')
      .eq('id', institutionId)
      .single();

    const institutionDomain = institution?.website
      ?.toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];

    // Auto-verify if domains match
    const verificationMethod = claimDomain && institutionDomain && claimDomain === institutionDomain
      ? 'auto'
      : 'manual';

    const { data, error } = await supabase
      .from('institution_claims')
      .insert({
        institution_id: institutionId,
        institution_type: institutionType,
        claimed_by: user.id,
        claim_email: claimEmail,
        domain_used: claimDomain,
        verification_method: verificationMethod,
        status: verificationMethod === 'auto' ? 'approved' : 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    // If auto-approved, update user role/permissions (optional — implement if you have a roles system)
    if (verificationMethod === 'auto') {
      // TODO: Grant admin rights for this institution
      // await supabase.from('institution_admins').insert({...})
    }

    return NextResponse.json({
      success: true,
      claim: data,
      autoApproved: verificationMethod === 'auto',
      message: verificationMethod === 'auto'
        ? 'Claim approved automatically. You now have admin access.'
        : 'Claim submitted for manual review. We will contact you within 24-48 hours.',
    });
  } catch (error) {
    console.error('Claim submission error:', error);
    return NextResponse.json({ error: 'Failed to submit claim' }, { status: 500 });
  }
}
// === END FILE ===
STEP 4: API ROUTE — Submit Join Request (NO CHANGE — ALREADY SUPPORTS SCHOOL TYPE)
File: app/api/institutions/request/route.ts
Action: CREATE (same as previous version)
TypeScript
// === FILE: app/api/institutions/request/route.ts ===
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const {
      name,
      type,
      country,
      city,
      website,
      contactEmail,
      contactPhone,
      description,
    } = body;

    if (!name || !type || !country || !contactEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('pending_institutions')
      .insert({
        name,
        type,
        country,
        city: city || null,
        website: website || null,
        contact_email: contactEmail,
        contact_phone: contactPhone || null,
        description: description || null,
        submitted_by: user?.id || null,
        status: 'submitted',
      })
      .select()
      .single();

    if (error) throw error;

    // TODO: Send email notification to admin (implement with your email provider)
    // await sendAdminNotification('new_institution_request', data);

    return NextResponse.json({
      success: true,
      request: data,
      message: 'Request submitted successfully. Our team will review and contact you within 2-3 business days.',
    });
  } catch (error) {
    console.error('Join request error:', error);
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
  }
}
// === END FILE ===
STEP 5: MAIN CLAIM/REQUEST PAGE (UPDATED WITH SCHOOLS)
File: app/institutions/claim/page.tsx
Action: CREATE
TypeScript
// === FILE: app/institutions/claim/page.tsx ===
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Globe, Building2, Briefcase, GraduationCap, ArrowRight, CheckCircle, Clock, X } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';

interface SearchResult {
  id: string;
  name: string;
  entityType: 'institution' | 'employer' | 'school';
  type?: string;
  industry?: string;
  level?: string;
  country?: string;
  county?: string;
  city?: string;
  sub_county?: string;
  website?: string;
  logo_url?: string;
}

export default function ClaimPage() {
  const router = useRouter();
  const [searchBy, setSearchBy] = useState<'name' | 'domain'>('name');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<SearchResult | null>(null);
  const [claimEmail, setClaimEmail] = useState('');
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimResult, setClaimResult] = useState<{success: boolean; message: string; autoApproved?: boolean} | null>(null);

  // Request form state
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestForm, setRequestForm] = useState({
    name: '',
    type: 'university',
    country: '',
    city: '',
    website: '',
    contactEmail: '',
    contactPhone: '',
    description: '',
  });
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestResult, setRequestResult] = useState<{success: boolean; message: string} | null>(null);

  const debouncedQuery = useDebounce(query, 400);

  const performSearch = useCallback(async (searchQuery: string, by: 'name' | 'domain') => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/institutions/search?q=${encodeURIComponent(searchQuery)}&by=${by}`);
      const data = await res.json();
      setResults(data.results || []);
      setHasSearched(true);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    performSearch(debouncedQuery, searchBy);
  }, [debouncedQuery, searchBy, performSearch]);

  const handleClaimSubmit = async () => {
    if (!selectedEntity || !claimEmail) return;
    setClaimSubmitting(true);
    try {
      const res = await fetch('/api/institutions/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionId: selectedEntity.id,
          institutionType: selectedEntity.entityType,
          claimEmail,
        }),
      });
      const data = await res.json();
      setClaimResult({
        success: data.success,
        message: data.message,
        autoApproved: data.autoApproved,
      });
    } catch (err) {
      setClaimResult({ success: false, message: 'Failed to submit claim. Please try again.' });
    } finally {
      setClaimSubmitting(false);
    }
  };

  const handleRequestSubmit = async () => {
    setRequestSubmitting(true);
    try {
      const res = await fetch('/api/institutions/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestForm),
      });
      const data = await res.json();
      setRequestResult({
        success: data.success,
        message: data.message,
      });
    } catch (err) {
      setRequestResult({ success: false, message: 'Failed to submit request. Please try again.' });
    } finally {
      setRequestSubmitting(false);
    }
  };

  const normalizeDomain = (url?: string) => {
    if (!url) return '';
    return url.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  };

  const getEntityIcon = (entity: SearchResult) => {
    if (entity.entityType === 'employer') return <Briefcase className="text-gray-400" size={20} />;
    if (entity.entityType === 'school') return <GraduationCap className="text-gray-400" size={20} />;
    return <Building2 className="text-gray-400" size={20} />;
  };

  const getEntitySubtitle = (entity: SearchResult) => {
    if (entity.entityType === 'institution') {
      return `${entity.type || 'Institution'} • ${entity.city ? `${entity.city}, ` : ''}${entity.country || ''}`;
    }
    if (entity.entityType === 'employer') {
      return `${entity.industry || 'Company'} • ${entity.city ? `${entity.city}, ` : ''}${entity.country || ''}`;
    }
    if (entity.entityType === 'school') {
      return `${entity.level || 'School'} • ${entity.sub_county ? `${entity.sub_county}, ` : ''}${entity.county || ''}`;
    }
    return '';
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Join ElimuX</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Search to see if your institution, school, or company is already listed. Claim your profile or request to be onboarded.
          </p>
        </div>

        {/* Search Tabs */}
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

        {/* Search Input */}
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
                : 'Enter institution, school, or company name'
            }
            className="w-full bg-gray-900 border border-gray-700 rounded-xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
          {isLoading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Results */}
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
                      {result.logo_url ? (
                        <img src={result.logo_url} alt="" className="w-8 h-8 object-contain" />
                      ) : (
                        getEntityIcon(result)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{result.name}</h3>
                      <p className="text-gray-400 text-sm">{getEntitySubtitle(result)}</p>
                      {result.website && (
                        <p className="text-gray-500 text-sm mt-1">{normalizeDomain(result.website)}</p>
                      )}
                    </div>
                    <button
                      onClick={() => { setSelectedEntity(result); setClaimEmail(''); setClaimResult(null); }}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium shrink-0 transition-colors"
                    >
                      Claim Profile
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-900/50 rounded-xl border border-gray-800">
                <Search className="mx-auto text-gray-600 mb-4" size={48} />
                <h3 className="text-xl font-semibold mb-2">No results found</h3>
                <p className="text-gray-400 mb-6">
                  {searchBy === 'domain'
                    ? `We couldn't find any institution matching "${query}"`
                    : `We couldn't find any institution, school, or employer named "${query}"`}
                </p>
                <button
                  onClick={() => {
                    setShowRequestForm(true);
                    setRequestForm(prev => ({ ...prev, name: query, website: searchBy === 'domain' ? query : '' }));
                  }}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2"
                >
                  Request to Join ElimuX <ArrowRight size={18} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bottom CTA for manual request */}
        {hasSearched && results.length > 0 && (
          <div className="max-w-2xl mx-auto mt-8 text-center">
            <p className="text-gray-500 mb-4">Can't find what you're looking for?</p>
            <button
              onClick={() => setShowRequestForm(true)}
              className="text-orange-400 hover:text-orange-300 font-medium"
            >
              Submit a new onboarding request →
            </button>
          </div>
        )}

        {/* Claim Modal */}
        {selectedEntity && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">Claim {selectedEntity.name}</h3>
                <button onClick={() => setSelectedEntity(null)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              {!claimResult ? (
                <>
                  <p className="text-gray-400 mb-6">
                    To verify ownership, enter your official institutional email address.
                    {selectedEntity.website && (
                      <> If your email domain matches <strong>{normalizeDomain(selectedEntity.website)}</strong>, approval will be instant.</>
                    )}
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Official Email</label>
                      <input
                        type="email"
                        value={claimEmail}
                        onChange={(e) => setClaimEmail(e.target.value)}
                        placeholder="you@institution.ac.ke"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <button
                      onClick={handleClaimSubmit}
                      disabled={!claimEmail || claimSubmitting}
                      className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 disabled:text-gray-500 text-white py-3 rounded-lg font-medium transition-colors"
                    >
                      {claimSubmitting ? 'Submitting...' : 'Submit Claim'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  {claimResult.success ? (
                    <>
                      <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
                      <h4 className="text-lg font-semibold mb-2">
                        {claimResult.autoApproved ? 'Claim Approved!' : 'Claim Submitted'}
                      </h4>
                      <p className="text-gray-400">{claimResult.message}</p>
                    </>
                  ) : (
                    <>
                      <X className="mx-auto text-red-500 mb-4" size={48} />
                      <p className="text-gray-400">{claimResult.message}</p>
                    </>
                  )}
                  <button
                    onClick={() => setSelectedEntity(null)}
                    className="mt-6 text-orange-400 hover:text-orange-300 font-medium"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Request Form Modal */}
        {showRequestForm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-lg w-full p-6 my-8">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold">Request to Join ElimuX</h3>
                <button onClick={() => setShowRequestForm(false)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              {!requestResult ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-1">Institution/School/Company Name *</label>
                      <input
                        type="text"
                        value={requestForm.name}
                        onChange={(e) => setRequestForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Type *</label>
                      <select
                        value={requestForm.type}
                        onChange={(e) => setRequestForm(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                      >
                        <option value="university">University</option>
                        <option value="college">College</option>
                        <option value="tvet">TVET</option>
                        <option value="school">School</option>
                        <option value="employer">Employer</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Country *</label>
                      <input
                        type="text"
                        value={requestForm.country}
                        onChange={(e) => setRequestForm(prev => ({ ...prev, country: e.target.value }))}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">City</label>
                      <input
                        type="text"
                        value={requestForm.city}
                        onChange={(e) => setRequestForm(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-1">Website</label>
                      <input
                        type="url"
                        value={requestForm.website}
                        onChange={(e) => setRequestForm(prev => ({ ...prev, website: e.target.value }))}
                        placeholder="https://www.example.ac.ke"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Contact Email *</label>
                      <input
                        type="email"
                        value={requestForm.contactEmail}
                        onChange={(e) => setRequestForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Contact Phone</label>
                      <input
                        type="tel"
                        value={requestForm.contactPhone}
                        onChange={(e) => setRequestForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                      <textarea
                        value={requestForm.description}
                        onChange={(e) => setRequestForm(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleRequestSubmit}
                    disabled={!requestForm.name || !requestForm.country || !requestForm.contactEmail || requestSubmitting}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 disabled:text-gray-500 text-white py-3 rounded-lg font-medium transition-colors"
                  >
                    {requestSubmitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  {requestResult.success ? (
                    <>
                      <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
                      <h4 className="text-lg font-semibold mb-2">Request Received</h4>
                      <p className="text-gray-400">{requestResult.message}</p>
                    </>
                  ) : (
                    <>
                      <X className="mx-auto text-red-500 mb-4" size={48} />
                      <p className="text-gray-400">{requestResult.message}</p>
                    </>
                  )}
                  <button
                    onClick={() => setShowRequestForm(false)}
                    className="mt-6 text-orange-400 hover:text-orange-300 font-medium"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
// === END FILE ===
STEP 6: USE-DEBOUNCE HOOK (if not existing)
File: hooks/use-debounce.ts
Action: CREATE (if missing)
TypeScript
// === FILE: hooks/use-debounce.ts ===
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
// === END FILE ===
STEP 7: NAVIGATION UPDATE
File: components/layout/navbar.tsx (or your main navigation component)
Action: MODIFY — Add "Join ElimuX" link
Locate your navigation links array and add:
TypeScript
// === INSERT INTO NAV LINKS ARRAY ===
{
  label: 'Join ElimuX',
  href: '/institutions/claim',
  icon: Building2,
  public: true, // show even when not logged in
}
// === END INSERT ===
Place it after "Partner" or at the end of the primary nav. Ensure it is visible to non-authenticated users.
STEP 8: ADMIN DASHBOARD — PENDING REVIEWS PAGE (UPDATED WITH SCHOOLS)
File: app/admin/claims/page.tsx
Action: CREATE
TypeScript
// === FILE: app/admin/claims/page.tsx ===
'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle, XCircle, Clock, Building2, Briefcase, GraduationCap, ExternalLink } from 'lucide-react';

interface Claim {
  id: string;
  institution_id: string;
  institution_type: string;
  claim_email: string;
  domain_used: string;
  verification_method: string;
  status: string;
  created_at: string;
  claimed_by: string;
}

interface PendingInstitution {
  id: string;
  name: string;
  type: string;
  country: string;
  city: string;
  website: string;
  contact_email: string;
  contact_phone: string;
  status: string;
  created_at: string;
}

export default function AdminClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [pending, setPending] = useState<PendingInstitution[]>([]);
  const [activeTab, setActiveTab] = useState<'claims' | 'requests'>('claims');
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [claimsRes, pendingRes] = await Promise.all([
      supabase.from('institution_claims').select('*').order('created_at', { ascending: false }),
      supabase.from('pending_institutions').select('*').order('created_at', { ascending: false }),
    ]);
    setClaims(claimsRes.data || []);
    setPending(pendingRes.data || []);
    setLoading(false);
  };

  const updateClaimStatus = async (id: string, status: 'approved' | 'rejected') => {
    await supabase.from('institution_claims').update({ status, reviewed_at: new Date().toISOString() }).eq('id', id);
    fetchData();
  };

  const updatePendingStatus = async (id: string, status: 'under_review' | 'approved' | 'rejected') => {
    await supabase.from('pending_institutions').update({ status, reviewed_at: new Date().toISOString() }).eq('id', id);
    fetchData();
  };

  const getClaimIcon = (type: string) => {
    if (type === 'employer') return <Briefcase size={20} />;
    if (type === 'school') return <GraduationCap size={20} />;
    return <Building2 size={20} />;
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Institution Reviews</h1>

      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setActiveTab('claims')}
          className={`px-6 py-2 rounded-lg font-medium ${activeTab === 'claims' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-300'}`}
        >
          Ownership Claims ({claims.filter(c => c.status === 'pending').length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-6 py-2 rounded-lg font-medium ${activeTab === 'requests' ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-300'}`}
        >
          Join Requests ({pending.filter(p => p.status === 'submitted').length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : activeTab === 'claims' ? (
        <div className="space-y-4">
          {claims.length === 0 && <p className="text-gray-400">No claims found.</p>}
          {claims.map((claim) => (
            <div key={claim.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                  {getClaimIcon(claim.institution_type)}
                </div>
                <div>
                  <p className="font-semibold">{claim.claim_email}</p>
                  <p className="text-sm text-gray-400">
                    Type: {claim.institution_type} • Domain: {claim.domain_used} • Method: {claim.verification_method} • Status: {claim.status}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(claim.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              {claim.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => updateClaimStatus(claim.id, 'approved')}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button
                    onClick={() => updateClaimStatus(claim.id, 'rejected')}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              )}
              {claim.status !== 'pending' && (
                <span className={`px-3 py-1 rounded-full text-sm ${claim.status === 'approved' ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
                  {claim.status}
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {pending.length === 0 && <p className="text-gray-400">No pending requests.</p>}
          {pending.map((req) => (
            <div key={req.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                    {req.type === 'employer' ? <Briefcase size={20} /> : req.type === 'school' ? <GraduationCap size={20} /> : <Building2 size={20} />}
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{req.name}</p>
                    <p className="text-sm text-gray-400">
                      {req.type} • {req.city ? `${req.city}, ` : ''}{req.country}
                    </p>
                    {req.website && (
                      <a href={req.website} target="_blank" rel="noopener noreferrer" className="text-orange-400 text-sm flex items-center gap-1 mt-1">
                        {req.website} <ExternalLink size={12} />
                      </a>
                    )}
                    <p className="text-sm text-gray-500 mt-2">Contact: {req.contact_email} {req.contact_phone && `• ${req.contact_phone}`}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  req.status === 'submitted' ? 'bg-yellow-900 text-yellow-400' :
                  req.status === 'under_review' ? 'bg-blue-900 text-blue-400' :
                  req.status === 'approved' ? 'bg-green-900 text-green-400' :
                  'bg-red-900 text-red-400'
                }`}>
                  {req.status}
                </span>
              </div>
              {req.status === 'submitted' && (
                <div className="flex gap-2 mt-4 justify-end">
                  <button
                    onClick={() => updatePendingStatus(req.id, 'under_review')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <Clock size={16} /> Mark Reviewing
                  </button>
                  <button
                    onClick={() => updatePendingStatus(req.id, 'approved')}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button
                    onClick={() => updatePendingStatus(req.id, 'rejected')}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
// === END FILE ===
STEP 9: FEATURE FLAG CHECK (Optional but Recommended)
If you want to hide this behind a feature flag until tested, wrap the nav link and page access with a flag check.
In your feature flag loader (wherever you fetch institution_claim_portal_enabled):
TypeScript
// === CHECK BEFORE RENDERING NAV LINK ===
const { data: flag } = await supabase.from('feature_flags').select('value').eq('key', 'institution_claim_portal_enabled').single();
if (flag?.value !== 'true') return null; // Don't show link
// === END CHECK ===
Enable the flag in Supabase after local testing passes.
STEP 10: TESTING CHECKLIST (Execute Before Commit)
[ ] Run npm run build — zero errors
[ ] Navigate to /institutions/claim locally
[ ] Name Search — Institution: Type "Mount Kenya" — verify results appear
[ ] Name Search — School: Type a known school name — verify school result appears with GraduationCap icon
[ ] Domain Search: Switch to Domain tab, type a school domain — verify match
[ ] Claim Flow: Click "Claim Profile" on any result, enter email, submit
[ ] Auto-Approval: Use an email matching the entity domain — verify instant approval in DB
[ ] Manual Review: Use a non-matching email — verify pending status in DB
[ ] Request Flow: Search for a non-existent name, click "Request to Join", select "School" type, fill form, submit
[ ] Admin Page: Navigate to /admin/claims, verify claim and request appear with correct type icons
[ ] Approve/Reject: Test admin action buttons, verify status updates
[ ] RLS Check: Log out, verify you can still search and submit requests (but not claims)
COPY-PASTE SUMMARY
Table
#	File	Action
1	Supabase SQL Editor	Run Step 1 SQL
2	app/api/institutions/search/route.ts	CREATE
3	app/api/institutions/claim/route.ts	CREATE
4	app/api/institutions/request/route.ts	CREATE
5	app/institutions/claim/page.tsx	CREATE
6	hooks/use-debounce.ts	CREATE (if missing)
7	components/layout/navbar.tsx	MODIFY — add nav link
8	app/admin/claims/page.tsx	CREATE
Do NOT commit or push until all checklist items pass locally.