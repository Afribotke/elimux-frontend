# BRIDGE 176-C-A — BUILD: Seamless Claim Handoff (CORRECTED)

**Cycle:** 176-C-A  
**Status:** APPLY NOW. CORRECTIONS CONFIRMED.

---

## CORRECTIONS FROM STEP 1 REPORT

| Brief Assumption | Reality |
|------------------|---------|
| `selectedInstitution` / `setSelectedInstitution` | `selected` / `setSelected` |
| `fetch('/api/institutions/...')` relative path | `` `${API_URL}/api/institutions/...` `` — backend is external, not local Next.js route |
| `useEffect` already imported | NOT imported — needs adding |
| `useSearchParams` not imported | Needs adding to existing `next/navigation` import |

---

## EXACT MODIFICATIONS

**File:** `src/app/institution/register/page.tsx`

### Change 1: Update React Import
**Find:**
```typescript
import { useState } from 'react';
Replace with:
TypeScript
import { useState, useEffect } from 'react';
Change 2: Update next/navigation Import
Find:
TypeScript
import { useRouter } from 'next/navigation';
Replace with:
TypeScript
import { useRouter, useSearchParams } from 'next/navigation';
Change 3: Add Pre-Fetch Logic
Find: The useState declarations (around line 26):
TypeScript
const [selected, setSelected] = useState<InstitutionHit | null>(null);
Insert immediately AFTER that line:
TypeScript
const searchParams = useSearchParams();
const preselectedId = searchParams.get('institution_id');

useEffect(() => {
  if (preselectedId && !selected) {
    fetch(`${API_URL}/api/institutions/${preselectedId}`)
      .then(res => {
        if (!res.ok) throw new Error('Institution not found');
        return res.json();
      })
      .then(data => {
        setSelected({ id: data.id, name: data.name, city: data.city });
      })
      .catch(err => {
        console.error('Failed to load preselected institution:', err);
      });
  }
}, [preselectedId, selected]);
Note: API_URL is already defined in this file (confirmed by Cycle 176-C-A Step 1). The setSelected call maps the full backend response to the narrow InstitutionHit shape { id, name, city }.
STEP 3 — BUILD & TEST
powershell
cd "C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend"
npm run build
If build passes, test locally:
http://localhost:3000/institution/register?institution_id=de3c8f25-... (real ID) → should pre-select "University of Nairobi"
http://localhost:3000/institution/register (no ID) → normal search UI
http://localhost:3000/institution/register?institution_id=fake → normal search UI, no crash
STEP 4 — COMMIT & PUSH
powershell
git add src/app/institution/register/page.tsx
git commit -m "Cycle 176-C-A — Seamless claim handoff: pre-select institution from /join search result"
git push origin main
STEP 5 — LIVE VERIFICATION
https://www.elimux.ke/join → search "University of Nairobi"
Click "Claim Profile" → lands on /institution/register?institution_id=...
Institution name pre-selected, claim form visible
Test without institution_id → normal search works
Test with bad ID → normal search works, no crash
RULE
Execute all 5 steps now. Report back after Step 3 (build result) and Step 5 (live verification).