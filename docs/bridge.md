CRITICAL FIX — ENCODING ARTIFACTS IN META TAGS/TITLES — REPORT

Status: COMPLETE - root-caused to TWO separate real issues (not one),
both addressed on the local side; one requires a deploy to fully resolve
Archive Ref: docs/archive/bridge-075.md (snapshot of the prior OG-image
report, taken before this report replaced it)

=== ROOT CAUSE: TWO SEPARATE BUGS, NOT ONE ===

The screenshot string "Elimux - Global Education Discovery - ElimuX
â€" Discover Global Education & Career Opportunities" is two different
things concatenated, not one bug:

  PART 1: "Elimux - Global Education Discovery" - from
  public/manifest.json's `name` field (lowercase "Elimux", stale copy).
  This is a real, previously-untouched bug - browsers/PWA install
  contexts can prepend the manifest app name to the tab/window title in
  certain OS-level display contexts, which explains the "Elimux - ..."
  prefix your screenshot shows that doesn't exist anywhere in any
  <title> tag.

  PART 2: "ElimuX â€" Discover Global Education & Career Opportunities"
  - this is the EXACT OLD title, mojibake and all, that Cycle 029 (SEO
  optimization) already fixed in src/app/layout.tsx - but that fix has
  never been deployed. Every cycle since has ended with "DO NOT commit,
  DO NOT push," so this fix has been sitting locally, uncommitted, this
  entire session. Confirmed directly: curl'd https://www.elimux.ke/ just
  now and it still serves the literal old mojibake title byte-for-byte.
  This part of the report cannot be "fixed" again locally - it's already
  fixed in the working tree, it just hasn't shipped.

=== STEP 1-2: SEARCH RESULTS ===

  grep -rn "â€" src/ --include="*.tsx" --include="*.ts" --include="*.md"
  -> zero matches. No mojibake anywhere in source. Confirms Part 2 above
  is a deploy-lag issue, not a remaining source bug.

  grep -rn "Global Education Discovery" src/ public/
  -> public/manifest.json:2 - the real source of Part 1.

=== STEP 3-4: A NOTE ON THE INSTRUCTION'S OWN INTERNAL CONFLICT ===

Step 3 says replace ALL em-dashes (—) with plain hyphens (-). Step 5's
own list of "clean" desired titles uses real em-dash characters in every
single example ("ElimuX — AI-Powered...", "Discover Programs —
Universities & TVET | ElimuX", etc.) - not hyphens. Followed Step 5's
explicit, concrete spec (keep real "—" characters) rather than Step 3's
generic rule, since applying Step 3 literally would have directly
contradicted Step 5's own listed correct output. The actual bug was
never "em-dashes are bad" - it was a mojibake BYTE SEQUENCE (â€") in
place of a real em-dash, already fixed in Cycle 029 and confirmed absent
from source now (see Step 1-2 grep above).

=== STEP 5-6: TITLE-BY-TITLE VERIFICATION ===

All 9 checked individually via curl against the local server, not
assumed. 7 matched already; 2 did not and were fixed:

  Homepage:      "ElimuX — AI-Powered Education & Career Discovery" - MATCH
  Programs:      "Discover Programs — Universities & TVET | ElimuX" - MATCH
  Scholarships:  "Find Scholarships — Fully Funded & Partial | ElimuX" - MATCH
  Internships:   "Internship Opportunities — Apply Now | ElimuX" - MATCH
  Attachments:   "Industrial Attachments — University Placements | ElimuX" - MATCH
  Bursary:       "Bursaries — Financial Aid for Students | ElimuX" - MATCH
  Institutions:  "Accredited Institutions — Universities & Colleges | ElimuX" - MATCH
  About:         WAS "About ElimuX — Our Mission & Vision | ElimuX" (WRONG -
                 duplicated "ElimuX" via the root layout's title
                 template auto-appending "| ElimuX" on top of a title
                 that already said "ElimuX" once) - FIXED, now exactly
                 "About ElimuX — Our Mission & Vision"
  Contact:       Same bug, same fix - FIXED, now exactly
                 "Contact ElimuX — Get in Touch"

  Fix: switched About/Contact's `title` from a plain string to
  `title: { absolute: '...' }` in their metadata exports - this is the
  Next.js mechanism to opt a specific page out of the parent layout's
  title template ("%s | ElimuX"), rather than inherit it. Every other
  page's title intentionally keeps the "| ElimuX" suffix (matches Step
  5's own list for those 7), only About/Contact needed the bypass since
  their own title text already names the brand once.

=== ALSO FIXED: public/manifest.json ===

  name:        "Elimux - Global Education Discovery" -> "ElimuX — AI-Powered Education & Career Discovery"
  short_name:  "Elimux" -> "ElimuX"
  description: "Discover and compare education programs worldwide" -> matches the real root-layout description now

This directly addresses Step 6's "inconsistent casing (Elimux vs
ElimuX)" check - manifest.json was the one place still using the old
lowercase "Elimux" spelling anywhere in the project.

=== VERIFICATION ===

1. npx tsc --noEmit - clean.
2. npm run build (2.5GB-heap/skip-sourcemaps recipe) - clean.
3. npx next start - running, http://localhost:3000 returns HTTP 200.
4. All 9 titles curl-verified individually against the local server post
   -fix (listed above) - all 9 now match Step 5's spec exactly, byte for
   byte. /manifest.json curl-verified - new name/short_name/description
   confirmed served.

=== EXACT BEFORE/AFTER, EVERY FILE CHANGED ===

  src/app/about/page.tsx
    BEFORE: title: 'About ElimuX — Our Mission & Vision'
    AFTER:  title: { absolute: 'About ElimuX — Our Mission & Vision' }

  src/app/contact/layout.tsx
    BEFORE: title: 'Contact ElimuX — Get in Touch'
    AFTER:  title: { absolute: 'Contact ElimuX — Get in Touch' }

  public/manifest.json
    BEFORE: "name": "Elimux - Global Education Discovery"
            "short_name": "Elimux"
            "description": "Discover and compare education programs worldwide"
    AFTER:  "name": "ElimuX — AI-Powered Education & Career Discovery"
            "short_name": "ElimuX"
            "description": "Discover universities, colleges, TVET institutes, scholarships, internships, industrial attachments, and bursaries worldwide. AI-powered matching for every student."

No other files needed changes - src/app/layout.tsx and the 6 other
layout.tsx files created in Cycle 029 were already correct (real em-
dashes, correct casing, matched Step 5's spec exactly on first check).

=== WHAT STILL NEEDS A DEPLOY, NOT A CODE FIX ===

The screenshot the founder saw is almost certainly from production
(www.elimux.ke), which is still running pre-Cycle-029 code. Everything
in this report is fixed in the local working tree; none of it is live
until a commit + push + deploy happens. Flagging plainly rather than
implying this is resolved on the actual live site - it isn't, yet.

DO NOT commit. DO NOT push.
