CYCLE 030 — AUDIT & REDESIGN /ai-search/ PAGE — STEP 1 AUDIT REPORT

Status: STEP 1 COMPLETE (read-only, nothing modified) - proceeding into
Step 2 (redesign) next, per this cycle's own instruction
Archive Ref: docs/archive/bridge-077.md (snapshot of the raw instruction,
taken before this audit report replaced it)

=== 1. FILE ===

src/app/ai-search/page.tsx - the only file in that route directory (no
sibling layout.tsx, no nested routes).

=== 2. IMPORTS ===

AISearchBar, SearchModeToggle, InterestSelector, CareerPathway,
ProgramCard, InstitutionCard (all standalone components under
src/components/, none shared with the homepage), plus supabase client,
runAISearch/SearchIntent/InstitutionMode from @/lib/aiSearch, awardPoints
from @/lib/api, and lucide-react icons (Sparkles, GraduationCap,
Building2, MapPin, DollarSign, BarChart3).

=== 3. CURRENT CONTENTS ===

- Badge: "Sparkles icon + AI-Powered Education Discovery"
- H1: "Tell us what you're looking for" - the exact old headline
- Subheadline: "Describe it in your own words, pick your interests, or
  tell us your dream career - we'll match you to real programs."
- SearchModeToggle - only renders behind a
  NEXT_PUBLIC_FEATURE_SKILLS_TOGGLE env var, off by default
- AISearchBar (the search input itself)
- InterestSelector (separate stacked section)
- CareerPathway (separate stacked section)
- "Smart filters" row: 4 dropdowns - Country, Category, Level, Budget
- Conditional results: Programs grid / Institutions grid / empty state
- NO FOOTER anywhere on the page - it just ends after results (or after
  the filters row if no search has run yet)

=== 4. SHARED COMPONENTS WITH HOMEPAGE? ===

Zero overlap. NewHomePage.tsx imports CategoryPills, CareerSearchDropdown,
GradeMatcher, AdPortalSection, PopularPrograms, SponsorBanner, HowItWorks,
Footer, AISearchOverlay - a completely different component set than this
page's AISearchBar/SearchModeToggle/InterestSelector/CareerPathway. No
imports in common at all.

=== 5. OLD SKOLEX vs NEW DARK DESIGN? ===

Neither, cleanly - a third, unmigrated state:
- NOT the literal old light Skolex look: uses theme-adaptive CSS-variable
  tokens (bg-elimux-card, text-foreground, text-muted, border-border)
  rather than hardcoded light colors, so it inherits the site's
  dark-by-default theme passively.
- NOT the new homepage/TVET style either: no permanently-dark gradient
  hero (bg-gradient-to-br from-slate-900...), no 6 category pills, no
  "Or browse by category" divider, no footer. None of the Cycles
  025-029 design system's signature elements are present here.
- DOES still say "Tell us what you're looking for" verbatim (the exact
  string this cycle's own Step 1 asked to check for).
- Does NOT have a literal "3 tabs" layout (nothing in the instruction's
  own description matches 1:1) - instead has a flag-gated 2-way
  SearchModeToggle plus two separate stacked sections
  (InterestSelector, CareerPathway). Different structure, same
  underlying symptom: this page has never been touched by any of the
  Cycles 025-029 redesign work and sits visually disconnected from the
  rest of the now-redesigned site.

=== PROCEEDING TO STEP 2 ===

Moving into the redesign now, per this cycle's own "Report after Step 1
audit, then proceed to Step 2" directive. Will build the dark-gradient
hero, headline/subheadline, prominent AI search input, 6 category pills
+ "Or browse by category" divider (matching the homepage's
HERO_CATEGORIES pattern), and add the Footer this page currently lacks
entirely - reusing the same structural pattern already established on
the homepage and TVET hero rather than inventing a fourth visual
treatment. Will report back with the same verification rigor as every
prior cycle (tsc/build/curl/bundle checks) once done.

DO NOT commit. DO NOT push.
