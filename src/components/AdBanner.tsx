'use client';

import { useEffect, useState } from 'react';
import { Ad } from '@/types';

interface AdBannerProps {
  placement: 'homepage' | 'search' | 'sidebar' | 'banner';
  className?: string;
}

export default function AdBanner({ placement, className = '' }: AdBannerProps) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAd() {
      try {
        const response = await fetch(`/api/ads?placement=${placement}&limit=1`);
        if (response.ok) {
          const { data } = await response.json();
          if (data?.length > 0) setAd(data[0]);
        }
      } catch {
        // Silently fail — ads are non-critical
      } finally {
        setLoading(false);
      }
    }
    fetchAd();
  }, [placement]);

  if (loading || !ad) return null;

  return (
    <a
      href={ad.link_url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block relative overflow-hidden rounded-xl border border-gray-200 hover:shadow-md transition-shadow ${className}`}
      onClick={() => {
        // Track click
        fetch(`/api/ads/${ad.id}/click`, { method: 'POST' }).catch(() => {});
      }}
    >
      {ad.image_url ? (
        <img src={ad.image_url} alt={ad.title} className="w-full h-auto object-cover" />
      ) : (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
          <p className="text-xs font-medium uppercase tracking-wide opacity-75">Sponsored</p>
          <h4 className="font-bold text-lg mt-1">{ad.title}</h4>
          <p className="text-sm text-white/80 mt-1">{ad.content}</p>
        </div>
      )}
      <div className="absolute top-2 right-2">
        <span className="text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded">Ad</span>
      </div>
    </a>
  );
}
