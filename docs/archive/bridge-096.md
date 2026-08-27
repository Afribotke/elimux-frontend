Cycle: Audit & Fix Programs Page Loading Speed
Problem
/programs?category=... loads program cards very slowly. Skeleton state persists for several seconds before content appears. Screenshot shows dark skeleton placeholders with no data.
Phase 1 — Audit (Do This First, Report Back Before Fixing)
Step 1: Find the Programs API Route
powershell
Get-ChildItem -Recurse -Filter "*.ts" -Path "src" | Select-String -Pattern "programs.*route|/api/programs|fetchPrograms|getPrograms" | Select-Object -First 20
Read the file handling /api/programs or the data fetch for the programs page. Report:
File path
Whether it uses .limit() and what number
Whether it uses .offset() or cursor pagination
Whether institutions are joined in one query or fetched separately per program
Step 2: Check for N+1 Queries
In the same file, look for:
A loop that fetches institution data per program
Multiple Supabase calls inside a .map() or for loop
Any pattern where programs are fetched first, then institution details are fetched in a second round
Report the exact lines if found.
Step 3: Check Database Indexes
Run this in Supabase SQL Editor:
sql
select indexname, indexdef 
from pg_indexes 
where tablename = 'programs';
Report which indexes exist. Specifically look for:
programs_category_id
programs_status
programs_institution_id
If any are missing, note them.
Step 4: Check the Live Query Performance
Run this in Supabase SQL Editor using a real category ID:
sql
select id, name from categories order by name limit 20;
Pick one category ID from the output, then run:
sql
explain analyze
select 
  programs.id,
  programs.name,
  programs.level,
  programs.duration,
  institutions.name as institution_name,
  institutions.city,
  institutions.country,
  institutions.logo_url
from programs
join institutions on programs.institution_id = institutions.id
where programs.category_id = 'PASTE_REAL_UUID_HERE'
  and programs.status = 'active'
order by programs.name
limit 24;
Report the execution time from the explain analyze output.
Step 5: Check the Frontend
Read src/app/programs/page.tsx (or wherever the programs listing page lives). Report:
Does it fetch data client-side or server-side?
Are images set to loading="lazy"?
How many cards render on first paint?
Phase 2 — Fixes (Apply After Audit Report)
Fix A: Add Pagination
If no .limit() exists, add it:
TypeScript
const limit = 24;
const page = parseInt(searchParams.get('page') || '1');
const offset = (page - 1) * limit;

const { data, error, count } = await supabase
  .from('programs')
  .select(`
    id, name, level, duration, tuition_fee,
    institutions!inner(name, city, country, logo_url)
  `, { count: 'exact' })
  .eq('category_id', categoryId)
  .eq('status', 'active')
  .order('name', { ascending: true })
  .range(offset, offset + limit - 1);
Fix B: Fix N+1 (If Found)
Replace any per-program institution fetch with a single join query. The SQL pattern above already handles this.
Fix C: Add Missing Indexes (If Audit Shows Gaps)
sql
create index if not exists idx_programs_category_id on programs(category_id);
create index if not exists idx_programs_status on programs(status);
create index if not exists idx_programs_institution_id on programs(institution_id);
create index if not exists idx_programs_category_status on programs(category_id, status);
Fix D: Add Pagination UI
Add Next/Previous buttons below the card grid. Pass page as query param:
plain
/programs?category=...&page=2
Fix E: Lazy Load Images
For program cards rendered below the first row, add:
tsx
<img src={logo_url} loading="lazy" alt={name} />
Acceptance Criteria
[ ] Programs page loads first 24 cards in under 2 seconds
[ ] Pagination controls visible with page numbers or Next/Previous
[ ] Total count displayed: "Showing 1-24 of X programs"
[ ] No N+1 queries — single joined query for programs + institutions
[ ] Database indexes confirmed on category_id and status
[ ] Images below first viewport row use loading="lazy"
Do Phase 1 audit first. Report findings here before applying any fixes.