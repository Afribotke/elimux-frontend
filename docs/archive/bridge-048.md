# BRIDGE: ElimuX Cycle 025 — Status Recap & Next Task
**Date:** 2026-08-23  
**Status:** EXECUTE — no questions, no options  
**Rule:** After every change, run `npx tsc --noEmit && npm run build`. Fix errors before reporting.

---

## WHERE WE ARE — CYCLE 025 SUMMARY

This cycle started as a Silicon Valley-grade design overhaul. Here's what got done, what's working, and what's broken right now.

### ✅ COMPLETED & WORKING

| Item | Status | Notes |
|------|--------|-------|
| Design tokens extended | ✅ | Shadows, animations, font sizes, spacing added to tailwind.config.js. globals.css extended with `.gradient-mask-b` and `prefers-reduced-motion`. No existing tokens removed. |
| Shared components | ✅ | LoadingState, EmptyState, ErrorFallback created. AppShell, Navbar, Footer created (thin wrappers, no duplication of shadcn). |
| /programs page polish | ✅ | text-balance, focus-visible rings, shadow-card, hover states. Blue stray colors fixed to primary gold. |
| /scholarships page polish | ✅ | Same polish applied. |
| /institutions/[id] polish | ✅ | Same polish applied. |
| /auth/login & /auth/register polish | ✅ | className-only changes. Session logic untouched. |
| /admin/dashboard polish | ✅ | className-only changes. |
| UnifiedNavBar (6 pills) | ✅ | Global, mounted in root layout. Universities & College, Skills & Trades (TVET), Scholarships, Internship, Attachment, Bursary. Active pill highlighted. Count badges on Internship (7) and Attachment (0). |
| /internships filtering | ✅ | `.eq("type", "internship")` added. Middleware redirect to /opportunities REMOVED. /internships now serves dedicated internship-only content. |
| /attachments | ✅ | Already correct — filters by type='attachment'. No changes needed. |
| Critical Error fix | ✅ | `crypto.randomUUID` crash over HTTP fixed with `crypto.getRandomValues()` fallback in src/lib/pwaDevice.ts. |
| Duplicate Analytics import fix | ✅ | Pre-existing bug in layout.tsx, not caused by this cycle. |
| Homepage copy fix | ✅ | Skolex headline changed from "Tell us what you're looking for" to "Discover Your Perfect Education". Subheadline changed to "Find universities, colleges, TVET institutes, and programs worldwide." |

### 🔄 PENDING — CURRENT TASK

**The Skolex homepage (NewHomePage.tsx) had 3 category tabs: "University & College", "Skills & Trades", "Scholarships". These were removed because they duplicated the global UnifiedNavBar and hid Internship/Attachment/Bursary. BUT the removal also accidentally stripped the content sections that were rendered inside those tabs.**

**Current state:** Homepage shows hero + search input, but is MISSING:
- Popular Programs section
- Live Partners & Advertisers section  
- Afribot / sponsor banner section
- How It Works section
- Any other sections that previously rendered conditionally based on active tab

**What needs to happen NOW:**
Restore ALL content sections unconditionally. Remove tab state logic entirely. The homepage is a single scrollable page where every section is always visible.

---

## EXACT INSTRUCTION — FIX HOMEPAGE CONTENT

In `src/components/home/NewHomePage.tsx` (or wherever the Skolex homepage component lives):

1. **Remove tab UI completely** — the 3 clickable pills ("University & College", "Skills & Trades", "Scholarships") must be gone. This is already done. Do not bring them back.

2. **Restore ALL content sections unconditionally** — find every section that was previously rendered inside a tab conditional (e.g., `activeTab === 'universities'`, `activeTab === 'tvet'`, `activeTab === 'scholarships'`). Remove the condition. Render the section always.

3. **The homepage must show, in order:**
   - Hero section: headline ("Discover Your Perfect Education"), subheadline, AI search input
   - Stats bar (if it existed)
   - Popular Programs section (with program cards like Accountancy, Accounting, etc.)
   - Live Partners & Advertisers section (with category pills: Education, Finance, Visa Agents, TVET & Trades, Visa & Travel, Technology, Careers)
   - Afribot / "Proudly Powered By" sponsor section
   - How It Works section
   - Any footer or additional sections

4. **No conditional rendering based on tabs.** Every section renders on every load.

5. **Do NOT modify the data fetching logic** — if sections were fetching data inside tab conditionals, keep the fetch but remove the tab gate.

---

## VERIFICATION STEPS

After implementing the fix:

1. `npx tsc --noEmit` — must be clean
2. `npm run build` — must be clean (155 routes)
3. `npx next start`
4. Open `http://localhost:3000` and visually confirm:
   - Hero with correct headline and search input ✅
   - Popular Programs section with program cards ✅
   - Live Partners & Advertisers with category pills and ad cards ✅
   - Afribot sponsor banner ✅
   - How It Works section ✅
   - UnifiedNavBar (6 pills) still visible below navbar ✅
   - No old 3-tabs anywhere ✅
5. Click each of the 6 pills and confirm navigation/filtering still works.

---

## WHAT NOT TO DO

- Do NOT ask me questions. Make reasonable engineering decisions and document them in code comments.
- Do NOT modify /programs, /scholarships, /internships, /attachments, or /bursary pages.
- Do NOT touch middleware.ts (already fixed).
- Do NOT touch Vercel env vars.
- Do NOT delete NewHomePage.tsx or merge with CurrentHome — that is a separate future cycle.
- Do NOT commit or push. Wait for "approve and commit".

---

## CONTEXT FROM THIS CONVERSATION THREAD

- The user is viewing the local preview at `192.168.0.14:3000` and `localhost:3000`.
- The user sent screenshots showing the missing sections: Afribot banner, Live Partners & Advertisers with "Your ad here" cards, Popular Programs with Accounting/Accountancy cards.
- The user explicitly said: "those missing items in the new http://localhost:3000/" — confirming the homepage is broken.
- The fix is restoring content, not redesigning it. Keep existing styling and structure, just remove the tab gating.

---

Report back with: (a) what sections were restored, (b) tsc result, (b) build result, (c) confirmation that all sections render on the homepage preview.