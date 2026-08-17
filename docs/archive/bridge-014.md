===START===

## KIMI DESIGN (Current)

# INSTRUCTION 014: Add GDPR account deletion endpoint

**Background:** GDPR Article 17 requires users to delete their personal data. Cycle 012 built the export endpoint. This completes the pair. The endpoint anonymizes user-generated content (reviews, messages) rather than destroying it, deletes personal profiles, and cancels active subscriptions.

**Task 1 — Create deletion route:**
Create `elimux-backend/src/routes/user-delete.ts` with this content:

```typescript
import { Router } from 'express';
import { requireUser } from '../middleware/user-auth';
import { supabase } from '../lib/supabase';

const router = Router();

router.delete('/delete-account', requireUser, async (req, res) => {
  const userId = req.userId;

  try {
    // 1. Anonymize messages (keep conversation history, remove identity)
    await supabase
      .from('scholarship_messages')
      .update({ sender_id: null, sender_type: 'deleted_user' })
      .eq('sender_id', userId);

    // 2. Delete scholarship applications (user-owned, no public value)
    await supabase
      .from('scholarship_applications')
      .delete()
      .eq('student_id', userId);

    // 3. Delete scholarship profile
    await supabase
      .from('scholarship_profiles')
      .delete()
      .eq('user_id', userId);

    // 4. Delete student profile
    await supabase
      .from('student_profiles')
      .delete()
      .eq('user_id', userId);

    // 5. Delete M-Pesa transactions (if any exist)
    await supabase
      .from('mpesa_transactions')
      .delete()
      .eq('user_id', userId);

    // 6. Delete Paystack payments (if any exist)
    await supabase
      .from('payments')
      .delete()
      .eq('subscriber_id', userId);

    // 7. Delete user record from users table
    await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    // 8. Delete auth user from Supabase Auth (requires service role)
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (authError) {
      console.error('Supabase auth deletion error:', authError);
      // Continue — data is already gone, auth cleanup is best-effort
    }

    return res.status(200).json({
      success: true,
      message: 'Account and personal data deleted. Some anonymized records may remain for legal/operational purposes.',
      deleted_at: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Account deletion error:', error);
    return res.status(500).json({ error: 'Failed to delete account. Please contact support.' });
  }
});

export default router;
Task 2 — Mount the route:
In elimux-backend/src/index.ts, add:
TypeScript
import userDeleteRouter from './routes/user-delete';
And mount:
TypeScript
app.use('/api/user', userDeleteRouter);
Confirm this does NOT collide with the export route from Cycle 012 (/api/user/export-data). Both should share the /api/user prefix.
Task 3 — Verify no collision:
Confirm export-data (GET) and delete-account (DELETE) are different methods and paths. No shadowing.
Task 4 — Build check:
Run npm run build in elimux-backend. Must pass with zero errors.
Task 5 — Live verify (after deploy):
Run: curl -X DELETE -H "Authorization: Bearer <valid_token>" https://api.elimux.ke/api/user/delete-account
Should return 200 with { success: true }.
Acceptance Criteria:
[ ] Route file created at src/routes/user-delete.ts
[ ] Route mounted at /api/user/delete-account
[ ] Protected by requireUser middleware
[ ] Returns 401 without valid auth token
[ ] Deletes applications, profiles, payments, and user record
[ ] Anonymizes messages (sets sender_id to null, sender_type to 'deleted_user')
[ ] Attempts Supabase Auth user deletion
[ ] Returns 200 with success message on completion
[ ] Returns 500 with contact-support message on failure
[ ] npm run build passes in elimux-backend
Risk: DO NOT delete other users' data. Every query must filter by req.userId. DO NOT delete scholarship_favorites (no user_id column, only device_id — cannot link to user). The users table is users not profiles (confirmed in Cycle 012).
===END===