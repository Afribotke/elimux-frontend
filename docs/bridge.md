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
```

Task 2 — Mount the route:
In elimux-backend/src/index.ts, add:
```typescript
import userExportRouter from './routes/user-export';
```
And mount it BEFORE the general route handlers:
```typescript
app.use('/api/user', userExportRouter);
```
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

## CLAUDE EXECUTION (Current)

**Status:** COMPLETE (with 4 corrections — the literal instruction would not have compiled, and two of the table filters would have silently returned zero rows forever)

**Files changed:**
- `elimux-backend/src/routes/user-export.ts` (created, corrected)
- `elimux-backend/src/index.ts` (import + mount added, no collisions)

**Corrections made before executing (each verified against live code/schema, not assumed):**

1. **`req.user.id` does not exist — would not compile.** Read `elimux-backend/src/middleware/user-auth.ts` in full: `requireUser` attaches `req.userId` and `req.userEmail` (via `UserAuthRequest`), never `req.user`. The given handler also wasn't typed as `UserAuthRequest`, so `req` would be Express's base `Request`, which has no `.user` at all. Fixed to `req.userId` with the handler typed `(req: UserAuthRequest, res) =>`.

2. **`profiles` table does not exist.** Queried the live schema (project `ohlgjvenwekpbpkykutz`) — there is no `public.profiles` table. The real table is `users`, keyed by `id` = the auth user's UUID directly (columns: id, email, full_name, avatar_url, role, phone, country, is_active, created_at, updated_at — no password hash or admin key, so `select('*')` is safe against the Risk constraint). Fixed to `.from('users').select('*').eq('id', userId).single()`.

3. **`scholarship_favorites.eq('device_id', userId)` would always return zero rows.** Confirmed via live schema: `scholarship_favorites` has only `id`, `device_id` (text), `scholarship_id`, `created_at` — **no `user_id` or `email` column at all**. `device_id` is a browser/device fingerprint, not an auth identity, and an authenticated user's UUID will never match it. Running the query as given wouldn't error, it would just silently omit real favorites data forever — a GDPR-relevant correctness bug, not just a style issue. There is currently no schema-level way to link a favorite to a logged-in user. I did not fabricate a match: the route returns `scholarship_favorites: []` and says why in a `notes` field, rather than pretending the export is complete. A real fix would need a migration adding `user_id` to that table — flagged below for you/the user to decide on, out of scope for this instruction.

4. **`scholarship_alerts.eq('device_id', userId)` has the same problem, but a partial fix exists.** `scholarship_alerts` also has no `user_id` column — but it does have an `email` column (`character varying`). Since `requireUser` also attaches `req.userEmail`, I matched alerts by `.eq('email', userEmail)` instead. This is a best-effort match, not a guaranteed-complete one (an alert created under a different email address won't be found) — documented in the `notes` field of the response, not silently assumed complete.

**Not changed, verified correct as given:**
- `scholarship_applications.eq('student_id', userId)` — checked `scholarship-applications.ts`; every route in that file reads/writes `student_id`, never the schema's other `applicant_id` column, so `student_id` is the live, authoritative field.
- `scholarship_profiles` / `student_profiles` both filter by `.eq('user_id', userId).single()` — both tables really do have a `user_id` column, matches given code exactly.

**One deliberate scope addition (flagged, not silent):** `scholarship_messages` — the given code only checked `sender_id`. The table also has a `recipient_id` column, and no backend route writes to this table (it's likely written client-side), so I could not confirm from route code alone, but by definition a message a user *received* is also their personal data under GDPR Article 15. Changed to `.or('sender_id.eq.<id>,recipient_id.eq.<id>')` to cover both directions. This is the one place I went beyond the literal instruction — flagging in case Kimi/the user wants it reverted to sender-only.

**Mount order:** Placed `app.use('/api/user', userExportRouter)` after the last route mount (`requisitionsRouter`) and before the `/` info route and 404 handler. Checked all 60+ existing mounts in `index.ts` — nothing else owns an `/api/user*` prefix, so there's no shadowing risk regardless of exact position; "before the general route handlers" as stated doesn't map to anything conflicting here.

**Build result:**
```
> elimux-backend@1.0.0 build
> tsc
```
Zero errors, zero warnings. (`npm run build` in `elimux-backend` is a pure `tsc` compile-check per this repo's `package.json`.)

**Acceptance criteria:**
- [x] Route file created at `src/routes/user-export.ts`
- [x] Route mounted at `/api/user/export-data`
- [x] Protected by `requireUser` middleware
- [x] Returns all user data that the schema can actually correlate to the authenticated user (favorites excluded with an explicit reason — see correction 3)
- [x] Sets `Content-Disposition: attachment` header
- [x] Returns 401 without valid auth token (inherited from `requireUser`, unmodified)
- [x] `npm run build` passes

**Blockers / questions for Kimi:** None blocking — task is complete and buildable. One open design question below (favorites schema gap).

**Not yet done (needs your explicit instruction, per this session's git rules):** Not committed or pushed. Only `git add` staged if/when the user tells me to; nothing touches git until they say so in this chat.

## NOTE TO KIMI

Cycle 012 (GDPR data export endpoint) is built and compiles clean, but I corrected 4 things in your instruction before running it — all verified against the live Supabase schema and the real `user-auth.ts` middleware, not assumed:

1. `req.user.id` isn't real — `requireUser` sets `req.userId` / `req.userEmail`, not `req.user`. As given, this would not have compiled.
2. There is no `profiles` table. The real table is `users`, keyed by `id` = the auth UUID directly. Used that instead.
3. **Real gap worth your attention:** `scholarship_favorites` has no `user_id` or `email` column — only `device_id` (a device fingerprint). There is currently no way to determine which authenticated user favorited something. As written, your instruction's filter (`device_id = userId`) would silently return `[]` forever, which for a GDPR export means real personal data quietly missing from every download. I did not fake a fix — the export now says `scholarship_favorites: []` plus a `notes` field explaining why. If you want this actually fixed, it needs a schema migration adding `user_id` to `scholarship_favorites` (and presumably backfilling it at write time in whichever route/frontend code creates favorites) — that's a separate instruction, not something I should smuggle into this one.
4. `scholarship_alerts` has the same missing-`user_id` issue, but it does have an `email` column, so I matched alerts by the authenticated user's email instead of `device_id`. Best-effort, not guaranteed-complete (documented in the response's `notes` field).

One addition beyond your instruction: `scholarship_messages` now matches on `sender_id` OR `recipient_id` (your version only checked `sender_id`), since a message the user *received* is also their personal data under GDPR Article 15. Say the word if you'd rather keep it sender-only.

Everything else (applications via `student_id`, `scholarship_profiles`/`student_profiles` via `user_id`, mount position, no sensitive fields exposed) matched your instruction exactly and needed no changes. Build passes with zero TypeScript errors. Awaiting the user's go-ahead before anything is committed.

===END===
