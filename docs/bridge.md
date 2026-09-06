CYCLE 177-B — COMMITTED, PUSHED, DEPLOYED, LIVE-VERIFIED. On explicit "commit and push it"
instruction, following the staged-not-committed report already written for this cycle
(`docs/archive/bridge-177b-staged-report.md`).

Archived: the prior "staged, not committed" report is `docs/archive/bridge-177b-staged-report.md`.

WHAT'S NOW LIVE ON www.elimux.ke / elimux.ke

Frontend commit `963848b`, deployed as `elimux-frontend-etn5gd6rj` (confirmed via `vercel inspect`
- aliased to `www.elimux.ke`, `elimux.ke`, `v2.elimux.ke`, `bursary.elimux.ke`). Docs commits
`5d3c2dc` (the staged-not-committed report) and this one, both already on `main`.

1. **Institution permission consolidation** - `institution_accounts.status='active'` is now the
   real, single source of truth the alerts routes and attachment-upload route resolve against too
   (previously two other, unreconciled mechanisms - `institutions.admin_user_id` and `users.role`
   - found by Cycle 177's audit). Attachment upload keeps its original `admin`/`super_admin`
   platform-role fallback rather than silently losing that access.
2. **Database**: `institution_accounts` now has real RLS policies (own-row SELECT/UPDATE) where
   it previously had none (deny-all for any non-service-role client) - confirmed live via
   `pg_policies`, 2 rows. `institutions.admin_user_id` backfill ran clean (0 rows affected - no
   real claims exist yet in production, so nothing needed backfilling; a forward-looking safety
   net, not a fix to existing broken data).
3. **Navigation**: the institution dashboard, Alerts, and (renamed) Link Performance pages now
   share a real sidebar layout - all three were previously reachable only by typing the exact URL,
   with zero links between them anywhere in the app.
4. **Analytics naming collision resolved**: the dashboard's own "Analytics" tab (profile views/
   applications/programs) and the separate smart-link-click-tracking page (also called
   "Analytics") no longer share a name - the latter is now "Link Performance"
   (`/institution/dashboard/link-performance`); the old URL redirects there automatically.

VERIFIED LIVE, NOT JUST DEPLOYED
`curl -L https://www.elimux.ke/institution/dashboard/link-performance` -> 200 (confirms the new
route is genuinely serving on production, not just present in the build output).

STILL OPEN, CARRIED FORWARD - not resolved by this cycle, restating so nothing gets lost
1. **`trending_alerts` doesn't exist anywhere in this database** - confirmed via
   `information_schema` across all schemas before this cycle touched anything, and confirmed
   nothing in either repo creates or writes to it. The Alerts feature (Cycle 028) has almost
   certainly 500'd on every real call since it shipped, masked as "no alerts yet" by the
   frontend's own empty `.catch()`. This cycle's permission fix makes the *check* consistent with
   the rest of the app but cannot make Alerts actually load data - that needs its own decision:
   build the table + a real data source, or retire the feature.
2. Sidebar rendering, nav active-states, and sign-out are unverified in a real logged-in session -
   this whole session is structurally unable to complete that check (entering a password into any
   field, even a disposable test account, is a hard rule here, confirmed blocked by the harness's
   own classifier when attempted in Cycle 176-C-BD). Needs a human with real login credentials to
   click through once.
3. Everything else already carried forward from Cycles 170-177: `feature/skills-toggle` branch
   (real unmerged work, untouched), `pre-theme-sweep-backup` stash (kept, still needs a proper
   audit), 2 unexplained Vercel-integration branches on `origin`.
