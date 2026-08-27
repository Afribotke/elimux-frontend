CYCLE — OG Image Deploy + PWA Share System
PART 1: Deploy New OG Image (5 minutes)
Step 1: Asset Placement
Copy og-image-solid-bg.png → elimux-frontend/public/og-image.png
Overwrite any existing file.
Step 2: Verify Metadata
Open src/app/layout.tsx. Confirm openGraph.images and twitter.images both point to /og-image.png:
TypeScript
openGraph: {
  images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'ElimuX' }],
},
twitter: {
  card: 'summary_large_image',
  images: ['/og-image.png'],
},
If these fields don't exist, add them. Do NOT remove existing metadata.
Step 3: Build, Commit, Push
bash
npm run build
# Must pass zero errors
git add public/og-image.png src/app/layout.tsx
git commit -m "feat: deploy branded OG share image"
git push origin main
Step 4: Cache Bust (User Action)
After Vercel deploy is live, force WhatsApp to refresh:
Visit https://developers.facebook.com/tools/debug/
Enter https://www.elimux.ke and click "Debug"
Click "Scrape Again" to force refresh
Then test sharing in WhatsApp
PART 2: PWA Share System (Core Feature)
Goal
Add a share button to the ElimuX PWA that works everywhere — course pages, scholarship pages, search results, the homepage. When tapped, it opens the native mobile share sheet (iOS/Android) with pre-filled title, description, and URL.
Step 1: Create Share Utility
Create src/lib/share.ts:
TypeScript
// src/lib/share.ts
interface ShareData {
  title: string;
  text: string;
  url: string;
}

export async function shareContent(data: ShareData): Promise<boolean> {
  // Native Web Share API (works in PWA on mobile)
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: data.title,
        text: data.text,
        url: data.url,
      });
      return true;
    } catch (err) {
      // User cancelled or share failed
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed:', err);
      }
      return false;
    }
  }

  // Fallback: copy to clipboard
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(`${data.title}\n${data.text}\n${data.url}`);
      return true;
    } catch {
      // Fallback to manual copy
      return false;
    }
  }

  return false;
}

export function canShare(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.share;
}
Step 2: Create Share Button Component
Create src/components/ShareButton.tsx:
TypeScript
'use client';

import { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';
import { shareContent, canShare } from '@/lib/share';

interface ShareButtonProps {
  title: string;
  text: string;
  url: string;
  className?: string;
  variant?: 'icon' | 'button' | 'floating';
}

export function ShareButton({ title, text, url, className = '', variant = 'icon' }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const hasNativeShare = canShare();

  const handleShare = async () => {
    const shared = await shareContent({ title, text, url });

    if (!shared && !hasNativeShare) {
      // Fallback: show copy toast
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    }

    if (!shared && hasNativeShare) {
      // Native share was cancelled, try clipboard
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Nothing worked
      }
    }
  };

  if (variant === 'floating') {
    return (
      <>
        <button
          onClick={handleShare}
          className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 flex items-center justify-center transition-all active:scale-95 ${className}`}
          aria-label="Share"
        >
          {copied ? <Check className="w-6 h-6" /> : <Share2 className="w-6 h-6" />}
        </button>
        {showToast && (
          <div className="fixed bottom-24 right-6 z-50 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm shadow-lg">
            Link copied to clipboard!
          </div>
        )}
      </>
    );
  }

  if (variant === 'button') {
    return (
      <button
        onClick={handleShare}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-600/20 transition-colors ${className}`}
      >
        {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
        <span>{copied ? 'Copied!' : 'Share'}</span>
      </button>
    );
  }

  // Default: icon only
  return (
    <button
      onClick={handleShare}
      className={`p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors ${className}`}
      aria-label="Share"
    >
      {copied ? <Check className="w-5 h-5 text-green-400" /> : <Share2 className="w-5 h-5" />}
    </button>
  );
}
Step 3: Add Share to Navbar (Mobile)
In src/components/DesktopNav.tsx (or mobile nav component), add the share button:
tsx
import { ShareButton } from '@/components/ShareButton';

// Inside the navbar, near the user menu or mobile menu:
<ShareButton 
  title="ElimuX — Discover Your Perfect Education & Career"
  text="Find universities, TVET programs, scholarships, internships & more with AI."
  url="https://www.elimux.ke"
  variant="icon"
/>
Step 4: Add Share to Key Pages
A. Course/Program Detail Pages
Add a share button near the "Apply" button:
tsx
<ShareButton
  title={`${program.name} — ${program.institution}`}
  text={`Check out this ${program.type} at ${program.institution} on ElimuX!`}
  url={`https://www.elimux.ke/programs/${program.id}`}
  variant="button"
/>
B. Scholarship Detail Pages
tsx
<ShareButton
  title={`${scholarship.title} — Scholarship`}
  text={`Scholarship opportunity: ${scholarship.title}. Apply via ElimuX!`}
  url={`https://www.elimux.ke/scholarships/${scholarship.id}`}
  variant="button"
/>
C. Search Results Page
Add a floating share button so users can share their search:
tsx
<ShareButton
  title="ElimuX AI Search"
  text={`I found these education opportunities on ElimuX: ${searchQuery}`}
  url={typeof window !== 'undefined' ? window.location.href : 'https://www.elimux.ke'}
  variant="floating"
/>
D. Homepage
Add share to the hero section or footer:
tsx
<ShareButton
  title="ElimuX — AI-Powered Education Discovery"
  text="Discover your perfect education path with AI. Universities, TVET, scholarships, internships & more."
  url="https://www.elimux.ke"
  variant="button"
/>
Step 5: Add Share to Footer
In src/components/Footer.tsx, add a "Share ElimuX" link/button:
tsx
import { ShareButton } from '@/components/ShareButton';

// In the footer:
<div className="mt-6">
  <ShareButton
    title="ElimuX"
    text="Discover your perfect education & career path with AI."
    url="https://www.elimux.ke"
    variant="button"
  />
</div>
Step 6: Dynamic OG Tags for Individual Pages
For course/scholarship detail pages, the OG image should be dynamic. Update the metadata in each page:
tsx
// In a program detail page (e.g., app/programs/[id]/page.tsx)
export async function generateMetadata({ params }: { params: { id: string } }) {
  const program = await getProgram(params.id); // your data fetch

  return {
    title: `${program.name} — ${program.institution} | ElimuX`,
    description: program.description,
    openGraph: {
      title: `${program.name} — ${program.institution}`,
      description: program.description,
      url: `https://www.elimux.ke/programs/${params.id}`,
      images: program.image ? [{ url: program.image }] : [{ url: '/og-image.png' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${program.name} — ${program.institution}`,
      description: program.description,
      images: program.image ? [program.image] : ['/og-image.png'],
    },
  };
}
Step 7: Build & Verify
Run npm run build — zero errors.
Test on mobile:
Install PWA (Add to Home Screen)
Open a course page
Tap share button
Confirm native share sheet opens with correct title/text/URL
Test on desktop:
Share button should fallback to clipboard copy
Toast "Link copied!" should appear
Commit: git commit -m "feat: add PWA share system with Web Share API"
Push and verify Vercel deploy.
Rules
Do NOT remove existing share/OG functionality.
Do NOT break existing navigation or auth.
Use typeof navigator !== 'undefined' checks for SSR safety.
Report back which files were created/modified.