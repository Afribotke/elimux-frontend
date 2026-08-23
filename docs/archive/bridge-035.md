=== PWA OFFLINE QUEUE AUDIT & FIX ===

CLIENT-SIDE CODE PATH:
- sw.js: not involved in backend queue writes. Its 'sync' event handler (event.tag === 'elimux-sync') only broadcasts a postMessage to open clients when connectivity returns — a best-effort accelerator for browsers that support Background Sync (not Safari/iOS). It never itself calls any backend endpoint or touches Cache API for the queue; static-asset/API response caching (cacheFirst/networkFirst/staleWhileRevalidate) is a separate, unrelated concern in the same file.
- pwaQueue.ts: writes backend (POST /api/pwa/queue) with a client-only fallback. queueAction() first tries POST /api/pwa/queue; on any failure (including genuine offline, since that POST is itself a network call) it falls back to bufferActionLocally() — writes to localStorage only in that case.
- useBackgroundSync.ts: reads backend (GET /api/pwa/queue) and writes backend (POST /api/pwa/sync). On mount and on every 'online' event it calls apiGetQueue() (GET /api/pwa/queue) to refresh a pending count. On 'online' it also calls flushLocalBuffer(), which re-attempts queueAction() for anything buffered locally while offline. syncPendingActions(replay) — invoked by BackgroundSyncManager — reads the server queue, replays each action via a caller-supplied function, and calls apiMarkSynced() (POST /api/pwa/sync) once all replays in the batch succeed.
- BackgroundSyncManager.tsx: writes backend (indirectly, via useBackgroundSync). Mounted once in the root layout. Owns the actual replay logic (replayAction) — knows how to redo each action_type (favorite -> addFavorite/removeFavorite, review -> createReview, application -> applyProgram) — and calls syncPendingActions(replayAction) automatically whenever isOnline && pendingCount > 0.
- OfflineIndicator.tsx: client-side only, not involved in the queue. Just shows/hides a banner based on navigator.onLine + online/offline events. Deliberately does not reuse useBackgroundSync (documented as "mount exactly once" — a second mount previously caused duplicate-flush races).
- ServiceWorkerRegister.tsx: client-side only, not involved. Just calls navigator.serviceWorker.register('/sw.js') on mount. The 'elimux-sync' background-sync tag registration itself happens in useBackgroundSync.ts's registerBackgroundSync(), not here.

BACKEND ENDPOINTS (elimux-backend/src/routes/pwa.ts, mounted at app.use('/api/pwa', pwaRouter) in index.ts:156):
- POST /subscribe: touches push_subscriptions, auth: public (device-scoped)
- DELETE /subscribe: touches push_subscriptions, auth: public
- POST /notify: touches push_subscriptions (read) + sends via webpush, auth: adminAuth
- POST /queue: touches queued_actions (insert), auth: public
- GET /queue: touches queued_actions (read, filtered pending), auth: public
- POST /sync: touches queued_actions (bulk update to synced), auth: public
- POST /cache, GET /cache: REMOVED this cycle — see below.
No other backend file references either table (confirmed: grep -rn "offline_cache\|queued_actions" across elimux-backend/src only ever matches pwa.ts, plus one unrelated comment in scraper.ts referencing queued_actions purely as a documentation analogy for a different table's CHECK constraint).

DIAGNOSIS: Split — the two tables warrant genuinely different diagnoses, which the original audit conflated.
- queued_actions: "Backend tables are conditionally triggered." Fully wired end-to-end and PROVEN correct with a real live test this cycle (see Step 5 below) — it only writes during genuine offline events, which real users simply haven't triggered yet in production. Not dead code, not a missing bridge, not broken.
- offline_cache: "Backend tables are dead code." Exhaustively confirmed zero frontend callers for either endpoint under any plausible naming (grepped for "offline_cache", "pwa/cache", "pwaCache", "cacheOffline", "saveOfflineCache", "getOfflineCache" across all of elimux-frontend/src — none found). The backend endpoints existed and worked correctly in isolation, but nothing in the app has ever called them.

Note on a stale/misleading code comment found during this audit: src/lib/pwaDevice.ts carried a comment claiming "confirmed with Playwright: context.setOffline(true), click favorite, go back online, GET /api/pwa/queue came back empty — the queue call had silently failed too," implying the reconnect-flush path was broken. This cycle's real, live re-test (below) directly contradicts that — the full chain worked correctly within about 6 seconds of going back online. Most likely explanation: that earlier test checked the backend before the async flush->replay->sync chain had time to complete (a real race in the *test*, not the app), or the underlying code has since been fixed and the comment was never updated. Left the comment as-is (correcting stale comments was out of scope for this cycle), but flagging it here in case it misleads a future audit the way it nearly did this one.

FIX APPLIED:
- offline_cache: dropped via elimux-sql/51_drop_dead_offline_cache_table.sql (applied live, confirmed 0 rows immediately before dropping). Removed its two backend routes (POST/GET /api/pwa/cache) from pwa.ts. No frontend changes needed — nothing referenced them.
- queued_actions: no fix applied — working as designed. Left completely untouched (routes, table, all client code).

VERIFICATION (live, real simulation on www.elimux.ke via Claude in Chrome — not local devtools, the actual production site):
- Offline simulation: PASS. Navigated to a real institution page, overrode window.fetch to reject with TypeError (matching the exact failure mode FavoriteButton.tsx checks for) and forced navigator.onLine to false, then clicked the real "Add to favorites" button.
- Queue persistence: PASS. localStorage's elimux-local-pending-actions correctly held the buffered action ({action_type: "favorite", payload: {item_id, item_type: "institution", action: "add"}}) immediately after the click. Confirmed queued_actions was still 0 rows for this device at this point (correct — genuinely can't reach the server while offline).
- Queue flush on reconnect: PASS. Restored fetch, set navigator.onLine back to true, dispatched a real 'online' event. Within ~3 seconds the local buffer was cleared (localStorage key removed) and a real row appeared in queued_actions with status "synced" and a synced_at timestamp ~6 seconds after creation — confirming flushLocalBuffer -> POST /api/pwa/queue -> BackgroundSyncManager's auto-triggered syncPendingActions -> real replay (a genuine row was also written to user_favorites, proving the actual favorite action was re-executed, not just the queue bookkeeping) -> POST /api/pwa/sync all fired correctly in sequence.
- Backend tables updated: PASS for queued_actions (proven above) / N/A for offline_cache — tables removed intentionally, not because a write failed to occur.
- Live site re-test: PASS — the above test was run directly against the live production site (www.elimux.ke / api.elimux.ke), not a local or staging environment.
- Cleanup: deleted the test queued_actions row and the real user_favorites row the replay created; cleared the test device's localStorage state.

Backend deploy: commit dd68d04, Railway auto-deployed, confirmed healthy. Verified live: GET /api/pwa/cache now 404s (removed), GET /api/pwa/queue still 200 (untouched). Migration committed to elimux-sql (14f8eeb).
No frontend deploy needed this cycle — no frontend files changed.

OVERALL: PASS — audit complete, root cause definitively identified and confirmed by direct live testing (not just code reading), fix applied precisely where warranted (offline_cache removed) and precisely withheld where not warranted (queued_actions left alone, since it demonstrably works). The user was consulted before the destructive DROP TABLE step and explicitly approved it, given the much stronger evidence this cycle produced compared to the original audit's premise.
