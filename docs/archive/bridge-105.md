The 30-Minute Prep Work (Do This Now)
Create a single brand config file. This makes the rebrand a one-file change instead of a global find-and-replace hunt.
1. Create lib/brand.ts
TypeScript
// lib/brand.ts
// SINGLE SOURCE OF TRUTH — change this file once during rebrand

export const BRAND = {
  name: 'ElimuX',              // → change to 'Roveya' or 'Roveya.ai'
  tagline: 'Discover. Match. Apply.',
  fullTagline: 'Your Future. Our Technology.',
  domain: 'www.elimux.ke',     // → change to 'www.roveya.ai'
  email: 'hello@elimux.ke',    // → change to 'hello@roveya.ai'
  
  colors: {
    primary: '#0066FF',
    secondary: '#8B00FF', 
    accent: '#F5A623',
    dark: '#0F172A',
  },
  
  // Asset paths — swap these during rebrand
  logo: '/logo.png',
  logoWhite: '/logo-white.png',
  favicon: '/favicon.ico',
  
  // Social
  twitterHandle: '@elimux',    // → change
  ogImage: '/og-image.png',    // → swap file later
} as const;
2. Refactor all hardcoded "ElimuX" strings to use BRAND.name
Search your codebase for every instance of "ElimuX" and replace with BRAND.name. Key files:
app/layout.tsx — metadata title, description
app/page.tsx — homepage headings
app/login/page.tsx, app/register/page.tsx — auth page titles
components/footer.tsx — footer text
components/navbar.tsx — if logo has alt text or aria-label
app/not-found.tsx — 404 page message
Any email templates
Any error messages or toast notifications
Claude instruction for this:
"Search the entire codebase for the hardcoded string 'ElimuX' (case-insensitive). Replace every instance with BRAND.name imported from lib/brand.ts. Keep 'elimux' in URLs, file paths, and Supabase table names as-is — only replace user-facing display text."
3. Create a REBRAND_CHECKLIST.md in your repo root
Markdown
Copy
Code
Preview
# Roveya.ai Rebrand Checklist
Execute these in order when ready.

## Pre-Rebrand
- [ ] Register domain: roveya.ai
- [ ] Set up DNS / Vercel domain alias
- [ ] Generate new logo, favicon, and symbol assets
- [ ] Define new color palette (keep or evolve from current?)
- [ ] Reserve social handles: @roveya

## Code Changes (Single PR)
- [ ] Update `lib/brand.ts`: name, domain, email, handles
- [ ] Replace `public/logo.png` and `public/logo-white.png`
- [ ] Replace `public/favicon.ico` and all icon PNGs
- [ ] Replace `public/og-image.png`
- [ ] Update `manifest.json` name/short_name
- [ ] Update Google OAuth app name in Google Cloud Console
- [ ] Update Supabase project name (cosmetic only)
- [ ] Update Paystack/Stripe dashboard business name
- [ ] Update email sender name in email service

## Post-Deploy
- [ ] 301 redirect elimux.ke → roveya.ai
- [ ] Update Google Search Console property
- [ ] Update Google Analytics property name
- [ ] Announce rebrand on social media
What to Use for Images Right Now (Brand-Agnostic)
Instead of custom illustrations, use these free, neutral alternatives:
Table
Need	Solution	Cost
Course card placeholders	Abstract geometric patterns (CSS gradients or SVG)	Free
Empty states	Lucide icons at 120px + brand-colored background circle	Free
Hero banner	CSS gradient mesh animation or a simple dark gradient	Free
404 / 500 pages	Large Lucide icon (SearchX, TriangleAlert) + friendly text	Free
Auth background	Solid dark gradient (bg-gradient-to-br from-slate-900 to-blue-900)	Free
OG image	Skip for now, or use a plain dark card with text rendered in code	Free
Example: Brand-agnostic empty state
tsx
<div className="flex flex-col items-center justify-center py-20 text-center">
  <div className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center mb-6">
    <SearchX className="w-12 h-12 text-blue-400" />
  </div>
  <h3 className="text-xl font-semibold text-white mb-2">
    No results found
  </h3>
  <p className="text-slate-400 max-w-sm">
    Try adjusting your search or filters to find what you're looking for.
  </p>
</div>
This looks clean, professional, and has zero brand-specific assets to replace later.
The Bottom Line
Table
Phase	Focus
Now → Rebrand	Build features. Use neutral placeholders. Centralize brand config.
Rebrand Day	One PR: swap lib/brand.ts, replace logo files, update DNS. Deploy.
Post-Rebrand	Generate all custom illustrations, hero banners, and branded assets with the Roveya.ai identity.