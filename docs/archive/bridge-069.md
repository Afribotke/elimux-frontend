AUDIT — BURSARY NAVIGATION DUPLICATION — REPORT (READ-ONLY, NO CHANGES MADE)

Status: COMPLETE - audit only, zero files touched, per the explicit
"do not change anything" instruction
Archive Ref: docs/archive/bridge-068.md (snapshot of the prior deploy
report, taken before this audit report replaced it)

=== WHERE "Bursary" APPEARS ===

1. UnifiedNavBar.tsx (src/components/layout/UnifiedNavBar.tsx:56-60) -
   "Bursary" pill, 💰, href /bursary. Global nav, mounted in root
   layout.tsx. Explicitly hidden on the homepage only
   (`if (pathname === "/") return null`).

2. NewHomePage.tsx (src/components/home/NewHomePage.tsx:72) - "Bursary"
   hero category card, 💰, href /bursary. Homepage-only, part of a local
   HERO_CATEGORIES array.

3. DesktopNav.tsx (src/components/DesktopNav.tsx:176-180) - "🔔 Bursary
   Notifications" link, href /bursary/notifications, inside the logged-in
   user's profile dropdown. Different label, different destination from
   #1/#2 - this is the notifications settings page, not the Bursary hub.

4. MobileNav.tsx (src/components/MobileNav.tsx:154-161) - same "Bursary
   Notifications" link as #3, in the mobile "More" overlay, also
   logged-in-only.

5. src/app/admin/layout.tsx:181-188 - admin sidebar "Bursary Engine"
   section with 5 distinct sub-links (Providers/Funds/Applications/
   Disbursements/Alert Check). Admin-only, different audience.

Not found: no "Bursary" reference anywhere in Footer.tsx.

=== DOES IT APPEAR MORE THAN ONCE? ===

On any single rendered page: NO. DesktopNav, UnifiedNavBar, and
MobileNav are all mounted together in every page's layout, but #1 and #2
are route-exclusive by design - the homepage shows #2 (hero card) while
UnifiedNavBar explicitly returns null there; every other route shows #1
(pill) since the hero card only exists on the homepage component. No
page renders both at once.

At the source-code level: YES, it's duplicated data. #1 and #2 are two
separate hardcoded arrays that each independently define the same
Bursary → /bursary entry (plus the same other 5 categories -
Universities/TVET/Scholarships/Internship/Attachment). This is not an
accidental find - it's already documented in NewHomePage.tsx's own code
comment (lines 20-25), written when the hero card list was built: the
list was copied locally "since UnifiedNavBar doesn't export PILLS and
this is the only other place that needs it." A known, deliberate
tradeoff from when the hero was built, not an oversight this audit is
newly surfacing.

#3 and #4 are a different, narrower link (Notifications, not the hub)
appearing once on desktop and once on mobile - the expected desktop/
mobile parallel, not a duplication bug.

#5 is a separate admin-only menu with 5 distinct, non-overlapping items
- not a duplicate of the public nav or of each other.

=== NO CHANGES MADE ===

Per the instruction: audit only. Zero files edited, zero code touched,
zero refactoring. This report is read-only findings.

Full detail (file:line for every match, plus the reasoning distinguishing
"same page" vs "same codebase" duplication) is in the assistant's chat
response to the founder this session, if a longer version is needed.
