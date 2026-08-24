QUICK FIX — MAKE TVET COUNT AUTO-UPDATE WITH "LIVE" INDICATOR (execute immediately, no questions)

In src/app/programs/page.tsx, where `tvetTotalCount` is fetched:

1. AUTO-REFETCH: Add a `setInterval` that re-fetches the count every 30 seconds while the user is on the page. This way, as your scraper adds new institutions, the number ticks up without requiring a refresh.

   useEffect(() => {
     // existing fetch
     fetchCount();
     // auto-refresh every 30 seconds
     const interval = setInterval(fetchCount, 30000);
     return () => clearInterval(interval);
   }, []);

2. "LIVE" INDICATOR: Add a small pulsing green dot next to the count so users know it's a real, updating number:

   <span className="relative flex h-2 w-2">
     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
     <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
   </span>

   Position it immediately before the number: 🛡️ [dot] "Discover 1,121 programs..."

3. CLEANUP: Ensure the interval is cleared on unmount to prevent memory leaks.

After change:
- npx tsc --noEmit
- npm run build
- npx next start
- Verify: Open /programs?type=tvet, see the green pulsing dot, and confirm the count refreshes every 30 seconds.

DO NOT commit. DO NOT push.