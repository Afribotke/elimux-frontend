'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Sparkles, GraduationCap, Award, Trophy, User } from 'lucide-react'

const TABS = [
  { href: '/', label: 'Home', icon: Home, exact: true },
  { href: '/ai-search', label: 'Search', icon: Sparkles, exact: false },
  { href: '/programs', label: 'Programs', icon: GraduationCap, exact: false },
  { href: '/scholarships', label: 'Scholarships', icon: Award, exact: false },
  { href: '/leaderboard', label: 'Ranks', icon: Trophy, exact: false },
  { href: '/account/subscription', label: 'Account', icon: User, exact: false },
]

export default function MobileNav() {
  const pathname = usePathname()

  if (pathname?.startsWith('/admin')) return null

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-elimux-dark/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <div className="grid grid-cols-6">
        {TABS.map((tab) => {
          const active = tab.exact ? pathname === tab.href : pathname?.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center gap-0.5 min-h-[56px] text-xs font-medium transition-colors ${
                active ? 'text-primary-400' : 'text-muted hover:text-foreground'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
