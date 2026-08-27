Cycle: Audit & Fix Programs Page Loading Speed
Problem
/programs?category=... loads program cards very slowly. Skeleton state persists for several seconds before content appears.
Audit Steps (Do These First — Report Back Before Fixing)
Step 1: Find the Programs API Route
powershell
Get-ChildItem -Recurse -Filter "*.ts" -Path "src" | Select-String -Pattern "programs.*route|/api/programs|fetchPrograms|getPrograms" | Select-Object -First 20
Read the file that handles the /api/programs or similar endpoint.
Step 2: Check the Supabase Query
Look for:
Is there a .limit() call? What number?
Is there an .offset() or pagination cursor?
Are institutions fetched in a separate query per program (N+1)? Or joined in one query?
Is there an .order() clause?
Step 3: Check Database Indexes
Run this in Supabase SQL Editor:
sql
-- Check if indexes exist on programs table
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'programs';
Look for indexes on:
category_id
status (if filtering by active)
institution_id
If missing, they need to be added.
Step 4: Check Network Tab
Open browser DevTools → Network tab → reload /programs?category=...
How long does the API call take? (Look for the XHR/fetch request)
How many requests fire? (One for programs + N for institutions = N+1 problem)
Fixes to Apply (After Audit Confirms)
Fix 1: Add Pagination
TypeScript
const { data, error, count } = await supabase
  .from('programs')
  .select(`
    *,
    institutions!inner(name, city, country, logo_url)
  `, { count: 'exact' })
  .eq('category_id', categoryId)
  .eq('status', 'active')  // if you filter by status
  .order('name', { ascending: true })
  .range(offset, offset + limit - 1);  // e.g., .range(0, 23) for page 1
Limit: 24 cards per page.
Fix 2: Fix the Ambiguous Column (If Joining)
If selecting specific columns instead of *, always prefix:
sql
select 
  programs.id,
  programs.name,
  programs.level,
  programs.duration,
  programs.tuition_fee,
  institutions.name as institution_name,
  institutions.city,
  institutions.country,
  institutions.logo_url
from programs
join institutions on programs.institution_id = institutions.id
where programs.category_id = '...'
  and programs.status = 'active'
order by programs.name
limit 24;
Fix 3: Add Missing Indexes (If Not Present)
sql
-- Only run if the audit shows these are missing
create index if not exists idx_programs_category_id on programs(category_id);
create index if not exists idx_programs_status on programs(status);
create index if not exists idx_programs_institution_id on programs(institution_id);
create index if not exists idx_programs_category_status on programs(category_id, status);
Fix 4: Add Pagination UI
Add Next/Previous buttons or numbered pagination below the card grid. Pass page param as query string:
plain
/programs?category=...&page=2
Calculate offset: (page - 1) * 24
Fix 5: Image Lazy Loading
For program cards, add loading="lazy" to images below the first viewport row:
tsx
<img 
  src={program.logo_url} 
  loading={index < 6 ? "eager" : "lazy"} 
  alt={program.name}
/>
Acceptance Criteria
[ ] Programs page loads first 24 cards in under 2 seconds
[ ] Pagination controls visible (Next/Previous or page numbers)
[ ] Total count displayed (e.g., "Showing 1-24 of 1,247 programs")
[ ] No N+1 queries — institutions joined in single query
[ ] Database indexes confirmed present on category_id, status
[ ] Images below first row use lazy loading
[ ] Category filter in URL works with pagination (?category=...&page=2)
Commit
Stage all modified files.
Message: perf: add pagination, indexes, and joins to fix programs page load speed