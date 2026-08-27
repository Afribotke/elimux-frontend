# CYCLE — Fix PWA Icon: Replace All Manifest Icon Sizes

## Goal
Eliminate the old yellow "E" PWA icon. The user confirmed the new circular icon is served correctly on production (verified in Cycle 034), but Android still shows the old yellow "E" when installing the PWA. This means either:
1. Some manifest icon sizes still reference old files, OR
2. Chrome/Android is caching the old icon, OR
3. The manifest references sizes we never replaced (72, 96, 128, 144, 152, 384)

## Step 1: Audit Current Manifest
Read `public/manifest.json` and report back the EXACT `icons` array — every `src`, `sizes`, `type`, and `purpose` entry. Do not modify yet.

## Step 2: Audit Current Icon Files
List ALL files in `public/` that match `icon-*` or `favicon*`. Report:
- Which icon files exist
- Their file sizes (to detect if any are still the old yellow E — old files were likely smaller)
- Which sizes are present vs. missing

## Step 3: Replace All Icon Files
Copy ALL files from the provided `elimux-pwa-icons-complete.zip` into `public/`, overwriting any existing files with the same names:

Standard icons (overwrite):
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

Maskable variants (for Android adaptive icons — overwrite):
- icon-72x72-maskable.png
- icon-96x96-maskable.png
- icon-128x128-maskable.png
- icon-144x144-maskable.png
- icon-152x152-maskable.png
- icon-192x192-maskable.png
- icon-384x384-maskable.png
- icon-512x512-maskable.png

## Step 4: Update Manifest to Match
After Step 1's audit, update `public/manifest.json` so that:
- Every `icons` entry points to a file that actually exists in `public/`
- All entries use the new circular blue-purple icon
- Add `purpose: "maskable"` entries for Android adaptive icons
- Remove any entries pointing to files that don't exist

The manifest should look like this (adjust based on your audit):

```json
{
  "name": "ElimuX",
  "short_name": "ElimuX",
  "description": "Discover courses, scholarships, internships and attachments",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0F172A",
  "theme_color": "#0F172A",
  "icons": [
    { "src": "/icon-72x72.png", "sizes": "72x72", "type": "image/png" },
    { "src": "/icon-96x96.png", "sizes": "96x96", "type": "image/png" },
    { "src": "/icon-128x128.png", "sizes": "128x128", "type": "image/png" },
    { "src": "/icon-144x144.png", "sizes": "144x144", "type": "image/png" },
    { "src": "/icon-152x152.png", "sizes": "152x152", "type": "image/png" },
    { "src": "/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-384x384.png", "sizes": "384x384", "type": "image/png" },
    { "src": "/icon-512x512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icon-192x192-maskable.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "/icon-512x512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
Step 5: Add Cache-Busting Headers
In next.config.js (or next.config.ts), add cache headers for icon files to force browsers to revalidate:
JavaScript
// In the existing headers config, add or merge:
async headers() {
  return [
    {
      source: '/icon-:size*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
      ],
    },
    {
      source: '/manifest.json',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
      ],
    },
  ];
}
This forces Chrome to re-download icons instead of using cached versions.
Step 6: Build & Verify
Run npm run build — zero errors.
Run npm run start locally.
Open Chrome DevTools → Application → Manifest. Verify:
[ ] All icon URLs show the new circular blue-purple icon (not yellow E)
[ ] No 404s in the icon list
[ ] Maskable icons are listed with purpose: "maskable"
If clean, commit with message: fix: replace all PWA icon sizes and add maskable variants for Android
Push and confirm Vercel deploy is green.
Step 7: User Cache Clear (Critical)
After deploy is live, the user MUST clear the PWA cache on their Android device:
Chrome → Settings → Privacy → Clear browsing data → Cached images and files
OR uninstall the existing ElimuX PWA and reinstall it
New users installing the PWA for the first time will see the correct icon immediately
Rules
Do NOT modify navbar, footer, favicon, OG image, or any page content.
Do NOT change auth logic or navigation.
Report back exactly which files were replaced and what the manifest audit showed.
If the manifest already had maskable entries, preserve them and just update the file paths.