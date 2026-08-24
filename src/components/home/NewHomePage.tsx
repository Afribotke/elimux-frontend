'use client';

import { useState } from 'react';
import CategoryPills from './CategoryPills';
import CareerSearchDropdown from './CareerSearchDropdown';
import GradeMatcher from './GradeMatcher';
import AdPortalSection from './AdPortalSection';
import PopularPrograms from './PopularPrograms';
import SponsorBanner from './SponsorBanner';
import HowItWorks from './HowItWorks';
import { Footer } from '@/components/layout/Footer';
import AISearchOverlay from '@/components/search/AISearchOverlay';
import { Target, GraduationCap as GradIcon, Award } from 'lucide-react';

// Cycle 025: the 3 category tabs (University & College / Skills & Trades /
// Scholarships) duplicated the global UnifiedNavBar and hid content behind
// clicks. Replaced with always-visible stacked sections instead - same
// components, no tab state, nothing gated.
//
// Cycle 027: hero redesigned to fold the site's 6 top-level categories
// directly into it, since UnifiedNavBar is now hidden on this route only
// (see UnifiedNavBar.tsx). Same href/icon/label set as UnifiedNavBar's own
// PILLS array - kept as a small local list here rather than importing that
// module's internals, since UnifiedNavBar doesn't export PILLS and this is
// the only other place that needs it.
//
// Cycle 027 (dark premium hero): the hero is now permanently dark
// regardless of the site-wide light/dark toggle - same deliberate pattern
// as SponsorBanner/AdPortalSection's CTA banner, which are also always
// dark by design. Cards switched from translucent tinted glass to solid
// slate-800 blocks with a colored top border + solid icon fill. Combined
// hover shadow layers the instruction's generic dark drop-shadow with a
// second, color-matched glow per card (same RGB values used for the top
// border), since a single shadow can't do both.
const HERO_CATEGORIES = [
  {
    label: 'Universities & College', icon: '🎓', href: '/programs?type=university',
    topBorder: 'border-t-blue-500',
    iconBg: 'bg-blue-500',
    glow: 'hover:shadow-[0_10px_40px_-4px_rgba(59,130,246,0.3)]',
    ring: 'focus-visible:ring-blue-400',
  },
  {
    label: 'Skills & Trades (TVET)', icon: '🔧', href: '/programs?type=tvet',
    topBorder: 'border-t-orange-500',
    iconBg: 'bg-orange-500',
    glow: 'hover:shadow-[0_10px_40px_-4px_rgba(249,115,22,0.3)]',
    ring: 'focus-visible:ring-orange-400',
  },
  {
    label: 'Scholarships', icon: '🏆', href: '/scholarships',
    topBorder: 'border-t-yellow-500',
    iconBg: 'bg-yellow-500',
    glow: 'hover:shadow-[0_10px_40px_-4px_rgba(234,179,8,0.3)]',
    ring: 'focus-visible:ring-yellow-400',
  },
  {
    label: 'Internship', icon: '💼', href: '/internships',
    topBorder: 'border-t-emerald-500',
    iconBg: 'bg-emerald-500',
    glow: 'hover:shadow-[0_10px_40px_-4px_rgba(16,185,129,0.3)]',
    ring: 'focus-visible:ring-emerald-400',
  },
  {
    label: 'Attachment', icon: '📎', href: '/attachments',
    topBorder: 'border-t-violet-500',
    iconBg: 'bg-violet-500',
    glow: 'hover:shadow-[0_10px_40px_-4px_rgba(139,92,246,0.3)]',
    ring: 'focus-visible:ring-violet-400',
  },
  {
    label: 'Bursary', icon: '💰', href: '/bursary',
    topBorder: 'border-t-rose-500',
    iconBg: 'bg-rose-500',
    glow: 'hover:shadow-[0_10px_40px_-4px_rgba(244,63,94,0.3)]',
    ring: 'focus-visible:ring-rose-400',
  },
];

const HERO_STATS = [
  { value: '10,000+', label: 'Institutions' },
  { value: '50,000+', label: 'Programs' },
  { value: '100+', label: 'Countries' },
  { value: '1M+', label: 'Students' },
];

export default function NewHomePage() {
  const [showGradeMatcher, setShowGradeMatcher] = useState(false);

  return (
    <div className="w-full bg-white dark:bg-background min-h-screen">
      {/* Hero Section - permanently dark, not theme-toggle-adaptive
          (same deliberate pattern as SponsorBanner/AdPortalSection's CTA
          banner elsewhere on this page). Picked the "subtle brand warmth"
          gray/slate variant over pure slate-950-to-black, since the
          instruction offered both and this one still reads as ElimuX's
          own palette rather than a generic dark theme. */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950">
        {/* Radial glow behind the headline, for depth */}
        <div
          className="pointer-events-none absolute left-1/2 top-24 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary-500/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative max-w-5xl mx-auto px-4 pt-14 pb-12 text-center">
          <div className="flex items-center gap-2 mx-auto mb-4 w-fit bg-primary-500/20 text-primary-300 border border-primary-500/30 rounded-full px-4 py-1.5 text-sm font-medium">
            <span>✨ AI-Powered Education & Career Hub</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-white text-center drop-shadow-lg text-balance max-w-3xl mx-auto">
            Discover Your Perfect Education
          </h1>

          <p className="text-lg md:text-xl text-gray-300 text-center mt-4 mb-10 max-w-2xl mx-auto">
            Find universities, colleges, TVET institutes, and programs worldwide.
          </p>

          {/* AI Search Bar - moved above the category cards */}
          <div className="mb-10">
            <AISearchOverlay />
          </div>

          {/* Or browse by category */}
          <div className="flex items-center gap-4 max-w-[560px] mx-auto mt-8 mb-4">
            <div className="h-px bg-gray-700 flex-1" />
            <span className="text-sm text-gray-400 dark:text-gray-500 text-center shrink-0">
              Or browse by category
            </span>
            <div className="h-px bg-gray-700 flex-1" />
          </div>

          {/* 6 category cards — same destinations as UnifiedNavBar's pills.
              max-w-[560px] targets ~160-180px per card on desktop at
              3 columns + gap-4, per the resize spec. */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5 max-w-[560px] mx-auto">
            {HERO_CATEGORIES.map((cat) => (
              <a
                key={cat.href}
                href={cat.href}
                className={`flex flex-col items-center text-center bg-slate-800 border border-slate-700 hover:border-slate-500 border-t-4 ${cat.topBorder} rounded-2xl p-6 min-h-[160px] justify-center transition-all duration-300 hover:-translate-y-2 hover:bg-slate-700 ${cat.glow} focus-visible:outline-none focus-visible:ring-2 ${cat.ring} focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900`}
              >
                <div className={`w-14 h-14 rounded-full ${cat.iconBg} text-white flex items-center justify-center mx-auto mb-3`}>
                  <span className="text-2xl">{cat.icon}</span>
                </div>
                <span className="text-white font-semibold text-base">
                  {cat.label}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Discovery Tools — moved directly below the 6 category cards per
          this cycle's reorder. The instruction's spec (icon 24px, single
          input/dropdown at h-9, single compact button) describes a
          one-action micro-tool per card, not a full results-displaying
          widget - CareerSearchDropdown already fits that (kept as the
          real component, not forked, since it's already just a single
          input+live-dropdown). GradeMatcher's full experience includes a
          results list that would break the "balanced visual weight, no
          section dominates" goal this same instruction states if crammed
          into a ~300px column, so its compact card triggers an inline
          reveal of the real component below the 3-column row instead.
          Scholarship matching has no compact single-input form (GPA +
          course + county + gender + a full results grid) - rather than
          gut ScholarshipDiscovery.tsx into something it isn't, the card
          links straight to /scholarships, which already exists as a
          real, separate, fully-built listing page with its own filters -
          the natural home for this, not a homepage teaser. */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 my-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">More Ways to Discover</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-6 h-6 text-primary-600 shrink-0" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Find a Career</span>
              </div>
              <p className="text-xs text-gray-500 truncate mb-2">Search careers and see matching programs</p>
              <CareerSearchDropdown />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-1">
                <GradIcon className="w-6 h-6 text-primary-600 shrink-0" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Match Your Grade</span>
              </div>
              <p className="text-xs text-gray-500 truncate mb-2">Find courses you qualify for with your KCSE grade</p>
              <button
                onClick={() => setShowGradeMatcher((v) => !v)}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white text-xs font-medium py-1.5 px-3 hover:border-primary-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-1"
              >
                {showGradeMatcher ? 'Hide' : 'Check My Grade'}
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-6 h-6 text-primary-600 shrink-0" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Match Scholarships</span>
              </div>
              <p className="text-xs text-gray-500 truncate mb-2">Tell us about yourself, get matched instantly</p>
              <a
                href="/scholarships"
                className="block w-full text-center rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium py-1.5 px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-1"
              >
                Match Me
              </a>
            </div>
          </div>

          {showGradeMatcher && (
            <div className="mt-4">
              <GradeMatcher />
            </div>
          )}
        </div>
      </div>

      {/* LIVE Partners & Advertisers — must sit immediately below Discovery
          Tools, not above it */}
      <div className="max-w-5xl mx-auto px-4">
        <AdPortalSection />
      </div>

      {/* Stats bar */}
      <div className="bg-white dark:bg-background border-y border-gray-100 dark:border-border py-8">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {HERO_STATS.map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl font-bold text-primary-600">{stat.value}</div>
              <div className="text-sm text-gray-500 dark:text-muted">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Programs */}
      <div className="max-w-5xl mx-auto px-4">
        <PopularPrograms />
      </div>

      {/* This cycle's Discovery Tools spec explicitly names only
          CareerSearchDropdown/GradeMatcher/ScholarshipDiscovery - it
          doesn't mention CategoryPills (the profession-pill browser), and
          adding a 4th item would break the "3 columns" grid the
          instruction specifies. Kept it, since it's real and working, in
          this gap where no adjacency rule applies. */}
      <div className="max-w-5xl mx-auto px-4">
        <CategoryPills />
      </div>

      {/* How It Works */}
      <div className="max-w-5xl mx-auto px-4">
        <HowItWorks />
      </div>

      {/* Sponsor Banner — deliberately full-width, breaks out of the
          max-w-5xl container the other sections use */}
      <SponsorBanner />

      {/* Cycle 027: Footer was previously unused anywhere in the app (see
          docs/audit-log.md) - the old Skolex homepage had none at all. */}
      <Footer />
    </div>
  );
}
