# docs/bridge.md — Cycle 167: Admin CRM Frontend — Unified Outreach UI

## Objective
Build the admin dashboard pages for the unified CRM so the user can see contacts, filter by type/country/status, view details, add key people, enrich contacts, and send templated messages — all from `/admin/crm`. Replace the old employer-only outreach link in the admin sidebar with the new unified CRM.

## CRITICAL RULES
1. Do NOT drop any table.
2. Audit existing admin sidebar/navigation first.
3. Use existing ElimuX UI patterns (same components, styling, auth as other admin pages).
4. Run `npx tsc --noEmit` after any change.
5. Do NOT commit or push until instructed.

---

## STEP 1: Audit Existing Admin Navigation

Run these commands and report EXACT output:

```powershell
# 1.1 Find admin layout and sidebar
Get-ChildItem -Path .\src\app\admin\ -Recurse -File -ErrorAction SilentlyContinue | 
  Where-Object { $_.Name -match '(?i)(layout|sidebar|nav|menu)' } | 
  Select-Object FullName

# 1.2 Read the admin sidebar/navigation file
# (Claude to identify which file contains the admin nav links and read it)

# 1.3 Check how existing admin pages are structured
Get-ChildItem -Path .\src\app\admin\ -Directory -ErrorAction SilentlyContinue | 
  Select-Object FullName

# 1.4 Check existing employer outreach page for reference
Get-Content .\src\app\admin\employers\outreach\page.tsx -ErrorAction SilentlyContinue | Select-Object -First 50
Report:
Which file contains the admin sidebar/navigation links
What navigation items currently exist
How the old employer outreach link is labeled and where it points
STEP 2: Update Admin Navigation
Add a new "CRM / Outreach" link to the admin sidebar/navigation. Keep the old employer pages accessible but demote them. The new link should point to /admin/crm.
Report exactly which file was modified and what lines were added/changed.
STEP 3: Create Admin CRM Page Structure
Create these files:
3.1 Main CRM List Page
src/app/admin/crm/page.tsx — Contact list with:
Filters: entity_type (dropdown), status (dropdown), country_relevance (dropdown), county (text search), assigned_to (dropdown of team members), search by name
Table columns: Name, Type, Country, County, Status, Priority, Assigned To, Email, Phone, Last Contact, Actions
Actions per row: View, Enrich, Send Message
Bulk actions: select multiple → Send Template, Assign to Rep, Change Status
Pagination
"Needs Enrichment" quick filter button
3.2 Contact Detail Page
src/app/admin/crm/[id]/page.tsx — Single contact view with:
Contact details card (name, type, email, phone, website, county, status, priority, notes, tags)
Key People section (list, add new person form)
Message History (emails/SMS sent, status, open/click tracking)
Activity Log (timeline of all actions on this contact)
Enrichment form (edit email, phone, whatsapp, notes)
Send Message button (opens template selector modal)
3.3 Send Message Modal Component
src/components/crm/SendMessageModal.tsx — Reusable modal:
Select template (filtered by contact's entity_type)
Preview rendered template with variables
Channel indicator (shows which channel will be used: Email/SMS/Needs Enrichment)
Send button
Success/error feedback
3.4 CRM Dashboard/Stats Page
src/app/admin/crm/dashboard/page.tsx — Overview:
Total contacts by entity_type (cards)
Outreach funnel: New → Contacted → Responded → Onboarded
Messages sent this week/month
Team activity feed (recent actions)
Contacts needing enrichment (count + quick link)
3.5 Templates Page
src/app/admin/crm/templates/page.tsx — Template management:
List all templates with category, channel support, usage count
Edit template form (subject, email body, SMS body)
Create new template
Preview with sample variables
STEP 4: API Client Functions
Create src/lib/crm-api.ts with typed functions for all CRM API endpoints:
TypeScript
export async function getCRMContacts(filters: {...}) {...}
export async function getCRMContact(id: string) {...}
export async function enrichContact(id: string, data: {...}) {...}
export async function addContactPerson(id: string, data: {...}) {...}
export async function getCRMTemplates(entityType?: string) {...}
export async function sendMessage(data: {...}) {...}
export async function getCRMActivities(filters: {...}) {...}
export async function getCRMStats() {...}
export async function assignContact(id: string, assignedTo: string) {...}
export async function getCRMTeam() {...}
Use the existing Supabase client pattern from the codebase.
STEP 5: Validation
5.1 Navigation updated
/admin/crm link appears in sidebar
Old /admin/employers/outreach still accessible but not primary
5.2 Pages render without error
/admin/crm — contact list loads
/admin/crm/dashboard — stats load
/admin/crm/templates — templates load
/admin/crm/[id] — contact detail loads (test with a real contact ID)
5.3 TypeScript compilation
powershell
cd elimux-frontend
npx tsc --noEmit
Report: OK or errors.
5.4 Functional test (if possible)
Filter contacts by entity_type = 'university' and country_relevance = 'kenya'
Verify 31 Kenyan universities appear
Click "Send Message" on one contact with email
Verify template selector appears
STEP 6: Report Template
plain
## CYCLE 167 VALIDATION REPORT — Admin CRM Frontend

### Navigation
| Check | Result |
|---|---|
| /admin/crm link added to sidebar | YES / NO |
| Old employer outreach still accessible | YES / NO |

### Pages Created
| Route | File | Status |
|---|---|---|
| /admin/crm | src/app/admin/crm/page.tsx | |
| /admin/crm/dashboard | src/app/admin/crm/dashboard/page.tsx | |
| /admin/crm/templates | src/app/admin/crm/templates/page.tsx | |
| /admin/crm/[id] | src/app/admin/crm/[id]/page.tsx | |

### Components Created
| Component | File | Status |
|---|---|---|
| SendMessageModal | src/components/crm/SendMessageModal.tsx | |
| CRM API client | src/lib/crm-api.ts | |

### TypeScript Check
| Result |
|---|
| OK / ERRORS: ___ |

### Functional Test
| Test | Result |
|---|---|
| Filter Kenya universities | |
| View contact detail | |
| Open send message modal | |

### Errors
| Step | Error | Resolution |
|---|---|---|
| | | |

### Ready for Live Outreach via UI?
YES / NO
CRITICAL RULES
Audit navigation first before modifying.
Match existing admin page patterns — do not invent new styling.
Use existing auth hooks and Supabase client.
If tsc fails, report exact errors and STOP.
Do NOT commit or push until instructed.
