Make both /schools and /pathways show a clean "Coming Soon" page. Disable both homepage cards. Nothing else touched.
docs/bridge.md — CYCLE 171: COMING SOON SHIELD
Scope: Replace the live entry pages for /schools and /pathways with a unified "Coming Soon" screen. Disable both cards on the homepage. Do not delete any existing code — just shield the routes.
Excluded: Everything else from the audit.
Rule: Build → local test → commit → push. No other files modified.
STEP 1: CREATE REUSABLE COMING SOON COMPONENT
Create src/components/ComingSoonPage.tsx:
tsx
"use client";

import { Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ComingSoonPageProps {
  title: string;
  description?: string;
}

export default function ComingSoonPage({
  title,
  description = "We're finalizing this feature. Check back soon for updates.",
}: ComingSoonPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
          <Clock className="w-10 h-10 text-amber-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-3">{title}</h1>
        <p className="text-slate-600 mb-8 leading-relaxed">{description}</p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-full text-sm font-medium text-amber-700">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          Coming Soon
        </div>
        <div className="mt-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
STEP 2: SHIELD /PATHWAYS
Replace the entire content of src/app/pathways/page.tsx with:
tsx
import ComingSoonPage from "@/components/ComingSoonPage";

export const metadata = {
  title: "Career Pathways — Coming Soon | ElimuX",
  description: "Career pathways guidance is coming soon to ElimuX.",
};

export default function PathwaysPage() {
  return (
    <ComingSoonPage
      title="Career Pathways"
      description="Discover the perfect academic and career path based on your KCSE results. Our AI-powered guidance system is being finalized for 100% accuracy."
    />
  );
}
Important: If src/app/pathways/page.tsx does not exist (the partial pages are in sub-routes), also create/replace these if they exist:
src/app/pathways/interpret/page.tsx
src/app/pathways/analyze/page.tsx
src/app/pathways/match/page.tsx
src/app/pathways/validate/page.tsx
Each gets the same ComingSoonPage wrapper with appropriate title. If any of these files don't exist, skip.
STEP 3: SHIELD /SCHOOLS
Replace the entire content of src/app/schools/page.tsx with:
tsx
import ComingSoonPage from "@/components/ComingSoonPage";

export const metadata = {
  title: "Schools — Coming Soon | ElimuX",
  description: "Kenyan school discovery is being updated with complete C1–C4 data.",
};

export default function SchoolsPage() {
  return (
    <ComingSoonPage
      title="Schools"
      description="We're integrating complete Kenyan school data (C1–C4) with verified county and constituency information. Coming back stronger soon."
    />
  );
}
STEP 4: UPDATE HOMEPAGE CARDS
In src/components/home/NewHomePage.tsx, find the HERO_CATEGORIES array.
Change the Senior Schools entry from live to disabled/SOON:
Find the Senior Schools entry (currently with href: "/schools", teal styling) and change it to:
tsx
{
  title: "Senior Schools",
  description: "Discover and compare secondary schools across Kenya.",
  icon: School,
  href: "/schools",
  color: "teal",
  disabled: true,
  badge: "SOON",
}
Verify the Career Pathways entry already has disabled: true, badge: "SOON". If not, ensure it matches.
Both cards should now render as disabled greyed-out cards with amber "SOON" badges. No card in the grid should be clickable for these two.
STEP 5: BUILD & VERIFY
powershell
cd "C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend"

# Kill any stray dev servers first
taskkill /F /IM node.exe 2>$null

# Build
$env:NEXT_PRIVATE_SKIP_SOURCEMAPS="1"
npm run build
Verify:
Build exits 0, zero errors.
next start locally.
Open http://localhost:3000 — homepage shows BOTH Senior Schools and Career Pathways as disabled "SOON" cards.
Click neither card (they shouldn't be clickable).
Manually navigate to http://localhost:3000/schools — shows the Coming Soon page with "Schools" title.
Manually navigate to http://localhost:3000/pathways — shows the Coming Soon page with "Career Pathways" title.
Console is clean.
STEP 6: COMMIT & PUSH
powershell
# Scope the commit to ONLY these files
git add src/components/ComingSoonPage.tsx src/app/pathways/page.tsx src/app/schools/page.tsx src/components/home/NewHomePage.tsx

# If any sub-route pages were modified in Step 2, add them too:
# git add src/app/pathways/interpret/page.tsx src/app/pathways/analyze/page.tsx etc.

git commit -m "Cycle 171: Shield /schools and /pathways with Coming Soon pages; disable both homepage cards"

git push origin main
STEP 7: LIVE CHECK
After Vercel deploys:
curl https://www.elimux.ke/schools — should contain "Coming Soon"
curl https://www.elimux.ke/pathways — should contain "Coming Soon"
Visit https://www.elimux.ke — both cards show "SOON"
