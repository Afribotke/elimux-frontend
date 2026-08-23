CYCLE 025 — DIAGNOSE HOMEPAGE DISCREPANCY (execute immediately, no questions)

The user sees missing sections on localhost:3000. You report that NewHomePage.tsx still has its tabs and sections intact. This means the user is likely viewing CurrentHome (the old homepage) because NEXT_PUBLIC_FEATURE_SKOLEX_HOME is NOT set in the local environment.

DO THIS IN ORDER:

1. CHECK CURRENT LOCAL ENV:
   Run: cat .env.local 2>/dev/null || echo "No .env.local found"
   Run: cat .env 2>/dev/null || echo "No .env found"
   Report: Is NEXT_PUBLIC_FEATURE_SKOLEX_HOME set? What is its value?

2. CHECK WHAT PAGE IS ACTUALLY RENDERING:
   In src/app/page.tsx, show me the EXACT code that decides between CurrentHome and NewHomePage. Paste the conditional block verbatim.

3. IF the flag is NOT set locally:
   - Set it temporarily for this preview: NEXT_PUBLIC_FEATURE_SKOLEX_HOME=true
   - Rebuild: npm run build
   - Restart: npx next start
   - Verify: curl -s http://localhost:3000 | grep -o "Discover Your Perfect Education" || echo "NOT FOUND"
   - Report: Does the new headline appear? If yes, the user was looking at CurrentHome.

4. IF the flag IS set and NewHomePage IS rendering:
   - Open http://localhost:3000 in a real browser (Playwright or actual browser)
   - Take a screenshot of the FULL homepage from top to bottom
   - Report: Which sections are visible? Which are missing?
   - Check browser DevTools Console for any red errors
   - Report: Any JavaScript errors preventing sections from rendering?

5. REGARDLESS of the above, the user wants the Skolex homepage (NewHomePage) to be the ONLY homepage. The 3 tabs inside NewHomePage are confusing because they duplicate the global UnifiedNavBar. But you are CORRECT that removing them would also remove GradeMatcher, CareerSearchDropdown, and ScholarshipDiscovery content that is gated behind those tabs.

   SO: Do NOT remove the tabs yet. Instead, REORGANIZE the tabs so they make sense:
   - Tab 1: "AI Search" — keep the AI search input and GradeMatcher/CareerSearchDropdown
   - Tab 2: "Scholarships" — keep ScholarshipDiscovery
   - Tab 3: "Programs" — keep the program discovery content
   - Remove the old tab labels "University & College", "Skills & Trades", "Scholarships" — those are now handled by the global UnifiedNavBar
   - The new tabs should be about SEARCH MODES, not categories

   OR simpler: Convert the 3 tabs into 3 stacked sections on the same page (no tabs, just scroll down):
   - Section 1: AI Search (with GradeMatcher, CareerSearchDropdown)
   - Section 2: Scholarship Discovery
   - Section 3: Popular Programs

   Pick the simpler approach (stacked sections, no tabs). Implement it.

6. AFTER implementing, verify:
   - npx tsc --noEmit
   - npm run build
   - npx next start
   - Homepage loads with headline "Discover Your Perfect Education"
   - All sections visible: AI Search, Scholarship Discovery, Popular Programs, Live Partners & Advertisers, Afribot banner
   - No old category tabs (University & College / Skills & Trades / Scholarships)

DO NOT commit. DO NOT push. Report results with screenshots if possible.
