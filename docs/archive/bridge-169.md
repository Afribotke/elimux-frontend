CYCLE 169 — LIVE SITE BUG FIX: Favicon + Missing Senior Schools Nav
Live Platform Safety Procedure (MANDATORY)
AUDIT → Inspect files, identify root cause
CODE → Fix files
BUILD → npm run build (zero errors)
VERIFY → Local browser check
COMMIT → Only after local verify passes
PUSH → Only after commit is clean
LIVE CHECK → Confirm production matches local
ISSUE 1: Old Yellow "E" Favicon Still Live
Audit tasks:
List all files in public/ matching *icon*, *fav*, *logo*, *.png, *.svg, *.ico
Check app/layout.tsx or app/metadata.ts for icons / favicon metadata export
Check public/manifest.json for icons array and theme_color
Check next.config.js / next.config.ts for any PWA / manifest plugin config
Check if public/favicon.ico exists and what it contains
Check if public/icon-*.png files exist (PWA icons)
Root cause to confirm: Either:
(a) New favicon files were committed but old favicon.ico still exists and browsers cache .ico preferentially, OR
(b) app/layout.tsx metadata still references old icon path, OR
(c) manifest.json still references old icon paths, OR
(d) PWA service worker has cached the old icons
Fix (apply all that apply):
If old public/favicon.ico exists → delete it (modern browsers prefer .ico if present)
Ensure app/layout.tsx exports correct metadata:
tsx
export const metadata = {
  icons: {
    icon: '/logo-new.png', // or whatever the new logo filename is
    shortcut: '/logo-new.png',
    apple: '/logo-new.png',
  },
};
Update public/manifest.json icons array to point to new logo files only
If a PWA service worker / workbox config exists, bump the cache version or add cache-bust query param to icon URLs
Ensure new logo file is actually present in public/ and committed
ISSUE 2: Senior Schools Nav Item Missing
Audit tasks:
Read components/layout/UnifiedNavBar.tsx (or wherever top-level nav lives)
Check if "Senior Schools" link exists in the nav array/map
Check if there is any conditional rendering (feature flag, auth check, role check) that might hide it
Check if the nav item was accidentally removed in a previous cycle
Check app/schools/page.tsx exists and is not gated by middleware
Root cause to confirm: Either:
(a) Nav item was accidentally removed/dropped from the array, OR
(b) A feature flag or auth condition is hiding it, OR
(c) The nav array is database-driven and the "Senior Schools" category row is missing/filtered
Fix:
If accidentally removed → restore the nav item with correct href="/schools" and existing styling classes
If hidden by a flag/condition → remove the incorrect gate (Senior Schools is a live, shipped feature)
If database-driven → verify the category row exists and is not filtered out
The nav item must match the styling of other live nav items (Universities, Colleges, Courses).
BUILD & VERIFY
bash
npm run build
# Zero errors
npm run dev
# Local browser verify:
# [ ] Tab shows new logo (not yellow E)
# [ ] PWA install prompt / manifest shows new logo
# [ ] Senior Schools appears in nav, clickable, routes to /schools
# [ ] No console errors
COMMIT & PUSH (Only after local verify)
bash
git add -A && git status
# Confirm only favicon/logo files + nav file are staged
git commit -m "Cycle 169: Fix live favicon and restore Senior Schools nav"
git push origin main
LIVE VERIFY
Hard-refresh www.elimux.ke (Ctrl+F5) to bust cache
Screenshot tab showing new logo
Screenshot nav showing Senior Schools present
Report back with both screenshots