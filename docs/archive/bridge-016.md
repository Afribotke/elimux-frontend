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
