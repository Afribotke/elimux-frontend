Markdown
Copy
Code
Preview
# BRIDGE: Cycle 029 — ElimuX SEO Optimization (No Commit Until Approved)
**Status:** EXECUTE — no questions, no options  
**Rule:** After every change, run `npx tsc --noEmit && npm run build`. Fix errors before proceeding.  
**Rule:** Do NOT commit or push. Wait for "commit and push it".

---

## CONTEXT

ElimuX needs to be fully optimized for search engines. Google must understand:
- What ElimuX is (education & career discovery platform)
- What pages exist (programs, scholarships, internships, attachments, bursaries)
- How pages relate to each other (breadcrumbs, internal linking)
- Rich structured data for rich snippets in search results

---

## STEP 1: robots.txt

Create `src/app/robots.txt` (or `public/robots.txt` if Next.js static file serving is configured):
User-agent: *
Allow: /
Disallow admin and auth pages from indexing
Disallow: /admin/
Disallow: /auth/
Disallow: /api/
Disallow: /employer/
Disallow: /advertiser/
Sitemap location
Sitemap: https://www.elimux.ke/sitemap.xml
plain

RULES:
- Allow everything except admin, auth, API, and internal portal routes.
- Point to the production sitemap URL.
- If `public/robots.txt` already exists, overwrite it with this content.

---

## STEP 2: sitemap.xml (Dynamic)

Create `src/app/sitemap.ts` (Next.js App Router dynamic sitemap):

```typescript
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.elimux.ke';
  
  // Static routes
  const staticRoutes = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1.0 },
    { url: `${baseUrl}/programs`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${baseUrl}/scholarships`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${baseUrl}/internships`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${baseUrl}/attachments`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${baseUrl}/bursary`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${baseUrl}/institutions`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
  ];

  // TODO: Add dynamic routes for institutions, programs, scholarships, internships
  // Fetch from Supabase and map to { url, lastModified, changeFrequency, priority }
  // For now, static routes are sufficient. Flag dynamic route expansion for Cycle 030.

  return staticRoutes;
}
RULES:
Use src/app/sitemap.ts (App Router convention).
If src/app/sitemap.xml or public/sitemap.xml exists, replace with the dynamic .ts version.
Production URL must be https://www.elimux.ke.
STEP 3: Meta Descriptions (Unique Per Page)
Add or update <meta name="description"> for every page. Use Next.js metadata export in each page.tsx:
Homepage (src/app/page.tsx):
TypeScript
export const metadata = {
  title: 'ElimuX — AI-Powered Education & Career Discovery',
  description: 'Discover universities, colleges, TVET institutes, scholarships, internships, industrial attachments, and bursaries worldwide. AI-powered matching for every student.',
  keywords: 'education, university, college, TVET, scholarship, internship, attachment, bursary, Kenya, Africa, study abroad',
  openGraph: {
    title: 'ElimuX — AI-Powered Education & Career Discovery',
    description: 'Find your perfect education path with AI. Universities, TVET, scholarships, internships & more.',
    url: 'https://www.elimux.ke',
    siteName: 'ElimuX',
    images: [{ url: 'https://www.elimux.ke/og-image.jpg', width: 1200, height: 630 }],
    locale: 'en_KE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ElimuX — AI-Powered Education & Career Discovery',
    description: 'Find your perfect education path with AI.',
    images: ['https://www.elimux.ke/og-image.jpg'],
  },
};
Programs (src/app/programs/page.tsx):
TypeScript
export const metadata = {
  title: 'Discover Programs — Universities & TVET | ElimuX',
  description: 'Explore 50,000+ programs from top universities and TVET institutions worldwide. Filter by country, level, category, and fees.',
};
Scholarships (src/app/scholarships/page.tsx):
TypeScript
export const metadata = {
  title: 'Find Scholarships — Fully Funded & Partial | ElimuX',
  description: 'Search scholarships for undergraduate, masters, and PhD studies. AI-powered matching based on your profile and grades.',
};
Internships (src/app/internships/page.tsx):
TypeScript
export const metadata = {
  title: 'Internship Opportunities — Apply Now | ElimuX',
  description: 'Find verified internship opportunities with top employers. AI-powered matching for students and recent graduates.',
};
Attachments (src/app/attachments/page.tsx):
TypeScript
export const metadata = {
  title: 'Industrial Attachments — University Placements | ElimuX',
  description: 'Find industrial attachment placements arranged through your university. Hands-on experience with verified employers.',
};
Bursary (src/app/bursary/page.tsx):
TypeScript
export const metadata = {
  title: 'Bursaries — Financial Aid for Students | ElimuX',
  description: 'Discover bursary opportunities to fund your education. Need-based and merit-based financial aid for students in Kenya and beyond.',
};
Institutions (src/app/institutions/page.tsx):
TypeScript
export const metadata = {
  title: 'Accredited Institutions — Universities & Colleges | ElimuX',
  description: 'Browse 10,000+ accredited universities, colleges, and TVET institutions worldwide. Check accreditation status and reviews.',
};
About (src/app/about/page.tsx):
TypeScript
export const metadata = {
  title: 'About ElimuX — Our Mission & Vision',
  description: 'ElimuX is an AI-powered global education and career discovery platform connecting students with universities, TVET institutes, scholarships, internships, attachments, and bursaries.',
};
Contact (src/app/contact/page.tsx):
TypeScript
export const metadata = {
  title: 'Contact ElimuX — Get in Touch',
  description: 'Contact the ElimuX team for partnerships, support, or inquiries. We help students discover education and career opportunities worldwide.',
};
RULES:
Every public page MUST have a unique title and description.
Titles should be under 60 characters, descriptions under 160 characters.
Include openGraph and twitter tags on the homepage at minimum.
If a page already exports metadata, merge/update it — do not duplicate.
STEP 4: Structured Data (JSON-LD Schema Markup)
Add JSON-LD <script type="application/ld+json"> to key pages. Use Next.js metadata or inject via dangerouslySetInnerHTML in layout/page components.
4.1 Organization Schema (Global — add to root layout)
JSON
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "ElimuX",
  "url": "https://www.elimux.ke",
  "logo": "https://www.elimux.ke/logo.png",
  "description": "AI-powered global education and career discovery platform",
  "sameAs": [
    "https://twitter.com/elimux",
    "https://linkedin.com/company/elimux",
    "https://facebook.com/elimux"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "Customer Support",
    "email": "support@elimux.ke",
    "availableLanguage": ["English", "Swahili"]
  }
}
4.2 WebSite Schema (Homepage — for Google Sitelinks Searchbox)
JSON
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "ElimuX",
  "url": "https://www.elimux.ke",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://www.elimux.ke/programs?search={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
4.3 FAQPage Schema (Homepage FAQ section)
JSON
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How do I find the right program?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Use our AI-powered search to describe what you're looking for in your own words, or browse by category — Universities, TVET, Scholarships, Internships, Attachments, or Bursaries."
      }
    },
    {
      "@type": "Question",
      "name": "How do I compare institutions?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "View institutions side by side with accreditation status, location, program categories, and student reviews all in one place."
      }
    },
    {
      "@type": "Question",
      "name": "How do I apply?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Head directly to the institution or program page to apply, or start with a scholarship search to fund your education."
      }
    },
    {
      "@type": "Question",
      "name": "What is an industrial attachment?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Attachments are arranged through your university as part of your degree requirements. Your institution uploads eligible students, and you apply through the platform."
      }
    },
    {
      "@type": "Question",
      "name": "Who can post opportunities?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Verified employers and institutions can post internships, attachments, and bursaries. Create an employer account to get started."
      }
    }
  ]
}
4.4 BreadcrumbList Schema (Add to every page)
JSON
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://www.elimux.ke"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Programs",
      "item": "https://www.elimux.ke/programs"
    }
  ]
}
RULES:
Organization and WebSite schema go in the root layout (visible on every page).
FAQPage schema goes on the homepage only.
BreadcrumbList schema goes on every page, dynamically generated based on the current route.
Use a helper component JsonLd to inject scripts cleanly.
STEP 5: Open Graph Image (og-image.jpg)
Create a simple OG image at public/og-image.jpg:
Dimensions: 1200 x 630px
Content: ElimuX logo + "AI-Powered Education & Career Discovery" tagline
Background: dark gradient matching the homepage hero
If you cannot generate an image, create a placeholder and flag it for design in Cycle 030.
STEP 6: Canonical URLs & Link Cleanup
6.1 Canonical URLs
Add to every page's metadata:
TypeScript
alternates: {
  canonical: 'https://www.elimux.ke/programs', // or current page URL
}
6.2 Internal Linking Cleanup
Audit and fix:
All internal links must use absolute paths (/programs, not programs)
No broken links to /opportunities (redirected to /internships)
Footer links must all resolve to real pages
"Advertise here" link in AdPortalSection must point to /partner or /contact
All <a> tags must have href attributes (no empty or # links)
6.3 External Links
All external links must have rel="noopener noreferrer"
Sponsor/affiliate links must have rel="noopener noreferrer sponsored"
STEP 7: Heading Hierarchy (H1 → H6)
Audit every page for proper heading structure:
Each page must have exactly ONE <h1>
Headings must not skip levels (no H1 → H3)
Homepage H1: "Discover Your Perfect Education"
TVET page H1: "Your Grade Opens Doors — Find Your Path"
Other pages: appropriate H1 matching the page purpose
STEP 8: Image Alt Text
Audit all <img> tags:
Every image must have descriptive alt text
Logo: alt="ElimuX logo"
Institution logos: alt="[Institution Name] logo"
Program images: alt="[Program Name] at [Institution Name]"
Icons: alt="" (decorative) or meaningful labels
Sponsor banners: alt="[Sponsor Name] - [Tagline]"
STEP 9: Verification
After all changes:
npx tsc --noEmit
npm run build
npx next start
Check these URLs and confirm:
[ ] http://localhost:3000/robots.txt — returns correct content
[ ] http://localhost:3000/sitemap.xml — returns valid XML with all routes
[ ] Homepage view-source — contains JSON-LD scripts for Organization, WebSite, FAQPage
[ ] /programs view-source — contains unique meta description and title
[ ] Every public page has unique <title> and <meta name="description">
[ ] No empty alt attributes on content images
[ ] No skipped heading levels
DO NOT commit. DO NOT push. Report results.