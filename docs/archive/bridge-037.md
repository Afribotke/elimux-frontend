# BRIDGE: Cycle 025 Side-by-Side Audit — Live vs. Local Build
**Scope:** Compare www.elimux.ke (production) against localhost:3000 (local design build)  
**Goal:** Identify every omission, breakage, or visual change. Report reasons.  
**Status:** EXECUTE — no questions, no options  
**Rule:** Do NOT commit or push anything until this audit is complete and user approves.

---

## 0. PRE-AUDIT — FIX LOCALHOST FIRST

The local build at localhost:3000 shows "Critical Error" on load. Before any comparison can happen, this must be fixed.

1. Show the EXACT terminal output from `npx next start` — paste the full error stack trace.
2. Show the EXACT browser Console errors (F12 → Console).
3. Show the current content of:
   - `src/app/layout.tsx`
   - `src/components/layout/AppShell.tsx`
   - `src/components/ui/ErrorFallback.tsx`
4. Fix the root cause. Rebuild. Restart `npx next start`. Confirm homepage loads without Critical Error.
5. Report: "Local build now loads. Root cause was: [explanation]."

Do NOT proceed to Section 1 until localhost loads without errors.

---

## 1. LIVE SITE AUDIT — www.elimux.ke

For each page below, make an HTTP GET request and report what you find. Use `curl -s -o /dev/null -w "%{http_code}" [URL]` for status codes.

### 1.1 Route Inventory
List EVERY route that returns HTTP 200 on the live site. Check these known routes:

| Route | Status | Notes |
|-------|--------|-------|
| / | | Homepage content |
| /programs | | Program listing |
| /programmes | | Redirect? 404? |
| /scholarships | | Scholarship listing |
| /institutions | | Institution listing |
| /institutions/[id] | | Pick any real ID |
| /auth/login | | Login page |
| /auth/register | | Register page |
| /admin/dashboard | | Admin dashboard (may redirect if unauth) |
| /employer/login | | Employer login |
| /advertiser/login | | Advertiser login |
| /payments | | Payments page |
| /bursary | | Bursary page |
| /about | | About page |
| /contact | | Contact page |
| /blog | | Blog page |
| /sitemap.xml | | SEO sitemap |
| /robots.txt | | Robots file |
| Any other routes you find | | |

### 1.2 Live Site Component Inventory
For the homepage and /programs page, describe:
- What navigation elements exist (top nav items, dropdowns, mobile menu)
- What hero section content exists (headline, subheadline, CTAs, images)
- What cards/components are visible (program cards, stats, features)
- What footer content exists (columns, links, social icons)
- What auth state is shown (login button vs. user dropdown)

### 1.3 Live Site Assets
- What logo is displayed? (text or image, colors)
- What is the primary brand color on the live site? (gold/amber or other)
- Is there a dark mode toggle? Where? Does it work?
- Are there any animations or transitions visible?

---

## 2. LOCAL BUILD AUDIT — localhost:3000

After fixing the Critical Error, audit the local build the same way.

### 2.1 Route Inventory
Same table as 1.1, but for localhost:3000. Report status for each route.

### 2.2 Local Build Component Inventory
Same as 1.2 — describe what appears on homepage and /programs.

### 2.3 Local Build Assets
Same as 1.3 — describe logo, brand colors, dark mode, animations.

### 2.4 Build Output Inspection
Run: `ls -la .next/server/app/` and report what page files were generated.
Compare against the live site's expected routes. Flag any missing routes.

---

## 3. SIDE-BY-SIDE COMPARISON TABLE

Create a markdown table comparing Live vs. Local for every item:

| Item | Live (elimux.ke) | Local (localhost) | Status | Reason for Change |
|------|------------------|-------------------|--------|-------------------|
| Homepage hero headline | [text] | [text] | MATCH / DIFFERENT / MISSING | [why] |
| Homepage stats bar | [present/absent] | [present/absent] | | |
| /programs page layout | [description] | [description] | | |
| Dark mode toggle | [location] | [location] | | |
| Navbar items | [list] | [list] | | |
| Footer columns | [count] | [count] | | |
| Program card design | [description] | [description] | | |
| /scholarships page | [status] | [status] | | |
| /institutions/[id] | [status] | [status] | | |
| Admin dashboard | [status] | [status] | | |
| Auth pages | [status] | [status] | | |
| Employer pages | [status] | [status] | | |
| Bursary pages | [status] | [status] | | |
| Analytics script | [present] | [present] | | |
| Any other page | | | | |

**Status column:** Use one of: MATCH (identical), DIFFERENT (changed), MISSING (gone from local), NEW (only in local), BROKEN (errors).

**Reason column:** If DIFFERENT or MISSING, explain:
- Was it intentionally redesigned in Cycle 025?
- Was it accidentally removed/broken?
- Was it never in the local codebase to begin with?
- Is it a pre-existing issue unrelated to Cycle 025?

---

## 4. GIT DIFF ANALYSIS

Run: `git diff --name-only` and report every file that has uncommitted changes.

For each changed file, report:
- File path
- Was it changed by Claude in Cycle 025? (yes/no — check if it's in the bursary/analytics pre-existing diff)
- What was the nature of the change? (design polish, bug fix, new file, structural change)
- Does this change risk breaking any live functionality?

---

## 5. OMISSIONS REPORT

List every item that exists on the live site but is MISSING or BROKEN on localhost. For each:

1. **What is missing?** (be specific — page, component, feature, text)
2. **Where did it exist on live?** (URL + DOM location)
3. **Why is it missing locally?** 
   - Deleted by Cycle 025 changes?
   - Build error prevented it from generating?
   - Pre-existing condition (was already broken before Cycle 025)?
   - Route doesn't exist in local codebase?
4. **Severity:** CRITICAL (blocks launch), HIGH (major feature missing), MEDIUM (visual regression), LOW (minor polish)
5. **Fix required before commit?** yes/no

---

## 6. RECOMMENDATION

After the audit, provide ONE clear recommendation:

- **SHIP:** Local build is ready, differences are intentional design improvements only.
- **FIX THEN SHIP:** Specific items need fixing first (list them).
- **ABORT:** Local build has critical regressions, do not commit. Revert Cycle 025 changes.

Do NOT provide multiple options. Pick one and justify it.

---

## 7. EXECUTION RULES

- Use `curl` or browser inspection for live site checks.
- Use actual local server responses for localhost checks.
- Be specific — "the navbar" is not enough; list every link in the navbar.
- If you cannot access a page (e.g., admin dashboard requires auth), note it as "AUTH REQUIRED" rather than guessing.
- Do NOT modify any files during the audit phase. This is read-only investigation.
- Report findings in a single consolidated markdown file: `docs/audit-025-comparison.md`