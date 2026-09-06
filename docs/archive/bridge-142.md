# KJSA step responsive fix — real bug wasn't quite what was described,
## fixed the actual markup, verified at a genuine 375px width, not
## guessed at. NOT committed, per instruction.

## Status: `npx tsc --noEmit` and `npm run build` both clean. Verified
## visually at a real 375px viewport (not the usual resize_window
## limitation - see method below). Not committed, as instructed.

## The described bug didn't quite match the real file

The brief described an "+ Add a subject" button and an "8 subjects
entered so far" counter overflowing. Neither exists in this file - the
KJSA step renders a **fixed list of 8 subjects**, each with its own
EE/ME/AE/BE `<select>` dropdown (`kjsaSubjects.map(...)`), not a
dynamic add-one-at-a-time flow. Checked the real markup before touching
anything rather than pasting in code for UI that isn't there.

There *was* a real, if differently-shaped, responsive problem in the
same area: each subject row used `flex items-center justify-between`
with no wrap/stack behavior (a long label + a native `<select>` side by
side), and the bottom Back/Next nav used a plain `flex justify-between`
with no mobile stacking. Fixed both of those - the actual bug, not the
described one.

## What changed

`src/app/pathways/wizard/page.tsx`:
- Subject rows: `flex items-center justify-between` →
  `flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2`,
  and the `<select>` got `w-full sm:w-auto` so it goes full-width when
  stacked instead of squeezing next to the label.
- Bottom nav: `flex justify-between` →
  `flex flex-col-reverse sm:flex-row items-stretch sm:items-center
  justify-between gap-3`, both buttons got `w-full sm:w-auto` and
  `justify-center` (they only had `items-center` before, not centering
  their own icon+label when full-width).

## Verification - actually done, not assumed

`resize_window` doesn't work in this environment (confirmed again -
requested 375×812, `window.innerWidth` stayed at 1366 after the call,
same as a prior cycle). Instead of reporting that as a dead end again,
found a way around it this time: injected an `<iframe>` pinned to
`width:375px` pointing at the same page, which genuinely renders at
that width (`iframe.contentWindow.innerWidth` read back as `372`, not a
guess). Drove the wizard to Step 4 inside that iframe via the same
DOM-event technique used all session, then screenshotted the iframe
region directly.

**Result, real and visual, not inferred from class names:** subject
rows now stack cleanly - label on top, full-width dropdown below, both
clearly tappable, no overlap. The Back/Next nav renders as two
full-width stacked buttons with no overlap either. No horizontal
scroll. No console errors during the whole walkthrough.

Also confirmed no regression at the real desktop width this tab
actually renders at (1366px, well above the `sm:` breakpoint) - row
layout for both the subject rows and the nav render exactly as before.

## Not done

- `npm run build` was already run as part of the tsc/build check above -
  matches the checklist's own "npm run build passes" item.
- Did not test on an actual phone - the iframe technique is a real
  375px CSS viewport, which is what Tailwind's `sm:` breakpoint
  actually keys off, but it's not a substitute for real touch-target
  testing on real hardware if that matters for this change.

## Per instruction

Not committed. Say the word if this looks right.
