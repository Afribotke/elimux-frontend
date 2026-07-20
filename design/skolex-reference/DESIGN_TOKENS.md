# Skolex Design Tokens (harvest reference — read-only)

**Status:** Reference material only, per [§11 Skolex Harvest Program](../../../elimux-sql/ELIMUX_STATE.md#11-skolex-harvest-program-active--governing-law).
Skolex is a FROZEN prototype and parts source — NOT a rebrand target. Nothing here
ships as-is. Any component ported from this reference is re-implemented as a new
ElimuX-branded component inside `elimux-frontend`, behind a `NEXT_PUBLIC_FEATURE_*`
flag, on a `feat/skolex-*` branch, verified on Vercel Preview against the real
production API before any merge.

Source: `C:\Users\ELON\Projects-2026\SKOLEX WORKINGS\skolex-netlify-examining.zip`
(v3.0 Netlify bundle — newest of the three archives found; `skolex-deploy-v2.zip`
and `SKOLEX_PWA_ASSETS.zip` are earlier/redundant snapshots of the same system).
Four representative pages copied verbatim into `html/` alongside this file:
`skolex-ask.html` (public search — richest component set), `skolex-admin.html`
(buttons/cards/modals/KPI tiles/status badges), `skolex-developers.html` (dark
code-viewer theme), `skolex-examining.html` (compact cross-check + violet/ink
theme variant).

---

## Colors

| Token | Hex | Role |
|---|---|---|
| `--navy` | `#0D1F3C` | Primary brand / dark surfaces / PWA `theme_color` |
| `--gold` | `#C8973A` | Accent / CTA / highlight |
| `--gold2` | `#E0A840` | Secondary gold (admin/payments/portal) |
| `--blue` | `#1B4FA0` | Secondary accent / info |
| `--tvet` | `#1A6B40` | Category color, TVET institutions |
| `--green` | `#16A34A` | Success state |
| `--red` | `#E53935` | Error / danger state |
| `--amber` | `#F59E0B` | Warning state |
| `--parch` | `#F8F5EE` | Page background (light parchment); internal pages vary `--bg` between `#F0EDE6`/`#F6F4F0` |
| `--white` | `#FFFFFF` | Card / panel background |
| `--g1` | `#F0EDE6` (page-dependent: `#F5F3EE` / `#F2EFE8`) | Subtle fill / hover background |
| `--g2` | `#E2DDD5` (page-dependent: `#E8E4DC` / `#E4E0D6`) | Light border |
| `--g3` | `#B0A898` (page-dependent: `#C8C3B8` / `#B8B2A6`) | Darker border / divider |
| `--text` | `#1A2035` | Primary text |
| `--t2` | `#5A6070` | Secondary text |
| `--t3` | `#9AA0B0` | Tertiary / muted text |
| `--mpesa` | `#00A651` | M-Pesa brand green (payments page only) |
| `--stripe` | `#635BFF` | Stripe brand purple (payments page only) |
| `--ink` | `#1A0A2E` | Dark surface (examining page theme) |
| `--ink2` | `#2D1B5A` | Dark surface gradient (examining page theme) |
| `--violet` / `--violet2` | `#5B21B6` / `#7C3AED` | Accent, examining/professional-bodies theme |
| — | `#25D366` (hover `#1EBE5C`) | WhatsApp green (`.btn-wa`) |

**Dark code-viewer theme** (developer portal only):
`--bg:#0A0E1A` `--panel:#111827` `--panel2:#1A2236` `--border:#1F2D45` `--border2:#2A3A55` `--text:#E2E8F0` `--t2:#94A3B8` `--t3:#4A5568`

**Syntax-highlight tokens** (developer portal):
`--k:#67E8F9` keyword · `--s:#A3E635` string · `--n:#FB923C` number · `--fn:#C084FC` function · `--cm:#4A5568` comment

**Status/badge colors:**
- `.badge-tveta`: bg `#EBF7F0`, text `#1A6B40`
- `.badge-kcse`: bg `#FBF5E8`, text `#8A6320`
- `.badge-red`: `rgba(229,57,53,.25)` / `#FF7070`
- `.badge-amber`: `rgba(245,158,11,.2)` / `#F59E0B`
- `.badge-green`: `rgba(22,163,74,.2)` / `#4ADE80`
- Live/status dot: `#22C55E` online, `#EF4444` offline

**Category swatch pairs** (dark bg / accent, used for sponsor-card tinting — sampled from `skolex-ask.html`):
`#0F3460/#1B4FA0`, `#1A3A2A/#2D6A4F`, `#1A1A2E/#16213E`, `#2D1B69/#4A2F8A`, `#1A2E40/#2B5876`, `#003A14/#006920`, `#1A3A1A/#1A6B40`, `#0D1F3C/#1B3A6A`, `#1A2F0A/#2D5A14`, `#1A0A0A/#6A1414`, `#003A2A/#00695C`

---

## Fonts

Loaded via Google Fonts (`fonts.googleapis.com`):

| Token | Family | Used for |
|---|---|---|
| `--serif` (public pages) | `'Libre Baskerville', serif` | Headlines / logo — index, portal, offline, install, 404 |
| `--serif` (internal dashboards) | `"Syne", sans-serif` | Headlines — admin, developers, payments |
| `--sans` | `'DM Sans', sans-serif` | Body text, weights 300/400/500/600 |
| `--mono` | `'DM Mono', monospace` | Labels, tags, code — weights 400/500 |

Full link example:
```
https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap
```

---

## Spacing

No formal `--space-*` scale — observed as consistent ad-hoc pixel values:

| Tier | Values |
|---|---|
| Tight (badges/pills) | `3px 8px`, `4px 9px`, `4px 12px` |
| Small (sm buttons) | `5px 10px`, `6px 12px`, `7px 14px` |
| Base (default buttons/tabs) | `8px 16px`, `9px 16px`, `9px 18px` |
| Card padding | `16px`, `16px 18px`, `18px`, `18px 22px`, `20px 22px`/`20px 24px` |
| Section/card gaps | `8px`, `14px`, `16px`, `22px`, `24px` |
| Sidebar width (`--sidebar-w`) | `240px` admin · `248px` portal · `252px` examining · `260px` developers |

---

## Border radius

| Token | Value (page-dependent) | Used for |
|---|---|---|
| `--r` | `8px` (dev dark theme) / `10px` (payments, portal, admin, examining) / `12px` (public index) | Buttons, inputs |
| `--r-lg` | `14px` (dev) / `16px` (payments/portal/admin/examining) / `18px` (public index) | Cards, modals |
| `--r-xl` | `24px` (examining page only) | Extra tier, special surfaces |
| `--r-full` | `9999px` | Pills, badges, avatar circles, fully-rounded buttons |
| — | `3px` | Small tag badges (e.g. `.badge-tveta`) |
| — | `50%` | Circular buttons / dots / avatars |

---

## Shadows

| Token | Value (page-dependent) |
|---|---|
| `--shadow` | `0 2px 16px rgba(13,31,60,.08)` public · `0 1px 8px rgba(13,31,60,.07)` admin · `0 4px 20px rgba(0,0,0,.4)` dev dark |
| `--shadow-lg` | `0 8px 40px rgba(13,31,60,.14)` public · `0 4px 24px rgba(13,31,60,.12)` admin · `0 8px 40px rgba(13,31,60,.13)` examining |
| Modal-specific | `.modal-box { box-shadow: 0 24px 80px rgba(13,31,60,.25); }` |

---

## Component inventory

1. **Sticky top nav** (`.platform-nav`) — `background:rgba(13,31,60,.96)`, `backdrop-filter:blur(20px)`, `border-bottom:1px solid rgba(200,151,58,.15)`, height `52px`.
2. **Mobile bottom nav** (`.bottom-nav`, `.bn-item`) — fixed, same glass/blur navy treatment, desktop-hidden.
3. **Hamburger + slide-out menu** (`.hamburger`, `.mobile-menu`, `.mm-link`, `.mm-divider`).
4. **Hero search card** (`.search-card`) — `border-radius:var(--r-lg)`, `box-shadow:var(--shadow-lg)`; circular send button (`.search-btn`, 44×44px, navy, `border-radius:var(--r)`).
5. **Search filter pills** (`.search-pill`) — `--r-full`, `--g1` bg, `--g2` border.
6. **Result / institution card** (`.result-*`) — numbered gold circular badge (`.result-num`, 26×26px, 50% radius), serif title, meta-tag row.
7. **Meta tags / badges** (`.meta-tag`, `.tag-country/.tag-fee/.tag-dur/.tag-mode`, `.badge-tveta`, `.badge-kcse`) — small mono-font pill/rect, category-tinted.
8. **Buttons** (`.btn` + `.btn-navy/.btn-gold/.btn-green/.btn-red/.btn-outline/.btn-violet`, sizes `.btn-sm/.btn-xs`) — base `padding:7-8px 14-16px`, `border-radius:var(--r)`.
9. **Social/share buttons** (`.btn-wa` WhatsApp green, `.btn-email` outlined navy) — `--r-full`.
10. **Ad/sponsor system** — tabs (`.ads-tab`), featured hero slide (`.ad-featured`), ticker (`.ticker-track`), grid cards (`.ad-card`), CTA (`.ad-btn`, gold bg).
11. **Cards / dashboard panels** (`.card`, `.card-header`, `.card-title`, `.card-body`) — white bg, `1px solid var(--g2)`, `border-radius:var(--r-lg)`.
12. **KPI / stat tiles** (`.kpi-grid`, `.kpi-label`, `.kpi-value`, `.kpi-delta`, `.kpi-icon`) — 4-col grid, large serif numeral.
13. **Modal** (`.modal-overlay`, `.modal-box`, `.modal-head` navy header, `.modal-title`, `.modal-close` circular, `.modal-body`, `.modal-footer`) — `backdrop-filter:blur(6px)`.
14. **Status/delta badges** (`.badge-red/.badge-amber/.badge-green`, `.status`) — translucent rgba backgrounds.
15. **Country selector** (`.country-selector`, `.country-btn`, `.country-flag`) — pill button, flag emoji + name.
16. **Scroll-to-top FAB** (`.scroll-top`) — 40×40px circular navy button, fixed bottom-right.
17. **Sidebar layout** (internal pages) — `--sidebar-w` drives fixed-width dark/light nav, collapses on mobile.

---

## Non-goals

- No visual changes to ElimuX ship from this file alone. It documents Skolex's
  system for later, deliberate, flagged component work — see §11 phases P1-P3.
- Do not import Skolex CSS/JS directly. Re-implement using ElimuX's existing
  styling conventions (audit those before P1 starts).
