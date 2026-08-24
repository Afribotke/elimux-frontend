CYCLE 029 — ELIMUX SEO OPTIMIZATION — COMPLETION REPORT

Status: COMPLETE - all 9 steps executed; build/curl/bundle-verified; live
browser checklist not done (Chrome unavailable, as every cycle this
session)
Archive Ref: docs/archive/bridge-072.md (snapshot of the earlier receipt,
taken before this report replaced it)

=== IMPORTANT: TWO FILES ALREADY EXISTED ===

Checked before creating anything, rather than assuming a blank slate:
src/app/robots.ts and src/app/sitemap.ts already existed. The existing
sitemap.ts was MORE advanced than the instruction's own draft - it
already fetches real program/institution detail routes from Supabase,
exactly what the instruction's own Step 2 comment said to defer to
"Cycle 030." Applying the instruction's static-only draft literally
would have been a regression (deleting live dynamic routes). Merged
instead of overwriting in both files - detail below.

=== STEP 1: robots.txt (src/app/robots.ts) ===

Existing disallow list: /admin/, /api/, /student/, /employer/, /dashboard/
Instruction's list: /admin/, /auth/, /api/, /employer/, /advertiser/
Merged (union, not replace): /admin/, /api/, /auth/, /advertiser/,
/employer/, /student/, /dashboard/ - keeps the existing /student/ and
/dashboard/ protections the instruction didn't know about, adds the two
new ones it asked for. Sitemap line already correct.
Verified live: curl localhost:3000/robots.txt - all 7 disallow lines
present, sitemap URL correct.

=== STEP 2: sitemap.xml (src/app/sitemap.ts) ===

Added the 5 missing top-level listing pages (programs, scholarships,
internships, attachments, bursary - none were in the sitemap as static
entries before, only program/institution DETAIL pages were dynamically
included) at priority 0.9 as specified. Left the existing dynamic
Supabase-driven program/institution routes untouched - removing them to
match the instruction's static-only draft would have deleted working
functionality.
Verified live: curl localhost:3000/sitemap.xml - valid XML, 2,013 <url>
entries (13 static + ~2,000 real dynamic program/institution routes).

=== STEP 3 + 6.1: METADATA + CANONICAL URLS (all 9 pages) ===

Checked every target page first: all 9 are either 'use client' (7 of
them) or had zero existing metadata export. Next.js requires metadata
exports to live in a Server Component - a 'use client' page.tsx cannot
export metadata directly (this would fail the build if attempted
literally). Handled per-page:

  - Homepage: page.tsx is 'use client' with no route-specific layout
    possible for "/" - its metadata is genuinely the root layout's own
    metadata in this framework. Updated src/app/layout.tsx's title/
    description/openGraph/twitter to the instruction's given copy, AND
    fixed a real, pre-existing bug found while touching this file: the
    title/description had mis-encoded em-dashes rendering literally as
    "â€”" in production (confirmed live via curl before this cycle) -
    now a real "—" character. Added alternates.canonical.
  - programs/, scholarships/, internships/, attachments/, bursary/,
    contact/: all 'use client' - created a sibling layout.tsx in each
    (new files) exporting metadata + canonical, rendering {children}.
    Standard Next.js pattern for this exact situation.
  - institutions/, about/: real Server Components already (no 'use
    client') - added `export const metadata` directly into the existing
    page.tsx, no new file needed.

All 9 titles/descriptions match the instruction's given copy exactly
(programs/scholarships/internships/attachments/bursary/institutions/
about/contact titles omit the instruction's own "| ElimuX" suffix in the
literal strings, since the root layout's existing title.template
("%s | ElimuX") already appends it - using both would have produced
"X | ElimuX | ElimuX").
Verified live via curl on every one of the 9 routes: unique <title>,
unique <meta name="description">, unique <link rel="canonical"> with the
correct trailing-slash URL, on all 9.

=== STEP 4: JSON-LD STRUCTURED DATA ===

Built the suggested `JsonLd` helper (src/components/seo/JsonLd.tsx) and
used it everywhere rather than repeating dangerouslySetInnerHTML calls.

  - Organization + WebSite: added to root layout.tsx (global, every
    page). Omitted the `sameAs` social links (twitter/linkedin/facebook)
    from the instruction's draft - grepped the entire codebase and found
    zero existing references to any of those three URLs anywhere,
    meaning they're unverified placeholders, not confirmed real ElimuX
    accounts. Publishing fabricated social-profile URLs into indexed
    structured data is a real misinformation risk, not a cosmetic
    omission - flagging rather than silently including them. Used the
    real, already-verified support@elimux.ke address for contactPoint
    (confirmed live elsewhere in the codebase in an earlier cycle this
    session) and the real /icon-512x512.png file for logo (the
    instruction's /logo.png doesn't exist).
  - FAQPage: added to the homepage only (NewHomePage.tsx), via the
    JsonLd helper. Reworded ONE of the five given answers before
    publishing it: the "compare institutions side by side" claim isn't
    real - grepped src/app/institutions/ and src/components/institutions/
    for "compare" and found zero matches; only /programs has an actual
    compare feature (CompareProvider/CompareDrawer). Reworded to state
    what's actually true (institution profiles show accreditation/
    location/categories/reviews; programs have the real compare tool)
    rather than publish an overstated feature claim in indexed schema -
    same standard as the sameAs omission above. All other 4 answers used
    verbatim.
  - BreadcrumbList: built as a single reusable client component
    (src/components/seo/BreadcrumbJsonLd.tsx, mounted once in root
    layout) that generates a Home > [segment] trail from the current
    pathname, rather than hand-wiring a per-page breadcrumb into every
    route. The instruction's own draft only showed one hardcoded example
    (Home > Programs); with 100+ real routes in this app, a per-page
    approach would either take enormous individual wiring or silently
    miss most routes. The pathname-driven version satisfies "add to
    every page" automatically and correctly returns null on the
    homepage (no meaningful single-item trail there). Known limitation,
    flagged not hidden: dynamic segments (program/institution ids) render
    their raw slug/UUID as the breadcrumb label rather than a real name,
    since that would need a per-route data fetch this component doesn't
    have - acceptable for schema validity, not a polish item.
  Verified live: curl localhost:3000/ - Organization, WebSite, FAQPage
  (with nested Question/Answer/ContactPoint/SearchAction/EntryPoint types)
  all present; BreadcrumbList correctly ABSENT on homepage, confirmed
  PRESENT on /programs/.

=== STEP 5: OG IMAGE ===

Not created. No public/og-image.jpg existed before this cycle, and this
environment has no image-generation tool available. Per the
instruction's own explicit fallback ("create a placeholder and flag it
for design"), did NOT add an `images:` field pointing to a nonexistent
file - a broken og:image reference is worse for social-share previews
than omitting the field entirely (shows a broken-image icon vs. no
image). FLAGGED FOR CYCLE 030 DESIGN, as instructed: a real 1200x630
image at public/og-image.jpg, ElimuX logo + tagline, dark gradient
matching the hero.

=== STEP 6.2 + 6.3: LINK CLEANUP ===

- Internal absolute paths: audited (grep for relative hrefs) - zero
  found. Already 100% compliant before this cycle.
- Footer links: audited all 10 - every route (/about, /pricing,
  /internships, /accreditation-bodies, /contact, /partner,
  /ads/self-serve, /privacy, /terms, /cookies) confirmed to resolve to a
  real page.tsx. Nothing broken, nothing changed.
- /opportunities link premise checked, not assumed: the instruction
  states "/opportunities redirected to /internships." Checked
  middleware.ts, next.config.js, and vercel.json directly - there is NO
  redirect between these two routes anywhere in the codebase in either
  direction. Both /opportunities and /internships are real, separate,
  live pages with their own content. (Note: an earlier cycle's own
  audit-log entry from this session claims the OPPOSITE direction - a
  308 from /internships to /opportunities - which also doesn't match
  current reality.) Left both pages and all links to /opportunities
  untouched, since nothing is actually broken - flagging the stale
  "redirect exists" premise rather than silently either fixing a
  non-bug or ignoring the discrepancy.
- AdPortalSection "Advertise here" link premise checked, not assumed:
  the instruction says it "must point to /partner or /contact." It
  already points to /ads/self-serve, a real, fully-built route (create/
  dashboard sub-pages confirmed to exist). This is a MORE specific,
  correct destination than either instruction-suggested alternative -
  left unchanged, would have been a regression to "fix."
- Empty/# href audit: zero matches anywhere in src/.
- rel="noopener noreferrer" added to all 5 external-absolute-URL links
  found that didn't already have it: the WhatsApp CTA in
  AdPortalSection.tsx, the "Powered by ElimuX" footer credit in
  careers/[slug]/page.tsx, and all 3 "Back to Bursary Engine" links
  (bursary/provider/invite/[token], register, [slug]) pointing to
  https://bursary.elimux.ke. Deliberately did NOT add target="_blank" to
  any of these - none had it before, and adding it would be a navigation
  -behavior change beyond what this SEO instruction asked for (only rel
  was requested).
- rel="noopener noreferrer sponsored" added to the one genuine sponsor/
  affiliate link found: SponsorBanner.tsx's "Proudly Powered By" link
  (already had target="_blank" rel="noopener noreferrer" from an earlier
  cycle - added "sponsored" to the existing rel value). Checked
  AdPortalSection's ad cards specifically for other sponsor click-
  throughs - found none; that component navigates internally via
  onClick, not real anchor tags to external sponsor URLs.

=== STEP 7: HEADING HIERARCHY (9 named pages) ===

Audited h1-h6 tags in all 9 route files directly. Found and fixed 2 real
skip violations (H1 -> H3, no H2 anywhere):
  - contact/page.tsx: 3 instances (Email Us, Live Chat, Message Sent!) -
    all bumped h3 -> h2.
  - bursary/page.tsx: 2 instances (Filters sidebar heading, each fund
    card's {fund.name}) - both bumped h3 -> h2.
Confirmed correct, no changes needed: internships, attachments,
institutions, about (all properly sequential, no skips).
programs/page.tsx has TWO <h1> tags in source (TVET hero's and the
generic "Explore Programs" header) - not a bug: they're inside a mutually
-exclusive `filters.type === 'tvet' ? ... : ...` conditional, so exactly
one renders at runtime depending on route state, never both.
Scope limitation, not claimed as full coverage: audited the 9 named
route files' own JSX directly, not every imported child component
recursively (e.g. did not check inside every card/list component these
pages render). A full site-wide heading audit across all 100+ routes and
every nested component was not attempted - out of proportion for this
cycle.
Verified live: curl localhost:3000/contact/ - h1 -> h2 -> h2, no h3
remaining, confirmed fixed in the actual served HTML.

=== STEP 8: IMAGE ALT TEXT (9 named pages) ===

Found and fixed 2 real instances of alt="" on non-decorative content
images: employer logos in internships/page.tsx and attachments/page.tsx
(`<img src={employer.logo_url} alt="">`) - these identify who posted the
opportunity, not decorative. Changed to `alt={employer.company_name +
" logo"}` (with a "Employer" fallback for null company names) in both,
matching the instruction's own "[Institution Name] logo" convention
extended to employers. Checked the shared card components
(FeaturedInstitutionCard, InstitutionCard, ProgramCard,
InstitutionsBrowser) for the same pattern - zero <img> tags exist in any
of them (icons/emoji only), nothing to fix there. Homepage and TVET hero
use emoji/icon glyphs, not <img> tags - nothing to fix.
Verified via the compiled production bundle (both routes are client-
hydrated): confirmed the new alt-text template literal is present in
both shipped chunks, not just in source.

=== STEP 9: VERIFICATION ===

1. npx tsc --noEmit - clean.
2. npm run build (2.5GB-heap/skip-sourcemaps recipe) - clean, all routes
   built including the new /robots.txt and /sitemap.xml static routes,
   /programs at 14.5 kB (unchanged from the last cycle).
3. npx next start - running, http://localhost:3000 returns HTTP 200.
4. Checklist:
   [x] /robots.txt returns correct content - curl-verified, all 7
       disallow rules + sitemap line present.
   [x] /sitemap.xml returns valid XML with all routes - curl-verified,
       2,013 real entries.
   [x] Homepage view-source contains JSON-LD for Organization, WebSite,
       FAQPage - curl-verified, all three @type values present with
       correct nested structure.
   [x] /programs view-source contains unique meta description and title
       - curl-verified.
   [x] Every one of the 9 named pages has a unique <title> and <meta
       name="description"> - curl-verified individually on all 9, not
       spot-checked on a subset.
   [x] No empty alt attributes remain on the 2 content images found -
       fixed and bundle-verified.
   [x] No skipped heading levels remain in the 9 named pages - fixed and
       curl-verified on the 2 pages that had violations.

   NOT verified: an actual browser rendering these pages, clicking
   through, or a full site-wide (100+ route) heading/alt-text sweep
   beyond the 9 named pages. Chrome browser automation remains
   unavailable this session - every check above is curl/build/bundle-
   based, same constraint as every prior cycle.

=== FILES CHANGED (uncommitted, sitting on local commit dd7a7f9) ===

New: src/components/seo/JsonLd.tsx, src/components/seo/
BreadcrumbJsonLd.tsx, src/app/programs/layout.tsx, src/app/scholarships/
layout.tsx, src/app/internships/layout.tsx, src/app/attachments/
layout.tsx, src/app/bursary/layout.tsx, src/app/contact/layout.tsx
Modified: src/app/robots.ts, src/app/sitemap.ts, src/app/layout.tsx,
src/app/institutions/page.tsx, src/app/about/page.tsx, src/app/contact/
page.tsx, src/app/bursary/page.tsx, src/app/internships/page.tsx,
src/app/attachments/page.tsx, src/components/home/NewHomePage.tsx,
src/components/home/AdPortalSection.tsx, src/components/home/
SponsorBanner.tsx, src/app/careers/[slug]/page.tsx, src/app/bursary/
provider/invite/[token]/page.tsx, src/app/bursary/provider/register/
page.tsx, src/app/bursary/provider/[slug]/page.tsx

DO NOT commit. DO NOT push. Awaiting "commit and push it".
