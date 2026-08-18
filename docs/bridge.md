## KIMI DESIGN (Current)

# INSTRUCTION 016: Add "Bursary — Opening Soon" to live site without affecting existing functionality

**Background:** The Bursary Engine is being built but is not ready for launch. We need to add a visible entry point on the live homepage (www.elimux.ke) that directs interest to the coming bursary platform. The bursary.elimux.ke domain is live on Vercel with SSL.

**Task 1 — Add Bursary button to homepage:**
In `elimux-frontend/src/app/page.tsx` (or the main homepage component), add a prominent "Bursary" button/link in the main navigation or hero section.

Requirements:
- Position it next to or near the existing "Scholarships" or main CTA
- Style it to match the existing design system (colors, fonts, spacing)
- Text should read: "Bursary" with a small badge/pill next to it saying "Opening Soon"
- The badge should be visually distinct (e.g., amber/yellow background, small text)
- On click: navigate to `https://bursary.elimux.ke`

Example styling:
```tsx
&lt;Link href="https://bursary.elimux.ke" className="..."&gt;
  &lt;span&gt;Bursary&lt;/span&gt;
  &lt;span className="ml-2 px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full"&gt;
    Opening Soon
  &lt;/span&gt;
&lt;/Link&gt;
Task 2 — Create Coming Soon landing page:
Create elimux-frontend/src/app/bursary/page.tsx with a simple, branded "Coming Soon" page.
Requirements:
Clean, minimal design matching ElimuX branding
Headline: "ElimuX Bursary Engine"
Subheadline: "Connecting students with funding opportunities from County Governments, NG-CDF, NGOs, Corporates, and Foundations."
Status badge: "Opening Soon" (prominent, centered)
Email capture form: "Get notified when we launch" (simple email input + submit button)
No backend needed for email capture yet — just log to console or store in localStorage for now
Include: "Are you a funding provider? Register your interest" with a mailto: link to your email
Footer: "Powered by ElimuX" linking back to www.elimux.ke
Task 3 — Handle bursary.elimux.ke subdomain routing:
In elimux-frontend/src/middleware.ts (or create it if it doesn't exist), add logic to detect the bursary.elimux.ke subdomain and rewrite to the /bursary route.
TypeScript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  
  // If accessing bursary.elimux.ke, rewrite to /bursary path
  if (host === 'bursary.elimux.ke' || host.startsWith('bursary.elimux.ke')) {
    const url = request.nextUrl.clone();
    url.pathname = `/bursary${url.pathname}`;
    return NextResponse.rewrite(url);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
Task 4 — Verify no existing functionality is broken:
Run npm run build in elimux-frontend
Confirm build passes with zero errors
Confirm existing pages (home, scholarships, admin, etc.) still work
Confirm the new Bursary button appears on the homepage
Confirm clicking the button navigates to bursary.elimux.ke
Confirm bursary.elimux.ke shows the Coming Soon page
Task 5 — Commit and deploy:
bash
git add -A
git commit -m "cycle-016: add bursary opening soon button and landing page"
git push origin main
Vercel will auto-deploy. Verify live at www.elimux.ke and bursary.elimux.ke.
Acceptance Criteria:
[ ] Bursary button with "Opening Soon" badge appears on www.elimux.ke homepage
[ ] Button navigates to bursary.elimux.ke
[ ] bursary.elimux.ke displays the Coming Soon landing page
[ ] Email capture form is present and functional (frontend only)
[ ] Existing homepage functionality is unchanged
[ ] Existing routes (scholarships, admin, applications) are unaffected
[ ] npm run build passes
[ ] Changes are committed and deployed
Risk: DO NOT modify any existing API routes, auth logic, or database tables. DO NOT change the existing navigation structure except adding the Bursary button. DO NOT break the PWA service worker. This is a purely additive change.
plain

**Save bridge.md.**

---

## Step 3: Tell Claude to execute

After saving, tell Claude this exact sentence:

## CLAUDE EXECUTION (Current)

**Status: COMPLETE** (Tasks 1–4 fully executed and verified live-locally; Task 5's commit/push deliberately not run — staged only, awaiting explicit confirmation per rule 13, same as every prior cycle including 015).

**Observation on the instruction file itself (not a blocker):** the KIMI DESIGN section above ends with leftover template text — "**Save bridge.md.**", a "## Step 3: Tell Claude to execute" heading, and a dangling "After saving, tell Claude this exact sentence:" with nothing after it. This reads like boilerplate carried over from whatever guide Kimi drafted this instruction from, not part of Instruction 016 itself. Ignored as noise rather than treated as a Task 6. Also: Task 1's "Example styling" code fence has HTML-escaped `&lt;`/`&gt;` instead of literal angle brackets (a copy-paste artifact) — read as intent, not applied literally.

**Task 1 (Bursary nav button):** Added to **both** `DesktopNav.tsx` and `MobileNav.tsx`, not just one. The instruction said "main navigation or hero section" and named "Scholarships" as the anchor point, but neither nav actually has a "Scholarships" entry (the real primary nav is Home/Institutions/AI Search/Opportunities/Programs) — placed the Bursary link as a new item in each nav's primary list instead, styled to match each file's existing pattern (`DesktopNav`: emoji icon + amber pill, matching `NavLink`'s icon-as-emoji-string convention; `MobileNav`: `HandCoins` lucide icon + amber pill, matching that file's icon-component convention). Left the mobile bottom tab bar (the always-visible 4-slot bar) untouched — added the entry to the full "More" menu overlay instead, since inserting a 5th item into a fixed `justify-around` 4-column layout would have been a real structural change, not the "purely additive" one the Risk line asked for.

**Task 2 (Coming Soon page):** Created `elimux-frontend/src/app/bursary/page.tsx` — headline/subheadline/badge text matches the instruction verbatim, email form validates format client-side and stores to `localStorage` (`elimux-bursary-notify-emails`) plus a `console.log`, matching "no backend needed yet." Provider-interest link uses `mailto:support@elimux.ke` — the instruction said "to your email" without naming one; `support@elimux.ke` is the real address already used elsewhere in this codebase (`contact/page.tsx`, `receipts/[reference]/page.tsx`), not invented. Styled with the same design tokens as the real homepage hero (`elimux-dark`/`elimux-card` gradient, `primary-400/500/600`, `text-muted`, `border-border`) rather than guessed colors, so it actually matches the live design system.

**Task 3 (subdomain routing) — corrected, not applied literally:** `elimux-frontend/src/middleware.ts` already existed (the instruction's "or create it if it doesn't exist" branch didn't apply) with two pieces of real, live logic the given replacement code would have silently deleted: the `/internships` → `/opportunities/` 308 redirect, and the auth-cookie gate on `/dashboard` and `/admin` (unauthenticated users would gain access to both). Merged the bursary-host rewrite in as a new first branch instead of overwriting the file. Two corrections made beyond the merge itself:
1. **Host-match bug fixed:** the given code's `host.startsWith('bursary.elimux.ke')` also matches a spoofed host like `bursary.elimux.ke.attacker.com`. Replaced with an exact regex (`^bursary\.elimux\.ke(:\d+)?$`, port suffix allowed for local/preview).
2. **Matcher broadened, not narrowed:** the existing matcher only ran middleware on `/dashboard/:path*`, `/admin/:path*`, `/internships(/)?` — too narrow for the bursary rewrite to fire on arbitrary paths (including `/`) on that subdomain. Adopted the instruction's own suggested matcher (`/((?!api|_next/static|_next/image|favicon.ico).*)`), which is a strict superset of the old one — every path the old matcher covered is still covered, plus everything else. This does mean middleware now runs on effectively every request instead of 4 patterns; flagged as a real, deliberate cost tradeoff, not a silent side effect.

**Task 4 (verification) — done beyond "build passes," actually exercised the behavior:**
- `npm run build`: **PASSED**, exit code 0, zero errors/warnings. `/bursary` appears in the route manifest (2.36 kB, static). Middleware bundle grew 34.4 kB → 34.5 kB (expected, new logic).
- Started the built app locally (`npm run start`, port 4321) and verified with `curl` + spoofed `Host` headers rather than trusting the build alone:
  - `Host: localhost`, `/` → response contains "Bursary" and "Opening Soon" (nav button renders) ✅
  - `Host: bursary.elimux.ke`, `/` → response contains "ElimuX Bursary Engine", "Opening Soon", "Get notified" (rewrite hits the Coming Soon page) ✅
  - `Host: localhost`, `/dashboard/` → **307 redirect to `/auth/login`**, not a 200 — confirms the auth-gate Task 3's literal code would have deleted is still intact ✅
  - `Host: localhost`, `/internships` → **308 redirect to `/internships/`** — confirms the existing single-hop redirect is still intact ✅
  - Local verification server stopped after (port 4321 released) — no lingering process.

**Task 5 (commit/deploy):** **NOT RUN**, deliberately — staged only (`docs/TECHNICAL_BLUEPRINT...` from Cycle 015 is already committed/pushed; this cycle's files are new changes on top). Matches the standing pattern from all 15 prior cycles and this session's own git-safety default: never commit without being explicitly asked, even when the KIMI DESIGN instruction itself says to.

**Files touched this cycle:** `src/components/DesktopNav.tsx`, `src/components/MobileNav.tsx` (Bursary nav entries), `src/app/bursary/page.tsx` (new), `src/middleware.ts` (merged, not replaced), `docs/archive/bridge-016.md` (new, archive snapshot), `docs/bridge.md` (this section). No API routes, auth logic, or database tables touched — matches the Risk constraint exactly.

## NOTE TO KIMI

Nothing blocking — Cycle 016 is clean. Two small things worth knowing:

1. **The instruction named "Scholarships" as the nav anchor, but that item doesn't exist in either nav** (real primary nav: Home/Institutions/AI Search/Opportunities/Programs). Placed Bursary as its own new nav item instead of "next to Scholarships" — if you had a specific visual position in mind, say so and I'll move it.
2. **`middleware.ts` matcher is now much broader** (`/((?!api|_next/static|_next/image|favicon.ico).*)` vs. the previous 4 explicit patterns) — necessary for the subdomain rewrite to work on arbitrary bursary.elimux.ke paths, but it does mean every request now runs through middleware instead of a narrow set. Not a problem at current traffic, worth knowing if it ever needs optimizing later.

Also carried over from Cycle 015, still unresolved: M-Pesa build ordering vs. Cycle 013, Stripe-vs-Paystack billing for the eventual full Bursary Engine, and whether `scholarship_messages` gets reused — none of that blocks this cycle's "Opening Soon" page, which has no backend dependency at all.