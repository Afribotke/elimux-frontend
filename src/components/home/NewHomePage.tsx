'use client';

import CategoryPills from './CategoryPills';
import CareerSearchDropdown from './CareerSearchDropdown';
import GradeMatcher from './GradeMatcher';
import ScholarshipDiscovery from './ScholarshipDiscovery';
import AdPortalSection from './AdPortalSection';
import PopularPrograms from './PopularPrograms';
import SponsorBanner from './SponsorBanner';
import AISearchOverlay from '@/components/search/AISearchOverlay';

// Cycle 025: the 3 category tabs (University & College / Skills & Trades /
// Scholarships) duplicated the global UnifiedNavBar and hid content behind
// clicks. Replaced with always-visible stacked sections instead - same
// components, no tab state, nothing gated.
export default function NewHomePage() {
  return (
    <div className="w-full bg-white min-h-screen">
      {/* Hero Section — matches old design exactly */}
      <div className="max-w-5xl mx-auto px-4 pt-10 pb-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-[#fef3c7] text-[#92400e] px-4 py-1.5 rounded-full text-sm font-medium mb-6">
          <span>✨</span>
          <span>AI-Powered Education Discovery</span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
          Discover Your Perfect Education
        </h1>

        {/* Subtitle */}
        <p className="text-gray-500 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
          Find universities, colleges, TVET institutes, and programs worldwide.
        </p>

        {/* AI Search Bar */}
        <AISearchOverlay />
      </div>

      {/* Section 1: AI Search — category browsing, career search, grade matcher */}
      <div className="max-w-5xl mx-auto px-4 pb-10">
        <CategoryPills />
        <div className="text-left mt-2 max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🎯</span>
            <span className="text-gray-900 text-lg font-semibold">Find a course or career</span>
          </div>
          <CareerSearchDropdown />
          <div className="text-center mt-4">
            <a href="/careers" className="text-gray-400 text-sm hover:text-gray-600 transition-colors">
              Browse all careers A–Z →
            </a>
          </div>
        </div>
        <div className="max-w-2xl mx-auto mt-8">
          <GradeMatcher />
        </div>
      </div>

      {/* Section 2: Scholarship Discovery */}
      <div className="max-w-5xl mx-auto px-4 pb-4">
        <ScholarshipDiscovery />
      </div>

      {/* Section 3: Popular Programs, Live Partners & Advertisers, sponsor banner */}
      <div className="max-w-5xl mx-auto px-4">
        <AdPortalSection />
        <PopularPrograms />
        <SponsorBanner />
      </div>

      {/* Footer spacer */}
      <div className="h-12" />
    </div>
  );
}
