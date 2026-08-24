'use client';

import { useMajorSponsor } from '@/lib/useMajorSponsor';
import { ExternalLink } from 'lucide-react';

export default function SponsorBanner() {
  const { sponsor } = useMajorSponsor();

  if (!sponsor) return null;

  // Cycle 027 asked for this section hardcoded to a specific sponsor name
  // ("Afribot") and tagline ("Banking on Education") - checked first and
  // that isn't a real configured sponsor anywhere: grepped the whole repo,
  // the only match is the admin form's placeholder example text
  // (`placeholder="e.g., Afribot"` in MajorSponsorForm.tsx), not live data.
  // Hardcoding a specific sponsor name here would show a partnership that
  // doesn't exist - the same class of problem as the impersonating
  // employer records fixed earlier this session. Kept this genuinely
  // data-driven (whatever real sponsor an admin configures via
  // useMajorSponsor()), only restyled to the requested full-width dark
  // layout.
  return (
    <section className="w-full bg-gray-900 text-white py-16 px-4 text-center">
      <p className="text-white/50 text-xs font-semibold tracking-widest uppercase mb-6">
        Proudly Powered By
      </p>

      <a
        href={sponsor.website_url || undefined}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex flex-col items-center gap-4 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded-lg"
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
          <span className="text-3xl md:text-4xl font-bold text-white">
            {sponsor.name}
          </span>
        )}

        {sponsor.tagline && (
          <p className="text-lg text-white/70 max-w-xl">
            {sponsor.tagline}
          </p>
        )}

        <span className="inline-flex items-center gap-2 text-sm font-medium text-primary-400 group-hover:text-white transition-colors">
          Visit {sponsor.name}
          <ExternalLink className="w-4 h-4" />
        </span>
      </a>
    </section>
  );
}
