'use client'

import Link from 'next/link'
import { useMajorSponsor } from '@/lib/useMajorSponsor'

export default function Footer() {
  const { sponsor } = useMajorSponsor()
  const showSponsor = sponsor && sponsor.show_in_footer

  return (
    <footer className="py-8 px-4 border-t border-border bg-elimux-dark">
      <div className="max-w-6xl mx-auto text-center space-y-4">
        {showSponsor && (
          <a
            href={sponsor.website_url || undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-col items-center gap-2 group"
          >
            <span className="text-sm text-muted">
              ElimuX is proudly powered by{' '}
              <span className="font-semibold text-foreground group-hover:text-primary-400 transition-colors">{sponsor.name}</span>
            </span>
            {sponsor.logo_url && (
              <img src={sponsor.logo_url} alt={sponsor.name} className="h-10 w-auto object-contain" loading="lazy" decoding="async" />
            )}
            {sponsor.tagline && <span className="text-xs text-muted">{sponsor.tagline}</span>}
          </a>
        )}

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted">
          <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
          <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          <Link href="/accreditation-bodies" className="hover:text-foreground transition-colors">Accreditation Bodies</Link>
          <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
        </div>

        <div>
          <p className="text-muted text-sm mb-2">&copy; 2026 ElimuX. Discover global education opportunities.</p>
          <Link href="/institution-onboarding" className="text-sm text-primary-400 hover:text-primary-300 transition-colors">
            Are you an institution? List your programs on ElimuX
          </Link>
        </div>
      </div>
    </footer>
  )
}
