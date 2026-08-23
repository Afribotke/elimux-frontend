# Cycle 028 — Review & Approve 296 UoN Program Changes

## Approach
Sample audit → founder confirmation → bulk approve. No individual review of 296 items.

## Step 1: Pull a Representative Sample

Run this SQL in Supabase SQL Editor:

```sql
SELECT 
  pc.id,
  p.name as program_name,
  pc.field_name,
  pc.old_value,
  pc.new_value,
  pc.created_at
FROM program_changes pc
LEFT JOIN programs p ON pc.program_id = p.id
LEFT JOIN institutions i ON p.institution_id = i.id
WHERE pc.status = 'pending'
  AND i.name ILIKE '%nairobi%'
ORDER BY RANDOM()
LIMIT 10;
Copy the results into a clean markdown table and show the founder.
Step 2: Ask Founder One Yes/No Question
Show the table and ask exactly this:
"These are 10 random samples from the 296 UoN changes. If these look correct, I will bulk-approve all 296. Yes or no?"
Step 3: Execute Based on Answer
If YES — Bulk Approve All 296
sql
UPDATE program_changes
SET status = 'approved', approved_at = NOW(), approved_by = 'admin'
WHERE status = 'pending'
  AND program_id IN (
    SELECT p.id FROM programs p
    JOIN institutions i ON p.institution_id = i.id
    WHERE i.name ILIKE '%nairobi%'
  );
Then check if your schema requires a separate "apply" step (some program_changes tables auto-sync, others need an explicit UPDATE to the live programs table). If an apply function exists (e.g., apply_program_change()), call it for all approved rows. If not, the approval status alone may be sufficient — check the existing admin dashboard code to confirm.
If NO — Stop and Report
Do NOT bulk approve. Instead, run:
sql
SELECT 
  pc.field_name,
  COUNT(*) as change_count,
  STRING_AGG(DISTINCT LEFT(pc.new_value, 50), ' | ') as sample_values
FROM program_changes pc
LEFT JOIN programs p ON pc.program_id = p.id
LEFT JOIN institutions i ON p.institution_id = i.id
WHERE pc.status = 'pending'
  AND i.name ILIKE '%nairobi%'
GROUP BY pc.field_name
ORDER BY change_count DESC;
Show this breakdown to the founder so they can see which fields are affected most. Wait for further direction.
Step 4: Verify
After approval (if yes):
sql
SELECT status, COUNT(*) 
FROM program_changes 
WHERE program_id IN (
  SELECT p.id FROM programs p
  JOIN institutions i ON p.institution_id = i.id
  WHERE i.name ILIKE '%nairobi%'
)
GROUP BY status;
Confirm pending count = 0.
Deliverables
[ ] 10-row sample presented to founder
[ ] Founder's yes/no recorded
[ ] Bulk action executed (or stopped if no)
[ ] Final state verified