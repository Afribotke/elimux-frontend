'use client';

import { useState } from 'react';
import CategoryPills from './CategoryPills';
import CareerSearchDropdown from './CareerSearchDropdown';
import GradeMatcher from './GradeMatcher';
import ScholarshipDiscovery from './ScholarshipDiscovery';
import AdPortalSection from './AdPortalSection';
import PopularPrograms from './PopularPrograms';
import SponsorBanner from './SponsorBanner';
import AISearchOverlay from '@/components/search/AISearchOverlay';
import type { TabType } from '@/types/home';

export default function NewHomePage() {
  const [activeTab, setActiveTab] = useState<TabType>('skills');

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
          Tell us what you&apos;re looking for
        </h1>

        {/* Subtitle */}
        <p className="text-gray-500 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
          Describe it in your own words, pick your interests, or tell us your dream career — we&apos;ll match you to real programs.
        </p>

        {/* Tab Pills */}
        <div className="flex justify-center gap-3 mb-6">
          <button
            onClick={() => setActiveTab('uni')}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-medium transition-all ${
              activeTab === 'uni'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
            }`}
          >
            <span>🎓</span>
            University & College
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-medium transition-all ${
              activeTab === 'skills'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
            }`}
          >
            <span>🔧</span>
            Skills & Trades
          </button>
          <button
            onClick={() => setActiveTab('scholarships')}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-medium transition-all ${
              activeTab === 'scholarships'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
            }`}
          >
            <span>💰</span>
            Scholarships
          </button>
        </div>

        {/* AI Search Bar */}
        <AISearchOverlay />
      </div>

      {/* Tab Content */}
      <div className="max-w-5xl mx-auto px-4 pb-4">
        {activeTab === 'uni' && (
          <div>
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
          </div>
        )}
        {activeTab === 'skills' && (
          <div className="max-w-2xl mx-auto">
            <GradeMatcher />
          </div>
        )}
        {activeTab === 'scholarships' && <ScholarshipDiscovery />}
      </div>

      {/* Homepage Sections — visible on both tabs */}
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
