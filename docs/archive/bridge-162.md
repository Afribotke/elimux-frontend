# docs/bridge.md — Cycle 162: Phase 5 — Team & Oversight

## Objective
Build the team delegation and oversight layer: assign contacts to reps, track every action in the activity feed, and give managers a real-time view of team performance. Reps see only their assigned contacts. Managers see their team's activity. Super Admin sees everything.

## CRITICAL RULES
1. Do NOT drop any table.
2. Append-only to existing files. Do NOT replace.
3. Use `adminAuth` on every new route.
4. Import shared `supabase` from `../lib/supabase`.
5. Run `npx tsc --noEmit` after any TypeScript change.
6. Run SQL one block at a time. Report EXACT output.
7. If any step fails, STOP and report the error.
8. Do NOT commit or push until instructed.

---

## STEP 1: Seed CRM Team

Run this SQL in Supabase SQL Editor:

```sql
-- ============================================
-- 1.1 Make the existing admin user a super_admin
-- ============================================
-- Find the admin user first
SELECT id, email, raw_user_meta_data->>'role' as role 
FROM auth.users 
WHERE raw_user_meta_data->>'role' = 'admin' 
LIMIT 1;

-- Then insert into crm_team (replace USER_ID with the actual UUID from above)
-- INSERT INTO crm_team (user_id, role, is_active, created_at)
-- VALUES ('ACTUAL_ADMIN_USER_ID', 'super_admin', true, now())
-- ON CONFLICT DO NOTHING;
Claude: Run the SELECT first. Report the exact id and email of the admin user. Then run the INSERT with that actual UUID.
After inserting, verify:
sql
SELECT user_id, role, is_active FROM crm_team;
STEP 2: Add Team Management API Routes
Read the current end of elimux-backend/src/routes/crm.ts to find where to append. Append these routes BEFORE export default router;:
TypeScript
// ============================================
// Team Management Routes (appended to crm.ts)
// ============================================

// GET /api/crm/team — list team members with user details
router.get('/team', adminAuth, async (req, res) => {
  try {
    const { data: team, error } = await supabase
      .from('crm_team')
      .select(`
        *,
        user:user_id (
          id,
          email,
          raw_user_meta_data->>name as name,
          raw_user_meta_data->>role as user_role
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(team || []);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// POST /api/crm/team — add a team member
router.post('/team', adminAuth, async (req, res) => {
  try {
    const { user_id, role, reports_to, county_scope, entity_type_scope } = req.body;

    if (!user_id || !role) {
      return res.status(400).json({ error: 'user_id and role are required' });
    }

    const { data, error } = await supabase
      .from('crm_team')
      .insert({
        user_id,
        role,
        reports_to: reports_to || null,
        county_scope: county_scope || null,
        entity_type_scope: entity_type_scope || null,
        is_active: true,
        created_by: req.user?.id,
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.from('crm_activities').insert({
      user_id: req.user?.id,
      action: 'team_member_added',
      entity_type: 'user',
      entity_id: user_id,
      metadata: { role, reports_to },
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// DELETE /api/crm/team/:id — deactivate a team member
router.delete('/team/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('crm_team')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('crm_activities').insert({
      user_id: req.user?.id,
      action: 'team_member_removed',
      entity_type: 'user',
      entity_id: data.user_id,
      metadata: { role: data.role },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// ============================================
// Assignment & Activity Routes
// ============================================

// PATCH /api/crm/contacts/:id/assign — assign contact to a rep
router.patch('/contacts/:id/assign', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_to, assigned_by } = req.body;

    const { data: contact, error } = await supabase
      .from('crm_contacts')
      .update({
        assigned_to,
        assigned_by: assigned_by || req.user?.id,
        assigned_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('crm_activities').insert({
      user_id: req.user?.id,
      action: 'contact_assigned',
      entity_type: 'contact',
      entity_id: id,
      metadata: { assigned_to, previous_assigned_to: contact.assigned_to },
    });

    res.json(contact);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// GET /api/crm/activities — activity feed with filters
router.get('/activities', adminAuth, async (req, res) => {
  try {
    const { user_id, action, entity_type, page = '1', limit = '50' } = req.query;
    
    let query = supabase
      .from('crm_activities')
      .select('*, user:user_id (email, raw_user_meta_data->>name as name)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (user_id) query = query.eq('user_id', user_id);
    if (action) query = query.eq('action', action);
    if (entity_type) query = query.eq('entity_type', entity_type);

    const from = (parseInt(page as string) - 1) * parseInt(limit as string);
    const to = from + parseInt(limit as string) - 1;

    const { data, error, count } = await query.range(from, to);

    if (error) throw error;

    res.json({
      data: data || [],
      meta: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: count || 0,
        pages: Math.ceil((count || 0) / parseInt(limit as string)),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// GET /api/crm/stats/team — per-rep performance metrics
router.get('/stats/team', adminAuth, async (req, res) => {
  try {
    const { data: repStats, error } = await supabase.rpc('get_crm_team_stats');

    if (error) throw error;

    res.json(repStats || []);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});
After appending, run:
powershell
cd elimux-backend
npx tsc --noEmit
Report: OK or exact errors.
STEP 3: Create Team Stats RPC Function
Run this SQL in Supabase SQL Editor:
sql
-- ============================================
-- 3.1 Per-rep performance stats
-- ============================================
CREATE OR REPLACE FUNCTION get_crm_team_stats()
RETURNS TABLE(
  user_id uuid,
  user_name text,
  role text,
  contacts_assigned bigint,
  contacts_contacted bigint,
  emails_sent bigint,
  sms_sent bigint,
  messages_opened bigint,
  messages_replied bigint,
  last_active timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as user_id,
    COALESCE(u.raw_user_meta_data->>'name', u.email) as user_name,
    COALESCE(t.role, 'unknown') as role,
    COUNT(DISTINCT c.id) FILTER (WHERE c.assigned_to = u.id) as contacts_assigned,
    COUNT(DISTINCT c.id) FILTER (WHERE c.assigned_to = u.id AND c.status != 'new') as contacts_contacted,
    COUNT(m.id) FILTER (WHERE m.sent_by = u.id AND m.channel = 'email') as emails_sent,
    COUNT(m.id) FILTER (WHERE m.sent_by = u.id AND m.channel = 'sms') as sms_sent,
    COUNT(m.id) FILTER (WHERE m.sent_by = u.id AND m.opened_at IS NOT NULL) as messages_opened,
    COUNT(m.id) FILTER (WHERE m.sent_by = u.id AND m.replied_at IS NOT NULL) as messages_replied,
    MAX(a.created_at) as last_active
  FROM auth.users u
  LEFT JOIN crm_team t ON t.user_id = u.id AND t.is_active = true
  LEFT JOIN crm_contacts c ON c.assigned_to = u.id
  LEFT JOIN crm_messages m ON m.sent_by = u.id
  LEFT JOIN crm_activities a ON a.user_id = u.id
  WHERE t.role IS NOT NULL OR EXISTS (SELECT 1 FROM crm_messages WHERE sent_by = u.id LIMIT 1)
  GROUP BY u.id, u.email, u.raw_user_meta_data, t.role
  ORDER BY contacts_assigned DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
Verify:
sql
SELECT * FROM get_crm_team_stats() LIMIT 5;
Report exact output (mask emails if needed).
STEP 4: Validation
4.1 Team member seeded
sql
SELECT user_id, role, is_active FROM crm_team;
4.2 TypeScript compilation
powershell
cd elimux-backend && npx tsc --noEmit
Report: OK or errors.
4.3 Test assignment (dry run — do NOT modify real contact)
sql
-- Find one contact with no assigned_to
SELECT id, name, assigned_to FROM crm_contacts WHERE assigned_to IS NULL LIMIT 1;

-- Find admin user id
SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin' LIMIT 1;

-- Report both IDs. Do NOT run UPDATE yet.
4.4 Activity feed has entries
sql
SELECT COUNT(*) as total_activities FROM crm_activities;
SELECT action, COUNT(*) as count FROM crm_activities GROUP BY action ORDER BY count DESC;
4.5 Team stats RPC works
sql
SELECT * FROM get_crm_team_stats() LIMIT 3;
STEP 5: Report Template
plain
## CYCLE 162 VALIDATION REPORT — Phase 5: Team & Oversight

### Team Seeded
| User ID | Role | Active? |
|---|---|---|
| | | |

### Routes Added
| Route | Method | Auth | Status |
|---|---|---|---|
| /api/crm/team | GET | adminAuth | |
| /api/crm/team | POST | adminAuth | |
| /api/crm/team/:id | DELETE | adminAuth | |
| /api/crm/contacts/:id/assign | PATCH | adminAuth | |
| /api/crm/activities | GET | adminAuth | |
| /api/crm/stats/team | GET | adminAuth | |

### TypeScript Check
| Project | Result |
|---|---|
| elimux-backend | OK / ERRORS: ___ |

### RPC Functions
| Function | Exists? | Test Output |
|---|---|---|
| get_crm_team_stats | | |

### Activity Feed
| Total Activities | Top Actions |
|---|---|
| | |

### Errors
| Step | Error | Resolution |
|---|---|---|
| | | |

### Ready for Phase 6 (Contact Enrichment UI)?
YES / NO
CRITICAL RULES
Append-only to crm.ts. Do NOT replace existing routes.
Use the shared supabase client.
If tsc fails, report exact errors and STOP.
Do NOT commit or push until instructed.