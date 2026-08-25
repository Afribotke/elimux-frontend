'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

// Extracted from DesktopNav.tsx's own inline dropdown (same menu items, same
// links) - just given the framer-motion polish and made reusable, not a
// redesign. Sources user/signOut from the real AuthContext (@/hooks/useAuth),
// not the imaginary shape/columns an earlier draft of this component assumed
// (no avatar_url - never populated; role stays real but is hardcoded
// 'student' today per AuthContext's fetchProfile, so the admin link below is
// live code that just never currently triggers).
export function AuthNav({ className }: { className?: string }) {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = useCallback(() => {
    setIsOpen(false);
    signOut();
  }, [signOut]);

  if (!user) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
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
    );
  }

  const isAdmin = (user as any)?.role === 'admin';
  const displayName = user.full_name || user.email?.split('@')[0] || 'Account';
  const initial = user.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 pl-1 pr-3 py-1.5 rounded-full hover:bg-muted transition-colors border border-border"
      >
        <div className="w-7 h-7 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center text-white text-[10px] font-bold">
          {initial}
        </div>
        <span className="text-muted-foreground text-[13px] font-medium max-w-[100px] truncate">
          {displayName}
        </span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-muted-foreground transition-transform duration-200', isOpen && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-52 bg-background border border-border rounded-xl shadow-lg py-2 z-50"
          >
            <Link
              href="/student/profile"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-foreground text-sm hover:bg-muted"
            >
              Profile
            </Link>
            <Link
              href="/applications"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-foreground text-sm hover:bg-muted"
            >
              📝 My Applications
            </Link>
            <Link
              href="/bursary/notifications"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-foreground text-sm hover:bg-muted"
            >
              🔔 Bursary Notifications
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-foreground text-sm hover:bg-muted"
              >
                Admin Dashboard
              </Link>
            )}
            <div className="border-t border-border my-1" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full text-left px-4 py-2 text-red-600 text-sm hover:bg-red-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
