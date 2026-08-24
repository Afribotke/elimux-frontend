CRITICAL BUG — "FIND MY TVET PATH" BUTTON NOT WORKING — REPORT

Status: FIXED - root cause identified and confirmed, not a guess; build/
bundle-verified; live click-through not watched in a real browser (see
note below)
Archive Ref: docs/archive/bridge-066.md (snapshot of the prior "live
indicator" completion report, taken before this bug report replaced it -
this bug report arrived directly in chat, not via a bridge.md edit, so
that prior report hadn't been archived yet)

=== 1. THE onClick HANDLER ===

File: src/app/programs/page.tsx, button at (pre-fix) line 310-315:

    <button
      onClick={handleFindTvetPath}
      className="mt-6 bg-primary-600 hover:bg-primary-500 ..."
    >
      🔍 Find My TVET Path
    </button>

Wired correctly. `handleFindTvetPath` was defined and did read the
selected grade:

    const handleFindTvetPath = () => {
      setFilters((f) => ({ ...f, grade: heroGrade }));
      setPage(1);
    };

`heroGrade` is the select's own controlled state (`value={heroGrade}`,
`onChange={(e) => setHeroGrade(...)}`), read correctly. This part was
never broken.

=== 2. THE GRADE FILTERING LOGIC ===

Checked whether this was a data/query problem before assuming a UI bug -
queried the live database directly (read-only, no writes) rather than
guessing:

    Total active TVET programs:                         1,121
    ...with minimum_kcse_grade_numeric NOT NULL:         1,121  (100%)
    ...matching grade D (numeric <= 3):                  1,017

The column exists, is fully populated for every TVET program (not the
"column doesn't exist / is null for most rows" cause your own checklist
named), and the filter genuinely changes the result set (1,017 of 1,121
- a real, if modest, reduction). `fetchPrograms()`'s existing `.lte
('minimum_kcse_grade_numeric', gradeToNumeric(filters.grade))` clause was
already correct and unchanged. So clicking the button DID correctly
filter the query - this was never a broken filter.

=== ROOT CAUSE ===

Not a wiring bug, not a data bug - a visibility bug. The button sits at
the top of a tall hero (badge, headline, subheadline, credibility line,
grade selector, button, divider, browse-all link), and the results grid
it's supposed to update lives well below the fold, with no scroll target
and no loading indicator on the button itself. Clicking it silently did
everything right (state updated, query re-ran, grid re-rendered) but
nothing on the visible screen changed unless the visitor scrolled down
manually - and even after scrolling, grade D only excludes ~9% of
results, so the first page of alphabetically-sorted cards often looks
identical anyway. From the user's seat, that's indistinguishable from
"the button does nothing."

=== EXACT LINES CHANGED ===

1. Added a `resultsRef` (useRef) on the results-section wrapper div
   (filters bar + results count + program grid), and call
   `resultsRef.current?.scrollIntoView({ behavior: 'smooth', block:
   'start' })` in both `handleFindTvetPath` and `handleBrowseAllTvet`
   right after the state updates - so clicking either button now visibly
   carries the visitor to the (re-filtering) results, not just updates
   state off-screen.
2. Button now reads `disabled={loading}` and its label swaps to "⏳
   Finding your path..." while the shared page `loading` flag is true
   (the same flag that already drives the ProgramCardSkeleton grid) -
   immediate visual feedback on click, addresses Task 4's "loading state
   briefly" requirement using existing state rather than adding a new
   one.
3. `handleBrowseAllTvet` got the identical scroll-into-view treatment for
   consistency, even though it wasn't reported as broken - same
   underlying visibility problem would apply to it.

Not touched, because already correct: fetchPrograms()'s query logic, the
grade column, the EmptyState encouraging-message branch (added in Cycle
028, still correct), filters/URL sync.

=== 5. CONSOLE / NETWORK CHECK ===

Could not perform - Chrome browser automation is unavailable this
session (extension not connected, confirmed again for this task). No
DevTools console/network capture was possible. What IS confirmed instead:
the equivalent query run directly against the live Supabase REST API
(same table, same filter clause, same grade) returns valid results with
no error, and `npx tsc --noEmit` / `npm run build` both pass clean, so
there's no compile-time or type error in this path. This is not the same
as confirming zero runtime console errors in an actual browser session -
flagged honestly rather than claimed.

=== DOES IT WORK END-TO-END NOW? ===

Code-verified yes, browser-verified no (see above). What changed
concretely: previously, selecting grade D and clicking "Find My TVET
Path" updated the underlying data correctly but produced no visible
change unless the visitor happened to scroll down and compare closely.
Now the same click also scrolls the results into view and shows a
loading state on the button, so the interaction is visible.

=== VERIFICATION ===

1. npx tsc --noEmit - clean.
2. npm run build (2.5GB-heap/skip-sourcemaps recipe) - clean, /programs
   route now 14.5 kB (was 14.4 kB).
3. npx next start - running, http://localhost:3000 returns HTTP 200.
4. Compiled-bundle check (client-hydrated page, same limitation as every
   check on this route): confirmed scrollIntoView, "Finding your path",
   scroll-mt-4, and disabled:cursor-wait are all present in the real
   shipped app/programs/page-*.js chunk.

   NOT verified: actually clicking the button in a real browser and
   watching the scroll + loading state + filtered grid happen. Strongly
   recommend an eyeball pass at http://localhost:3000/programs?type=tvet
   - select grade D, click, confirm the page scrolls and results update
   - before closing this out as fully confirmed. This is the same
   limitation flagged on every fix this session, but worth repeating
   given this was specifically reported as user-facing broken.

=== FILES CHANGED (uncommitted, sitting on local commit 63a3258) ===

- elimux-frontend/src/app/programs/page.tsx

DO NOT commit. DO NOT push.
