Cycle: PWA Offline Queue End-to-End Audit & Fix
Context: The audit found offline_cache and queued_actions tables are actively used by BackgroundSyncManager, useBackgroundSync, and /api/pwa/queue — but both tables have 0 rows. This cycle traces the full code path to find out why, fixes any broken links, and verifies the offline queue actually works.
Step 1 — Trace the full client-side queue path
Read these files in order and report the exact flow:
public/sw.js — Show the first 80 lines. What events trigger background sync? What does it do when sync fires? Does it call any API endpoint or just use Cache API?
src/lib/pwaQueue.ts — Show the full file. What methods exist? Does it write to IndexedDB, localStorage, or call a backend API? What triggers a queue flush?
src/hooks/useBackgroundSync.ts — Show the full file. What does it do on mount? Does it call apiGetQueue() or any backend endpoint? What happens if the user is offline?
src/components/BackgroundSyncManager.tsx — Show the full file. How does it use the hook? What conditions trigger sync?
src/components/OfflineIndicator.tsx — Show the full file. What does it display? Does it trigger any sync actions?
src/components/ServiceWorkerRegister.tsx — Show the full file. How does it register the SW? Does it set up any sync listeners?
Report: For each file, state: reads from backend / writes to backend / client-side only / not involved in queue.
Step 2 — Trace the backend queue path
Read these files and report:
elimux-backend/src/routes/pwa.ts — Show the full file. What endpoints exist? What do they read/write? Do they touch offline_cache, queued_actions, or both? What auth do they require?
elimux-backend/src/index.ts — Confirm the mount path for the PWA router. Show the exact line.
Check if any other backend files reference offline_cache or queued_actions:
bash
grep -r "offline_cache\|queued_actions" elimux-backend/src/ --include="*.ts" -l
Report: List every endpoint, its method, what table it touches, and what auth it requires.
Step 3 — Identify the disconnect
Based on the code reads, answer these questions:
Does the service worker ever call /api/pwa/queue or any backend endpoint? Or does it only use Cache API and IndexedDB?
Does pwaQueue.ts ever POST queued actions to the backend? Or does it only store them client-side and retry them directly against their original API endpoints (e.g., re-POST a failed scholarship application directly to /api/scholarships/apply)?
Does useBackgroundSync call apiGetQueue() on every page load? What does apiGetQueue() do — does it read from queued_actions table or from client-side storage?
If the backend endpoints exist but are never called, why? Is the queue logic entirely client-side (pwaQueue.ts + SW) with the backend tables being dead code? Or is there a missing bridge (e.g., pwaQueue.ts should POST to /api/pwa/queue but doesn't)?
Report: The exact reason the tables are empty. State one of:
"Backend tables are dead code" — client-side queue handles everything, backend endpoints exist but are never called by any client code.
"Backend tables are missing a bridge" — client-side queue should POST to backend but the code to do so is missing/broken.
"Backend tables are conditionally triggered" — they only write during genuine offline events, which haven't happened in production.
"Backend code is broken" — the client tries to call the backend but errors prevent writes.
Step 4 — Fix based on the diagnosis
If "Backend tables are dead code":
Remove the backend PWA router (elimux-backend/src/routes/pwa.ts) and its mount in index.ts.
Remove offline_cache and queued_actions tables via migration.
Keep the client-side queue (pwaQueue.ts, sw.js, useBackgroundSync) as the sole offline mechanism — it works without the backend tables.
Update BackgroundSyncManager and OfflineIndicator to remove any references to the backend queue endpoint.
If "Backend tables are missing a bridge":
Add the missing bridge in pwaQueue.ts or useBackgroundSync.ts:
When the queue flushes (user comes back online), POST failed actions to /api/pwa/queue for server-side persistence before retrying them.
OR: When actions are queued client-side, also POST them to /api/pwa/queue so the server knows about pending work.
Ensure the backend endpoints actually handle the POSTed data correctly (check if pwa.ts expects the right payload shape).
Update useBackgroundSync to read from /api/pwa/queue on mount and merge with client-side queue.
If "Backend tables are conditionally triggered":
Force a test: simulate offline in browser DevTools, perform an action that should queue (e.g., favorite a scholarship), come back online, and verify the queue flushes.
If the queue flushes correctly but never hits the backend tables, that confirms they're dead code. Apply the "dead code" fix.
If the queue doesn't flush at all, fix the flush logic.
If "Backend code is broken":
Fix the specific error (wrong payload shape, auth failure, SQL error, etc.).
Re-verify with the test from Step 5.
Step 5 — Verify end-to-end
Test procedure:
Open https://www.elimux.ke/ in Chrome DevTools.
Go to Network tab → set Throttling to Offline.
Navigate to a page that triggers a queueable action (e.g., try to favorite a scholarship, or try to apply to an internship).
Confirm the action is queued (check pwaQueue.ts logs, localStorage, or IndexedDB).
Confirm OfflineIndicator shows the offline state.
Turn Throttling back to Online.
Confirm the queue flushes — the action retries and succeeds.
Check the backend: query queued_actions and offline_cache to see if rows were written.
sql
SELECT COUNT(*) FROM queued_actions;
SELECT COUNT(*) FROM offline_cache;
Report: PASS or FAIL for each step. If any step fails, describe exactly what happened vs. what was expected.
Step 6 — Build, deploy, final verify
If backend changes were made: npm run build → push → Railway deploy.
If frontend changes were made: npm run build → vercel --prod.
Re-run the offline/online test on the live site.
Confirm the tables either have rows (if the bridge was fixed) or no longer exist (if dead code was removed).
Report format
plain
=== PWA OFFLINE QUEUE AUDIT & FIX ===

CLIENT-SIDE CODE PATH:
- sw.js: [reads backend / writes backend / client-only / not involved]
- pwaQueue.ts: [reads backend / writes backend / client-only / not involved]
- useBackgroundSync.ts: [reads backend / writes backend / client-only / not involved]
- BackgroundSyncManager.tsx: [reads backend / writes backend / client-only / not involved]
- OfflineIndicator.tsx: [reads backend / writes backend / client-only / not involved]
- ServiceWorkerRegister.tsx: [reads backend / writes backend / client-only / not involved]

BACKEND ENDPOINTS:
- [method] [path]: touches [table], auth: [type]

DIAGNOSIS:
- Root cause: [dead code / missing bridge / conditional trigger / broken code]
- Explanation: [2-3 sentences]

FIX APPLIED:
- [exact changes made]

VERIFICATION:
- Offline simulation: [PASS / FAIL]
- Queue persistence: [PASS / FAIL]
- Queue flush on reconnect: [PASS / FAIL]
- Backend tables updated: [PASS / FAIL / N/A — tables removed]
- Live site re-test: [PASS / FAIL]

OVERALL: [PASS / FAIL]
Do not proceed to any other feature until this cycle is verified complete.