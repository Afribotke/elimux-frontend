# elimux-frontend

Next.js (App Router) frontend for ElimuX, statically exported (`output: 'export'` in
`next.config.js`) and deployed to Vercel. Talks to [`elimux-backend`](https://github.com/Afribotke/elimux-backend)
for mutations/admin/AI, and reads some public data directly from Supabase.

**Static export gotcha**: pages under `src/app/` that fetch data in a server component (e.g.
`institutions/page.tsx`) run that fetch **at build time**, not per-request. Changing data in Supabase
(featuring an institution, adding a sponsor ad) does not appear on the live site until the next
`vercel --prod` deploy rebuilds the static HTML. Client components (`'use client'`, e.g.
`SponsorAdBanner`) fetch after hydration instead and don't have this limitation.

## Data access: two paths

- **`src/lib/supabase.ts`** — a Supabase client using the public anon key, used for direct
  read-only queries (home page search, institution/program listings). RLS restricts this to
  `is_active = true` rows only (see `elimux-sql/01b_rls.sql`).
- **`src/lib/api.ts`** — a thin `fetch` wrapper around `elimux-backend`'s `/api/*` routes. Used for
  everything else: admin CRUD (`X-Admin-Key` header via `useAdminKey()`), reviews, gamification,
  sponsor ads, institution/program applications. This is the only path for anything that needs the
  service-role-backed backend rather than anon-key RLS.

Prefer `lib/api.ts` for new features unless the data is a simple public read RLS already allows.

## Routes (`src/app/`)

| Route | Notes |
|---|---|
| `/` | Home: hero search, stats, category browse, `SponsorAdBanner` (homepage + search placements). |
| `/institutions`, `/institutions/[id]` | Listing (+ `FeaturedInstitutionCard` section, `SponsorAdBanner`) and detail. Statically generated per institution. |
| `/programs`, `/programs/[id]` | Same pattern for programs. |
| `/ai-search` | Natural-language search via `elimux-backend`'s `/api/ai-search`. |
| `/pricing`, `/account/subscription`, `/payments/callback` | Paystack subscription flow. |
| `/favorites` | Device-fingerprint-scoped favorites. |
| `/leaderboard` | Gamification leaderboard, badges, referrals. |
| `/institution-onboarding` | Public self-service application form for institutions. |
| `/about`, `/contact` | Static content. |
| `/admin/*` | Gated by `AdminKeyProvider`/`AdminGate` in `src/app/admin/layout.tsx` (sessionStorage-cached admin key, verified against `/api/admin/verify`). Sub-pages: `institutions`, `programs`, `pricing`, `reviews`, `ads` (`AdManager` — sponsor ad campaigns). |

## Key components

- `InstitutionCard` / `FeaturedInstitutionCard` — the latter is the gold-border "Sponsored" variant,
  swapped in wherever `institution.is_featured` is true.
- `SponsorAdBanner` — fetches one active ad for a `placement` prop and posts a click on click-through.
- `AdminKeyContext` — holds the admin key in React context + `sessionStorage`; every admin page reads
  it via `useAdminKey()` and passes it to `lib/api.ts` calls.
- `ServiceWorkerRegister` / `public/sw.js`, `public/manifest.json` — PWA support.

## Environment variables

| Variable | Used for |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL for `elimux-backend` (`lib/api.ts`) |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Direct anon-key Supabase reads (`lib/supabase.ts`) |

Set in Vercel project settings; `.env.local` here is dev-only and gitignored.

## Working on this repo

```
npm run dev     # next dev
npm run build   # next build -> static export in dist/ (distDir in next.config.js)
npm run start   # next start (not what production uses — prod serves the static export)
```

Deploy: `vercel --prod` from this directory (or push to `main`, which Vercel auto-deploys). Because
of the static-export build-time-fetch gotcha above, any change to featured institutions or sponsor
ads needs a redeploy to actually show up, even though the backend data changed instantly.

Schema/data changes live in [`elimux-sql`](https://github.com/Afribotke/elimux-sql); API changes live
in [`elimux-backend`](https://github.com/Afribotke/elimux-backend).
