# BRIDGE 176-C-A — BUILD: Seamless Claim Handoff

**Cycle:** 176-C-A  
**Status:** EXECUTE NOW. PART A ONLY. B, C, D DEFERRED.

---

## GOAL

When a user clicks "Claim Profile" on `/join`, `/institution/register` should pre-select that institution instead of making them search again.

---

## STEP 1 — READ THE FILE (CONFIRM VARIABLE NAMES)

```powershell
cd "C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend"
Get-Content "src/app/institution/register/page.tsx" -Raw
Stop after reading. Report back:
What is the useState variable that holds the selected institution? (e.g., selectedInstitution, selected, institution)
What is the setter function? (e.g., setSelectedInstitution, setSelected)
What is the component's main state type for the selected institution?
Does the file already import anything from next/navigation?
If the variable names differ from selectedInstitution / setSelectedInstitution, adapt the code below to match exactly.
STEP 2 — APPLY MODIFICATION
2.1 Add Import
At the top of the file, add to existing next/navigation imports (or create the import line):
TypeScript
import { useSearchParams } from 'next/navigation';
2.2 Add Pre-Fetch Logic
Inside the component function, after the existing useState declarations, add:
TypeScript
const searchParams = useSearchParams();
const preselectedId = searchParams.get('institution_id');

useEffect(() => {
  if (preselectedId && !selectedInstitution) {
    fetch(`/api/institutions/${preselectedId}`)
      .then(res => {
        if (!res.ok) throw new Error('Institution not found');
        return res.json();
      })
      .then(data => {
        setSelectedInstitution(data);
      })
      .catch(err => {
        console.error('Failed to load preselected institution:', err);
        // Leave selectedInstitution null so user sees normal search UI
      });
  }
}, [preselectedId, selectedInstitution, setSelectedInstitution]);
Adapt selectedInstitution and setSelectedInstitution to match the actual variable names from Step 1.
2.3 Add useEffect Import (If Missing)
If useEffect is not already imported from react, add it:
TypeScript
import { useState, useEffect } from 'react';
STEP 3 — BUILD & TEST
powershell
cd "C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend"
npm run build
If build passes, test locally:
http://localhost:3000/institution/register?institution_id=de3c8f25-... (real University of Nairobi ID) → should show "Selected: University of Nairobi" and the claim form
http://localhost:3000/institution/register (no ID) → should show normal search UI
http://localhost:3000/institution/register?institution_id=fake-id → should show normal search UI (graceful fallback)
STEP 4 — COMMIT & PUSH
powershell
git add src/app/institution/register/page.tsx
git commit -m "Cycle 176-C-A — Seamless claim handoff: pre-select institution from /join search result"
git push origin main
STEP 5 — LIVE VERIFICATION
https://www.elimux.ke/join → search "University of Nairobi"
Click "Claim Profile" → lands on /institution/register?institution_id=...
Institution name should be pre-selected, claim form visible
Test without institution_id → normal search works
Test with bad ID → normal search works (no crash)
RULE
STOP AFTER STEP 1. Report the exact variable names. I will confirm the adaptation before you apply Step 2.