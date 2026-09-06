# Objective
The user reports they cannot see the new CRM outreach link in the admin dashboard — only the old employer outreach link appears. Verify the navigation was actually updated, fix any issue, and confirm the user can see and click the new CRM link.

## CRITICAL RULES
1. Do NOT drop any table.
2. Read the actual navigation file before assuming it's correct.
3. Fix only what's broken. Do NOT rebuild pages that already exist.
4. Do NOT commit or push until instructed.

---

## STEP 1: Read the Actual Admin Navigation File

Read the file that contains the admin sidebar/navigation. Report EXACTLY:
- File path
- Every navigation item currently listed (copy-paste the relevant code block)
- Whether "CRM" or "Outreach" or "Unified CRM" appears anywhere
- Whether the old employer links still appear

---

## STEP 2: Fix Navigation if Missing or Wrong

If the CRM link is NOT in the navigation, add it. The link must point to `/admin/crm` and be clearly labeled "CRM" or "Outreach" (not "Employer Outreach").

If the CRM link IS there but hidden, broken, or mislabeled, fix it.

After any change, run:
```powershell
cd elimux-frontend
npx tsc --noEmit
Report: OK or errors.
STEP 3: Verify Pages Are Reachable
Check that these files actually exist:
src/app/admin/crm/page.tsx
src/app/admin/crm/dashboard/page.tsx
src/app/admin/crm/templates/page.tsx
src/app/admin/crm/[id]/page.tsx
If any are missing, report which ones.
STEP 4: Test Build
Run:
powershell
cd elimux-frontend
npm run build
Report: SUCCESS or exact errors.
STEP 5: Report Template
plain
## CYCLE 167B VALIDATION REPORT — Navigation Fix

### Navigation File
| File Path | |
|---|---|

### Navigation Items Found
| Label | Route | Status |
|---|---|---|
| (list all) | | |

### CRM Link
| Present? | Label | Route | Fixed? |
|---|---|---|---|
| YES / NO | | | YES / NO |

### Pages Exist
| Route | File Exists? |
|---|---|
| /admin/crm | YES / NO |
| /admin/crm/dashboard | YES / NO |
| /admin/crm/templates | YES / NO |
| /admin/crm/[id] | YES / NO |

### Build
| Result |
|---|
| OK / ERRORS: ___ |

### User Can Now See CRM Link?
YES / NO — (what exactly should the user click?)
CRITICAL RULES
Read the real file first. Do NOT assume.
Fix only the navigation. Pages from Cycle 167 are already built.
If build fails, report exact error and STOP.
Do NOT commit or push until instructed.
