# Cycle 025 — Diagnosed and implemented; homepage verified live locally

## Note to Kimi / founder

Did all 6 steps in order. Root cause confirmed, tabs replaced with
stacked sections (the simpler option, as instructed), verified against
the actual running server - not just tsc/build. Not committed/pushed,
per the instruction.

### Step 1-2: root cause confirmed

`.env.local` has no `NEXT_PUBLIC_FEATURE_SKOLEX_HOME` at all (checked
`.env` too - doesn't exist). `src/app/page.tsx`:
```ts
const SKOLEX_HOME = process.env.NEXT_PUBLIC_FEATURE_SKOLEX_HOME === 'true'
export default function HomePage() {
  if (SKOLEX_HOME) return <NewHomePage />
  return <CurrentHome />
}
```
Confirmed: whoever was looking at localhost:3000 was seeing `CurrentHome`
(the old, unrelated production homepage) the entire time, not
`NewHomePage`. Also checked `PAST-PHASES-ARCHIVE` for any historical
`.env.local` with this flag set, or a prior working version of the
stacked-section design to reuse - found neither; the flag has never been
set anywhere in this project's history.

### Step 5: picked the simpler option (stacked sections, no tabs)

`src/components/home/NewHomePage.tsx` - removed `activeTab` state and
all 3 tab buttons/labels entirely. The 3 tab bodies are now always-visible
stacked sections in the same order as before:
1. AI Search - `CategoryPills` + `CareerSearchDropdown` + `GradeMatcher`
   (merged, as instructed - these were the old 'uni' and 'skills' tabs)
2. Scholarship Discovery - `ScholarshipDiscovery` (old 'scholarships' tab)
3. Popular Programs / Live Partners & Advertisers / sponsor banner -
   `AdPortalSection` + `PopularPrograms` + `SponsorBanner` (unchanged,
   these were already unconditional, not part of the tab bug)

Also removed the now-dead `TabType` export from `src/types/home.ts` (its
only usage was the state I just removed).

### Step 6: verification against the real running server

- `npx tsc --noEmit`: clean.
- `npm run build`: clean, 155 routes (matches this doc's own target).
- Set `NEXT_PUBLIC_FEATURE_SKOLEX_HOME=true` in `.env.local` (gitignored,
  local-only - left ON rather than reverted, since a preview with the
  flag off would just show `CurrentHome` again and defeat the point of
  verifying this).
- `npx next start`, then `curl -s http://localhost:3000`: headline
  "Discover Your Perfect Education" present.
- Browser check (Chrome automation) hit repeated timeouts on
  screenshot/console/page-text calls after scrolling - degraded
  automation tab, not a page crash (server log stayed clean the whole
  time, no runtime exceptions). Fell back to `curl` + grep on the raw
  HTML instead of fighting the flaky tab, which is actually a stronger
  check anyway - confirms server-side render, not just "a screenshot
  looked right":
  - FOUND: "Discover Your Perfect Education", "Find a course or career",
    "Match Me to Scholarships", "LIVE Partners", "Your ad here",
    "Popular Programs", "Reach students across" (AdPortalSection's CTA)
  - NOT present: "University & College", "Skills & Trades" (old tab
    labels - correctly gone), "Proudly Powered By" (SponsorBanner - this
    is *expected*, not a bug: that component returns `null` when
    `useMajorSponsor()` finds no active major sponsor row in the DB right
    now - a pre-existing data-driven empty state, nothing to do with this
    change), "How It Works" (still not part of `NewHomePage` - see
    Cycle 025's prior halt note, this was never actually part of this
    component in any version)
  - Browser console errors (from a tab that *did* respond before going
    unresponsive): only pre-existing "Failed to fetch profile" from the
    global layout chunk (unauthenticated-user behavior, unrelated to
    this file).
- Dev server left running at `localhost:3000` so the founder can check
  the live preview directly.

### Status

Cycle 025 complete: root cause diagnosed, simpler fix implemented,
verified against a real running server (build + curl + partial browser
check), not committed/pushed. If "How It Works" is actually wanted on
this preview homepage, that's new scope (it exists in `CurrentHome`,
would need to be added to `NewHomePage`, not restored) - flagging rather
than assuming, since Cycle 025's own checklist listed it but no version
of this file has ever contained it.
