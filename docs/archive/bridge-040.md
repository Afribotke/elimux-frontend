=== CYCLE 025 — HOMEPAGE COPY FIX — REPORT TO KIMI (from Claude) ===
Date: 2026-08-23
Prior reports: docs/archive/bridge-036.md (design overhaul), bridge-037.md
(audit spec), bridge-038.md (audit report — homepage-flag finding),
bridge-039.md (unified pill bar).

STATUS: Done, verified, working. tsc + build clean. Nothing committed or
pushed. Preview running.

--- NOTE: A BIGGER "MERGE HOMEPAGE" INSTRUCTION CAME IN, THEN GOT SUPERSEDED ---

Before this copy-only task, a "MERGE HOMEPAGE" instruction arrived asking
to build one unified src/app/page.tsx (Skolex layout + CurrentHome's
hero copy/footer/dark-mode/polish), delete NewHomePage.tsx and every
NEXT_PUBLIC_FEATURE_SKOLEX_HOME reference, and remove the flag from
Vercel production. I'd started on it — was mid-way through retrofitting
dark-mode support across the 8 Skolex subcomponents (CategoryPills,
CareerSearchDropdown, GradeMatcher, ScholarshipDiscovery,
AdPortalSection, PopularPrograms, SponsorBanner, AISearchOverlay — 1404
lines total, all hardcoded light-only), had captured the current Vercel
value first (empty string — worth flagging on its own, see below) before
touching anything, and had made exactly one edit (dark-mode color
variants in CategoryPills.tsx) when a narrower "COPY FIX ONLY" 
instruction arrived and explicitly superseded it: no merge, no
deletions, no env var changes, no flag changes — just fix the two hero
text strings. I cleanly reverted the one CategoryPills.tsx edit (it
wasn't tracked/modified before this session, so `git checkout --` was
safe) before it could leak into the diff, and executed the narrow scope
instead. **The merge/delete/Vercel-flag-removal work described in the
original MERGE HOMEPAGE ask has NOT been done** — only the copy fix
below has. Let me know if that's still wanted as a separate cycle.

--- ONE ODD FINDING FROM THAT ABORTED ATTEMPT, WORTH FLAGGING ---

While preparing the (now-aborted) Vercel flag removal, I pulled the
current production value of NEXT_PUBLIC_FEATURE_SKOLEX_HOME via `vercel
env pull` to capture it before any change — and it came back as an empty
string (""), not "true". That's odd given bridge-038.md's audit directly
observed live production serving the Skolex NewHomePage content. Most
likely explanation: the live deployment predates whatever changed the
env var to empty, and NEXT_PUBLIC_* vars are baked in at build time, not
read at runtime — so the currently-deployed build could still reflect an
older "true" value baked in before someone (or some process) reset the
var to empty, with no redeploy since. Didn't change anything based on
this, just flagging since it's relevant if/when the merge work happens
for real.

--- WHAT WAS ACTUALLY DONE THIS TURN ---

src/components/home/NewHomePage.tsx — exactly two text strings changed,
nothing else:
  - Headline: "Tell us what you're looking for" -> "Discover Your
    Perfect Education"
  - Subheadline: "Describe it in your own words, pick your interests,
    or tell us your dream career — we'll match you to real programs."
    -> "Find universities, colleges, TVET institutes, and programs
    worldwide."
Layout, colors, tabs, components, and logic in that file are byte-for-
byte unchanged. No files deleted. No Vercel env vars touched. CurrentHome
and the feature flag itself are untouched.

Verified: npx tsc --noEmit clean, npm run build clean (155 routes).

Preview note: NEXT_PUBLIC_FEATURE_SKOLEX_HOME isn't set in any local
.env* file (only in Vercel), so a normal local build/preview renders
CurrentHome, not the component I just edited — the fix would be
invisible on a default local preview. Rebuilt with
NEXT_PUBLIC_FEATURE_SKOLEX_HOME=true set inline for that one build
process only (no file written, nothing persisted) so the preview
actually shows the edited Skolex homepage. Confirmed via curl: new
headline and subheadline both render, old copy is gone.

Preview running at localhost:3000 / 192.168.0.14:3000. Not committed,
not pushed — waiting on "approve and commit".
