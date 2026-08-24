CYCLE 028 — TVET PAGE: "MATCH YOUR GRADE" HERO SECTION (execute immediately, no questions)

SCOPE: Add a prominent grade-matching hero section to the TVET/Skills & Trades page. This is the entry point for students with lower KCSE grades who don't know what professions they can pursue.

=== STEP 1: IDENTIFY THE TVET PAGE ===

Find where the TVET content renders. Check:
- Is it /programs?type=tvet (filtered view)?
- Is there a dedicated /tvet or /skills-and-trades route?
- Or is it the "Skills & Trades (TVET)" pill filtering the /programs page?

Report: Which file(s) render the TVET page content? Paste the route and main component file path.

=== STEP 2: ADD "MATCH YOUR GRADE" HERO SECTION ===

At the TOP of the TVET page content (before program listings), add a full-width hero section:

LAYOUT:
┌─────────────────────────────────────────────────────────────┐
│  🎯 MATCH YOUR GRADE                                        │
│                                                             │
│  Headline: "Your Grade Opens Doors — Find Your Path"        │
│  Subheadline: "TVET programs welcome all KCSE grades.       │
│                Discover what you can become."                │
│                                                             │
│  "I got"  [ KCSE Grade ▼ ]  "What can I study?"            │
│                                                             │
│  [ 🔍 Find My TVET Path ]                                   │
│                                                             │
│  ─── or ───                                                 │
│                                                             │
│  [ Browse All TVET Programs → ]                             │
└─────────────────────────────────────────────────────────────┘

STYLING (match dark premium theme):
- Background: bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900
- Container: max-w-3xl mx-auto py-16 px-4 text-center
- Badge above headline: "🎯 Match Your Grade" — bg-primary-500/20 text-primary-300 border border-primary-500/30 rounded-full px-4 py-1.5 text-sm font-medium
- Headline: text-4xl md:text-5xl font-extrabold text-white text-balance
- Subheadline: text-lg text-gray-300 mt-4 max-w-xl mx-auto
- Grade selector: 
  - Label "I got": text-gray-300 text-lg
  - Dropdown: bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-lg min-w-[140px]
  - Options: A, A-, B+, B, B-, C+, C, C-, D+, D, D-, E
  - Label "What can I study?": text-gray-300 text-lg
- "Find My TVET Path" button: btn-primary (bg-primary-600 hover:bg-primary-500 text-white rounded-xl px-8 py-3 text-lg font-semibold)
- Divider "or": text-gray-500 text-sm with horizontal lines
- "Browse All TVET Programs →": text-primary-400 hover:text-primary-300 text-sm font-medium

=== STEP 3: GRADE FILTERING LOGIC ===

When user selects a grade and clicks "Find My TVET Path":
1. Capture the selected grade
2. Filter the TVET programs to show ONLY those where the program's minimum_entry_grade matches or is lower than the selected grade
3. If no grade column exists in the programs table, filter by a related field or show all TVET programs with a note: "Contact institutions for specific grade requirements"
4. Display results below the hero in the existing program card grid
5. If no results: show EmptyState with encouraging message: "No programs found for this exact grade. Try browsing all TVET programs or contact institutions directly."

=== STEP 4: TONE & COPY ===

All copy must be encouraging and empowering:
- ❌ "You only qualify for these because you got a D+"
- ✅ "Your D+ opens these professional paths"
- ❌ "Limited options for low grades"
- ✅ "Practical skills, real careers, no matter your grade"

=== STEP 5: VERIFICATION ===

After implementing:
1. npx tsc --noEmit
2. npm run build
3. npx next start
4. Navigate to the TVET page
5. Confirm:
   - [ ] "Match Your Grade" hero is visible at the top
   - [ ] Grade dropdown has all KCSE grades (A through E)
   - [ ] "Find My TVET Path" button is prominent
   - [ ] Selecting a grade and clicking the button filters results
   - [ ] Empty state is encouraging, not discouraging
   - [ ] "Browse All TVET Programs" link works
   - [ ] Dark mode works on this page

DO NOT commit. DO NOT push. Report results.