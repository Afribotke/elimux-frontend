STOP. DO NOT PUSH TO PRODUCTION.

Cycle 025 and 026 changes are committed locally (63a3258, 69 files) but NOT pushed to Vercel. Cycle 027 is about to start. We are keeping everything local until the full redesign is complete and reviewed.

REASONS FOR NOT PUSHING YET:

1. Homepage is mid-redesign (Cycle 027 in progress). Pushing now would show a half-finished homepage to live users.
2. The two-homepage problem (CurrentHome vs NewHomePage) is not fully resolved. The feature flag NEXT_PUBLIC_FEATURE_SKOLEX_HOME is still in play.
3. Cycle 025-026 changes (UnifiedNavBar, /internships redirect removal, DesktopNav cleanup, employer vacancy type selector, admin approvals page) have not been user-tested on a real browser yet.
4. The user wants to review everything locally first, then push as one clean deployment.
5. Pushing 69 files at once is safer than incremental pushes that might break live functionality.

WHAT YOU MUST DO NOW:

1. Confirm the local commit exists: git log --oneline -3
2. Confirm nothing is pushed: git status (should show "Your branch is ahead of 'origin/main' by 1 commit")
3. Document all pending changes in a single file: docs/pending-deployment.md

Create docs/pending-deployment.md with this exact content:

```markdown
# Pending Deployment — DO NOT PUSH UNTIL APPROVED

## Status
Local commit: 63a3258
Files changed: 69
Pushed to production: NO

## What's Included (Cycles 025-026)

### Design System
- Extended tailwind.config.js with shadows, animations, font sizes, spacing
- Extended globals.css with gradient-mask-b and prefers-reduced-motion

### Shared Components
- LoadingState, EmptyState, ErrorFallback
- AppShell, Navbar, Footer wrappers

### Navigation
- UnifiedNavBar (6 pills): Universities & College, Skills & Trades (TVET), Scholarships, Internship, Attachment, Bursary
- DesktopNav cleaned up: Opportunities and Bursary links removed
- MobileNav cleaned up: Jobs tab removed

### Pages
- Homepage: Skolex copy updated, tabs replaced with stacked sections
- /programs: SV-grade polish, old filter bar removed
- /scholarships: SV-grade polish
- /institutions/[id]: SV-grade polish
- /auth/login & /auth/register: className polish
- /admin/dashboard: className polish
- /internships: dedicated page, middleware redirect removed, filters correctly
- /admin/approvals: new page (mock data, backend pending)

### Bug Fixes
- Duplicate Analytics import in layout.tsx
- crypto.randomUUID crash over HTTP
- /api/opportunities 500 (missing local env key + error handling hardened)

### Data Fixes (Production)
- 6 impersonating employer records renamed (Safaricom, Twiga, Bata, Kenya Airways, KPLC, M-Pesa Foundation)

### In Progress (Cycle 027)
- Homepage hero redesign: integrate 6 categories into hero, remove global UnifiedNavBar from homepage
- Full SV-grade polish on all homepage sections

## Blockers Before Push
- [ ] Cycle 027 homepage redesign complete
- [ ] User review of local preview
- [ ] Feature flag resolution (NEXT_PUBLIC_FEATURE_SKOLEX_HOME)
- [ ] Admin approvals backend API built
- [ ] Employer vacancy form UI click-tested

## Push Command (DO NOT RUN UNTIL APPROVED)
git push origin main
After creating the file, report back: "Pending deployment documented. Local commit 63a3258 ready. Cycle 027 can proceed safely without risk to production."
Then proceed with Cycle 027 as instructed in the previous bridge.md.
DO NOT push. DO NOT run vercel --prod. DO NOT touch remote.
plain

---

This keeps everything safe. Claude documents the full state, confirms nothing is live yet, and then continues building Cycle 027 locally. When you're ready, you'll say "push everything" and it'll all go live at once.
CYCLE 027 — HOMEPAGE HERO REDESIGN (execute in order, no questions)

STEP 1: REMOVE GLOBAL UnifiedNavBar FROM HOMEPAGE ONLY

The UnifiedNavBar is mounted in root layout.tsx and appears on every page. On the homepage ONLY, it must be hidden. The 6 categories will live inside the hero section instead.

Fix:
- In src/app/layout.tsx (or wherever UnifiedNavBar is mounted), add a conditional: do NOT render UnifiedNavBar when the current route is "/" (homepage).
- Use usePathname() to check the route.
- UnifiedNavBar must still appear on /programs, /scholarships, /internships, /attachments, /bursary.

DO NOT remove UnifiedNavBar from those other pages.

STEP 2: REDESIGN HOMEPAGE HERO

In src/components/home/NewHomePage.tsx:

The hero must be a single cohesive visual unit with the 6 category cards integrated:

Headline: "Discover Your Perfect Education" (text-display-1, font-weight 800, centered, text-balance)
Subheadline: "Find universities, colleges, TVET institutes, and programs worldwide." (text-body-lg, centered, max-width 2xl)

Below that, a 3x2 grid of category cards:
Row 1: Universities & College | Skills & Trades (TVET) | Scholarships
Row 2: Internship | Attachment | Bursary

Card style:
- bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 (on dark gradient background)
- OR bg-white border border-gray-200 shadow-card rounded-2xl p-6 (on light background)
- Icon: 48px, centered, subtle background circle
- Label: text-lg font-semibold text-center mt-3
- Hover: hover:bg-white/20 hover:scale-[1.02] transition-all duration-200
- Active: ring-2 ring-primary-400

Background: Use a gradient. Suggestion for dark mode: bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700. For light mode: bg-gradient-to-br from-primary-50 via-white to-white.

AI Search Input:
- Large, prominent, centered below the category cards
- bg-white rounded-2xl shadow-soft-lg px-6 py-4 text-lg
- Placeholder: "Ask anything... e.g., 'I want to study medicine in Kenya'"
- Search button inside input (right side), btn-primary style

Stats bar below hero:
- bg-white border-y border-gray-100 py-8
- 4 stats in a row: "10,000+ Institutions", "50,000+ Programs", "100+ Countries", "1M+ Students"
- Number: text-3xl font-bold text-primary-600
- Label: text-sm text-gray-500

STEP 3: POLISH BELOW-THE-FOLD SECTIONS

Popular Programs:
- Heading: text-display-2 with "🔥 Popular Programs" and "Explore all →" link right-aligned
- Cards: card-interactive with image, institution, duration, category badge
- Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6

Live Partners & Advertisers:
- Heading: text-display-3 with green dot indicator "LIVE Partners & Advertisers"
- Category pills: smaller version of hero cards
- Ad cards: dashed border for empty, solid for filled

Sponsor Banner (Afribot):
- Full-width, bg-gray-900 text-white py-16
- Centered logo, tagline "Banking on Education", CTA "Visit Afribot"

How It Works:
- Heading: text-display-2 centered
- 3 steps: numbered circles (1, 2, 3), icon, title, description
- Connecting line between steps on desktop

STEP 4: GLOBAL CONSISTENCY

- Top navbar: transparent over hero with backdrop blur, transitions to solid on scroll
- Footer: must appear on homepage (old Skolex had none)
- Dark mode: entire homepage must respect the toggle

STEP 5: VERIFICATION

After all steps:
1. npx tsc --noEmit
2. npm run build
3. npx next start
4. Check:
   - Homepage: no UnifiedNavBar below navbar, 6 cards in hero, headline correct, search input prominent
   - /programs: UnifiedNavBar IS visible below navbar
   - Dark mode toggle works on homepage
   - Footer visible on homepage
   - All sections render correctly

DO NOT commit. DO NOT push. Report after each step.