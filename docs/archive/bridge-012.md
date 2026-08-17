===START===

## KIMI DESIGN (Current)

# INSTRUCTION 012: Add GDPR data export endpoint

**Background:** GDPR Article 15 requires users to access all personal data held about them. ElimuX stores user profiles, applications, favorites, and messages. This endpoint returns everything in a single JSON download.

**Task 1 — Create the export route:**
Create `elimux-backend/src/routes/user-export.ts` with this content:

```typescript
import { Router } from 'express';
import { requireUser } from '../middleware/user-auth';
import { supabase } from '../lib/supabase';

const router = Router();

router.get('/export-data', requireUser, async (req, res) => {
  const userId = req.user.id;

  try {
    // Fetch all user-related data in parallel
    const [
      { data: profile },
      { data: applications },
      { data: favorites },
      { data: alerts },
      { data: messages },
      { data: scholarshipProfile },
      { data: studentProfile },
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('scholarship_applications').select('*').eq('student_id', userId),
      supabase.from('scholarship_favorites').select('*').eq('device_id', userId),
      supabase.from('scholarship_alerts').select('*').eq('device_id', userId),
      supabase.from('scholarship_messages').select('*').eq('sender_id', userId),
      supabase.from('scholarship_profiles').select('*').eq('user_id', userId).single(),
      supabase.from('student_profiles').select('*').eq('user_id', userId).single(),
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      user_id: userId,
      data: {
        profile: profile || null,
        scholarship_applications: applications || [],
        scholarship_favorites: favorites || [],
        scholarship_alerts: alerts || [],
        scholarship_messages: messages || [],
        scholarship_profile: scholarshipProfile || null,
        student_profile: studentProfile || null,
      },
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="elimux-data-export-${userId}.json"`);
    return res.status(200).json(exportData);
  } catch (error) {
    console.error('Data export error:', error);
    return res.status(500).json({ error: 'Failed to export data' });
  }
});

export default router;
Task 2 — Mount the route:
In elimux-backend/src/index.ts, add:
TypeScript
import userExportRouter from './routes/user-export';
And mount it BEFORE the general route handlers:
TypeScript
app.use('/api/user', userExportRouter);
Task 3 — Verify the route is protected:
Confirm requireUser middleware is used (not public access).
Confirm the endpoint returns 401 if no valid Bearer token is provided.
Task 4 — Build check:
Run npm run build in elimux-backend. Must pass with zero errors.
Task 5 — Live verify (after deploy):
Run: curl -H "Authorization: Bearer <valid_token>" https://api.elimux.ke/api/user/export-data
Should return JSON with exported_at, user_id, and data fields.
Acceptance Criteria:
[ ] Route file created at src/routes/user-export.ts
[ ] Route mounted at /api/user/export-data
[ ] Protected by requireUser middleware
[ ] Returns all user data in JSON format
[ ] Sets Content-Disposition: attachment header for download
[ ] Returns 401 without valid auth token
[ ] npm run build passes in elimux-backend
Risk: DO NOT include other users' data. Every query must filter by the authenticated user's ID. DO NOT include sensitive system fields (password hashes, admin keys, etc.) — only user-facing tables.
===END===