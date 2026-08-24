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
- MobileNav cleaned up: Jobs tab removed (bottom bar) and Opportunities/Bursary removed (hamburger overlay)

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
- 6 impersonating employer records renamed (Safaricom, Twiga, Bata, Kenya Airways, KPLC, M-Pesa Foundation Academy) — this was a live database write, not part of the git commit

### In Progress (Cycle 027)
- Homepage hero redesign: integrate 6 categories into hero, remove global UnifiedNavBar from homepage
- Full SV-grade polish on all homepage sections
- Not started yet — Cycle 027's Step 1 instruction has not been received in full (bridge.md currently starts mid-document, missing its header and Step 1)

## Blockers Before Push
- [ ] Cycle 027 homepage redesign complete
- [ ] User review of local preview
- [ ] Feature flag resolution (NEXT_PUBLIC_FEATURE_SKOLEX_HOME)
- [ ] Admin approvals backend API built
- [ ] Employer vacancy form UI click-tested

## Push Command (DO NOT RUN UNTIL APPROVED)
git push origin main
