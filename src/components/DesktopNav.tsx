'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/theme-toggle';
import { useState, useEffect } from 'react';
import PoweredByHeaderBadge from './PoweredByHeaderBadge';
import NotificationBell from './bursary/NotificationBell';
import { AuthNav } from './layout/AuthNav';

const PRIMARY_NAV = [
  { icon: '🏠', label: 'Home', href: '/' },
  { icon: '🏛️', label: 'Institutions', href: '/institutions' },
  { icon: '✨', label: 'AI Search', href: '/ai-search' },
  { icon: '📋', label: 'Programs', href: '/programs' },
];

const SECONDARY_NAV = [
  { icon: '🏢', label: 'For Employers', href: '/for-employers' },
  { icon: '🏆', label: 'Achievements', href: '/achievements' },
  { icon: '🤝', label: 'Partner', href: '/partner' },
];

function NavLink({
  href,
  icon,
  label,
  isActive,
  size = 'md',
}: {
  href: string;
  icon: string;
  label: string;
  isActive: boolean;
  size?: 'md' | 'sm';
}) {
  const base =
    size === 'md'
      ? 'flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-all'
      : 'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-all';

  const active =
    size === 'md'
      ? 'bg-muted text-foreground'
      : 'bg-background text-foreground shadow-sm';

  const inactive =
    size === 'md'
      ? 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50';

  return (
    <Link href={href} className={`${base} ${isActive ? active : inactive}`}>
      <span className={size === 'md' ? 'text-sm' : 'text-xs'}>{icon}</span>
      {label}
    </Link>
  );
}

export default function DesktopNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  // Cycle 027: transparent-over-hero, solid-on-scroll only applies on the
  // homepage - it's the only route with a colored hero for the navbar to
  // float over. Every other page keeps the same always-solid style it had
  // before (nothing behind it to show through, so a transparent navbar
  // there would just look broken).
  const isHome = pathname === '/';
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isHome) return;
    function handleScroll() {
      setScrolled(window.scrollY > 60);
    }
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHome]);

  const headerSolid = !isHome || scrolled;

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-200 ${
        headerSolid
          ? 'bg-background/80 backdrop-blur-md border-b border-border'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      {/* Line 1 — Primary */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center h-[52px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center text-white text-sm">
              🎓
            </div>
            <span className="text-foreground font-bold text-lg tracking-tight">
              ElimuX
            </span>
          </Link>

          {/* Centered Primary Nav — no dead space */}
          <nav className="hidden lg:flex items-center gap-1 mx-auto">
            {PRIMARY_NAV.map((item) => (
              <NavLink
                key={item.href}
                {...item}
                isActive={isActive(item.href)}
                size="md"
              />
            ))}
                <PoweredByHeaderBadge />

          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3 shrink-0 ml-auto lg:ml-0">
            <ThemeToggle />

            {user && <NotificationBell />}

            <AuthNav />
          </div>
        </div>
      </div>

      {/* Line 2 — Secondary. Hidden on the homepage - the dark hero there
          has nowhere for this light gray bar to sit without breaking it. */}
      {!isHome && (
        <div className="hidden lg:block border-t border-border bg-muted/30">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center h-[38px]">
              <nav className="flex items-center gap-1 mx-auto">
                {SECONDARY_NAV.map((item) => (
                  <NavLink
                    key={item.href}
                    {...item}
                    isActive={isActive(item.href)}
                    size="sm"
                  />
                ))}
                    <PoweredByHeaderBadge />

              </nav>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}


