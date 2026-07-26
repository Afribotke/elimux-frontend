'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/theme-toggle';
import { useState, useRef, useEffect } from 'react';

const PRIMARY_NAV = [
  { icon: '🏠', label: 'Home', href: '/' },
  { icon: '🏛️', label: 'Institutions', href: '/institutions' },
  { icon: '✨', label: 'AI Search', href: '/ai-search' },
  { icon: '💼', label: 'Internships', href: '/internships' },
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
      ? 'bg-gray-100 text-gray-900'
      : 'bg-white text-gray-800 shadow-sm';

  const inactive =
    size === 'md'
      ? 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/50'
      : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100/50';

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
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      {/* Line 1 — Primary */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center h-[52px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center text-white text-sm">
              🎓
            </div>
            <span className="text-gray-900 font-bold text-lg tracking-tight">
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
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3 shrink-0 ml-auto lg:ml-0">
            <ThemeToggle />

            {user ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 pl-1 pr-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors border border-gray-200"
                >
                  <div className="w-7 h-7 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                    {(user as any).email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-gray-600 text-[13px] font-medium max-w-[100px] truncate">
                    {(user as any).email?.split('@')[0] || 'Account'}
                  </span>
                  <span className="text-gray-400 text-xs">⌄</span>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-100 rounded-xl shadow-lg py-2 z-50">
                    <Link
                      href="/student/profile"
                      onClick={() => setProfileOpen(false)}
                      className="block px-4 py-2 text-gray-700 text-sm hover:bg-gray-50"
                    >
                      Profile
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setProfileOpen(false)}
                        className="block px-4 py-2 text-gray-700 text-sm hover:bg-gray-50"
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <div className="border-t border-gray-100 my-1" />
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
                  className="text-gray-500 text-[13px] font-medium hover:text-gray-900 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="bg-gray-900 text-white text-[13px] font-semibold px-4 py-2 rounded-full hover:bg-gray-800 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Line 2 — Secondary */}
      <div className="hidden lg:block border-t border-gray-50 bg-[#fafafa]">
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
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
