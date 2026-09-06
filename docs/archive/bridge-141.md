=== CYCLE 056 — HIDE CAREER PATHWAYS WITH "COMING SOON" ===

## URGENT

Career Pathways is live on production but is NOT ready for client demo. Replace all public-facing Career Pathways entry points with a professional "Coming Soon" page. Do this now, commit, push, deploy.

## WHAT TO CHANGE

### FILE 1: `src/app/pathways/wizard/page.tsx`

Replace the entire wizard content with a "Coming Soon" screen. Keep the file and route — just swap the UI.

**Replace the wizard render with:**

```tsx
export default function PathwaysComingSoonPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 text-center">
      <div className="max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
          <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Career Pathways</h1>
        <p className="mt-3 text-gray-600">
          We're aligning our recommendation engine with the official KEMIS Grade 10 selection framework. 
          This feature will be available soon.
        </p>
        <div className="mt-6 space-y-3">
          <a 
            href="https://selection-placement.kemis.go.ke/pathways" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block w-full rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 transition-colors"
          >
            Visit Official KEMIS Portal
          </a>
          <a 
            href="/" 
            className="block w-full rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back to Home
          </a>
        </div>
        <p className="mt-6 text-xs text-gray-400">
          Expected launch: September 2026
        </p>
      </div>
    </div>
  );
}
Keep the existing file imports/exports at the top — just replace the main component body. Do not delete the file.
FILE 2: src/app/pathways/results/page.tsx
Same treatment. Replace with the same Coming Soon component. If the file is a server component with metadata, keep the metadata but replace the rendered content.
tsx
// Keep existing metadata if present, replace the component body with the same Coming Soon JSX as above
FILE 3: Homepage CTA (if it links to /pathways/wizard)
Find where the homepage promotes Career Pathways. Likely in src/app/page.tsx or a hero section component.
Look for text like:
"Career Pathways"
"Discover Your Pathway"
"Start Your Assessment"
Link to /pathways/wizard
Change it to:
tsx
<div className="relative">
  <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 mb-3">
    Coming Soon
  </span>
  <h3 className="text-lg font-semibold text-gray-900">Career Pathways</h3>
  <p className="mt-1 text-sm text-gray-500">
    KEMIS-aligned subject selection and school placement guidance launching September 2026.
  </p>
</div>
If there is a button linking to /pathways/wizard, either:
Remove the link and make it non-clickable, OR
Keep the link but it goes to the Coming Soon page (which it will, since /pathways/wizard now shows Coming Soon)
FILE 4: Navigation / Footer Links
Check src/components/layout/Navbar.tsx, Footer.tsx, or any global navigation for a "Career Pathways" or "Pathways" link.
If found: Either remove it temporarily, or let it point to /pathways/wizard (which now shows Coming Soon).
BUILD & DEPLOY
bash
npm run build
# Must pass with zero errors

git add src/app/pathways/wizard/page.tsx
git add src/app/pathways/results/page.tsx
# Add any homepage/nav files you changed
git commit -m "chore: mask Career Pathways with Coming Soon page for pre-launch

- Replace wizard and results pages with professional Coming Soon screen
- Link to official KEMIS portal for user convenience
- Homepage CTA updated to show Coming Soon badge
- Zero functional changes to other modules"
git push origin main
Wait for Vercel deploy. Confirm via curl https://www.elimux.ke/pathways/wizard that it returns the Coming Soon HTML (not the wizard form).
VERIFICATION
[ ] npm run build passes
[ ] npx tsc --noEmit clean
[ ] curl https://www.elimux.ke/pathways/wizard shows "Career Pathways" heading and "Coming Soon" copy — NOT subject entry forms
[ ] curl https://www.elimux.ke/pathways/results?career=Lawyer... shows Coming Soon — NOT results
[ ] Homepage no longer advertises a functional wizard (shows Coming Soon badge instead)
[ ] No other pages affected
Do NOT wait for my confirmation. Build, commit, push, verify live, report back.