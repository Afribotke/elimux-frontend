Cycle: Bursary Student-Facing Discovery & Application Flow — CORRECTED
Pre-flight mandatory reads. Before writing any code, read these files and report their first 20 lines back:
src/lib/api.ts — report the exact function names for bursary-related exports and how authenticated endpoints retrieve the auth token
elimux-backend/src/routes/bursary-providers.ts — report the import pattern and Supabase client setup
elimux-backend/src/routes/admin-bursary-funds.ts — report how the POST endpoint maps flat DTO fields into JSONB columns (this is the pattern to reverse for public reads)
Do not write files until these 3 reads are reported.
Schema truth (from audit)
bursary_funds has NO amount, currency, deadline, eligibility_criteria, requirements, field_of_study, location columns. Real data lives in JSONB: budget (total, currency, committed, disbursed), application_window (deadline, opens_at), eligibility_rules, required_documents.
bursary_applications.applicant_id is FK to bursary_applicants.id, NOT auth.users.id. A bursary_applicants profile row must exist (or be auto-created) before inserting an application.
bursary_applications.tenant_id is NOT NULL. Must be resolved from the fund's tenant_id.
bursary_applications.status enum: draft|submitted|document_check|institution_verify|govt_verify|provider_review|approved|rejected|waitlisted|disbursed|appealed. New applications start at submitted.
bursary_funds.status enum: draft|open|closed|paused. Public listing only shows status = 'open'.
No applied_at column — use created_at. No notes column on bursary_applications.
Provider name is tenants.name, not organization_name. Logo is tenant_branding.logo_url.
All tables are empty (0 rows). The student flow will show empty until an admin approves a provider and that provider posts an open fund.
Step 1 — Create backend public routes
File: elimux-backend/src/routes/bursary-public.ts
Follow the exact same import pattern as bursary-providers.ts. Use the service-role Supabase client.
TypeScript
import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/bursary/funds — List all open bursary funds across providers
router.get('/funds', async (req: Request, res: Response) => {
  try {
    const { data: funds, error: fundsError } = await supabase
      .from('bursary_funds')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (fundsError) throw fundsError;

    const providerIds = [...new Set(funds?.map(f => f.provider_id).filter(Boolean) || [])];
    const tenantIds = [...new Set(funds?.map(f => f.tenant_id).filter(Boolean) || [])];

    const { data: providers } = await supabase
      .from('tenants')
      .select('id, name')
      .in('id', providerIds);

    const { data: branding } = await supabase
      .from('tenant_branding')
      .select('tenant_id, logo_url')
      .in('tenant_id', tenantIds);

    const providerMap = new Map(providers?.map(p => [p.id, p]) || []);
    const brandingMap = new Map(branding?.map(b => [b.tenant_id, b]) || []);

    const flattened = funds?.map(f => ({
      id: f.id,
      tenantId: f.tenant_id,
      providerId: f.provider_id,
      name: f.name,
      description: f.description,
      fundType: f.fund_type,
      status: f.status,
      totalAmount: f.budget?.total ?? null,
      currency: f.budget?.currency ?? null,
      committed: f.budget?.committed ?? null,
      disbursed: f.budget?.disbursed ?? null,
      eligibilityRules: f.eligibility_rules ?? null,
      requiredDocuments: f.required_documents ?? null,
      deadline: f.application_window?.deadline ?? null,
      opensAt: f.application_window?.opens_at ?? null,
      providerName: providerMap.get(f.provider_id)?.name ?? null,
      providerLogo: brandingMap.get(f.tenant_id)?.logo_url ?? null,
      createdAt: f.created_at,
      updatedAt: f.updated_at,
    })) || [];

    return res.json({ funds: flattened });
  } catch (err: any) {
    console.error('List funds error:', err);
    return res.status(500).json({ error: 'Failed to load bursaries' });
  }
});

// GET /api/bursary/funds/:id — Single fund detail
router.get('/funds/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data: fund, error: fundError } = await supabase
      .from('bursary_funds')
      .select('*')
      .eq('id', id)
      .single();

    if (fundError || !fund) {
      return res.status(404).json({ error: 'Bursary not found' });
    }

    const [{ data: provider }, { data: branding }] = await Promise.all([
      supabase.from('tenants').select('id, name').eq('id', fund.provider_id).maybeSingle(),
      supabase.from('tenant_branding').select('logo_url').eq('tenant_id', fund.tenant_id).maybeSingle(),
    ]);

    const flattened = {
      id: fund.id,
      tenantId: fund.tenant_id,
      providerId: fund.provider_id,
      name: fund.name,
      description: fund.description,
      fundType: fund.fund_type,
      status: fund.status,
      totalAmount: fund.budget?.total ?? null,
      currency: fund.budget?.currency ?? null,
      committed: fund.budget?.committed ?? null,
      disbursed: fund.budget?.disbursed ?? null,
      eligibilityRules: fund.eligibility_rules ?? null,
      requiredDocuments: fund.required_documents ?? null,
      deadline: fund.application_window?.deadline ?? null,
      opensAt: fund.application_window?.opens_at ?? null,
      providerName: provider?.name ?? null,
      providerLogo: branding?.logo_url ?? null,
      createdAt: fund.created_at,
      updatedAt: fund.updated_at,
    };

    return res.json({ fund: flattened });
  } catch (err: any) {
    console.error('Fund detail error:', err);
    return res.status(500).json({ error: 'Failed to load bursary details' });
  }
});

// POST /api/bursary/apply — Student submits application
router.post('/apply', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const { fund_id } = req.body;
    if (!fund_id) {
      return res.status(400).json({ error: 'fund_id is required' });
    }

    // Verify fund exists and is open
    const { data: fund, error: fundError } = await supabase
      .from('bursary_funds')
      .select('id, tenant_id, status, application_window')
      .eq('id', fund_id)
      .single();

    if (fundError || !fund) {
      return res.status(404).json({ error: 'Bursary fund not found' });
    }

    if (fund.status !== 'open') {
      return res.status(400).json({ error: 'This bursary is not currently accepting applications' });
    }

    if (fund.application_window?.deadline && new Date(fund.application_window.deadline) < new Date()) {
      return res.status(400).json({ error: 'Application deadline has passed' });
    }

    // Find or create applicant profile
    const { data: existingApplicant } = await supabase
      .from('bursary_applicants')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    let applicantId: string;
    if (existingApplicant) {
      applicantId = existingApplicant.id;
    } else {
      const { data: newApplicant, error: applicantError } = await supabase
        .from('bursary_applicants')
        .insert({
          user_id: user.id,
          tenant_id: fund.tenant_id,
          application_type: 'self',
          personal_info: {},
          academic_info: {},
          residence_info: {},
          household_info: {},
          vulnerability_index: {},
          documents: [],
          application_status: 'draft',
          fraud_score: 0,
          fraud_flags: [],
          eligibility_score: 0,
          eligibility_breakdown: {},
          appeal_status: 'none',
        })
        .select('id')
        .single();

      if (applicantError || !newApplicant) {
        console.error('Applicant creation error:', applicantError);
        return res.status(500).json({ error: 'Failed to create applicant profile' });
      }
      applicantId = newApplicant.id;
    }

    // Check for existing application
    const { data: existingApp } = await supabase
      .from('bursary_applications')
      .select('id')
      .eq('fund_id', fund_id)
      .eq('applicant_id', applicantId)
      .maybeSingle();

    if (existingApp) {
      return res.status(409).json({ error: 'You have already applied for this bursary' });
    }

    // Create application
    const { data: application, error: appError } = await supabase
      .from('bursary_applications')
      .insert({
        fund_id,
        applicant_id: applicantId,
        tenant_id: fund.tenant_id,
        status: 'submitted',
        submission_data: {},
        eligibility_score: 0,
        eligibility_breakdown: {},
        fraud_score: 0,
        fraud_flags: [],
        document_status: {},
        institution_verification: {},
        government_verification: {},
        provider_decision: {},
        allocation_data: {},
        disbursement_plan: [],
        appeal_data: {},
        audit_trail: [],
      })
      .select()
      .single();

    if (appError) {
      console.error('Application insert error:', appError);
      return res.status(500).json({ error: 'Failed to submit application' });
    }

    return res.status(201).json({
      success: true,
      application_id: application.id,
      status: application.status,
      message: 'Application submitted successfully',
    });
  } catch (err: any) {
    console.error('Bursary apply error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/bursary/applications/my — Get current user's applications
router.get('/applications/my', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Find applicant profile
    const { data: applicant } = await supabase
      .from('bursary_applicants')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!applicant) {
      return res.json({ applications: [] });
    }

    const { data: applications, error } = await supabase
      .from('bursary_applications')
      .select(`
        *,
        fund:bursary_funds!fund_id(id, name, description, budget, application_window, status)
      `)
      .eq('applicant_id', applicant.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch applications error:', error);
      return res.status(500).json({ error: 'Failed to fetch applications' });
    }

    const flattened = applications?.map(app => ({
      id: app.id,
      applicantId: app.applicant_id,
      fundId: app.fund_id,
      tenantId: app.tenant_id,
      status: app.status,
      submissionData: app.submission_data,
      eligibilityScore: app.eligibility_score,
      fraudScore: app.fraud_score,
      documentStatus: app.document_status,
      createdAt: app.created_at,
      updatedAt: app.updated_at,
      fundName: app.fund?.name ?? null,
      fundDescription: app.fund?.description ?? null,
      fundAmount: app.fund?.budget?.total ?? null,
      fundCurrency: app.fund?.budget?.currency ?? null,
      fundDeadline: app.fund?.application_window?.deadline ?? null,
      fundStatus: app.fund?.status ?? null,
    })) || [];

    return res.json({ applications: flattened });
  } catch (err: any) {
    console.error('Get applications error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
Step 2 — Mount the new route
File: elimux-backend/src/index.ts
Add this import with the other bursary route imports:
TypeScript
import bursaryPublicRoutes from './routes/bursary-public';
Add this mount line after the existing bursary mounts (around line 201):
TypeScript
app.use('/api/bursary', bursaryPublicRoutes);
Step 3 — Add API client functions
File: src/lib/api.ts
Add these functions using the exact same pattern as existing bursary functions in this file. Match the auth token retrieval, error handling, and fetch() pattern exactly.
TypeScript
export async function getBursaryFunds() {
  // GET /api/bursary/funds
  // Use same fetch pattern as fetchBursaryProvider
  // Return { funds: BursaryFund[] }
}

export async function getBursaryFund(id: string) {
  // GET /api/bursary/funds/${id}
  // Return { fund: BursaryFund }
}

export async function applyToBursary(fundId: string) {
  // POST /api/bursary/apply
  // Include Authorization: Bearer <token> header using same token retrieval as other authenticated calls
  // Body: { fund_id: fundId }
  // Return server response JSON
}

export async function getMyBursaryApplications() {
  // GET /api/bursary/applications/my
  // Include Authorization: Bearer <token> header
  // Return { applications: BursaryApplication[] }
}
Critical: Do NOT import createClientComponentClient from @supabase/auth-helpers-nextjs — this package is not in the project. Use the same Supabase client / auth token pattern already used in this file.
Step 4 — Create types
File: src/types/bursary.ts
TypeScript
export interface BursaryFund {
  id: string;
  tenantId: string;
  providerId: string | null;
  name: string;
  description: string | null;
  fundType: string | null;
  status: string | null;
  totalAmount: number | null;
  currency: string | null;
  committed: number | null;
  disbursed: number | null;
  eligibilityRules: any;
  requiredDocuments: any;
  deadline: string | null;
  opensAt: string | null;
  providerName: string | null;
  providerLogo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BursaryApplication {
  id: string;
  applicantId: string;
  fundId: string;
  tenantId: string;
  status: string | null;
  submissionData: any;
  eligibilityScore: number | null;
  fraudScore: number | null;
  documentStatus: any;
  createdAt: string;
  updatedAt: string;
  fundName?: string | null;
  fundDescription?: string | null;
  fundAmount?: number | null;
  fundCurrency?: string | null;
  fundDeadline?: string | null;
  fundStatus?: string | null;
}
Step 5 — Replace "Coming Soon" with live bursary listing
File: src/app/bursary/page.tsx (overwrite completely)
TypeScript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBursaryFunds } from '@/lib/api';
import { BursaryFund } from '@/types/bursary';
import Link from 'next/link';

export default function BursaryListingPage() {
  const router = useRouter();
  const [funds, setFunds] = useState<BursaryFund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [deadlineBefore, setDeadlineBefore] = useState('');

  useEffect(() => {
    fetchFunds();
  }, []);

  async function fetchFunds() {
    setLoading(true);
    setError(null);
    try {
      const data = await getBursaryFunds();
      setFunds(data.funds || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load bursaries');
    } finally {
      setLoading(false);
    }
  }

  function clearFilters() {
    setSearchQuery('');
    setMinAmount('');
    setMaxAmount('');
    setDeadlineBefore('');
  }

  const filteredFunds = funds.filter(fund => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matches = fund.name?.toLowerCase().includes(q) ||
        fund.description?.toLowerCase().includes(q) ||
        fund.providerName?.toLowerCase().includes(q);
      if (!matches) return false;
    }
    if (minAmount && (fund.totalAmount ?? 0) < parseInt(minAmount)) return false;
    if (maxAmount && (fund.totalAmount ?? 0) > parseInt(maxAmount)) return false;
    if (deadlineBefore && fund.deadline && new Date(fund.deadline) > new Date(deadlineBefore)) return false;
    return true;
  });

  const isFiltered = searchQuery || minAmount || maxAmount || deadlineBefore;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Bursaries & Financial Aid</h1>
          <p className="mt-2 text-gray-600">Discover funding opportunities to support your education.</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Filters</h3>
                {isFiltered && (
                  <button onClick={clearFilters} className="text-sm text-blue-600 hover:text-blue-800">
                    Clear all
                  </button>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Keyword..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Range</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={minAmount}
                    onChange={e => setMinAmount(e.target.value)}
                    placeholder="Min"
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    value={maxAmount}
                    onChange={e => setMaxAmount(e.target.value)}
                    placeholder="Max"
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline Before</label>
                <input
                  type="date"
                  value={deadlineBefore}
                  onChange={e => setDeadlineBefore(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          <div className="flex-1">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">{error}</div>
            ) : filteredFunds.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  {funds.length === 0 ? 'No bursaries available yet. Check back soon!' : 'No bursaries match your filters.'}
                </p>
                {isFiltered && funds.length > 0 && (
                  <button onClick={clearFilters} className="mt-4 text-blue-600 hover:text-blue-800 font-medium">
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 mb-4">{filteredFunds.length} bursar{filteredFunds.length === 1 ? 'y' : 'ies'} found</p>
                {filteredFunds.map(fund => (
                  <Link
                    key={fund.id}
                    href={`/bursary/fund/${fund.id}`}
                    className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{fund.name}</h3>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Open</span>
                        </div>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-3">{fund.description || 'No description available.'}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          {fund.providerName && (
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                              {fund.providerName}
                            </span>
                          )}
                          {fund.totalAmount && (
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              {fund.currency || 'KES'}{fund.totalAmount.toLocaleString()}
                            </span>
                          )}
                          {fund.deadline && (
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              Deadline: {new Date(fund.deadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
Step 6 — Create public bursary detail page
File: src/app/bursary/fund/[id]/page.tsx
TypeScript
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getBursaryFund, applyToBursary } from '@/lib/api';
import { BursaryFund } from '@/types/bursary';
import Link from 'next/link';

export default function BursaryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const fundId = params.id as string;

  const [fund, setFund] = useState<BursaryFund | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState(false);

  useEffect(() => {
    fetchFund();
  }, [fundId]);

  async function fetchFund() {
    setLoading(true);
    setError(null);
    try {
      const data = await getBursaryFund(fundId);
      setFund(data.fund);
    } catch (err: any) {
      setError(err.message || 'Failed to load bursary details');
    } finally {
      setLoading(false);
    }
  }

  async function handleApply() {
    setApplying(true);
    setApplyError(null);
    setApplySuccess(false);
    try {
      await applyToBursary(fundId);
      setApplySuccess(true);
    } catch (err: any) {
      setApplyError(err.message || 'Failed to submit application');
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !fund) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error || 'Bursary not found'}</p>
          <Link href="/bursary" className="mt-4 text-blue-600 hover:text-blue-800 font-medium">← Back to bursaries</Link>
        </div>
      </div>
    );
  }

  const isDeadlinePassed = fund.deadline ? new Date(fund.deadline) < new Date() : false;
  const canApply = fund.status === 'open' && !isDeadlinePassed;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/bursary" className="text-blue-600 hover:text-blue-800 font-medium mb-6 inline-block">← Back to all bursaries</Link>
        <div className="bg-white rounded-lg shadow p-8">
          <div className="border-b pb-6 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-2xl font-bold text-gray-900">{fund.name}</h1>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                fund.status === 'open' && !isDeadlinePassed ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {isDeadlinePassed ? 'Closed' : fund.status === 'open' ? 'Open' : fund.status}
              </span>
            </div>
            {fund.providerName && (
              <p className="text-blue-600 font-medium">{fund.providerName}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {fund.totalAmount && (
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-medium">Award Amount</p>
                <p className="text-2xl font-bold text-blue-900">{fund.currency || 'KES'}{fund.totalAmount.toLocaleString()}</p>
              </div>
            )}
            {fund.deadline && (
              <div className={`rounded-lg p-4 ${isDeadlinePassed ? 'bg-red-50' : 'bg-amber-50'}`}>
                <p className={`text-sm font-medium ${isDeadlinePassed ? 'text-red-600' : 'text-amber-600'}`}>Application Deadline</p>
                <p className={`text-lg font-semibold ${isDeadlinePassed ? 'text-red-900' : 'text-amber-900'}`}>
                  {new Date(fund.deadline).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            )}
            {fund.fundType && (
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-purple-600 font-medium">Fund Type</p>
                <p className="text-lg font-semibold text-purple-900 capitalize">{fund.fundType}</p>
              </div>
            )}
          </div>

          {fund.description && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">About this Bursary</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{fund.description}</p>
            </div>
          )}

          {fund.eligibilityRules && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Eligibility Criteria</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-gray-600 text-sm whitespace-pre-wrap">{JSON.stringify(fund.eligibilityRules, null, 2)}</pre>
              </div>
            </div>
          )}

          {fund.requiredDocuments && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Required Documents</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-gray-600 text-sm whitespace-pre-wrap">{JSON.stringify(fund.requiredDocuments, null, 2)}</pre>
              </div>
            </div>
          )}

          <div className="border-t pt-6">
            {applySuccess ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-medium">Application submitted successfully!</p>
                <p className="text-green-600 text-sm mt-1">
                  You can track your application status in{' '}
                  <Link href="/bursary/my-applications" className="underline font-medium">My Applications</Link>.
                </p>
              </div>
            ) : (
              <>
                {applyError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-red-800">{applyError}</p>
                  </div>
                )}
                <button
                  onClick={handleApply}
                  disabled={!canApply || applying}
                  className={`w-full md:w-auto px-8 py-3 rounded-lg font-semibold text-white transition-colors ${
                    canApply ? 'bg-blue-600 hover:bg-blue-700 disabled:opacity-50' : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  {applying ? 'Submitting...' : canApply ? 'Apply Now' : 'Applications Closed'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
Step 7 — Create "My Applications" tracker page
File: src/app/bursary/my-applications/page.tsx
TypeScript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMyBursaryApplications } from '@/lib/api';
import { BursaryApplication } from '@/types/bursary';
import Link from 'next/link';

export default function MyApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<BursaryApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  async function fetchApplications() {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyBursaryApplications();
      setApplications(data.applications || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: string | null) {
    switch (status) {
      case 'submitted': return 'bg-yellow-100 text-yellow-800';
      case 'document_check': return 'bg-orange-100 text-orange-800';
      case 'institution_verify': return 'bg-blue-100 text-blue-800';
      case 'govt_verify': return 'bg-indigo-100 text-indigo-800';
      case 'provider_review': return 'bg-cyan-100 text-cyan-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'waitlisted': return 'bg-gray-100 text-gray-800';
      case 'disbursed': return 'bg-purple-100 text-purple-800';
      case 'appealed': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  function formatStatus(status: string | null) {
    if (!status) return 'Unknown';
    return status.replace(/_/g, ' ');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Bursary Applications</h1>
            <p className="text-gray-600 mt-1">Track the status of your applications.</p>
          </div>
          <Link href="/bursary" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Browse Bursaries</Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-800">{error}</div>
        )}

        {applications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">You haven't applied to any bursaries yet.</p>
            <Link href="/bursary" className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-medium">Browse available bursaries →</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map(app => (
              <div key={app.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{app.fundName || 'Unknown Fund'}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(app.status)}`}>
                        {formatStatus(app.status)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                      {app.fundAmount && <span>{app.fundCurrency || 'KES'}{app.fundAmount.toLocaleString()}</span>}
                      {app.fundDeadline && <span>Deadline: {new Date(app.fundDeadline).toLocaleDateString()}</span>}
                      <span>Applied: {new Date(app.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Link href={`/bursary/fund/${app.fundId}`} className="text-blue-600 hover:text-blue-800 font-medium text-sm whitespace-nowrap">View Fund →</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
Step 8 — Build, verify, deploy
Backend: npm run build — verify bursary-public.ts compiles
Frontend: npm run build — fix any TS errors. If OOM: NODE_OPTIONS="--max-old-space-size=1536" npm run build
Deploy: Backend → Railway, Frontend → Vercel
Live verify:
/bursary loads and shows listing (empty until admin seeds data)
/bursary/fund/[id] shows detail with Apply button
Logged-in student clicks Apply → success confirmation
/bursary/my-applications shows submitted application with submitted status
Report back: build status, any errors, and confirmation all 4 deliverables are live.
Do not proceed to any other feature until this cycle is verified complete.