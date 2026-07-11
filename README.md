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
| `/admin/*` | Gated by `AdminKeyProvider`/`AdminGate` in `src/app/admin/layout.tsx` (sessionStorage-cached admin key, verified against `/api/admin/verify`). Sub-pages: `institutions`, `programs`, `pricing`, `reviews`, `ads` (`AdManager` — sponsor ad campaigns), `revenue`, `users`, `searches`, `institutions-performance` (analytics dashboard — see below). |

## Key components

- `InstitutionCard` / `FeaturedInstitutionCard` — the latter is the gold-border "Sponsored" variant,
  swapped in wherever `institution.is_featured` is true.
- `SponsorAdBanner` — fetches one active ad for a `placement` prop and posts a click on click-through.
- `AdminKeyContext` — holds the admin key in React context + `sessionStorage`; every admin page reads
  it via `useAdminKey()` and passes it to `lib/api.ts` calls.
- `ServiceWorkerRegister` / `public/sw.js`, `public/manifest.json` — PWA support.
- `components/admin/charts/` (`LineChart`, `PieChart`, `RankedBarList`) — hand-rolled SVG, not a
  library. See "Analytics Events Tracking" below for the data that feeds them.

## Analytics Events Tracking

The admin dashboard (`/admin`, `/admin/revenue`, `/admin/users`, `/admin/searches`,
`/admin/institutions-performance`) reads from `elimux-backend`'s `analytics_events` table via
`GET /api/admin/analytics/*`. That table is only ever populated by events this app tracks — to
record one, use `trackEvent` from `src/lib/analytics.ts`:

```typescript
import { trackEvent } from '@/lib/analytics'

// Track a search
trackEvent('search', { query: 'medicine', filters: { country: 'Kenya' } })

// Track a page view
trackEvent('page_view', { path: '/institutions/123', institution_id: '123' })

// Track a payment
trackEvent('payment', { plan: 'premium', amount: 500, currency: 'KES' })
```

- **Fire-and-forget.** `trackEvent` returns `void`, not a promise to await — a tracking failure must
  never block or break the page it's called from.
- **No device ID to pass.** It posts to `elimux-backend`'s `POST /api/admin/analytics/track` without
  `user_device_id`; the backend derives it server-side from the request (same IP+UA fingerprint
  `favorites`/`gamification` already use), so callers never compute one.
- **`event_type` is one of** `search | page_view | click | application | review | share | payment` —
  anything else is rejected with `400` by the backend. `metadata` is a free-form JSON object; there's
  no fixed schema, but `GET /api/admin/analytics/searches` specifically reads `metadata.query` and
  `metadata.result_count` for a `search` event, and `GET /api/admin/analytics/institutions` reads
  `metadata.institution_id` for a `page_view` event — match those keys if you want those two
  breakdowns to pick the event up.

**Call sites today**:

| Event | Fires from | Notes |
|---|---|---|
| `search` | `elimux-backend`'s `POST /api/ai-search` (server-side) | Every AI search call. |
| `search` | `app/page.tsx`'s `handleSearch` | The homepage's direct-Supabase search *and* the "Browse by Category" buttons (same function, `query: ''`) — `result_count` included so zero-result searches show up here too. |
| `page_view` | `components/TrackPageView.tsx`, rendered from `institutions/[id]/page.tsx` | That page is an async server component (statically exported), so `trackEvent` can't be called directly in its body — it'd fire once per *build*, not per visitor. `TrackPageView` defers to a client-side `useEffect` instead; reuse this pattern for any other static page that needs page-view tracking. |
| `review` | `components/ReviewForm.tsx`, after `createReview` succeeds | `{ institution_id, program_id, rating }`. |
| `share` | `components/ShareModal.tsx`, all three share actions | `platform` is `copy_link` \| `whatsapp` \| `email`. Separate from `trackAdClick` in `lib/api.ts`, which is an older, unrelated mechanism specifically for sponsor-ad clicks — don't conflate the two. |
| `application` | `institution-onboarding/page.tsx`'s `handleFinalSubmit`, after programs submit | Metadata key is `institution_application_id`, not `institution_id` — at submit time this is a pending application with no real `institutions.id` yet; it only gets one if an admin approves it (`institution_applications.created_institution_id`). |
| `payment` | `payments/callback/page.tsx`, only when `verifyPayment` returns `status: 'success'` | `plan` reads the subscription's plan slug/name off the verify response. |

Not yet wired: `click` has no call site anywhere. `page_view` only covers the institution detail page —
programs, the homepage, and other static pages don't track views.

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
