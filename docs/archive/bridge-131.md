# BRIDGE: STASH PATHWAYS → COMMIT PWA → RESTORE PATHWAYS
## Cycle: Pathways-Deploy-Prep | Status: Execute Immediately

---

## 0. RULES

- Do NOT commit, push, or deploy Career Pathways files
- Do NOT modify any Career Pathways code during this cycle
- Commit and push ONLY the PWA auto-update + identity lock work
- After push, restore Career Pathways to uncommitted working tree
- Verify build passes after stash and after restore

---

## 1. AUDIT: WHAT EXISTS RIGHT NOW

Before touching git, confirm these files exist on disk:

### 1.1 Career Pathways Files (MUST be stashed, NOT committed)
src/app/pathways/layout.tsx
src/app/pathways/page.tsx
src/app/pathways/results/page.tsx
src/app/pathways/wizard/page.tsx
src/app/api/pathways/route.ts
src/app/api/pathways/interpret/route.ts
src/app/api/kjsa/route.ts
src/app/api/kjsa/analyze/route.ts
src/app/api/schools/route.ts
src/app/api/schools/match/route.ts
src/app/api/combinations/route.ts
src/app/api/careers/route.ts
src/app/api/guidance/validate/route.ts
scripts/download-school-data.ts
supabase/migrations/20260829000001_pathways_schema.sql
supabase/migrations/20260829000002_pathways_rls_fix.sql
supabase/seeders/pathways_seed.sql
plain

### 1.2 PWA Files (MUST be committed and pushed)
public/manifest.json
public/sw.js
src/app/layout.tsx (modified for PWA)
src/hooks/usePWAUpdate.ts
src/components/PWAUpdateToast.tsx
src/components/PWACleanupBanner.tsx
plain

### 1.3 Other Uncommitted Files (FOUNDER DECISION NEEDED)
src/app/admin/users/page.tsx (modified)
src/components/admin/DataTable.tsx (new)
src/components/admin/UserDetailDrawer.tsx (new)
public/elimux-complete-image-inventory.pdf
public/og-image-solid-bg.png
public/previews/ (2 files)
public/table-1787829636220.csv
public/table-1787829673294.csv
plain

**STOP HERE.** Ask the founder:

> "The admin users-table redesign files and loose marketing assets (PDFs, images, CSVs) are also uncommitted. Should I:
> 1. Commit them with the PWA work?
> 2. Stash them with Career Pathways?
> 3. Discard the loose assets and commit only admin redesign?
> 
> Reply with the number."

**Do NOT proceed until founder replies.**

---

## 2. STEP-BY-STEP EXECUTION

### Step 2.1: Stash Career Pathways

Run this exact command in PowerShell:

```powershell
cd "C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend"
git stash push -m "HOLD: Career Pathways Phase 2 - DO NOT DEPLOY UNTIL 100% TESTED" -- src/app/pathways src/app/api/pathways src/app/api/kjsa src/app/api/schools src/app/api/combinations src/app/api/careers src/app/api/guidance scripts/download-school-data.ts supabase/migrations/20260829000001_pathways_schema.sql supabase/migrations/20260829000002_pathways_rls_fix.sql supabase/seeders/pathways_seed.sql
Verify: Run git status --short. Career Pathways files should NOT appear. PWA files SHOULD still appear.
Step 2.2: Handle Admin + Assets (Per Founder Decision)
If founder says "1" (commit all with PWA):
powershell
git add public/manifest.json public/sw.js src/app/layout.tsx src/hooks/usePWAUpdate.ts src/components/PWAUpdateToast.tsx src/components/PWACleanupBanner.tsx src/app/admin/users/page.tsx src/components/admin/DataTable.tsx src/components/admin/UserDetailDrawer.tsx public/elimux-complete-image-inventory.pdf public/og-image-solid-bg.png public/previews/ public/table-1787829636220.csv public/table-1787829673294.csv
If founder says "2" (stash admin + assets with Pathways):
powershell
git stash push -m "HOLD: Admin redesign + loose assets" -- src/app/admin/users/page.tsx src/components/admin/DataTable.tsx src/components/admin/UserDetailDrawer.tsx public/elimux-complete-image-inventory.pdf public/og-image-solid-bg.png public/previews/ public/table-1787829636220.csv public/table-1787829673294.csv
git add public/manifest.json public/sw.js src/app/layout.tsx src/hooks/usePWAUpdate.ts src/components/PWAUpdateToast.tsx src/components/PWACleanupBanner.tsx
If founder says "3" (discard loose assets, commit admin only):
powershell
git rm --cached public/elimux-complete-image-inventory.pdf public/og-image-solid-bg.png public/previews/ public/table-1787829636220.csv public/table-1787829673294.csv
git add public/manifest.json public/sw.js src/app/layout.tsx src/hooks/usePWAUpdate.ts src/components/PWAUpdateToast.tsx src/components/PWACleanupBanner.tsx src/app/admin/users/page.tsx src/components/admin/DataTable.tsx src/components/admin/UserDetailDrawer.tsx
Step 2.3: Commit PWA Work
powershell
git commit -m "feat: PWA auto-update + identity lock (Cycles 049-050)"
Step 2.4: Push to Origin
powershell
git push origin main
Verify: Check Vercel dashboard. The deploy should trigger automatically.
Step 2.5: Restore Career Pathways
powershell
git stash pop
If founder chose option 2 (stash admin + assets): Run git stash pop a second time to restore those too.
Step 2.6: Verify Career Pathways Is Back
Run:
powershell
git status --short
Expected: Career Pathways files appear as untracked or modified (NOT staged). PWA files should NOT appear (they were committed).
Step 2.7: Build Verification
powershell
npm run build
Must pass with exit code 0, zero errors.
3. FINAL STATE CHECKLIST
[ ] Career Pathways files are BACK in working tree (uncommitted)
[ ] PWA files are COMMITTED and PUSHED to origin/main
[ ] npm run build passes with zero errors
[ ] Career Pathways is NOT deployed to www.elimux.ke
[ ] PWA auto-update IS deployed to www.elimux.ke
4. STOP
Do NOT proceed to Phase 3 (PDF + Share) until the founder explicitly says:
"Proceed to Phase 3"
End of bridge spec. Execute exactly as written. No deviations.