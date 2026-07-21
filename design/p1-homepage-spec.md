# P1 Homepage Hero Port — Implementation Spec

**Branch:** `feat/skolex-home` (cut from `main` AFTER PR #2 merges, so `design/skolex-reference/` is available)
**Flag:** `NEXT_PUBLIC_FEATURE_SKOLEX_HOME` — create in Vercel scoped to **Preview only**, value `true`. Production gets NOTHING until cutover.
**Law:** ELIMUX_STATE.md §11 — new components only, existing live components unmodified, read-only public API, founder preview before merge.

---

## 1. Scope

P1 replaces **only the homepage hero zone** (`/` down through the search card + stats line). Everything below the hero (existing homepage sections) stays, unmodified, in the current theme — transitional visual clash is accepted and documented; P3 restyles those sections.

**In scope:** hero wrapper, headline block, mode pill, AI ask box, example chips, localization bar, real-stats line, fonts, scoped Skolex theme.
**Out of scope:** global re-theme, ad/sponsor sections (P3), localization backend config (P2), pricing/monetization (P4), any backend change, any stats endpoint.

## 2. Flag mechanics (exact pattern as SearchModeToggle)

In `src/app/page.tsx`: top-level branch —

```tsx
const SKOLEX_HOME = process.env.NEXT_PUBLIC_FEATURE_SKOLEX_HOME === 'true'
// ...
if (SKOLEX_HOME) return <SkolexHome />
return <CurrentHome />   // existing homepage, untouched, byte-for-byte
```

Production builds have the var unset → `CurrentHome` always. Static export builds both branches into the bundle; the flag selects at build time. **Gate check:** a production build with the var unset must produce homepage HTML identical to today's.

## 3. Theme — scoped, NOT global

Do not touch global tokens/globals.css. Create `src/components/skolex/skolex-theme.css` (or a module) defining CSS variables under a `.skolex-theme` wrapper class, values taken from `design/skolex-reference/DESIGN_TOKENS.md`:

- navy `#0D1F3C`, gold `#C8973A`, parchment `#F8F5EE` (page background for the hero zone)
- radius scale 8–24px + 9999px pills; shadow tokens per the reference
- `SkolexHome` renders `<div className="skolex-theme">` around the whole hero zone

Fonts via `next/font/google` (self-hosted at build time, static-export safe): **Libre Baskerville** (hero headline serif) + **DM Sans** (body/UI). Skip Syne/DM Mono in P1.

## 4. Components (ALL new files under `src/components/skolex/`)

1. **`SkolexHome.tsx`** — wrapper: theme scope + parchment background + centered max-width container (~720px per reference) + vertical rhythm.
2. **`HeroSearch.tsx`** — the core unit:
   - Headline (Libre Baskerville): **"Ask anything. Get your top 10 options."** — VERIFY FIRST: if the AI search results page does NOT present a ranked top-10-style shortlist, use **"Ask anything. Find your perfect course."** instead. Truth in copy, no fabricated promise.
   - Subcopy (DM Sans): "Tell us in plain language what you want to study, where, and your budget. We find your best matches — ready to share."
   - Textarea + submit button (navy pill, gold focus ring, send icon per reference).
   - Example chips (parchment pills, gold border on hover): "Medicine in Kenya under KES 500k" · "MBA with scholarship in Germany" · "Online nursing from Africa" · "Short tech course, 3 months online". Clicking a chip fills the textarea AND focuses it (does not auto-submit).
   - **Submit behavior:** navigate to `/ai-search?q=<encoded query>&mode=<academic|skills>` (omit `mode` when null). NO direct API call from the homepage — the existing, verified AI search page does the work.
3. **`HeroModePill.tsx`** — two-option pill (🎓 University & College / 🔧 Skills & Trades), controlled state in `HeroSearch`, default null (no mode). Match the verified `SearchModeToggle` behavior contract (same `institutionMode` values) — restyle to the Skolex pill; do not import or modify the existing component.
4. **`LocalizationBar.tsx`** — line above the search card: `🇰🇪 Showing results for **Kenya** · Qualification: **KCSE** · Currency: **KES**` + "Change country" link opening a modal with a hardcoded priority list (Kenya, Uganda, Tanzania, Nigeria, Ghana, South Africa, Rwanda, United Kingdom, United States, Germany). Selection persists to `localStorage` (`elimux_country`) and re-renders the bar's country/qualification/currency from a small inline map (Kenya: KCSE/KES, others: reasonable defaults — full schema comes in P2). No backend.
5. **`TrustStats.tsx`** — one centered line under the card, muted gold: **"8,900+ institutions · 12,400+ programs · 194 countries"** — as a `const` at the top of the file (single source for easy updates).

## 5. SEO + hygiene

- Keep the existing homepage `<title>`/meta description (ElimuX-branded) — inspect current `page.tsx` metadata and carry it over unchanged.
- H1 = the headline. All interactive elements reachable by keyboard; pill buttons use `aria-pressed` (same contract as SearchModeToggle).
- No new images needed — the hero is typography-led.

## 6. Acceptance criteria (Gate P1-G2, run on the Vercel PREVIEW URL)

1. Flag OFF production build → homepage HTML byte-identical to current production (diff the prerendered file)
2. Preview (flag ON): hero renders per spec — headline, pill, ask box, chips, localization bar, stats line
3. Submit "medicine" with no mode → lands on `/ai-search?q=medicine`, results = baseline behavior
4. Select 🔧 Skills & Trades, submit "plumbing" → lands on `/ai-search?q=plumbing&mode=skills`, results are TVET-type only
5. Example chip click fills textarea, does not submit
6. Change country → Uganda → bar updates, survives page reload (localStorage)
7. iPhone-12 viewport: no horizontal scroll, pill wraps cleanly, modal usable
8. Zero console errors; no hydration warnings; existing below-hero sections render unchanged
9. **Post the preview URL + screenshots (desktop + mobile) and HOLD for founder approval before merge** — standing rule

## 7. Cutover (AFTER founder approves preview — separate instruction, not now)

Merge with flag OFF → verify production unchanged → flip `NEXT_PUBLIC_FEATURE_SKOLEX_HOME=true` in Production scope → rebuild → verify live → rollback = flag off.
