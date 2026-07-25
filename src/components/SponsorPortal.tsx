'use client';

import { useState } from 'react';
import { Ad } from '@/types';

interface SponsorPortalProps {
  ads: Ad[];
  sponsorId: string;
}

export default function SponsorPortal({ ads, sponsorId }: SponsorPortalProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'paused' | 'ended'>('active');

  const filteredAds = ads.filter(ad => ad.status === activeTab);
  const totalImpressions = ads.reduce((sum, ad) => sum + ad.impressions, 0);
  const totalClicks = ads.reduce((sum, ad) => sum + ad.clicks, 0);
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Ads</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{ads.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Impressions</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{totalImpressions.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Clicks</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{totalClicks.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">CTR</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{ctr}%</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {(['active', 'paused', 'ended'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab} ({ads.filter(a => a.status === tab).length})
            </button>
          ))}
        </div>

        <div className="p-4">
          {filteredAds.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>No {activeTab} ads</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAds.map((ad) => (
                <div key={ad.id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                  {ad.image_url && (
                    <img src={ad.image_url} alt={ad.title} className="w-16 h-16 object-cover rounded-lg" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{ad.title}</h4>
                    <p className="text-sm text-gray-500 truncate">{ad.placement} · {new Date(ad.start_date).toLocaleDateString()} - {new Date(ad.end_date).toLocaleDateString()}</p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>{ad.impressions.toLocaleString()} impressions</span>
                      <span>{ad.clicks.toLocaleString()} clicks</span>
                    </div>
                  </div>
                  <a
                    href={ad.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
