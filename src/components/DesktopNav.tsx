'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/theme-toggle';
import { useState, useRef, useEffect } from 'react';
import PoweredByHeaderBadge from './PoweredByHeaderBadge';

const PRIMARY_NAV = [
  { icon: '🏠', label: 'Home', href: '/' },
  { icon: '🏛️', label: 'Institutions', href: '/institutions' },
  { icon: '✨', label: 'AI Search', href: '/ai-search' },
  { icon: '💼', label: 'Opportunities', href: "/opportunities" },
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
  const { user, signOut } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const isAdmin = (user as any)?.role === 'admin';

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
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
            <Link
              href="https://bursary.elimux.ke"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-all text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              <span className="text-sm">💰</span>
              Bursary
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-800 rounded-full">
                Opening Soon
              </span>
            </Link>
                <PoweredByHeaderBadge />

          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3 shrink-0 ml-auto lg:ml-0">
            <ThemeToggle />

            {user ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 pl-1 pr-3 py-1.5 rounded-full hover:bg-muted transition-colors border border-border"
                >
                  <div className="w-7 h-7 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                    {(user as any).email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-muted-foreground text-[13px] font-medium max-w-[100px] truncate">
                    {(user as any).email?.split('@')[0] || 'Account'}
                  </span>
                  <span className="text-muted-foreground text-xs">⌄</span>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-background border border-border rounded-xl shadow-lg py-2 z-50">
                    <Link
                      href="/student/profile"
                      onClick={() => setProfileOpen(false)}
                      className="block px-4 py-2 text-foreground text-sm hover:bg-muted"
                    >
                      Profile
                    </Link>
                    <Link
                      href="/applications"
                      onClick={() => setProfileOpen(false)}
                      className="block px-4 py-2 text-foreground text-sm hover:bg-muted"
                    >
                      📝 My Applications
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-2 text-foreground text-sm hover:bg-muted"
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <div className="border-t border-border my-1" />
                    <button
                      onClick={() => {
                        signOut();
                        setProfileOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-red-600 text-sm hover:bg-red-50"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-muted-foreground text-[13px] font-medium hover:text-foreground transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="bg-foreground text-background text-[13px] font-semibold px-4 py-2 rounded-full hover:opacity-90 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Line 2 — Secondary */}
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
    </header>
  );
}


