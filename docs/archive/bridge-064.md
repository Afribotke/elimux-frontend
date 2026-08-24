QUICK FIX — ADD TVET CREDIBILITY LINE WITH REAL PROGRAM COUNT — FINDING, NOT YET IMPLEMENTED

Status: HALTED before writing the credibility line — checked the real
accreditation data first (per your note that TVETA scraping is real and
to "check under TVET"), and the numbers don't support the literal claim
as worded. Asked the founder how to proceed rather than picking a number
unilaterally; they chose to have this relayed to you here before any
code is written.
Archive Ref: docs/archive/bridge-063.md (snapshot of this instruction,
taken before this finding report replaced it)

Note: this bridge.md briefly also carried the Cycle 028 ("Match Your
Grade" hero) completion report before this instruction overwrote it -
that report wasn't lost, it's fully preserved in docs/audit-log.md's
Cycle 028 entry, just not separately archived as its own bridge-NNN.md
snapshot this time.

=== WHAT WAS CHECKED ===

Confirmed the TVETA infrastructure is real, not something to build from
scratch: `institutions.tveta_accredited` (boolean) and
`tveta_registration_number` columns already exist and are already
consumed by `src/components/TvetaBadge.tsx` (renders "TVETA Accredited"
vs "Not TVETA Verified" per institution) and a full admin review pipeline
at `src/app/admin/tveta-scraper/page.tsx` (run scraper → review pending →
approve/reject).

Queried the live database read-only (anon key, no writes) to get the real
numbers behind the requested credibility line:

- TVET-type institutions (type_id matching the same
  tvet|technical|vocational|polytechnic regex the /programs page already
  uses): 2,076 total, 2,035 marked tveta_accredited=true (98%).
- Active TVET programs actually listed on the site: 1,121 total.
- Of those 1,121 programs, only 127 (11%) belong to an institution marked
  tveta_accredited=true. The other 994 (89%) belong to institutions
  marked tveta_accredited=false.

In plain terms: most individual TVET institutions are marked accredited,
but the ones carrying the bulk of the actual program catalog (994 of
1,121 listed programs) are not among them. Institution-level accreditation
rate and program-level accreditation rate point in opposite directions
here.

=== WHY THIS BLOCKS THE LITERAL INSTRUCTION ===

The requested exact text is:
  "Discover {count} programs from top TVET institutions under TVET
  Authority"

If {count} = 1,121 (all active TVET programs, the number this
instruction's own fallback guidance points to - "derive the count from
the existing programs query response"), the phrase "under TVET Authority"
would be an accreditation claim that's false for 89% of what's being
counted. If {count} is instead scoped to only the 127 programs at
verified institutions, the claim becomes literally true but the number is
small enough to undercut the "credibility" the line is meant to convey -
a different kind of problem.

Not a case of the instruction's premise being wrong (TVETA data
genuinely exists, exactly as you said) - it's that the exact wording
requested doesn't hold for the most natural real count, and there's no
way to pick between the two very different numbers without a product
decision about what "under TVET Authority" should honestly represent.

=== OPTIONS SURFACED TO THE FOUNDER (none implemented yet) ===

1. Use 1,121 (all TVET programs), drop "under TVET Authority" entirely -
   e.g. "Discover 1,121 programs from top TVET institutions."
2. Use 127 (TVETA-accredited only), keep the claim - e.g. "Discover 127
   programs from TVETA-accredited institutions."
3. Keep 1,121, reword "under TVET Authority" as a sector-level fact about
   Kenya's TVET regulatory framework in general, not a per-program
   accreditation claim - e.g. "Discover 1,121 programs from top TVET
   institutions - TVET training in Kenya is regulated by the TVET
   Authority."
4. Stand down and relay to you first (chosen).

=== NEXT STEP ===

Awaiting your (or the founder's) decision on which framing to ship. No
code has been written for this instruction - src/app/programs/page.tsx is
unchanged since the Cycle 028 report. Will implement immediately once a
direction is confirmed, same query/skeleton/styling mechanics as
originally specified (real Supabase count, no hardcoded number, skeleton
while loading).

DO NOT commit. DO NOT push.
