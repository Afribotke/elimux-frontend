import { createClient } from '@/lib/supabase/server';
import { gradeToNumeric } from '@/lib/kcse-grades';
import { CompareProvider } from '@/components/CompareProvider';
import ProgramsPageClient from './ProgramsPageClient';

const PAGE_SIZE = 12;

interface ProgramsSearchParams {
  category?: string;
  country?: string;
  level?: string;
  search?: string;
  minFees?: string;
  maxFees?: string;
  type?: string;
  grade?: string;
  page?: string;
}

// Server Component: runs the same query fetchPrograms() used to run client-side-only
// on mount, so the first response already has real cards in it instead of shipping an
// empty shell that fetches after hydration. ProgramsPageClient.tsx keeps all the
// existing filter/pagination/compare interactivity - it just starts from this data
// instead of empty arrays, and skips its own first-mount fetch (see the isFirstRender
// guard there) since this already did that work.
export default async function ProgramsPage({
  searchParams,
}: {
  searchParams: Promise<ProgramsSearchParams>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const filters = {
    category: sp.category || '',
    country: sp.country || '',
    level: sp.level || '',
    search: sp.search || '',
    minFees: sp.minFees || '',
    maxFees: sp.maxFees || '',
    type: sp.type || '',
    grade: sp.grade || '',
  };
  const parsedPage = parseInt(sp.page || '1', 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  // institution_types is admin-managed (no fixed enum), so bucket by name pattern -
  // same logic ProgramsPageClient.tsx used to run client-side for this.
  const { data: instTypes } = await supabase.from('institution_types').select('id,name');
  const institutionTypeIds: { university: string[]; tvet: string[] } = { university: [], tvet: [] };
  for (const t of instTypes || []) {
    if (/tvet|technical|vocational|polytechnic/i.test(t.name)) institutionTypeIds.tvet.push(t.id);
    else if (/universit|college/i.test(t.name)) institutionTypeIds.university.push(t.id);
  }

  let programsQuery = supabase
    .from('programs')
    .select(
      'id,name,slug,description,duration_months,tuition_fees,currency,level,mode,is_ai_generated,is_verified,institution:institutions!inner(id,name,city,country:countries(name,flag_emoji)),category:program_categories(id,name,color,icon)',
      { count: 'exact' }
    )
    .eq('is_active', true)
    .order('name');

  if (filters.category) programsQuery = programsQuery.eq('category_id', filters.category);
  if (filters.country) programsQuery = programsQuery.eq('institution.country_id', filters.country);
  if (filters.level) programsQuery = programsQuery.eq('level', filters.level);
  if (filters.search) programsQuery = programsQuery.ilike('name', `%${filters.search}%`);
  if (filters.minFees) programsQuery = programsQuery.gte('tuition_fees', parseFloat(filters.minFees));
  if (filters.maxFees) programsQuery = programsQuery.lte('tuition_fees', parseFloat(filters.maxFees));
  if (filters.type === 'university' || filters.type === 'tvet') {
    const ids = institutionTypeIds[filters.type];
    // No matching institution_types rows (shouldn't happen, but matches the client's
    // own fail-closed behavior) - filter to zero results rather than showing everything.
    programsQuery = programsQuery.in('institution.type_id', ids.length > 0 ? ids : ['00000000-0000-0000-0000-000000000000']);
  }
  if (filters.grade) {
    programsQuery = programsQuery.lte('minimum_kcse_grade_numeric', gradeToNumeric(filters.grade));
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const [
    { data: programs, count },
    { data: categories },
    { data: countries },
    { data: levelsData },
  ] = await Promise.all([
    programsQuery.range(from, to),
    supabase.from('program_categories').select('id,name').eq('is_active', true).order('name'),
    supabase.from('countries').select('id,name').eq('is_active', true).order('name'),
    supabase.from('programs').select('level').eq('is_active', true).not('level', 'is', null),
  ]);

  const levels = [...new Set((levelsData || []).map((l: { level: string }) => l.level))].sort();

  return (
    <CompareProvider>
      <ProgramsPageClient
        initialPrograms={(programs as any) || []}
        initialTotalCount={count || 0}
        initialCategories={categories || []}
        initialCountries={countries || []}
        initialLevels={levels}
        initialInstitutionTypeIds={institutionTypeIds}
        initialFilters={filters}
        initialPage={page}
      />
    </CompareProvider>
  );
}
