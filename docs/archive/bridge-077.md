CYCLE 030 — AUDIT & REDESIGN /ai-search/ PAGE (execute in order, no questions)

=== STEP 1: AUDIT CURRENT STATE ===

Find and report:

1. What file renders /ai-search/? (Check src/app/ai-search/page.tsx or similar)
2. What components does it import?
3. What does the page currently contain? (copy the key sections/headlines)
4. Does it share any components with the homepage (NewHomePage.tsx)?
5. Is it using the old Skolex design (light background, "Tell us what you're looking for", 3 tabs) or the new dark design?

Report the EXACT file path and a summary of what you find. Do NOT modify anything yet.

=== STEP 2: REDESIGN /ai-search/ TO MATCH NEW DESIGN SYSTEM ===

After audit, redesign the /ai-search/ page to match the current homepage aesthetic:

REQUIREMENTS:
- Dark gradient background (same as homepage: from-slate-950 via-slate-900 to-black)
- Headline: "AI-Powered Education Search" (or similar, text-display-1, white, centered)
- Subheadline: "Describe what you're looking for in your own words. Our AI matches you to universities, TVET institutes, scholarships, internships, attachments, and bursaries."
- AI Search input: large, prominent, same style as homepage (bg-slate-800/80 backdrop-blur-md border-slate-600 rounded-2xl)
- The 6 category pills below the search (same compact style as homepage: Universities, TVET, Scholarships, Internship, Attachment, Bursary)
- "Or browse by category" label with divider lines
- Connection to the 6 categories: clicking a pill should navigate to the relevant page (/programs?type=university, /programs?type=tvet, /scholarships, /internships, /attachments, /bursary)
- Footer must be present
- Dark mode by default (since the whole page is dark)

RULES:
- Do NOT use the old Skolex components (HeroSearch, SearchModeToggle, etc.) unless they've been redesigned
- Use the same shared components as the homepage: AppShell, Footer, category card components if they exist
- If shared components don't exist for the 6 pills, create them or inline the same structure
- The page must NOT look like a separate product — it must feel like part of ElimuX

=== STEP 3: VERIFICATION ===

After redesign:
1. npx tsc --noEmit
2. npm run build
3. npx next start
4. Navigate to http://localhost:3000/ai-search/
5. Confirm:
   - [ ] Dark background, not light
   - [ ] Headline and subheadline present
   - [ ] AI search input prominent
   - [ ] 6 category pills visible
   - [ ] Clicking pills navigates correctly
   - [ ] Footer visible
   - [ ] No old "Tell us what you're looking for" or 3-tab layout

DO NOT commit. DO NOT push. Report after Step 1 audit, then proceed to Step 2.