Programs page loading speed — PHASE 1 AUDIT COMPLETE, NO FIXES APPLIED YET
Status: Audit done, root cause found and confirmed with real EXPLAIN ANALYZE evidence against the live database (not guessed). Per this cycle's own instruction ("report findings here before applying any fixes"), nothing has been changed - waiting for a go-ahead on Phase 2.
Archive Ref: docs/archive/bridge-096.md (snapshot of this cycle's spec, taken before this report replaced it).

STEP 1 — Programs data-fetching path
No /api/programs Next.js route exists, and elimux-backend's src/routes/programs.ts (which does exist) is NOT what this page uses - grepped for it, it's only called by admin-panel management and the apply flow (src/lib/api.ts), unrelated to public browsing. The actual /programs page (src/app/programs/page.tsx) is a 'use client' component that queries Supabase directly from the browser via fetchPrograms() (lines 157-207) - same architecture as /ai-search and the homepage.
- .limit()? No explicit .limit(), but .range(from, to) does the same job - PAGE_SIZE = 12.
- .offset()/cursor? Offset-based: from = (page-1)*12, via .range().
- Institutions joined or N+1? Single embedded join in one query - .select('...,institution:institutions!inner(...),category:program_categories(...)') - not N+1. (There's a separate one-off TVET total-count query and a 4-query Promise.all for filter dropdowns on mount, but neither is a per-program loop.)
- .order()? Yes - .order('name') server-side, ascending.
This page already has pagination, prev/next buttons, and a "Showing X of Y" count - Fix A, Fix B, and Fix D from the spec are already built. Not something this cycle needs to add.

STEP 2 — N+1 queries
None found in the results-fetching path itself (see above).

STEP 3 — Database indexes (checked directly against the live ElimuX Supabase project via SQL)
programs: idx_programs_category (category_id) AND idx_programs_category_id (category_id) - both indexing the same column, redundant. idx_programs_institution (institution_id), idx_programs_active (is_active), idx_programs_verified, idx_programs_ai_generated, idx_programs_grade/_numeric, idx_programs_level (on program_level, not "level" - the app's actual code filters on the `level` column, which is a different column from program_level; worth someone checking that's intentional, not a naming drift). No status column exists at all - the app correctly uses is_active (boolean), matching the schema; the spec's "status" index doesn't apply.
institutions: idx_institutions_country (country_id), idx_institutions_type (type_id), idx_institutions_active. Also indexed, also fine.
So category_id, is_active, and institution_id are all indexed individually - the spec's Fix C as literally written wouldn't add anything missing. What's actually missing, and what's actually causing the slowness, is below.

STEP 4 — Live query performance (EXPLAIN ANALYZE, real data, real category IDs, run against the live DB)
Ran the page's actual query shape three times at different result-set sizes:
- Business & Management (2,001 active programs, the largest category): 1042ms execution time. Query plan: Bitmap Heap Scan on idx_programs_category_id fetches all 2,001 matching rows from the heap (911ms of the 1042ms) before the ORDER BY name / LIMIT 12 can even apply, because no index supports returning rows in name order for a given category - Postgres has no way to stop after 12 without first collecting and sorting every match.
- Architecture & Design (341 active programs, a mid-size category): 2.5ms. Small enough that Postgres uses a plain Index Scan instead of Bitmap Heap Scan, walks the btree, filters, and the top-N heapsort barely costs anything.
- No category filter at all (12,717 active programs, the default /programs landing view): 27ms. Counterintuitively fast - at that selectivity (99.8% of the table), the planner switches to a full Sequential Scan, which reads disk sequentially instead of the scattered random-access reads Bitmap Heap Scan does, and that's actually cheaper here.
So the actual bug isn't "missing indexes" in the generic sense the spec assumed - it's that the existing category_id index can't also satisfy the ORDER BY, and Postgres's plan choice for medium-selectivity categories (roughly 1,000-2,500 of the 12,717 total, which covers most of the real categories per the counts pulled - Business & Management 2001, Engineering & Technology 1925, Arts & Humanities 1445, Medicine & Health Sciences 1336, Science & Mathematics 1291, Agriculture & Environment 1069, Information Technology 1065, Social Sciences 968) lands in the worst case for that gap. Small categories (Trades & Vocational 13, Hospitality & Tourism 10, Media & Communication 9, Finance & Accounting 5, Nursing & Caregiving 4, Public Policy & Governance 4, Data & Analytics 3, Aviation & Maritime 2, Sports & Fitness 1) and the unfiltered view are both already fast. The visible symptom - "skeleton persists for several seconds" - lines up: most of the popular categories a real visitor would actually click sit in that 1,000-2,500 row range, each costing ~1 second in the database alone before PostgREST/network/render time is even added.
Likely fix (not applied, this is a recommendation): a composite index covering (category_id, is_active, name) would let Postgres do an ordered index scan for the filtered+sorted case directly, matching rows already in name order, and stop after 12 - avoiding the heap fetch entirely for any category size. Cheaper and more targeted than the spec's proposed idx_programs_category_status, since status doesn't exist and the real cost driver is the sort, not the boolean filter.

STEP 5 — Frontend
- Client-side or server-side? Fully client-side - 'use client', useEffect-triggered fetch after mount, wrapped in a Suspense boundary whose fallback is a spinner (not the skeleton grid). The skeleton grid itself is a separate loading state inside ProgramsPageInner, shown once the component has mounted and fetchPrograms() is in flight. This architecture means the page ships empty on first load and only starts fetching after JS hydrates - a real contributor to the "skeleton persists" symptom on top of the query time itself, though fixing that (SSR/RSC) is a bigger structural change than this cycle's scope and not something I'd bundle into a perf-index fix without a separate go-ahead.
- Images/loading="lazy"? ProgramCard.tsx renders no <img> tag at all currently - grepped for img/Image/logo_url, zero matches. Fix E doesn't apply to the current UI; there's nothing to lazy-load on program cards today.
- Cards on first paint? 12 skeleton placeholders while loading (Array.from({length: PAGE_SIZE})), replaced by up to 12 real cards once fetchPrograms() resolves.

ACCEPTANCE CRITERIA STATUS (informational - Phase 2 not started)
[x] Pagination controls visible - already built
[x] Total count displayed ("Showing X of Y programs") - already built
[x] No N+1 queries - already true
[ ] Loads first 24 cards in under 2 seconds - PAGE_SIZE is currently 12, not 24 (worth confirming which the founder actually wants before changing); and for the common medium-category case, currently ~1s+ in the DB alone before network/render - the composite index above should fix this
[ ] Database indexes confirmed - category_id/is_active/institution_id all exist; the specific composite needed for the ORDER BY doesn't
[ ] Images lazy-loaded - not applicable, no images exist on cards right now
[x] Category filter + pagination in URL - already built (?category=...&page=2 via replaceState)

NEXT
- Waiting on a go-ahead to apply Phase 2: add the composite index (category_id, is_active, name) via a new elimux-sql migration file, and drop the redundant idx_programs_category (duplicate of idx_programs_category_id) while in there. Nothing else from the spec's fix list is actually needed - pagination/joins/URL sync/lazy-loading are either already built or not applicable.
- Separately, flagging (not fixing without asking): idx_programs_level indexes program_level, but the query filters on level - two different columns. Worth someone confirming that's intentional schema design and not a mismatch, independent of this perf cycle.
