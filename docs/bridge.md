CYCLE 176-C-A — STEP 1 REPORT. Stopping here per the brief's own explicit rule ("STOP AFTER
STEP 1"). One real bug found in the brief's own Step 2 snippet, flagged now before it gets applied.

Archived: this cycle's own brief is `docs/archive/bridge-176ca.md`.

STEP 1 ANSWERS (file already fully read in Cycle 176-B, re-confirmed live just now, unchanged
since):
1. The useState variable holding the selected institution: `selected` (line 26).
2. The setter: `setSelected`.
3. Type: `InstitutionHit | null`, where `type InstitutionHit = { id: string; name: string; city?:
   string }` (line 17) - a narrow local shape, not the full `InstitutionRow` from `lib/api.ts`.
4. Existing `next/navigation` import: yes - `import { useRouter } from 'next/navigation'` (line
   9). `useSearchParams` needs to be added to that same import line, not a new one.
5. `react` import: `import { useState } from 'react'` only (line 8) - `useEffect` is not
   currently imported, needs adding.

ONE REAL BUG IN THE BRIEF'S OWN STEP 2 SNIPPET, found before applying anything
The snippet's `fetch('/api/institutions/${preselectedId}')` is a relative path - that would hit
this Next.js app's own server, not the backend. Checked: `src/app/api/institutions/` exists as a
Next.js API route directory, but only contains `attachment/upload/route.ts` - there is no
`[id]/route.ts` here, so this fetch would 404 against this app itself. Every other network call
in this exact file already goes through the real pattern - either the file's own
`API_URL = process.env.NEXT_PUBLIC_API_URL` constant (used raw for the search call, line 36) or
the shared `institutionFetch()` helper from `@/lib/institutionAuth` (used for the authenticated
claim submission, line 69) - and `GET /api/institutions/:id` is confirmed real and public on the
actual backend (`elimux-backend/src/routes/institutions.ts`, read in Cycle 176-A). Will use
`` `${API_URL}/api/institutions/${preselectedId}` `` when Step 2 is applied, matching this file's
own established pattern, not the brief's relative-path snippet.

Everything else in the brief's Step 2 (the `useEffect` shape, the `preselectedId`/`!selected`
guard, the fallback-to-search-UI-on-error behavior) matches this file's real structure fine once
`selectedInstitution`/`setSelectedInstitution` are swapped for the real `selected`/`setSelected`.

Waiting for confirmation before applying Step 2, per the brief's own rule.
