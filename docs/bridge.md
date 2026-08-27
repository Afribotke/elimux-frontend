# Cycle 033 Report — Logo + Favicon Integration

## Status: DONE, `npm run build` green with zero errors/warnings, NOT committed or pushed

Executed both chained cycles from the last bridge.md drop (archived as
`docs/archive/bridge-104.md` — that snapshot also still has the raw pasted
chat-UI cruft from cycle 2's source, e.g. "Edit Copy Share", left in for the
record).

## What was actually different from the spec

Both cycles assumed a wide horizontal banner logo (`width={140} height={45}`,
`width={160} height={50}`). The real asset dropped in `public/logo/` is a
square 1:1 lockup (icon + "ElimuX" wordmark stacked, 1254×1254) — forcing it
into a 140×45 box would squash it illegibly. Checked every asset with the
Read tool before wiring anything in:
- `public/logo/logo-original.png` / `logo-white.png` — square lockup, full
  color / solid-white silhouette respectively. Confirmed `logo-white.png` is
  a real white silhouette (not a blank file) via a pixel-alpha bbox check —
  it just renders as blank in a white-background previewer.
- `public/logo/symbol-128.png` — icon-only mark, no wordmark, transparent bg.
  Used this (as `/icon-128.png`) anywhere space is tight (navbar, admin
  sidebar) instead of squeezing the full lockup in.
- `public/favicon/icon-192x192.png` / `icon-512x512.png` — a *different*,
  circular icon-only badge, clearly purpose-built for app-icon use (distinct
  from the logo-lockup versions of the same filenames in `public/logo/`).
  These intentionally win at `/icon-192x192.png` and `/icon-512x512.png`
  since the favicon cycle's own copy step targets those same root paths
  last — sequencing "logo then favicon" as asked means favicon's icon set
  is the one actually live at those paths now.

`public/manifest.json` already had a *better* icon set than what either
pasted cycle proposed (72/96/128/144/152/192/384/512 + maskable variants,
all pre-existing and working) — left its structure alone rather than
collapsing it down to the spec's 2-entry version; the underlying PNG bytes
at the paths it references were refreshed instead. Same reasoning for
`app/layout.tsx`'s `metadata.icons`: cycle 1 needed no edit there (it
already pointed at `/icon-192x192.png` / `/apple-touch-icon.png`, now
holding new content); cycle 2 did need an edit, since it adds dedicated
16/32/48px favicon sizes that didn't exist before.

## Files Changed (working tree only, nothing committed)
- `public/logo.png`, `public/logo-white.png`, `public/icon-128.png` — new, from `public/logo/`
- `public/apple-touch-icon.png`, `public/icon-192x192.png`, `public/icon-512x512.png` — overwritten twice in sequence (logo cycle, then favicon cycle final)
- `public/favicon.ico`, `public/favicon-16x16.png`, `public/favicon-32x32.png`, `public/favicon-48x48.png`, `public/mstile-150x150.png` — new, from `public/favicon/`
- `src/app/layout.tsx` — `metadata.icons` now lists the 16/32/48 favicon set + `shortcut: '/favicon.ico'`
- `src/components/DesktopNav.tsx` — navbar logo box (was a 🎓 emoji in a gradient div) replaced with `/icon-128.png`, kept the "ElimuX" text span
- `src/components/Footer.tsx` — added `/logo-white.png` above the link row (footer bg is dark — `bg-elimux-dark`)
- `src/app/admin/layout.tsx` — sidebar header icon (was an amber box with a Sparkles icon) replaced with `/icon-128.png`
- `src/app/auth/login/page.tsx`, `src/app/auth/register/page.tsx`, `src/app/advertiser/login/page.tsx` — centered `/logo-white.png` added above each form header (all three have `bg-elimux-dark`, so the white variant is the one that's actually visible — the spec's snippet used the color logo, which would be invisible on these dark cards)

## Not touched, and why
- `app/login/page.tsx` and `app/register/page.tsx` (root) — confirmed both are just redirect stubs to `/auth/login` and `/auth/register` respectively, no form of their own.
- `institution/login`, `partner/login`, `nita/login` — not named in either spec; left alone to keep this cycle's scope to what was actually asked (`/auth/login`, `/auth/register`, `/advertiser/login` were the three explicitly named or their real-file equivalent).
- Step 4 of the favicon cycle (search for hardcoded `<link rel="icon">` tags) — grepped the whole `src/` tree, found none. No-op, nothing to remove.
- No stray `vercel.svg` / `next.svg` / old `favicon.ico` existed in `public/` to delete.

## Verification
`npm run build` (heap capped at 2.5GB, per this machine's known ~3.9GB RAM
constraint) — exit 0, zero errors or warnings, both times (after cycle 1,
and again after cycle 2). Ran `next start` locally and curl-checked all 11
new/changed asset URLs (200 on every one) and confirmed the rendered
`<head>` on `/` carries the new favicon `<link>` tags and the navbar/footer
`<img>` tags point at the right files. Could not do a full visual/browser
check of the auth pages specifically — the Claude-in-Chrome browser
extension wasn't connected this session, and those three pages are
client-rendered behind a `Suspense` boundary (required because they use
`useSearchParams`), so their logo `<img>` never appears in the static HTML
either way — only after client-side hydration. The code change, the build,
and the source assets were all verified directly; the actual pixel-level
render on those three pages specifically was not.

## Open item
Nothing committed or pushed — following this project's existing pattern of
leaving cycles uncommitted until explicitly asked, and because the auth-page
visual check above is still outstanding. Say the word and this is a two-line
`git add` + `git commit`.
