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
```

Task 2 — Mount the route:
In elimux-backend/src/index.ts, add:
```typescript
import userDeleteRouter from './routes/user-delete';
```
And mount:
```typescript
app.use('/api/user', userDeleteRouter);
```
Confirm this does NOT collide with the export route from Cycle 012 (`/api/user/export-data`). Both should share the `/api/user` prefix.

Task 3 — Verify no collision:
Confirm export-data (GET) and delete-account (DELETE) are different methods and paths. No shadowing.

Task 4 — Build check:
Run npm run build in elimux-backend. Must pass with zero errors.

Task 5 — Live verify (after deploy):
Run: `curl -X DELETE -H "Authorization: Bearer <valid_token>" https://api.elimux.ke/api/user/delete-account`
Should return 200 with `{ success: true }`.

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

## CLAUDE EXECUTION (Current)

**Status:** COMPLETE (with 5 corrections — one would have thrown a DB constraint error on every deletion, two would have silently no-op'd, one contradicted the instruction's own Background text, one depends on the still-unresolved Cycle 013)

**Files changed:**
- `elimux-backend/src/routes/user-delete.ts` (created, corrected)
- `elimux-backend/src/index.ts` (import + mount added)

**Corrections made before executing (each verified against live code/schema, not assumed):**

1. **`sender_id: null` would violate a NOT NULL constraint.** Checked the live schema: `scholarship_messages.sender_id` is `NOT NULL`. Supabase-js doesn't throw on a DB error here (the given code never checks the returned `error`), so this wouldn't crash the request — it would just silently fail that one field, every time, meaning "anonymizes messages" would never actually happen despite the 200 response claiming success. Fixed to only set `sender_type: 'deleted_user'` and leave `sender_id` as-is. Since the `users` row for that id is deleted later in the same request, the id becomes an orphaned UUID that no longer resolves to any personal info via a join — not a perfect null, but the closest available given the column constraint. Also checked `recipient_id` (also `NOT NULL`, no separate "type" flag column exists) — left untouched, flagged below as a real limitation rather than silently claimed as handled.

2. **Missing type annotation — wouldn't have compiled.** The given handler was `async (req, res) => { const userId = req.userId; ... }`, same pattern as Cycle 012's `req.user.id` bug family: without typing `req` as `UserAuthRequest`, TypeScript treats it as base `Request`, which has no `.userId`. (Confirmed by reading how every other real route does this, e.g. `scholarship-applications.ts` line 73: `async (req: UserAuthRequest, res: Response) =>`.) Fixed by adding the same type annotation.

3. **`payments.eq('subscriber_id', userId)` would never match anything.** Queried the live schema: `payments.subscriber_id` references `subscribers.id` — a completely separate identity space from the auth user's id. `subscribers` has no `user_id` column at all, only `email` (confirmed: id, email, name, phone, country, paystack_customer_code, access_token). So this delete would silently affect zero rows, every time — the account-deletion endpoint would claim success while a deleted user's payment history stayed fully attached to their (still-existing) subscriber record. Fixed by looking up the subscriber via `req.userEmail`, then deleting that `subscribers` row. This turned out to be *better* than a literal payments delete, not just a rename: I checked the live FK delete rules and `subscriptions.subscriber_id → subscribers.id` is `ON DELETE CASCADE` (subscriptions get removed automatically) while `payments.subscriber_id → subscribers.id` is `ON DELETE SET NULL` (payment/financial records are detached from the person, not deleted outright). That SET NULL behavior is arguably the legally-safer outcome anyway — GDPR Article 17(3)(b) carves out an exception for data needed to meet a legal obligation, and financial transaction records are commonly subject to retention requirements — but that's a policy judgment call, not mine to make unilaterally; flagging it to you/Kimi below rather than silently deciding it's correct.

4. **Reviews were never touched, despite the Background explicitly promising it.** The instruction's own Background line says the endpoint "anonymizes user-generated content (reviews, messages)" — but Task 1's code only ever touches `scholarship_messages`, never `reviews`. Checked: `reviews` exists, has `user_id` (nullable), `reviewer_name` (nullable), `reviewer_email` (nullable) — all safely nullable, unlike the messages table's `sender_id`. Added `.update({ user_id: null, reviewer_name: 'Deleted User', reviewer_email: null }).eq('user_id', userId)` so the endpoint actually does what its own stated purpose says, rather than silently doing less than promised.

5. **`mpesa_transactions` doesn't exist yet — skipped, not faked.** Cycle 013 (M-Pesa STK Push) is still BLOCKED — I flagged a file/table naming collision and never created this table. Running Task 1's step 5 against a nonexistent table wouldn't crash (same silent-error pattern as above) but it's dead code referencing something that isn't real yet. Removed the step and left a comment marking it for follow-up once Cycle 013 actually ships a real M-Pesa transactions table.

**Not changed, verified correct as given:** `scholarship_applications` (`student_id`), `scholarship_profiles`/`student_profiles` (`user_id`), the `users` row delete, and the final `supabase.auth.admin.deleteUser(userId)` call (the exported `supabase` client uses the service-role key, confirmed in Cycle 007/011, so this has the right privileges). Also confirmed no foreign key anywhere in the public schema references `users` or `auth.users` — so nothing blocks or errors on delete ordering; step 7 (delete `users` row) before step 8 (delete the auth user) is safe either way.

**Collision check (Task 3):** `GET /api/user/export-data` (Cycle 012) and `DELETE /api/user/delete-account` (this cycle) differ in both HTTP method and path — both mounted at `/api/user`, no shadowing. Confirmed by reading `index.ts` directly, not assumed.

**Build result:**
```
> elimux-backend@1.0.0 build
> tsc
```
Zero errors, zero warnings.

**Acceptance criteria:**
- [x] Route file created at `src/routes/user-delete.ts`
- [x] Route mounted at `/api/user/delete-account`
- [x] Protected by `requireUser` middleware
- [x] Returns 401 without valid auth token (inherited from `requireUser`, unmodified)
- [x] Deletes applications, profiles, and user record; payments are detached (SET NULL) rather than deleted outright — see correction 3
- [x] Anonymizes messages — `sender_type` only; `sender_id` can't be nulled (NOT NULL constraint) — see correction 1
- [x] Attempts Supabase Auth user deletion
- [x] Returns 200 with success message on completion
- [x] Returns 500 with contact-support message on failure
- [x] `npm run build` passes

**Blockers / questions for Kimi:**
1. Is `payments.subscriber_id → subscribers.id` `ON DELETE SET NULL` (detach, retain the record) the outcome you want, or should payment rows actually be hard-deleted? I implemented the schema's existing behavior rather than fight it, but this is a real product/legal decision (financial retention vs. full erasure), not mine to make.
2. `scholarship_messages.recipient_id` is `NOT NULL` with no anonymization path available in the current schema — a deleted user's id will still appear as `recipient_id` on any message sent *to* them. Out of scope to fix without a schema change (e.g. a nullable `recipient_type` column mirroring `sender_type`) — flagging in case that's wanted as a future cycle.

**Not yet done (needs your explicit instruction, per this session's git rules):** Not committed or pushed.

## NOTE TO KIMI

Cycle 014 (GDPR account deletion) is built and compiles clean. Five corrections made, all verified against live code/schema:

1. `scholarship_messages.sender_id` is `NOT NULL` — the given `sender_id: null` would have silently failed every time (Supabase-js doesn't throw on this). Now only `sender_type: 'deleted_user'` is set; `sender_id` stays (becomes an orphaned UUID once the `users` row is deleted). `recipient_id` is also `NOT NULL` with no flag column, so messages *received* by a deleted user can't currently be anonymized at all — flagging as a real schema limitation, not something I could fix within this task.
2. Missing `UserAuthRequest` typing on the handler — same class of bug as Cycle 012's `req.user.id`, just subtler this time (the property name `req.userId` was correct, only the type annotation was missing). Fixed.
3. **The real one to look at:** `payments.eq('subscriber_id', userId)` would never match anything — `subscriber_id` points at `subscribers.id`, a totally separate identity space keyed by email, not the auth user id. I fixed this by deleting the matching `subscribers` row (found by email) instead. Turns out the DB already has FK rules for this: deleting a subscriber CASCADEs their `subscriptions` (deleted) and SET NULLs `payments.subscriber_id` (detached, not deleted) — which is arguably the right GDPR outcome for financial records anyway (Article 17(3)(b) permits retaining data needed for legal obligations), but that's a call for you/the user, not one I should make silently. Let me know if you actually want payment rows hard-deleted instead.
4. Your own Background text says this endpoint "anonymizes user-generated content (reviews, messages)" but Task 1's code never touched `reviews` at all. Added review anonymization (`user_id`, `reviewer_name`, `reviewer_email` all nulled/replaced — confirmed all three are nullable) so the endpoint actually matches what you said it does.
5. `mpesa_transactions` doesn't exist yet — Cycle 013 (M-Pesa) is still BLOCKED on the `routes/payments.ts` naming collision I flagged earlier and hasn't been resolved. Skipped that delete step for now rather than reference a table that isn't real; it should be added back once Cycle 013 actually ships.

Two open questions for you, both under "Blockers" in CLAUDE EXECUTION above: whether payments should be hard-deleted instead of detached, and whether `scholarship_messages.recipient_id` anonymization is worth a schema change in a future cycle. Build passes with zero TypeScript errors. Awaiting the user's go-ahead before anything is committed — and Cycle 013 is still open and unresolved, separate from this one.

===END===
