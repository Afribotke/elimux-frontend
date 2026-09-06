# CYCLE 178-C — Program Views Alert Trigger
# File: docs/bridge.md

## GOAL
Create a PostgreSQL trigger that inserts a real alert into `trending_alerts` every time a
program accumulates 10 new views. Uses the existing `program_views` table — zero new frontend
or backend code.

## MANDATORY LOCAL BUILD VERIFICATION
Even though this cycle changes no files, run the build to confirm the working tree is clean:
```bash
cd C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend
set NODE_OPTIONS=--max-old-space-size=2560
set NEXT_PRIVATE_SKIP_SOURCEMAPS=1
npm run build
Confirm exit code 0. Report the result.
PART 1 — Verify Schema Before Running Trigger
Run these in Supabase SQL Editor to confirm the trigger can safely reference real columns:
sql
-- Verify program_views has program_id
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'program_views' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verify programs has institution_id and name
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'programs' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verify trending_alerts exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'trending_alerts';
STOP if any of these return unexpected results. Report what you found.
PART 2 — Create the Trigger
Run this in Supabase SQL Editor as a single transaction:
sql
-- ============================================
-- CYCLE 178-C: Program Views Alert Trigger
-- ============================================

CREATE OR REPLACE FUNCTION public.create_view_alert()
RETURNS TRIGGER AS $$
DECLARE
    v_institution_id UUID;
    v_program_name TEXT;
    v_view_count INTEGER;
BEGIN
    -- Resolve institution and program name
    SELECT p.institution_id, p.name 
    INTO v_institution_id, v_program_name
    FROM public.programs p
    WHERE p.id = NEW.program_id;

    -- Safety: bail if program doesn't map to an institution
    IF v_institution_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Count total views for this program
    SELECT COUNT(*) INTO v_view_count
    FROM public.program_views
    WHERE program_id = NEW.program_id;

    -- Only alert every 10 views (10, 20, 30...) to avoid spam
    IF v_view_count % 10 = 0 THEN
        INSERT INTO public.trending_alerts (
            institution_id,
            type,
            title,
            message,
            metadata
        ) VALUES (
            v_institution_id,
            'program_views',
            'Program Getting Attention',
            format('"%s" has been viewed %s times.', v_program_name, v_view_count),
            jsonb_build_object(
                'program_id', NEW.program_id,
                'view_count', v_view_count
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists from any prior attempt, then create
DROP TRIGGER IF EXISTS view_alert_trigger ON public.program_views;

CREATE TRIGGER view_alert_trigger
    AFTER INSERT ON public.program_views
    FOR EACH ROW
    EXECUTE FUNCTION public.create_view_alert();

-- Verify trigger exists
SELECT trigger_name, event_manipulation, action_timing, action_orientation
FROM information_schema.triggers 
WHERE trigger_name = 'view_alert_trigger';
Confirm: The verify query must return exactly 1 row. If it returns 0, the trigger failed to create — report the error.
PART 3 — Verify Trigger Works (Manual Test)
Run this in Supabase SQL Editor to force a test alert:
sql
-- Find a real program_id and institution_id to test with
SELECT id, institution_id, name FROM public.programs WHERE is_active = true LIMIT 1;
Note the id (program_id) and institution_id.
Then run:
sql
-- Insert 10 view rows for that program to trigger the alert
-- (Replace :program_id with the real UUID from the query above)
INSERT INTO public.program_views (program_id, created_at)
SELECT :program_id, now()
FROM generate_series(1, 10);

-- Check if an alert was created
SELECT * FROM public.trending_alerts 
WHERE type = 'program_views'
ORDER BY created_at DESC
LIMIT 5;
Confirm: The second query must return at least 1 row with:
type = 'program_views'
title = 'Program Getting Attention'
message containing the program name and view count
If no alert appears, check the trigger function for errors in Supabase Logs → Postgres.
PART 4 — Report Back
Fill in this template and report:
Markdown
Copy
Code
Preview
## CYCLE 178-C REPORT

### Schema Verification
- program_views columns: [PASTE RESULT]
- programs columns: [PASTE RESULT]
- trending_alerts exists: [YES/NO]

### Trigger Status
- Function created: [YES/NO]
- Trigger created: [YES/NO]
- Verify query returned 1 row: [YES/NO]

### Manual Test
- Test program used: [NAME, ID]
- Alerts created after 10 inserts: [YES/NO — paste the alert row]
- Any errors in Postgres logs: [YES/NO — paste if yes]

### Build Verification
- npm run build exit code: [0 or other]
STOP
No files were changed in this cycle — nothing to stage or commit. Report the results above.