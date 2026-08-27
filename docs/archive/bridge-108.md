Priority 1: Unify the Share System (Do This Next)
Program and institution detail pages use the old ShareModal. Scholarship and search use the new ShareButton with multi-platform bottom sheet + analytics. Users will notice. One page gives them WhatsApp/Twitter/LinkedIn options, another gives them a basic modal. That's amateur.
The fix: Migrate program and institution detail pages to the new ShareButton system. Delete the old ShareModal entirely. One share experience across the entire platform.
Priority 2: PWA Icon (Yellow "E" Still Live)
Your Android screenshot proved the old yellow "E" is still the PWA icon. The complete icon set (72, 96, 128, 144, 152, 192, 384, 512 + maskable variants) was generated but never deployed. This is a branding failure every time someone installs the app.
Priority 3: Google OAuth Verification
The Google sign-in button went live without confirmed redirect URI config. If it's broken, users can't log in. Test it now.
Priority 4: Auth Page Visual Check
The logo on /auth/login, /auth/register, /advertiser/login was added but never visually verified. On dark backgrounds, the wrong logo variant could be invisible.
Your Next Claude Instruction (Priority 1)
Copy this entire block to docs/bridge.md:
Markdown
Copy
Code
Preview
# CYCLE — Unify Share System: Migrate Old ShareModal to New ShareButton

## Goal
Eliminate the inconsistent share UX. Program and institution detail pages currently use the old `ShareModal` (basic, no analytics, no multi-platform sheet). Scholarship and search use the new `ShareButton` (WhatsApp, Facebook, X, LinkedIn, Telegram, Email, smart links, analytics). Migrate program and institution pages to the new system. Then delete the old `ShareModal` to prevent future developers from using it.

## Step 1: Audit Current State
Read these files and report back their current contents:
- `src/components/DetailActions.tsx` — how it triggers the old ShareModal
- `src/components/ShareModal.tsx` — the old modal to be deleted
- `src/components/share/ShareButton.tsx` — the new button to use
- `src/components/share/index.ts` — what's exported from the new share module
- `src/lib/share-utils.ts` — the `getDefaultShareData` helper

## Step 2: Migrate Program Detail Page
Open `src/app/programs/[id]/page.tsx` (or wherever the program detail page lives). Find where `DetailActions` or `ShareModal` is used. Replace with:

```tsx
import { ShareButton } from '@/components/share';
import { getDefaultShareData } from '@/lib/share-utils';

// In the component, where the old share trigger was:
<ShareButton
  data={getDefaultShareData(`/programs/${program.id}`, 'program', {
    title: `${program.name} — ${program.institution}`,
    description: program.description,
    image: program.image,
  })}
  variant="icon"
/>
If the page structure doesn't allow direct insertion, modify DetailActions.tsx to use ShareButton instead of opening ShareModal.
Step 3: Migrate Institution Detail Page
Same as Step 2, but for src/app/institutions/[id]/page.tsx (or equivalent):
tsx
<ShareButton
  data={getDefaultShareData(`/institutions/${institution.id}`, 'institution', {
    title: `${institution.name}`,
    description: institution.description,
    image: institution.logo || institution.image,
  })}
  variant="icon"
/>
Step 4: Delete Old ShareModal
Once Steps 2 and 3 are verified working:
Delete src/components/ShareModal.tsx
Remove any imports of ShareModal across the codebase
Check src/components/DetailActions.tsx — if it only existed to host the old modal, simplify or remove it
Check favorites/page.tsx and CompareDrawer.tsx — if they import ShareResultsModal.tsx, verify that's the NEW system, not the old one. If it's old, migrate it too.
Step 5: Verify No Orphaned References
Search the entire codebase for any remaining references to the old share system:
bash
grep -r "ShareModal" src/ --include="*.tsx" --include="*.ts"
grep -r "share-modal" src/ --include="*.tsx" --include="*.ts"
Report any hits. If none, the migration is clean.
Step 6: Build & Verify
Run npm run build — zero errors.
Run npm run start locally.
Test these pages in browser:
[ ] /programs/[some-id] — tap share, confirm multi-platform bottom sheet opens
[ ] /institutions/[some-id] — tap share, confirm multi-platform bottom sheet opens
[ ] /scholarships/[some-id] — tap share, confirm it still works (was already new system)
[ ] / (homepage) — tap share in hero, confirm it works
If all pass, commit: git commit -m "refactor: unify share system — migrate all pages to ShareButton + delete old ShareModal"
Push and confirm Vercel deploy.
Rules
Do NOT break existing share functionality on scholarship or search pages.
Do NOT remove analytics tracking — the new system has it, the old doesn't.
Do NOT leave dead code (deleted files, unused imports).
Report every file modified, created, and deleted.