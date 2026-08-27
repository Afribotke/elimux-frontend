# CYCLE — Logo Integration Across ElimuX

## Goal
Replace all placeholder/generic logo references with the new ElimuX branded logo across the entire platform.

## Step 1: Asset Placement
Copy these files into `elimux-frontend/public/`:
- `logo-original.png` → `public/logo.png`
- `logo-white.png` → `public/logo-white.png`
- `symbol-128.png` → `public/icon-128.png`
- `favicon-32x32.png` → `public/favicon-32x32.png`
- `apple-touch-icon.png` → `public/apple-touch-icon.png`
- `icon-192x192.png` → `public/icon-192x192.png`
- `icon-512x512.png` → `public/icon-512x512.png`

## Step 2: Root Layout Metadata (app/layout.tsx)
Update the metadata export to include the favicon and apple-touch-icon. Keep all existing metadata fields (title, description, OG tags) — only add/change the icon fields.

```typescript
export const metadata = {
  title: 'ElimuX — Discover. Match. Apply.',
  description: 'Your Future. Our Technology. Find courses, scholarships, internships and attachments with AI-powered discovery.',
  icons: {
    icon: '/favicon-32x32.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  // preserve existing openGraph/twitter metadata
};
Step 3: PWA Manifest (public/manifest.json)
Create or overwrite public/manifest.json. If it already exists, preserve the name/short_name but update the icons array.
JSON
{
  "name": "ElimuX",
  "short_name": "ElimuX",
  "description": "Discover courses, scholarships, internships and attachments",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#0f172a",
  "icons": [
    { "src": "/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512x512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
Step 4: Navbar Logo Update
Find the Navbar component (likely components/navbar.tsx or app/components/Navbar.tsx). Locate the logo <img> or <Image> tag and replace it with:
tsx
import Image from 'next/image';
import Link from 'next/link';

// Inside the Navbar component, replace the logo area with:
<Link href="/" className="flex items-center gap-2 shrink-0">
  <Image
    src="/logo.png"
    alt="ElimuX"
    width={140}
    height={45}
    className="h-10 w-auto dark:hidden"
    priority
  />
  <Image
    src="/logo-white.png"
    alt="ElimuX"
    width={140}
    height={45}
    className="h-10 w-auto hidden dark:block"
    priority
  />
</Link>
Important: If the project uses images.unoptimized: true in next.config.js (which is the current config), keep using the standard <img> tag instead of <Image> for external URLs, but for these local /public assets, <Image> works fine and is preferred.
Step 5: Footer Logo Update
Find the Footer component. Replace any logo reference with:
tsx
<Image
  src="/logo-white.png"
  alt="ElimuX"
  width={120}
  height={38}
  className="h-8 w-auto opacity-90"
/>
If the footer background is light, use /logo.png instead.
Step 6: Auth Pages (Login / Register / Advertiser Login)
Find all auth page layouts (e.g., app/login/page.tsx, app/register/page.tsx, app/advertiser/login/page.tsx). Above each auth form, add the centered logo:
tsx
<div className="flex justify-center mb-8">
  <Image
    src="/logo.png"
    alt="ElimuX"
    width={160}
    height={50}
    className="h-12 w-auto"
    priority
  />
</div>
Step 7: Admin Dashboard Sidebar
If there is an admin dashboard with a sidebar, update the logo at the top of the sidebar:
tsx
<div className="flex items-center gap-2 px-4 py-4 border-b">
  <Image src="/icon-128.png" alt="" width={32} height={32} className="h-8 w-auto" />
  <span className="font-bold text-lg tracking-tight">ElimuX Admin</span>
</div>
Step 8: Email Templates (if any exist in the codebase)
If there are React-email or HTML email templates, add the logo at the top:
tsx
<img src="https://www.elimux.ke/logo.png" alt="ElimuX" width="140" style={{ display: 'block', margin: '0 auto 24px' }} />
Step 9: Build & Verify
Run npm run build — must pass with zero errors.
Run npm run start locally.
Verify:
[ ] Browser tab shows the favicon
[ ] Navbar shows logo on homepage
[ ] Footer shows logo
[ ] Login page shows logo above form
[ ] No 404s for any /logo.png, /favicon-32x32.png, etc.
If all pass, commit with message: feat: integrate ElimuX branded logo across platform
Push and confirm Vercel deploy is green.
Rules
Do NOT delete any existing functionality.
Do NOT change any navigation links or auth logic.
If a file does not exist (e.g., no admin sidebar yet), skip that step and note it in the report.
Report back exactly which files were modified and which steps were skipped.
plain

---


Do you want me to adjust any of the logo sizes or create additional variants (e.g., a monochrome version for loading states) before Claude starts?
use this as flavicon
Edit
Copy
Share
Create favicon assets .ico manifest and integration guide
Execute Python code
Create Favicon Assets and Claude Bridge.md Instructions with Preview
Execute Python code
tool result image 1
Integrate Favicon into ElimuX Download Links and Bridge.md Instructions
All favicon assets are generated and ready. Here's your complete instruction block for Claude.
Download Your Favicon Assets
Table
File	Purpose
favicon.ico	Legacy browsers (IE, old Safari) — multi-resolution ICO
favicon-16x16.png	Browser tab (standard)
favicon-32x32.png	Browser tab (retina)
favicon-48x48.png	Windows taskbar / search results
apple-touch-icon.png	iOS "Add to Home Screen"
icon-192x192.png	PWA icon (Android, Chrome)
icon-512x512.png	PWA splash screen
mstile-150x150.png	Windows Start Menu tile
Bridge.md — Paste This Entire Block to Claude
Markdown
Copy
Code
Preview
# CYCLE — Favicon Integration (ElimuX Branded Icon)

## Goal
Replace all existing favicon and PWA icon assets with the new ElimuX circular branded icon.

## Step 1: Asset Placement
Copy these 8 files into `elimux-frontend/public/`:
- `favicon.ico` → `public/favicon.ico`
- `favicon-16x16.png` → `public/favicon-16x16.png`
- `favicon-32x32.png` → `public/favicon-32x32.png`
- `favicon-48x48.png` → `public/favicon-48x48.png`
- `apple-touch-icon.png` → `public/apple-touch-icon.png`
- `icon-192x192.png` → `public/icon-192x192.png`
- `icon-512x512.png` → `public/icon-512x512.png`
- `mstile-150x150.png` → `public/mstile-150x150.png`

Delete any old favicon files in `public/` (e.g., `vercel.svg`, `next.svg`, old `favicon.ico`).

## Step 2: Root Layout Metadata (app/layout.tsx)
Find the `metadata` export. Replace or add the `icons` field. Keep every other metadata field exactly as-is.

```typescript
export const metadata: Metadata = {
  // ... keep all existing fields (title, description, openGraph, twitter, etc.) ...
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  // preserve everything else
};
Step 3: PWA Manifest (public/manifest.json)
Create or overwrite public/manifest.json. If it already exists, keep name/short_name but replace the icons array.
JSON
{
  "name": "ElimuX",
  "short_name": "ElimuX",
  "description": "Discover courses, scholarships, internships and attachments",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#0f172a",
  "icons": [
    { "src": "/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512x512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
Step 4: Remove Hardcoded <link>
Search the entire codebase for any hardcoded <link rel="icon" or <link rel="shortcut icon" or <link rel="apple-touch-icon" inside any .html, .tsx, or .ts files. Remove them — Next.js metadata.icons handles this automatically. Common locations to check:
app/layout.tsx (should only use metadata, no manual <link>)
Any _document.tsx or _app.tsx if using Pages Router
Any index.html if present
Step 5: Build & Verify
Run npm run build — must pass with zero errors.
Run npm run start locally.
Open http://localhost:3000 and verify:
[ ] Browser tab shows the circular E-graduation-cap icon
[ ] No 404s in Network tab for /favicon.ico, /favicon-32x32.png, /apple-touch-icon.png
[ ] No old Next.js or Vercel logos anywhere
If clean, commit with message: feat: replace favicon and PWA icons with ElimuX branded icon
Push. Confirm Vercel deploy is green.
After deploy, hard-refresh https://www.elimux.ke (Ctrl+Shift+R) and confirm the new favicon appears in the tab.
Rules
Do NOT delete or modify any page content, auth logic, or navigation.
Do NOT change the main logo.png / logo-white.png used in navbar/footer (that was a separate cycle).
Only touch favicon/PWA icon assets and their metadata references.
Report back exactly which files were modified and which old favicon files were deleted.
plain

