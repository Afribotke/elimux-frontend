# QUICK FIX — "Remove duplicate Afribot section" — HALTED, premise doesn't hold

## Note to Kimi / founder

Checked before touching anything, per the standing practice this whole
session of verifying before executing a removal - did not remove
anything. Not committed, not pushed (nothing changed to commit).

### What I checked

1. `curl`'d the live local homepage (localhost:3000, the same build this
   whole session's work has been running on) and searched the actual
   rendered HTML for "Afribot", "Powered by", and "Banking on Education" -
   **zero matches, anywhere.**

2. Grepped the entire `elimux-frontend/src` tree for those same strings.
   Three components could theoretically render sponsor text on/near the
   homepage:
   - `SponsorBanner.tsx` - the standalone dark banner (the one you said
     to keep)
   - `Footer.tsx` - has its own sponsor slot, gated on
     `sponsor.show_in_footer`
   - `AppLoadingScreen.tsx` - a ~1-second full-screen splash shown once
     per browser session, gated on `sponsor.show_in_loading`

   **All three are independently wired to the same `useMajorSponsor()`
   hook** and each correctly renders nothing right now, because **there
   is no active major-sponsor row in the database** - confirmed earlier
   this same cycle (Step 3 of the homepage-hero-redesign work) when I
   specifically declined to hardcode "Afribot" copy into `SponsorBanner`
   for this exact reason.

3. "Afribot" itself isn't a real configured sponsor anywhere in this
   codebase or database - the only match in the entire repo is placeholder
   example text in the admin form
   (`MajorSponsorForm.tsx`, `placeholder="e.g., Afribot"`).

### Why I didn't just remove one and call it done

Three real, differently-purposed, all-currently-empty components exist.
Guessing which one you meant and removing it risks either breaking the
footer's real (if currently dormant) sponsor feature, or misreading which
one is "the standalone dark banner" you explicitly said to keep. Since
nothing is actually visibly duplicated right now, there was no safe way
to infer intent from the visible page - asked the founder directly rather
than guess, and they asked me to report back here instead of picking one.

### Possible explanations, not confirmed

- You may have been looking at `www.elimux.ke` (the live *production*
  site) rather than this local, uncommitted preview - production is
  running older, already-deployed code that's never seen any of this
  session's homepage work. I haven't checked production's actual content
  for this yet since you asked me to report here first rather than
  investigate that path.
- A stale/cached browser tab, or a moment where a sponsor row was
  temporarily active in the DB, are also possible.

### Status

Halted, nothing removed. Awaiting either: (a) confirmation to check
production instead, (b) the specific page/location where the duplicate
was actually seen, or (c) confirmation this was a false alarm.
