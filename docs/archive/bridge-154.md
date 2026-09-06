Cycle 154 — DTB Academy Demo Markers (Visual “DEMO” Badges)
Status: Quick cosmetic pass. Adds visible “DEMO” indicators so visitors know this is a pilot, not a live banking integration. Scope: 4 files — banner, panel, wizard, success step. All gated by existing dtb_academy_enabled flag.
________________________________________
1. Homepage Banner — Add DEMO Badge
Edit src/components/financing/dtb/DtbHomepageBanner.tsx:
Add this right after the opening <section> tag (before the gradient div):
{/* DEMO badge */}
<div className="max-w-3xl mx-auto mb-3 flex justify-end">
  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-semibold tracking-wide uppercase">
    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
    Demo — Not yet live
  </span>
</div>
Also change the CTA button text from:
Apply now in 3 minutes
To:
Try demo application
And change the secondary button from “How it works” to:
Learn more
________________________________________
2. School Page Panel — Add DEMO Badge
Edit src/components/financing/dtb/DtbAcademyPanel.tsx:
Add this right after the panel header (inside the body div, before the badge-bar):
{/* DEMO notice */}
<div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-3">
  <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
  <span className="text-xs text-amber-400/90 leading-relaxed">
    <strong>Demo mode:</strong> This is a pilot integration. No real loan applications are being processed yet.
  </span>
</div>
Change the CTA button text from:
Check eligibility on ElimuX
To:
Try demo eligibility check
________________________________________
3. Application Wizard — Add DEMO Banner
Edit src/components/financing/dtb/DtbAcademyWizard.tsx:
Add this right after the <TrustBar /> component (before <ProgressDots />):
{/* DEMO banner */}
<div className="mb-4 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
  <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
  <div>
    <p className="text-sm font-medium text-amber-400">Demo mode — Pilot integration</p>
    <p className="text-xs text-amber-400/70 mt-0.5">
      You can walk through the full application flow, but no real data is sent to DTB.
      This is a preview of how the integration will work when it goes live.
    </p>
  </div>
</div>
Also change the SuccessStep reference code prefix from:
DTB-ELM-
To:
DEMO-ELM-
________________________________________
4. Success Step — Add DEMO Label
Edit src/components/financing/dtb/steps/SuccessStep.tsx:
Change the subtitle from:
DTB has received your school fees loan application. You&apos;ll get an SMS update within 24 hours.
To:
This was a demo walkthrough. In the live version, DTB would receive this application and send you an SMS update within 24 hours.
________________________________________
5. Build & Deploy
cd "C:\Users\ELON\Projects-2026\IDEA STORE\elimux-frontend"
npm run build
If clean:
git add src/components/financing/dtb/DtbHomepageBanner.tsx
git add src/components/financing/dtb/DtbAcademyPanel.tsx
git add src/components/financing/dtb/DtbAcademyWizard.tsx
git add src/components/financing/dtb/steps/SuccessStep.tsx
git status
git commit -m "Cycle 154 — Add DEMO markers to DTB Academy module

- Add amber 'Demo — Not yet live' badges to homepage banner, school panel, wizard
- Change CTA text to 'Try demo' variants
- Change reference code prefix to DEMO-ELM-
- Update success message to clarify this is a preview"
git push origin main
________________________________________
6. Verification
Surface	Expected
Homepage	Amber “Demo — Not yet live” badge top-right of banner. CTA says “Try demo application”
School page	Amber notice inside panel: “Demo mode: This is a pilot integration.” CTA says “Try demo eligibility check”
Wizard	Amber banner below trust bar: “Demo mode — Pilot integration” with explanation text
Success	Reference starts with DEMO-ELM-. Subtitle says “This was a demo walkthrough.”
________________________________________
7. Master Kill Switch
To hide the entire module instantly (all 3 surfaces):
-- Supabase SQL Editor
UPDATE app_config SET value = 'false' WHERE key = 'dtb_academy_enabled';
To bring it back:
UPDATE app_config SET value = 'true' WHERE key = 'dtb_academy_enabled';
