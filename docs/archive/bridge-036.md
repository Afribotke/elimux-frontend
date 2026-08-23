# BRIDGE: ElimuX Silicon Valley Design Overhaul — Cycle 025
**Scope:** Complete visual redesign to SV engineering standards  
**Status:** EXECUTE — no questions, no options, no manual steps  
**Precondition:** Build must pass clean before any commit. Test every change locally.

---

## STATUS UPDATE FROM CLAUDE — 2026-08-22

All 10 steps in Section 7's execution order are done. `npx tsc --noEmit` and `npm run build` are both clean as of the last change (155 routes build). **Nothing has been committed** — working tree only, per Section 8.

**Section 0 audit** found one blocker: `layout.tsx` had `Analytics` imported twice (line 13 + 17), an artifact of the in-progress bursary/analytics work already sitting uncommitted in this tree. Removed the duplicate; did not otherwise touch that work (bursary provider dashboard/invite pages, `@vercel/analytics`, `api.ts`, `middleware.ts`, `types/bursary.ts` are all still exactly as you left them).

**Important deviation from the literal spec, agreed with the user mid-session:** Section 1's tailwind.config/globals.css rewrite as originally written would have replaced the live gold/black ElimuX brand tokens (CSS-var driven `primary`, `darkMode:'class'`, `background`/`foreground`/`card`/`accent`/`secondary`/`elimux.*`) with a static blue/light-only palette, and the proposed `.card`/`.btn`/`.badge` component classes would have collided with the existing shadcn `src/components/ui/` kit. The user corrected this mid-turn: **extend, don't replace.** What actually shipped:
- `tailwind.config.js` — same file, same tokens; only new `extend` fields appended (fontSize display-1/2/3/body-lg/body-sm, spacing 18/22/30, borderRadius 4xl, boxShadow soft/soft-lg/glow/card/card-hover, animation fade-in/slide-up/scale-in).
- `globals.css` — only `.gradient-mask-b` added to the existing `@layer utilities`, plus a `prefers-reduced-motion` block appended. No CSS variables, `@layer base`, or `@layer components` touched.
- No new `.card`/`.btn`/`.badge`/`.input` classes. All restyling uses the existing `<Card>`/`<Button>`/`<Badge>`/`<Input>`/`<Skeleton>` components via `className`.
- `images.unoptimized: true` untouched.

**Section 3 (shared components)** — created `src/components/ui/{LoadingState,EmptyState,ErrorFallback}.tsx` (new, built on the existing `<Skeleton>`). For `src/components/layout/`: `Navbar.tsx` and `Footer.tsx` are thin re-exports of the existing `DesktopNav`/`Footer` (kept all real links/auth-dropdown/sponsor logic in their one canonical location rather than forking it). `AppShell.tsx` deliberately does **not** render Navbar — `DesktopNav`/`MobileNav` are already mounted once, globally, in root `layout.tsx`; an AppShell-rendered Navbar would double the header. AppShell only standardizes background/min-height and opts pages into `Footer` (which — worth flagging — had zero imports anywhere in the codebase before this).

**Pages 4–9** — Homepage, `/programs`, `/scholarships`, `/institutions/[id]`, `/admin/dashboard` + `/admin/layout.tsx`, and `/auth/login` + `/auth/register` all got the same class of change: `text-balance` headlines, focus-visible rings on interactive elements that had none, shadow/hover-lift tokens, `EmptyState`/`LoadingState` swapped in where a page had a hand-rolled equivalent, and a few hardcoded `blue-*` classes on `/programs` fixed to the `primary-*` brand scale. **No structural rewrites** — the bridge's tabbed-layout/sidebar/split-screen mockups for institution-detail and auth pages were not applied; those pages kept their existing structure (accreditation panel, TVETA badge, claim-CTA, session-handling in login/register has a documented past outage — see comments in `auth/login/page.tsx` — so I did not touch submit logic, only className). `NewHomePage.tsx` (the flagged Skolex hero, currently gated off) was left untouched — separate workstream, hardcoded light-only colors of its own, not part of this pass.

**Known gap not fixed:** `src/app/admin/layout.tsx` and `src/app/admin/dashboard/page.tsx` are hardcoded to a light-only `gray-*`/`amber-*` palette — they don't use the `background`/`foreground`/`primary` tokens at all, so admin has never respected the dark/light toggle. Retrofitting that is a bigger, separate job (large surface area, active-state amber intentionally distinct from the public-site gold) — flagging for a future cycle rather than doing it silently inside this one.

Diff is `docs/audit-log.md`, this file, and the 15 source files listed under Section 7 above — all still unstaged. Ready for review; will not `git add`/commit/push until told to.

---

## 0. AUDIT FIRST — DO NOT SKIP

Before writing a single line of design code, Claude must:

1. Run `git status` and report: uncommitted files, branch name, last commit hash.
2. Run `npx tsc --noEmit` and confirm zero type errors. If errors exist, fix them FIRST before any design work.
3. Run `npm run build` and confirm it passes. If it fails, stop and report.
4. Inventory every page in `src/app/` — list all routes with their purpose.
5. Inventory every shared component in `src/components/` — list names and purposes.
6. Check `tailwind.config.ts` (or `.js`) — report current theme extensions, colors, fonts.
7. Check `globals.css` — report all CSS variables, custom classes, and `@layer` definitions.
8. Report current `next.config.js` — confirm `images.unoptimized: true` is present (DO NOT REMOVE per Kimi instruction).

**Claude: paste the full audit output as the first response. Do not proceed to Step 1 until audit is complete and user says "proceed".**

---

## 1. DESIGN SYSTEM — TOKENS & CONFIGURATION

### 1.1 Tailwind Config Overhaul

Edit `tailwind.config.ts` (or create it if `.js`). The config must extend the default theme with these exact tokens:

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand — deep academic blue
        primary: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        // Secondary — warm amber for CTAs and highlights
        secondary: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        // Semantic
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",
        info: "#3b82f6",
        // Neutrals — cool gray for text hierarchy
        gray: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        display: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      fontSize: {
        "display-1": ["3.5rem", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "800" }],
        "display-2": ["2.25rem", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-3": ["1.5rem", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "600" }],
        "body-lg": ["1.125rem", { lineHeight: "1.6" }],
        "body": ["1rem", { lineHeight: "1.6" }],
        "body-sm": ["0.875rem", { lineHeight: "1.5" }],
        "caption": ["0.75rem", { lineHeight: "1.4" }],
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "30": "7.5rem",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        "soft": "0 4px 20px -2px rgba(0, 0, 0, 0.08)",
        "soft-lg": "0 10px 40px -4px rgba(0, 0, 0, 0.1)",
        "glow": "0 0 20px rgba(59, 130, 246, 0.15)",
        "card": "0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 12px rgba(0, 0, 0, 0.05)",
        "card-hover": "0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 24px rgba(0, 0, 0, 0.08)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "shimmer": "shimmer 2s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
Rules:
If tailwind.config.js exists, rename to .ts and convert.
Do NOT delete existing plugins — append to them.
Do NOT break existing custom classes — only extend.
1.2 Global CSS Reset & Base Styles
Overwrite src/app/globals.css with this exact content, preserving any existing @tailwind directives:
css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* === BASE RESET === */
@layer base {
  html {
    @apply antialiased;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  body {
    @apply bg-gray-50 text-gray-900 font-sans;
    font-feature-settings: "cv02", "cv03", "cv04", "cv11";
  }

  h1, h2, h3, h4, h5, h6 {
    @apply font-display text-gray-900 tracking-tight;
  }

  /* Focus states — accessible and visible */
  *:focus-visible {
    @apply outline-none ring-2 ring-primary-500 ring-offset-2 ring-offset-white;
  }

  /* Selection color */
  ::selection {
    @apply bg-primary-100 text-primary-900;
  }

  /* Scrollbar styling */
  ::-webkit-scrollbar {
    @apply w-2 h-2;
  }
  ::-webkit-scrollbar-track {
    @apply bg-gray-100 rounded-full;
  }
  ::-webkit-scrollbar-thumb {
    @apply bg-gray-300 rounded-full;
  }
  ::-webkit-scrollbar-thumb:hover {
    @apply bg-gray-400;
  }
}

/* === COMPONENT LAYER === */
@layer components {
  /* Card pattern */
  .card {
    @apply bg-white rounded-2xl border border-gray-100 shadow-card transition-all duration-200;
  }
  .card:hover {
    @apply shadow-card-hover border-gray-200;
  }
  .card-interactive {
    @apply card cursor-pointer hover:-translate-y-0.5;
  }

  /* Button base */
  .btn {
    @apply inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed;
  }
  .btn-primary {
    @apply btn bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-soft hover:shadow-soft-lg focus-visible:ring-primary-500;
  }
  .btn-secondary {
    @apply btn bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 focus-visible:ring-gray-400;
  }
  .btn-ghost {
    @apply btn text-gray-600 hover:bg-gray-100 hover:text-gray-900;
  }
  .btn-danger {
    @apply btn bg-error text-white hover:bg-red-600 focus-visible:ring-error;
  }

  /* Input pattern */
  .input {
    @apply w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 transition-all duration-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 focus:outline-none;
  }
  .input-error {
    @apply border-error focus:border-error focus:ring-red-100;
  }

  /* Badge pattern */
  .badge {
    @apply inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold;
  }
  .badge-primary { @apply badge bg-primary-50 text-primary-700; }
  .badge-secondary { @apply badge bg-secondary-50 text-secondary-700; }
  .badge-success { @apply badge bg-emerald-50 text-emerald-700; }
  .badge-warning { @apply badge bg-amber-50 text-amber-700; }
  .badge-error { @apply badge bg-red-50 text-red-700; }
  .badge-gray { @apply badge bg-gray-100 text-gray-600; }

  /* Skeleton loading */
  .skeleton {
    @apply bg-gray-200 rounded-lg animate-pulse;
  }
  .skeleton-shimmer {
    @apply bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-shimmer;
  }

  /* Section spacing */
  .section {
    @apply py-16 md:py-24 px-4 sm:px-6 lg:px-8;
  }
  .section-inner {
    @apply max-w-7xl mx-auto;
  }

  /* Page header */
  .page-header {
    @apply mb-8 md:mb-12;
  }
  .page-header h1 {
    @apply text-display-2 mb-3;
  }
  .page-header p {
    @apply text-body-lg text-gray-500 max-w-2xl;
  }
}

/* === UTILITY LAYER === */
@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
  .gradient-mask-b {
    mask-image: linear-gradient(to bottom, black 60%, transparent 100%);
  }
}
Rules:
Preserve any existing @import for fonts (Inter, etc.).
If Inter is not loaded, add @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'); at the top.
Do NOT remove existing utility classes that other files depend on.
1.3 Layout Wrapper Component
Create src/components/layout/AppShell.tsx:
tsx
"use client";

import React from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

interface AppShellProps {
  children: React.ReactNode;
  variant?: "default" | "minimal" | "dashboard";
}

export function AppShell({ children, variant = "default" }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar variant={variant} />
      <main className="flex-1">{children}</main>
      {variant !== "minimal" && <Footer />}
    </div>
  );
}
2. SHARED COMPONENTS — REPLACE ALL EXISTING
Claude must audit existing shared components and replace them with these standards. Do NOT create duplicates — update existing files.
2.1 Navbar (src/components/layout/Navbar.tsx)
Requirements:
Sticky top, bg-white/80 backdrop-blur-md border-b border-gray-100
Logo left, nav links center (desktop), auth buttons right
Mobile: hamburger menu with slide-down animation
Active link: text-primary-600 with subtle underline
Height: h-16
Z-index: z-50
2.2 Footer (src/components/layout/Footer.tsx)
Requirements:
bg-gray-900 text-gray-300
4-column grid on desktop: Brand, Product, Company, Legal
Social icons row
Bottom bar: copyright + status badge
Padding: py-16
2.3 Loading States
Create src/components/ui/LoadingState.tsx:
tsx
export function LoadingState({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-6 space-y-3">
          <div className="skeleton-shimmer h-4 w-1/3 rounded" />
          <div className="skeleton-shimmer h-3 w-3/4 rounded" />
          <div className="skeleton-shimmer h-3 w-1/2 rounded" />
        </div>
      ))}
    </div>
  );
}
2.4 Empty State
Create src/components/ui/EmptyState.tsx:
tsx
import { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
        {icon}
      </div>
      <h3 className="text-display-3 mb-2">{title}</h3>
      <p className="text-gray-500 max-w-md mb-6">{description}</p>
      {action}
    </div>
  );
}
2.5 Error Boundary
Create src/components/ui/ErrorFallback.tsx:
tsx
"use client";

import { useEffect } from "react";

export function ErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("UI Error:", error);
  }, [error]);

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-error mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-display-3 mb-2">Something went wrong</h2>
        <p className="text-gray-500 mb-6">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <button onClick={reset} className="btn-primary">
          Try again
        </button>
      </div>
    </div>
  );
}
3. PAGE-BY-PAGE REDESIGN INSTRUCTIONS
Claude must redesign these pages in this exact order. After EACH page, run npx tsc --noEmit and npm run build. Fix any errors before proceeding.
3.1 Homepage (src/app/page.tsx or src/app/(home)/page.tsx)
Layout:
Hero section: section bg-gradient-to-b from-primary-50 to-white
Headline: text-display-1 text-balance max-w-4xl
Subheadline: text-body-lg text-gray-500 max-w-2xl mt-4
CTA row: Primary + Secondary buttons, mt-8 flex flex-wrap gap-4
Hero image/illustration: right side on desktop, rounded-3xl shadow-soft-lg
Stats bar: bg-white border-y border-gray-100 py-8
4 stats in a row: "10,000+ Institutions", "50,000+ Programs", etc.
Number: text-3xl font-bold text-primary-600
Label: text-sm text-gray-500
Feature grid: section
3 cards in a row, card-interactive p-8
Each: icon (48px, bg-primary-50 text-primary-600 rounded-xl p-3), title, description
How it works: section bg-gray-900 text-white
3-step vertical timeline with connecting line
CTA section: section bg-primary-600 text-white text-center
text-display-2 text-white, button bg-white text-primary-700 hover:bg-gray-100
Rules:
All text must use text-balance for headlines.
Every interactive element must have hover and focus-visible states.
Use the AppShell wrapper.
3.2 Course/Program Discovery Page (src/app/programmes/page.tsx or similar)
Layout:
Page header with page-header class
Search bar: input with search icon, max-w-2xl mx-auto mb-8
Filter bar: horizontal scroll on mobile, flex-wrap on desktop
Filter chips: badge style, active state badge-primary
Results grid: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
Program card:
tsx
<div className="card-interactive overflow-hidden">
  <div className="h-48 bg-gray-200 relative">
    {/* Image or gradient placeholder */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
    <div className="absolute bottom-3 left-3 right-3">
      <span className="badge-primary">{category}</span>
    </div>
  </div>
  <div className="p-5">
    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{title}</h3>
    <p className="text-sm text-gray-500 mb-3">{institution}</p>
    <div className="flex items-center justify-between text-sm">
      <span className="text-primary-600 font-semibold">{tuition}</span>
      <span className="text-gray-400">{duration}</span>
    </div>
  </div>
</div>
Pagination: flex justify-center gap-2, active page btn-primary (small), others btn-ghost
3.3 Scholarship Page (src/app/scholarships/page.tsx)
Layout:
Page header: "Discover Scholarships" with page-header
Tabs: "All | Undergraduate | Masters | PhD | Short Course"
Active tab: border-b-2 border-primary-600 text-primary-600 font-semibold
Inactive: text-gray-500 hover:text-gray-700
Scholarship cards: similar to program cards but with:
Deadline badge: badge-error if < 7 days, badge-warning if < 30 days, badge-success otherwise
"Apply Now" button
Sponsor logo placeholder
3.4 Institution Detail Page
Layout:
Hero: institution banner image (or gradient), institution name, location badge, accreditation badge
Stats row: Programs count, Students count, Established year, Rating
Tabbed content: Overview | Programs | Scholarships | Reviews
Sidebar: Contact info, Apply button, Map placeholder
3.5 Admin Dashboard (src/app/admin/dashboard/page.tsx)
Layout:
Sidebar navigation: fixed left, w-64 bg-white border-r border-gray-200
Nav items with icon + label, active: bg-primary-50 text-primary-700 border-r-2 border-primary-600
Top bar: h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6
Search, notifications bell, user avatar dropdown
Main content area: p-8
Stats cards row: 4 cards, card p-6
Icon, label, value, trend indicator (up/down arrow + percentage)
Charts area: placeholder divs with card and skeleton for now
Recent activity table: clean table with border-collapse, hover rows
3.6 Auth Pages (src/app/login/page.tsx, src/app/register/page.tsx)
Layout:
Split screen: Left bg-primary-600 with brand messaging, Right white form
Left side: Logo, headline, 3 bullet points with checkmarks, testimonial quote
Right side:
Card: max-w-md mx-auto p-8
Social auth buttons: Google, Apple (if configured)
Divider: "or continue with email" — flex items-center gap-4 text-sm text-gray-400
Form fields: input components
Submit: btn-primary w-full
Footer links: "Forgot password?", "Don't have an account? Sign up"
4. RESPONSIVE BREAKPOINTS
All pages must be fully responsive:
Table
Breakpoint	Behavior
< 640px (sm)	Single column, stacked layout, hamburger nav, full-width cards
640–1024px (md)	2-column grids, sidebar collapses to top nav, medium padding
> 1024px (lg)	Full layout, 3-column grids, sidebar visible, max-width containers
Use Tailwind classes: sm:, md:, lg:, xl: prefixes. No raw media queries in component files.
5. ACCESSIBILITY REQUIREMENTS
Every component must pass these checks:
Color contrast: All text meets WCAG AA (4.5:1 for normal, 3:1 for large).
Focus states: All interactive elements have visible :focus-visible rings.
Semantic HTML: Use <header>, <main>, <nav>, <footer>, <article>, <section>.
ARIA labels: Icons inside buttons must have aria-label. Navigation landmarks must be labeled.
Reduced motion: Respect prefers-reduced-motion — disable animations if set.
Form labels: Every input must have an associated <label>.
Add to globals.css:
css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
6. PERFORMANCE RULES
No layout shift: All images and cards must have fixed aspect ratios or min-heights.
Lazy loading: Use loading="lazy" on all below-fold images.
Font loading: Use font-display: swap for custom fonts.
CSS containment: Heavy list sections should use contain: layout paint.
No inline styles: All styling via Tailwind classes or CSS variables.
Images: Keep images.unoptimized: true in next.config.js. Use <img> (not Next.js <Image>) with explicit width and height attributes.
7. EXECUTION ORDER
Claude must follow this exact sequence. After each step, report: files changed, type-check result, build result.
Step 1: Run audit (Section 0). Report findings. Wait for "proceed".
Step 2: Apply design tokens — tailwind config + globals.css.
Step 3: Create shared components — AppShell, Navbar, Footer, LoadingState, EmptyState, ErrorFallback.
Step 4: Redesign Homepage.
Step 5: Redesign Program/Discovery page.
Step 6: Redesign Scholarship page.
Step 7: Redesign Institution Detail page.
Step 8: Redesign Admin Dashboard.
Step 9: Redesign Auth pages.
Step 10: Final build, type-check, and report.
CRITICAL: If at any point npm run build fails, STOP. Do not proceed to the next step. Fix the error and rebuild. Report the error and the fix.
8. COMMIT RULES
Do NOT commit until the user explicitly says "commit and push it".
Stage changes with git add -A when asked.
Commit message format: design: [what changed] — Cycle 025
Push to origin main only after user confirmation.
9. WHAT NOT TO DO
Do NOT change any API routes, database schema, or backend logic.
Do NOT remove existing functionality — only redesign the UI layer.
Do NOT add new dependencies without asking.
Do NOT modify next.config.js except for tailwind content paths if needed.
Do NOT break existing navigation routes.
Do NOT create new pages — only redesign existing ones.
Do NOT guess file paths — audit first, then modify what exists.