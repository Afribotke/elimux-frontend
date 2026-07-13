'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sparkles } from 'lucide-react'

const LINKS = [
  { href: '/institutions', label: 'Institutions' },
  { href: '/programs', label: 'Programs' },
  { href: '/scholarships', label: 'Scholarships' },
  { href: '/ai-search', label: 'AI Search' },
  { href: '/pricing', label: 'Pricing' },
]

export default function DesktopNav() {
  const pathname = usePathname()

  return (
    <nav className="hidden md:flex items-center gap-6" aria-label="Primary">
      {LINKS.map((link) => {
        const active = pathname?.startsWith(link.href)
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`text-sm font-medium transition-colors ${
              active ? 'text-primary-400' : 'text-muted hover:text-foreground'
            }`}
          >
            {link.label}
          </Link>
        )
      })}
      <Link
        href="/ai-search"
        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
      >
        <Sparkles className="w-3.5 h-3.5" />
        Get Started
      </Link>
    </nav>
  )
}
