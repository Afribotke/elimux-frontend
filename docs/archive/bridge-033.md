Cycle: Attachments Build + Gamification Consolidation + Scholarship Favorites + PWA Cleanup
Context: Four independent fixes, one deploy. Execute in order. Verify each sub-cycle before proceeding to the next. Report back after each.
Phase 1: PWA Dead Tables Cleanup
Problem: offline_cache and queued_actions tables exist but are never written to. The PWA handles offline entirely client-side. Either wire them up or drop them to clean up the schema.
Decision: Drop them. The client-side Cache API + IndexedDB approach in sw.js and pwaQueue.ts is working (7 push subscriptions prove the PWA is active). The dead tables are schema debt from an earlier plan that was never implemented.
Step 1: Create migration elimux-sql/49_cleanup_pwa_dead_tables.sql:
sql
-- Only drop if they exist and have 0 rows (verified in audit)
DROP TABLE IF EXISTS offline_cache;
DROP TABLE IF EXISTS queued_actions;
Step 2: Run against live database. Report row counts before drop (should be 0).
Step 3: Remove any backend code that references these tables (if any). Search elimux-backend/src/ for offline_cache or queued_actions. If found, remove those references.
Verify: SELECT * FROM offline_cache → relation does not exist. Same for queued_actions. Report PASS/FAIL.
Phase 2: Scholarship Favorites — Link to User Accounts
Problem: scholarship_favorites uses device_id only, not user_id. Favorites can't follow a user across devices or after login. saved_scholarships is dead schema (duplicate, unused).
Step 1: Create migration elimux-sql/50_link_scholarship_favorites_to_users.sql:
sql
-- Add user_id column (nullable initially for migration)
ALTER TABLE scholarship_favorites ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Migrate existing rows: if device_id matches a known session, try to infer user_id
-- (This is best-effort; most rows are 0 anyway per audit)
UPDATE scholarship_favorites SET user_id = NULL WHERE user_id IS NULL;

-- Make user_id NOT NULL going forward
ALTER TABLE scholarship_favorites ALTER COLUMN user_id SET NOT NULL;

-- Add unique constraint to prevent duplicate favorites per user
ALTER TABLE scholarship_favorites DROP CONSTRAINT IF EXISTS scholarship_favorites_user_id_scholarship_id_key;
ALTER TABLE scholarship_favorites ADD CONSTRAINT scholarship_favorites_user_id_scholarship_id_key UNIQUE (user_id, scholarship_id);

-- Drop the dead saved_scholarships table
DROP TABLE IF EXISTS saved_scholarships;
Step 2: Update backend elimux-backend/src/routes/scholarships.ts (or wherever favorite/unfavorite endpoints live):
POST /api/scholarships/:id/favorite — read user_id from JWT instead of device_id from body/header. Insert user_id into scholarship_favorites.
DELETE /api/scholarships/:id/favorite — delete where user_id = authUser.id.
GET /api/scholarships/favorites — select where user_id = authUser.id, join scholarships for full data.
Step 3: Update src/lib/api.ts — favoriteScholarship, unfavoriteScholarship, listScholarshipFavorites should send the auth token (if they don't already) and stop sending device_id.
Step 4: Update src/app/scholarships/[id]/page.tsx — the favorite button should check user_id from auth state, not device_id.
Verify:
Log in as a student, favorite a scholarship.
Visit /scholarships/favorites — confirm it appears.
Log out, log in on a different session (or just refresh) — confirm favorite persists.
Report PASS/FAIL.
Phase 3: Gamification Consolidation — Three Leaderboards into One
Problem: Three separate pages (/achievements, /leaderboard, /gamification) implement overlapping gamification UI through two different data-access patterns (backend API vs direct Supabase). Maintenance risk.
Decision: Keep /achievements as the primary entry point (it already links to leaderboard). Merge /leaderboard and /gamification into /achievements as tabs or sections. Redirect /leaderboard and /gamification to /achievements.
Step 1: Read the current src/app/achievements/page.tsx, src/app/leaderboard/page.tsx, and src/app/gamification/page.tsx. Report back: which one has the most complete UI? Which data-access pattern is cleaner (backend API vs direct Supabase)?
Step 2: Based on the audit, pick the best single page as the base. Merge the unique features from the other two into it as tabs:
Tab 1: "My Achievements" (badges, points, levels — from /achievements or /gamification)
Tab 2: "Leaderboard" (rankings — from /leaderboard or /gamification)
Tab 3: "How to Earn" (actions list — from whichever page has it)
Step 3: Update src/app/achievements/page.tsx to be the consolidated page with tabs. Use the backend API pattern (not direct Supabase) for all data fetching, consistent with the rest of the app.
Step 4: Create redirects:
src/app/leaderboard/page.tsx → redirect to /achievements?tab=leaderboard
src/app/gamification/page.tsx → redirect to /achievements?tab=achievements
Simple redirect component:
TypeScript
import { redirect } from 'next/navigation';
export default function LeaderboardRedirect() { redirect('/achievements?tab=leaderboard'); }
Step 5: Update DesktopNav.tsx and MobileNav.tsx — ensure all nav links to "Achievements" or "Leaderboard" point to /achievements.
Verify:
/achievements loads with tabs, all data visible.
/leaderboard redirects to /achievements?tab=leaderboard.
/gamification redirects to /achievements.
Nav links work. Report PASS/FAIL.
Phase 4: Build Real Attachments Section
Problem: /attachments → 404. Detail page "Apply" button → 404 (/attachments/[id]/apply missing). Attachments are actually filtered internships data with type === "attachment", but there's no standalone discovery path.
Step 1: Create /attachments listing page
File: src/app/attachments/page.tsx
TypeScript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchInternships } from '@/lib/api'; // or equivalent — use the existing internships API
import Link from 'next/link';

export default function AttachmentsListingPage() {
  const [attachments, setAttachments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await fetchInternships(); // or listInternships, whatever the API client function is called
      const filtered = data.filter((job: any) => job.type === 'attachment' || job.job_type === 'attachment');
      setAttachments(filtered);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="min-h-screen flex justify-center items-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Industrial Attachments</h1>
        <p className="text-gray-600 mb-8">Find attachment opportunities for your university program.</p>
        
        {attachments.length === 0 ? (
          <p className="text-gray-500">No attachments available right now. Check back soon!</p>
        ) : (
          <div className="space-y-4">
            {attachments.map((attachment: any) => (
              <Link 
                key={attachment.id} 
                href={`/attachments/${attachment.id}`}
                className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition"
              >
                <h3 className="text-lg font-semibold">{attachment.title || attachment.name}</h3>
                <p className="text-gray-600 mt-2">{attachment.description}</p>
                <div className="mt-4 text-sm text-gray-500">
                  {attachment.location && <span>{attachment.location}</span>}
                  {attachment.duration && <span> • {attachment.duration}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
Adapt: Use the actual field names from the internships table (title, name, description, location, duration, etc. — verify in the schema or existing internships page).
Step 2: Fix the detail page apply link
File: src/app/attachments/[id]/page.tsx (existing)
Find the "Apply" or "click here to apply" link. It currently points to /attachments/${job.id}/apply which doesn't exist.
Change it to point to /institution/attachment/upload with a query param for the attachment ID:
TypeScript
<Link href={`/institution/attachment/upload?attachment_id=${job.id}`}>
  Apply via your institution
</Link>
Add explanatory text: "Attachments are arranged through your university. Apply here and your institution will forward your application."
Step 3: Update nav links
In DesktopNav.tsx and MobileNav.tsx, ensure the "Attachments" nav item links to /attachments (not /opportunities?tab=attachment).
Step 4: Build and verify
npm run build frontend
vercel --prod
Visit /attachments — confirm listing loads
Click an attachment — confirm detail page loads
Click Apply — confirm it goes to /institution/attachment/upload?attachment_id=...
Report PASS/FAIL
Build & Deploy Sequence
Phase 1 (PWA cleanup): Run migration, commit SQL, push.
Phase 2 (Scholarship favorites): Update backend + frontend + migration. Build backend → push → Railway. Build frontend → vercel --prod.
Phase 3 (Gamification): Merge pages, add redirects. Build → vercel --prod.
Phase 4 (Attachments): Build listing page, fix detail link. Build → vercel --prod.
Verify each phase live before proceeding to the next. If any phase fails, fix it before continuing.
Report format
plain
=== MULTI-FIX CYCLE ===

PHASE 1 — PWA CLEANUP:
- Tables dropped: [list]
- Code references removed: [YES / NO]
- Verification: [PASS / FAIL]

PHASE 2 — SCHOLARSHIP FAVORITES:
- Migration applied: [PASS / FAIL]
- Backend updated: [PASS / FAIL]
- Frontend updated: [PASS / FAIL]
- Cross-device favorite persists: [PASS / FAIL]
- Overall: [PASS / FAIL]

PHASE 3 — GAMIFICATION CONSOLIDATION:
- Base page chosen: [page name]
- Tabs merged: [list]
- Redirects working: /leaderboard -> [YES / NO], /gamification -> [YES / NO]
- Nav links updated: [YES / NO]
- Overall: [PASS / FAIL]

PHASE 4 — ATTACHMENTS BUILD:
- /attachments listing: [PASS / FAIL]
- Detail page apply link: [PASS / FAIL]
- Nav links: [PASS / FAIL]
- Overall: [PASS / FAIL]

OVERALL: [ALL PASS / PARTIAL / BLOCKED]
Do not proceed to any other feature until all four phases are verified.