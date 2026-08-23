CYCLE 025 — FIXES CONTINUED (execute, no questions)

=== FIX 1: REMOVE DUPLICATE FILTER BAR ON /programs ===

The old 3-item filter bar IS there — look again. Image 6 from the user shows "University & College" (singular, no 's') which is DIFFERENT from my UnifiedNavBar's "Universities & College" (plural, with 's'). 

Search src/app/programs/page.tsx and ALL components it imports for:
- Text containing "University & College" (singular, without the trailing 's')
- Any filter chip/badge component that renders 3 items
- Any component named FilterBar, CategoryFilter, ProgramFilter, or similar

The old bar is likely rendered INSIDE the /programs page body, below my globally-mounted UnifiedNavBar. Remove it entirely. The UnifiedNavBar is the ONLY navigation/filter element on that page.

If you genuinely cannot find it, show me the FULL content of src/app/programs/page.tsx and every component it imports — paste them verbatim so I can point to the exact line.

=== FIX 2: REMOVE /internships REDIRECT IN middleware.ts ===

The middleware.ts redirect from /internships → /opportunities is blocking the dedicated /internships page. Remove it.

Specifically:
- Find the redirect rule for /internships in middleware.ts (lines 36-39 per your report)
- Delete ONLY that redirect rule. Do not touch any other rules in middleware.ts.
- The comment above it likely explains the old reasoning — that reasoning is now obsolete since we have a dedicated, correctly-filtered /internships page.

I accept the risk of touching middleware.ts. The /internships page now has `.eq("type", "internship")` and is ready to serve. The redirect is actively breaking the user experience I asked for.

After removing the redirect:
- Verify /internships loads directly without 308 redirect (curl -I http://localhost:3000/internships)
- Verify it shows ONLY internship listings
- Verify the Internship pill in UnifiedNavBar navigates to /internships and renders correctly

=== POST-FIX VERIFICATION ===

After both fixes:
1. npx tsc --noEmit
2. npm run build
3. npx next start
4. Verify in browser:
   - /programs: ONLY the 6-item UnifiedNavBar, NO old 3-item bar below it
   - /internships: loads directly, shows only internships, correct heading
   - /attachments: still works as before
   - Internship pill shows count badge with real number

DO NOT commit. DO NOT push. Report results and wait for "approve and commit".