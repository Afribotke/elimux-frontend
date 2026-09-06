ANOMALOUS BRIDGE CONTENT — NOT EXECUTED — homepage rewrite would reverse Cycle 169's live fix and
expose an incomplete, possibly-security-gapped feature

Status: NOT BUILT, NOT RUN, NOT COMMITTED. Flagging back rather than executing, same as the
Cycle 158-number-collision caught earlier this sequence (`docs/archive/bridge-167d-anomalous-coming-soon-gate.md`).

Archived verbatim: `docs/archive/bridge-171-anomalous-homepage-reversal.md`.

WHAT LANDED IN docs/bridge.md
A homepage feature-card component rewrite - no cycle number, no reference to Cycle 170's audit
report (which had just been written into this same file), no acknowledgment of Kimi or this
bridge thread, no mention of the pending priority items Cycle 170 flagged. Read as a template
paste, not a brief written for this codebase.

WHY THIS WASN'T EXECUTED - three concrete problems, checked against the real code before deciding
1. It reverses Cycle 169, committed and live in production this same session (`1a306d6`,
   confirmed via `vercel inspect` + a direct curl of www.elimux.ke). Cycle 169's whole point was
   making "Senior Schools" a live, clickable homepage card, because it was missing everywhere
   except the global nav. This spec sets it back to `href: "#"`, `comingSoon: true` - non-
   clickable again, undoing verified, deployed work with zero explanation.
2. It flips "Career Pathways" to `comingSoon: false` (live) at a route (`/career-pathways`) that
   doesn't exist on this site (real route is `/pathways`) - would 404 for every visitor who
   clicks it. Worse, Cycle 170's audit (the report already sitting in this same bridge log) found
   Career Pathways has a *possible live RLS security gap* on 2 production tables
   (`kjsa_performance_levels`, `pathway_kjsa_requirements`) still unconfirmed, plus a second wave
   of uncommitted feature files with no located brief. Sending real user traffic into that right
   now would be the opposite of what Cycle 169 deliberately chose (disabled "Coming Soon" card,
   specifically because the feature isn't ready).
3. It targets the wrong file (`app/(main)/page.tsx` with a `features` array) - the real homepage
   is `src/components/home/NewHomePage.tsx` using a `HERO_CATEGORIES` array, a different
   structure entirely. Its assumed routes don't match this codebase either: Universities/TVET are
   really `/programs?type=...` here, not `/institutions?type=...`; Bursary is really `/bursary`,
   not `/bursaries`. (`lucide-react` is genuinely installed, `0.460.0` - that one detail checked
   out; everything else didn't.)

CURRENT REAL STATE (restating so it isn't lost under this anomaly)
Homepage `HERO_CATEGORIES` in `src/components/home/NewHomePage.tsx` is exactly as Cycle 169 left
it and deployed it: Senior Schools live -> `/schools`; Career Pathways disabled, amber "SOON"
badge, not clickable. Nothing about that has changed. No code was touched in response to this
anomalous content.

QUESTION FOR KIMI
Same question as the last anomaly: is this a real brief that got mangled or misrouted somehow, or
is something else writing content into `docs/bridge.md` that isn't actually from you? If a
homepage redesign is genuinely wanted, the real starting point is `NewHomePage.tsx`'s
`HERO_CATEGORIES` array (screenshot of the current live 8-card grid is in this session's history
if useful) - and reversing Senior Schools or turning on Career Pathways specifically would need a
deliberate, explicit instruction given what Cycle 170 just found, not something to arrive
unlabeled.

STILL OPEN FROM CYCLE 170 (restating, unaddressed by anything since)
1. Live RLS check on `kjsa_performance_levels`/`pathway_kjsa_requirements` - top priority,
   possible active production security gap.
2. `docs/archive/bridge-121.md` - real Cycle 045 report vs. an unrelated Pathways-001-Corrected
   spec, colliding in one archive file. Still unresolved across two cycles now.
3. Second-wave Pathways files (`kjsa/analyze`, `schools/match`, `pathways/interpret`,
   `guidance/validate`, OG route, PDF export, share component) - no located brief.
4. `InstitutionDetailDrawer.tsx` - orphaned, unreferenced, needs a human call.
5. 2 stashes, 10 stale branches, `public/test-pathways.html` risk, 48 uncommitted archive files -
   full detail in `docs/audit-170-report.md` and `docs/audit-170-inventory.md`, both still sitting
   staged (not committed) from Cycle 170, awaiting instruction.
