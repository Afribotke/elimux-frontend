Audit Phase
powershell
# Find the search pipeline
Get-ChildItem -Recurse -Filter "*.ts" -Path "src" | Select-String -Pattern "runAISearch|ai-search|/api/search" | Select-Object -First 30

# Read the API route
Get-Content "src/app/api/ai-search/route.ts" -ErrorAction SilentlyContinue
# or
Get-Content "src/app/api/search/route.ts" -ErrorAction SilentlyContinue

# Find runAISearch
Get-ChildItem -Recurse -Filter "*.ts" -Path "src" | Select-String -Pattern "runAISearch" | Select-Object -First 20
Fix Phase — Database Query Pattern
The search query should follow this logic (pseudocode — adapt to your actual Supabase client):
TypeScript
// After AI extracts intent: { subject: 'criminology', location: 'kenya', level: null }

const { data: programs, error } = await supabase
  .from('programs')
  .select(`
    id, name, institution_id, level, field_of_study, category, tags, description,
    institutions:institution_id (name, city, country)
  `)
  .or(
    `name.ilike.%${subject}%,` +
    `field_of_study.ilike.%${subject}%,` +
    `category.ilike.%${subject}%,` +
    `tags.cs.{${subject}},` +
    `description.ilike.%${subject}%`
  )
  .order('name', { ascending: true });

// If location is provided, filter further
let filtered = programs;
if (location) {
  filtered = programs.filter(p => 
    p.institutions?.city?.toLowerCase().includes(location.toLowerCase()) ||
    p.institutions?.country?.toLowerCase().includes(location.toLowerCase())
  );
}

// If still no results after location filter, return subject-matches regardless of location
const results = filtered.length > 0 ? filtered : programs;

// If STILL no results, return empty array — do NOT fall back to popular unrelated programs
return results;
Critical Rule
Remove any code that looks like this:
TypeScript
// BAD — silently returns popular programs when no match
if (results.length === 0) {
  return await supabase.from('programs').select('*').order('popularity', { ascending: false }).limit(18);
}
Replace with:
TypeScript
// GOOD — honest empty result with suggestions
if (results.length === 0) {
  return { programs: [], suggestions: await getRelatedSubjects(subject) };
}
Acceptance Criteria
[ ] Search "criminology in kenya" returns only law/justice/criminology-related programs, or shows "No results found"
[ ] Search "business administration" still returns relevant business programs
[ ] Search "plumbing in nairobi" returns TVET/skills programs
[ ] No query returns unrelated medical degrees as a hidden fallback
[ ] When no results exist, the "No results found" state displays with optional related subject suggestions
[ ] The "18 Results" button count reflects actual matched results, not fallback results
Commit
Stage only the files modified in the search pipeline.
Message: fix: AI search relevance — remove silent fallback to popular programs, enforce subject filtering
