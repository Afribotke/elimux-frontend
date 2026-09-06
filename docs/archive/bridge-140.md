=== CYCLE 054 — PATHWAYS KJSA STEP RESPONSIVE FIX ===

## BUG

The KJSA subject entry section (Step 4) is not responsive. On narrow viewports, the "+ Add a subject" button and the "8 subjects entered so far" text overflow or do not wrap correctly.

## FILE TO FIX

`src/app/pathways/wizard/page.tsx` — find the KJSA step render section (the step where subjects are entered with performance levels EE/ME/AE/BE).

## WHAT TO CHANGE

Find the container that holds:
- The "X subjects entered so far" text
- The "+ Add a subject" button
- The list of already-entered subjects
- The Back/Next navigation

Ensure the container uses responsive Tailwind classes:

**Before (likely broken):**
```tsx
<div className="flex items-center justify-between">
  <span>8 subjects entered so far.</span>
  <button>+ Add a subject</button>
</div>
After (responsive):
tsx
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
  <span className="text-sm text-gray-600">8 subjects entered so far.</span>
  <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors">
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
    Add a subject
  </button>
</div>
Also check the subject list items. Each entered subject row should stack vertically on mobile, not force a horizontal layout:
tsx
// Each subject row
<div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 rounded-lg border border-gray-200 bg-white p-3 sm:p-4">
  <span className="font-medium text-gray-900 flex-1">Mathematics</span>
  <div className="flex flex-wrap gap-2">
    {/* EE/ME/AE/BE buttons */}
  </div>
</div>
Also check the bottom navigation. The Back/Next buttons should stack or shrink appropriately:
tsx
<div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 mt-6">
  <button className="w-full sm:w-auto ...">Back</button>
  <button className="w-full sm:w-auto ...">Next</button>
</div>
VERIFICATION
After fix:
[ ] Open /pathways/wizard on a phone or Chrome DevTools at 375px width
[ ] Navigate to Step 4 (KJSA subject entry)
[ ] Confirm "Add a subject" button is fully visible and tappable
[ ] Confirm subject rows do not overflow horizontally
[ ] Confirm Back/Next buttons are usable without zooming
[ ] Confirm no horizontal scroll on the page
[ ] npm run build passes
Do NOT commit. Report back with screenshot.