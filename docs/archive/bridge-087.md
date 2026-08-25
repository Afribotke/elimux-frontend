Cycle 027 — SmartTrack Module: EXECUTED, tested live, one blocking DB bug found and fixed via SQL file
Status: CODE COMPLETE, BUILD GREEN, PARTIALLY VERIFIED LIVE. NOT committed/pushed (per guardrail — awaiting "commit and push it").
Archive Ref: docs/archive/bridge-086.md (snapshot of the corrected Cycle 027 spec this report was executed from, taken before this report replaced it).

WHAT WAS BUILT (all per the corrected spec unless noted below)
- npm install qrcode.react (4.2.0) — recharts confirmed already installed, skipped as instructed.
- src/app/s/[slug]/route.ts — redirect engine.
- src/app/api/smart-links/route.ts, src/app/api/share-events/route.ts, src/app/api/analytics/[type]/route.ts.
- src/components/smarttrack/SmartQRCode.tsx, ShareStats.tsx.
- src/app/student/dashboard/impact/page.tsx, src/app/institution/dashboard/analytics/page.tsx.
- Upgraded src/components/share/ShareButton.tsx, ShareBar.tsx, ShareBottomSheet.tsx (not just ShareButton — see below).
- Wired into src/app/scholarships/[id]/page.tsx (ShareStats + contentType/contentId on the existing ShareButton).
- New SQL fix file: elimux-sql/53_fix_get_or_create_smart_link_ambiguous_column.sql — NOT YET RUN, needs manual paste into Supabase Dashboard (see blocking bug below).

BLOCKING BUG FOUND — get_or_create_smart_link() is broken in the live DB right now
Called it directly against a real scholarships.id with the service role key to confirm the RPC actually works before wiring the API route to it. It doesn't:
  {"code":"42702","message":"column reference \"slug\" is ambiguous"}
A local PL/pgSQL variable named `slug` collides with smart_links.slug inside the function body. This means POST /api/smart-links will 500 on every call until fixed — the redirect engine and click logging are unaffected (they don't call this RPC) and were verified working end-to-end (see below).
Fix written to elimux-sql/53_fix_get_or_create_smart_link_ambiguous_column.sql — fully qualifies all columns, uses distinct variable names, reuses the existing generate_smart_slug() RPC. Needs to be pasted into the Supabase SQL editor and run before smart-link creation (and therefore the whole share → tracked-link flow) works. Following this project's established manual-paste migration workflow — did not attempt to run it myself.

SECOND BUG FOUND AND FIXED IN CODE — fire-and-forget analytics writes could get silently dropped
The spec's redirect route logs the click and bumps smart_links counters in a `.then()` chain after already having computed the redirect, with no `await`/`waitUntil`. On Vercel's serverless runtime, returning the response does not guarantee the function stays alive to finish in-flight promises — reproduced this locally (unique_clicks silently stayed at 0 despite is_unique_click:true having been correctly written to click_analytics, because the chained counter-update lost the race). Fixed by wrapping both writes in Next.js's `after()` (next/server) so they run inside the same invocation lifecycle without delaying the redirect. Re-tested after the fix — total_clicks and unique_clicks both incremented correctly. (Also note: the version in the corrected spec never incremented total_clicks at all, only unique_clicks — fixed that too as part of the same block.)

THIRD BUG FOUND AND FIXED — click_analytics has no `count` column
clicks-by-country, clicks-by-referrer, and trending in the analytics route selected a `count` column from click_analytics that doesn't exist (confirmed against the live schema) — click_analytics is one row per click, not pre-aggregated. Rewrote all three to fetch raw rows scoped by date/link and aggregate in JS instead of assuming a GROUP BY happened server-side.

FOURTH ISSUE — gamification_points insert removed from share-events route
Checked the live gamification_points schema directly: columns are user_id, student_id, action_key (FK to gamification_actions.action_key), points, reference_type, reference_id — there is no `action` or `metadata` column, contrary to what the spec (and, per audit-log.md, an earlier review this session) assumed. Also checked gamification_actions directly: the 8 existing action_keys are all internship-module actions (profile_complete, apply_internship, logbook_entry, review_employer, refer_friend, complete_internship, daily_login, upload_resume) — there is no share_content action_key yet, and inserting one via the FK would fail. Left the gamification award out of share-events/route.ts entirely rather than ship an insert that always fails silently. To wire this up: someone needs to decide the point value and add a share_content row to gamification_actions, then I (or Kimi) can add the award_points RPC call back in — that RPC does exist and is the correct interface, confirmed its signature (p_user_id, p_action_key, p_points, p_reference_id, p_reference_type) — please flag if a prior session actually already reconciled this differently, since audit-log.md's Cycle 027 review entry says the original gamification insert "matches the real, already-live gamification schema," which conflicts with what I found directly against the live DB just now (2026-08-25). Worth double-checking which is stale.

FIFTH ISSUE — real ShareButton/ShareBar props don't match what the spec assumed
The spec's patch assumed ShareButton already had contentType/contentId as its interface and just needed a getSmartLink() function added. The real component takes a single `shareData: ShareData` object (title/description/url/image/hashtags) with no content identifiers at all, and there's a second sibling component (ShareBar.tsx, used nowhere yet but same shape) that wraps the same ShareBottomSheet the spec didn't know about. Rather than follow the literal patch, added optional `contentType`/`contentId` props to both ShareButton and ShareBar; when both are present they resolve a smart link before sharing (falling back silently to the plain canonical URL for anonymous users or on any API failure) and pass tracking context down into ShareBottomSheet, which now fires a best-effort /api/share-events call per channel click and renders the SmartQRCode block. Added a shared `getSmartShareUrl()`/`trackShareEvent()` pair to src/lib/share-utils.ts backing both.

SIXTH ISSUE — analytics/[type] auth guard would have broken the public ShareStats widget
The spec's analytics route required a signed-in user for every type, including `content` — which is what the public-facing ShareStats widget calls for every anonymous visitor to a scholarship page. Scoped the auth requirement to skip only the `content` type; overview/trending/student-impact (personal dashboard queries) still require auth.

SEVENTH ISSUE — ShareStats only wired into scholarships/[id]
Per the spec's own conditional wording ("pages that already have share buttons"), checked every content-detail route: only scholarships/[id] and the generic /search page currently have a ShareButton. programs/[id], institutions/[id], attachments/[id], internships/[id], bursary/fund/[id] have no share UI at all yet (confirmed by grepping for ShareButton/ShareBar usage across the repo — zero matches outside those two). Did not invent new share buttons on the other five pages — that's a real product decision (what the share button should look like there, whether it's a floating/inline/icon variant) I'm not making unilaterally. ShareStats + smart-link tracking is wired into scholarships/[id] only for now; the other five pages are ready to receive the same two-line addition (`contentType`/`contentId` props + a `<ShareStats>` import) whenever a ShareButton gets added to them.

EIGHTH ISSUE — institution analytics dashboard simplified to match real data
The spec's institution dashboard reads `/api/analytics/overview` but expects fields (total_shares, applications, top_referrer, top_country) that only exist on the content_performance view, not on the smart_links rows overview actually returns — and content_performance has no institution/owner column to scope it by the signed-in institution's own listings anyway. Rather than ship a dashboard silently showing zeros for those fields, simplified it to the fields overview genuinely has (total_clicks, unique_clicks per smart link) and dropped the shares/applications/traffic-source-pie sections. Revisiting this properly needs a real institution-owned-content join, which doesn't exist in the current schema.

VERIFIED LIVE (against local dev server + direct Supabase REST calls, all test rows deleted afterward)
- npm run build: zero TypeScript errors, all 6 new routes present in the build manifest.
- Manually inserted a real smart_links row and hit /s/[slug]/ (note: this project's trailingSlash:true means the bare /s/[slug] URL 308s once before reaching the handler — pre-existing site-wide behavior, not something introduced here) — confirmed correct destination URL + UTM params, a click_analytics row written with real device/referrer detection, and total_clicks/unique_clicks both incrementing correctly after the after() fix.
- POST /api/smart-links with no session correctly 401s.
- Did not browser-test the actual share sheet / WhatsApp / copy-link / QR download UI this pass — no time budget left in this session for full manual click-through; that's the one item on the spec's own verification checklist still genuinely unverified.

WHAT'S NEEDED BEFORE THIS IS FULLY LIVE
1. Paste elimux-sql/53_fix_get_or_create_smart_link_ambiguous_column.sql into the Supabase SQL editor — until this runs, sharing a scholarship will silently fall back to the plain (untracked) URL instead of a smart link, because getSmartShareUrl() swallows the 500 and returns null on purpose.
2. Decide the gamification_actions entry for share_content (or confirm it already exists somewhere I didn't check) before re-adding the award_points call to share-events/route.ts.
3. Whoever owns the product decision on programs/institutions/attachments/internships/bursary share buttons should say whether/how to add them — then ShareStats + tracking is a two-line follow-up per page.
Not committing or pushing anything per the standing guardrail.
