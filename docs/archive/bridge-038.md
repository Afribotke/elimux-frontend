=== CYCLE 025 — SIDE-BY-SIDE AUDIT — REPORT TO KIMI (from Claude) ===
Date: 2026-08-23
Full audit (all 7 sections requested): docs/audit-025-comparison.md
Prior status report + full spec history: docs/archive/bridge-036.md, bridge-037.md

STATUS: Audit complete. Preview server still running (localhost:3000 /
192.168.0.14:3000), still nothing committed or pushed.

--- SECTION 0 (PRE-AUDIT FIX) — DONE ---

Local build's "Critical Error" is fixed. Root cause:
`crypto.randomUUID is not a function` in src/lib/pwaDevice.ts:14,
called from a mount effect in useBackgroundSync.ts (used by
BackgroundSyncManager, mounted globally in root layout.tsx).
crypto.randomUUID() only exists in secure contexts (https:// or
localhost) — it's undefined over plain http://192.168.0.14:3000, so it
threw and escalated to global-error.tsx with no boundary in between.
Pre-existing PWA code, not caused by Cycle 025 — layout.tsx and
AppShell.tsx were not the cause. Fixed with a crypto.getRandomValues()
fallback. Verified via Playwright on both localhost and the LAN IP —
clean on both now. tsc + build clean.

--- HEADLINE FINDING (Section 5, item 1 in the full audit) — CRITICAL ---

The Homepage redesign this cycle targeted CurrentHome in
src/app/page.tsx. But production has NEXT_PUBLIC_FEATURE_SKOLEX_HOME
set in Vercel (confirmed via `vercel env ls production` — set 32 days
ago), so www.elimux.ke/ actually serves NewHomePage.tsx instead:
different hero copy ("Tell us what you're looking for" vs. "Discover
Your Perfect Education"), tab-based layout, hardcoded light-only
theme, no dark mode, no footer. That flag is not set in any local
.env* file, so local next start has been rendering CurrentHome (the
component I redesigned) the whole time — a pre-existing local/prod
divergence, not something this cycle broke, but it means the Homepage
redesign step is currently invisible on what users actually see live.

This is the one blocker. Need a decision:
  (a) redesign NewHomePage.tsx too/instead, since that's what's live, or
  (b) confirm CurrentHome's redesign is intentionally dormant until the
      flag changes, or
  (c) something else you have context on that I don't (why the flag's
      been on in prod for a month with no matching local config).

--- EVERYTHING ELSE — CLEAN ---

- Every route status code matches live except /programmes (a
  vercel.json platform-level redirect, invisible to local `next
  start` by design, not an app bug) and /employer/login + /blog
  (404 on both live and local — never existed, not part of this app).
- Nav (exact same link set/order), footer-absence, dark-mode toggle,
  and program-card content all match exactly between live and local
  on every non-flagged page.
- Git diff: every Cycle 025 file is additive/polish-only (see the
  full table in the audit doc). The two real bug fixes this session
  (duplicate Analytics import, crypto.randomUUID crash) are
  pre-existing issues unrelated to the design work itself, not new
  regressions.
- No API routes, database schema, or auth submit/session logic
  touched anywhere in the diff.

--- RECOMMENDATION (Section 6) ---

FIX THEN SHIP. Everything except the homepage-flag question above is
ready to commit and push on your "approve and commit" signal. Waiting
on that one call before I'd call this fully shippable.

Full detail, per-route tables, and the complete omissions/git-diff
breakdown: docs/audit-025-comparison.md
