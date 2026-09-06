BRIDGE-125 — PWA Identity Lock & Duplicate Cleanup
Cycle 050 — Manifest id Field + One-Time Cleanup Banner
________________________________________
0. AUDIT — Current State
Before touching anything, verify: - public/manifest.json exists and does NOT have an id field - public/manifest.json has start_url and scope values (record them) - src/app/layout.tsx or src/components/ServiceWorkerRegister.tsx exists - src/components/ directory exists - docs/archive/ has bridge-124.md (Cycle 048 archive) — if not, archive current docs/bridge.md first
________________________________________
1. MANIFEST — Lock App Identity with id Field
Edit public/manifest.json. Add "id": "/" as the FIRST field after the opening brace.
The file must look exactly like this (preserve all existing fields, only add id):
{
  "id": "/",
  "name": "ElimuX — Global Education Discovery",
  "short_name": "ElimuX",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#0f172a",
  "orientation": "portrait",
  "scope": "/",
  "icons": [
    { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
CRITICAL RULES — never violate these: - id must be "/" — set once, never change again - start_url must stay "/" forever — never change to /home, /index.html, etc. - scope must stay "/" forever - Manifest URL must stay /manifest.json forever — never rename - name and short_name CAN change freely after id is locked - Icons CAN change freely after id is locked
________________________________________
2. ONE-TIME CLEANUP BANNER — components/PWACleanupBanner.tsx
Create this file:
// src/components/PWACleanupBanner.tsx
'use client';

import { useEffect, useState } from 'react';

export default function PWACleanupBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show in standalone PWA mode (installed app)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (!isStandalone) return;

    // Check if user has already dismissed this banner
    const dismissed = localStorage.getItem('elimux-pwa-cleanup-dismissed');
    if (dismissed) return;

    setShow(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem('elimux-pwa-cleanup-dismissed', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-white px-4 py-3 shadow-lg">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="font-semibold text-sm">
            🧹 Clean Up Old ElimuX Shortcuts
          </span>
          <span className="text-xs text-amber-100">
            If you see duplicate ElimuX icons on your home screen, uninstall the old ones.
            This keeps your app always up to date automatically.
          </span>
        </div>
        <button
          onClick={dismiss}
          className="bg-white text-amber-600 px-3 py-1.5 rounded-md font-semibold text-sm hover:bg-amber-50 transition-colors shrink-0"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
________________________________________
3. INJECT BANNER INTO ROOT LAYOUT
In src/app/layout.tsx, add the import and render the banner.
Add import at the top:
import PWACleanupBanner from '@/components/PWACleanupBanner';
Add inside the <body> as the FIRST child (before everything else):
<body>
  <PWACleanupBanner />
  {/* existing children */}
</body>
________________________________________
4. VERIFY NO CONFLICTS WITH CYCLE 049 (PWA Auto-Update)
The Cycle 049 files must remain untouched: - src/hooks/usePWAUpdate.ts — leave as-is - src/components/PWAUpdateToast.tsx — leave as-is - public/sw.js — leave as-is (already has SKIP_WAITING handler)
This Cycle 050 only touches: - public/manifest.json (adds id field) - src/components/PWACleanupBanner.tsx (new file) - src/app/layout.tsx (adds one import + one component)
________________________________________
5. BUILD & VERIFY
5a. Build locally:
npm run build
5b. Verify no TypeScript errors:
npx tsc --noEmit
5c. Verify manifest is valid JSON:
node -e "console.log(JSON.parse(require('fs').readFileSync('public/manifest.json')))"
5d. Confirm id field is present:
node -e "const m = JSON.parse(require('fs').readFileSync('public/manifest.json')); console.log('id:', m.id); console.log('start_url:', m.start_url); console.log('scope:', m.scope);"
Expected output:
id: /
start_url: /
scope: /
________________________________________
6. STOP — Do NOT Deploy Yet
After build passes clean, STOP. Wait for explicit user go-ahead before any deploy.
Why this needs manual testing first:
•	Changing manifest identity fields can cause browsers to re-evaluate the install prompt
•	The id field is relatively new (Chrome 96+) — verify it doesn’t break older browsers
•	Must test on a preview URL that the PWA still installs correctly and the banner shows in standalone mode
Preview deploy test checklist (when user says go):
•	☐ Deploy preview URL
•	☐ Open in Chrome mobile emulator → install PWA → confirm only ONE icon appears
•	☐ Open installed PWA → confirm amber cleanup banner shows at top
•	☐ Click “Got it” → banner disappears
•	☐ Close and reopen PWA → banner stays gone (localStorage persisted)
•	☐ Re-deploy a small text change → confirm existing PWA updates in place (no new icon)
________________________________________
7. CLEANUP
After successful deploy and verification: - [ ] public/manifest.json has "id": "/" as first field - [ ] start_url and scope are both "/" - [ ] src/components/PWACleanupBanner.tsx exists and builds clean - [ ] Banner renders in root layout before all other children - [ ] Build passes zero errors - [ ] No Cycle 049 files were modified - [ ] Nothing committed, staged, or deployed without explicit instruction
________________________________________
COPY BOUNDARIES
BEGIN COPY at: # BRIDGE-125 END COPY at: end of file (after last cleanup checkbox)
