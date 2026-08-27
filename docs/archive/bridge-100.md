Cycle: Fix /programs Perceived Loading Speed — Server-Side Data Fetch
Problem
The composite index fixed the database query (19.9ms), but /programs still feels slow to users. The page is 'use client' — it ships empty HTML, waits for JS to hydrate, then fetches from Supabase client-side. This adds a full network round-trip before any cards appear.
Root Cause
Current flow:
Browser requests /programs → Vercel serves empty HTML shell
Browser downloads JS bundle
React hydrates
Browser → Supabase round-trip (Kenya to US/EU, ~200-400ms each way)
Supabase queries DB (now fast, ~20ms)
Supabase → Browser response
React renders cards
Steps 4-6 are the perceived delay. The user sees skeletons for 500ms–2s+.
Solution
Move the initial data fetch to the server so HTML arrives with cards already rendered. Keep client-side interactivity for filters/pagination.
Implementation
File: src/app/programs/page.tsx
Convert to a Server Component (remove 'use client') that fetches initial programs server-side, then passes them to a client component for interactivity:
tsx
// src/app/programs/page.tsx — SERVER COMPONENT
import { createClient } from '@/lib/supabase/server';
import ProgramsClient from './ProgramsClient';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function ProgramsPage({
  searchParams,
}: {
  searchParams: { category?: string; page?: string };
}) {
  const supabase = createClient();
  const page = parseInt(searchParams.page || '1');
  const categoryId = searchParams.category;
  const limit = 12;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('programs')
    .select('*, institution:institutions!inner(name, city, country, logo_url), category:program_categories(name)', { count: 'exact' })
    .eq('is_active', true)
    .order('name')
    .range(from, to);

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data: programs, error, count } = await query;

  // Fetch filter dropdowns server-side too
  const [{ data: categories }, { data: countries }] = await Promise.all([
    supabase.from('program_categories').select('id, name').order('name'),
    supabase.from('institutions').select('country').neq('country', null),
  ]);

  return (
    <ProgramsClient
      initialPrograms={programs || []}
      initialCount={count || 0}
      initialCategories={categories || []}
      initialCountries={[...new Set((countries || []).map(c => c.country))]}
      currentCategory={categoryId}
      currentPage={page}
    />
  );
}
Then ProgramsClient is the existing 'use client' component, but it receives initialPrograms as props and renders them immediately on mount instead of showing skeletons:
tsx
// src/app/programs/ProgramsClient.tsx — CLIENT COMPONENT
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface ProgramsClientProps {
  initialPrograms: any[];
  initialCount: number;
  initialCategories: any[];
  initialCountries: string[];
  currentCategory?: string;
  currentPage: number;
}

export default function ProgramsClient({
  initialPrograms,
  initialCount,
  initialCategories,
  initialCountries,
  currentCategory,
  currentPage,
}: ProgramsClientProps) {
  const [programs, setPrograms] = useState(initialPrograms);
  const [loading, setLoading] = useState(false);
  // ... rest of existing client-side logic for filters/pagination
  // When user changes category or page, fetch client-side as before
  // But initial render shows real cards immediately, no skeleton
}
Key Changes
Server component fetches initial data — HTML arrives with cards pre-rendered
Client component handles interactivity — filters, pagination clicks still work client-side
No skeleton on first paint — real cards visible immediately
ISR revalidation — page rebuilds every 60 seconds with fresh data
Acceptance Criteria
[ ] /programs loads with real cards visible immediately (no skeleton on first paint)
[ ] Category filters still work client-side
[ ] Pagination still works client-side
[ ] Hard reload (Ctrl+Shift+R) shows cards in under 1 second
[ ] tsc --noEmit passes
[ ] Build succeeds
Commit
Stage modified files.
Message: perf: server-side fetch initial programs data to eliminate client-side loading skeleton

