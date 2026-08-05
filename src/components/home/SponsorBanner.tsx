'use client';

import { useMajorSponsor } from '@/lib/useMajorSponsor';
import { ExternalLink } from 'lucide-react';

export default function SponsorBanner() {
  const { sponsor } = useMajorSponsor();

  if (!sponsor) return null;

  return (
    <section className="mt-10 mb-6 bg-[#fafaf9] border border-gray-200 rounded-2xl py-12 px-4 text-center">
      <p className="text-gray-400 text-xs font-semibold tracking-widest uppercase mb-6">
        Proudly Powered By
      </p>

      <a
        href={sponsor.website_url || undefined}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex flex-col items-center gap-4 group"
      >
        {sponsor.logo_url ? (
          <img
            src={sponsor.logo_url}
            alt={sponsor.name}
            className="h-16 md:h-20 w-auto object-contain transition-transform group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="text-3xl md:text-4xl font-bold text-gray-900">
            {sponsor.name}
          </span>
        )}

        {sponsor.tagline && (
          <p className="text-lg text-gray-600 max-w-xl">
            {sponsor.tagline}
          </p>
        )}

        <span className="inline-flex items-center gap-2 text-sm font-medium text-[#7c6f50] group-hover:text-gray-900 transition-colors">
          Visit {sponsor.name}
          <ExternalLink className="w-4 h-4" />
        </span>
      </a>
    </section>
  );
}
