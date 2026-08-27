Root Cause First, Then Polish
Step 1 — Diagnose why the existing auth nav shows "Log In" when you're authenticated. The AI search page likely uses a different layout, misses the AuthContext provider, or has a hydration race. Claude should run this diagnostic before touching any UI:
powershell
# Diagnostic: find every navbar/header instance and auth provider boundary
Get-ChildItem -Recurse -Filter "*.tsx" | Select-String -Pattern "Log In|Get Started|AuthContext|DesktopNav|MobileNav" | Select-Object Filename, LineNumber, Line | Format-Table -AutoSize

# Check if ai-search page uses a different layout
Get-Content src/app/ai-search/layout.tsx -ErrorAction SilentlyContinue
Get-Content src/app/ai-search/page.tsx | Select-String -Pattern "layout|AuthContext|DesktopNav|MobileNav" 
Step 2 — Extract and polish the existing working dropdown into a single AuthNav.tsx, but source from the real data model (student_profiles, no avatar_url, role hardcoded to 'student'). No imaginary columns.
src/components/layout/AuthNav.tsx — REFACTORED (Real Data Only)
tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  LogOut, 
  LayoutDashboard, 
  Settings, 
  ChevronDown,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext'; // your existing context

// ─── Component ─────────────────────────────────────────────────────

export function AuthNav({ className }: { className?: string }) {
  const { user, isLoading, signOut } = useAuth(); // use your REAL context
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Close on route change
  useEffect(() => setIsOpen(false), [pathname]);

  // Click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = useCallback(async () => {
    setIsOpen(false);
    await signOut();
    router.push('/');
    router.refresh();
  }, [signOut, router]);

  // Derive display name from real context shape
  const displayName = user?.user_metadata?.full_name 
    ?? user?.email?.split('@')[0] 
    ?? 'User';
  
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // ── Loading Skeleton ─────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse" />
      </div>
    );
  }

  // ── Authenticated ────────────────────────────────────────────────
  if (user) {
    return (
      <div className={cn("relative", className)} ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-full transition-all duration-200",
            "hover:bg-slate-100 dark:hover:bg-slate-800",
            isOpen && "bg-slate-100 dark:bg-slate-800 ring-2 ring-slate-200 dark:ring-slate-700"
          )}
        >
          {/* Avatar — gradient fallback, no external URL dependency */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 
                        flex items-center justify-center text-white text-xs font-semibold
                        ring-2 ring-white dark:ring-slate-900 relative">
            {initials}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 
                           border-2 border-white dark:border-slate-900 rounded-full" />
          </div>

          <span className="hidden sm:block text-sm font-medium text-slate-900 dark:text-slate-100 max-w-[100px] truncate">
            {displayName}
          </span>

          <ChevronDown className={cn(
            "w-3.5 h-3.5 text-slate-400 transition-transform duration-200",
            isOpen && "rotate-180"
          )} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute right-0 mt-2 w-60 bg-white dark:bg-slate-900 rounded-2xl 
                       shadow-xl shadow-slate-200/50 dark:shadow-black/50 
                       border border-slate-200 dark:border-slate-800 
                       overflow-hidden z-50"
            >
              <div className="px-4 py-3.5 bg-slate-50/50 dark:bg-slate-800/50 border-b 
                            border-slate-100 dark:border-slate-800">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {displayName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {user.email}
                </p>
              </div>

              <div className="p-1.5">
                <DropdownItem 
                  href="/student/dashboard"
                  icon={<LayoutDashboard className="w-4 h-4" />}
                  label="Dashboard"
                  onClick={() => setIsOpen(false)}
                />
                <DropdownItem 
                  href="/settings"
                  icon={<Settings className="w-4 h-4" />}
                  label="Settings"
                  onClick={() => setIsOpen(false)}
                />
              </div>

              <div className="h-px bg-slate-100 dark:bg-slate-800 mx-1.5" />

              <div className="p-1.5">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl
                           text-sm text-red-600 dark:text-red-400 
                           hover:bg-red-50 dark:hover:bg-red-950/30
                           transition-colors duration-150"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── Unauthenticated ──────────────────────────────────────────────
  return (
    <div className={cn("flex items-center gap-2 sm:gap-3", className)}>
      <Link
        href="/login"
        className="text-sm font-medium text-slate-600 dark:text-slate-300 
                 hover:text-slate-900 dark:hover:text-white transition-colors
                 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        Log In
      </Link>
      <Link
        href="/register"
        className="text-sm font-semibold text-slate-900 dark:text-slate-100 
                 bg-white dark:bg-slate-800 
                 border border-slate-200 dark:border-slate-700
                 hover:border-slate-300 dark:hover:border-slate-600
                 hover:shadow-md dark:hover:shadow-slate-900/50
                 px-4 py-2 rounded-full transition-all duration-200"
      >
        Get Started
      </Link>
    </div>
  );
}

// ─── Subcomponent ──────────────────────────────────────────────────

function DropdownItem({ 
  href, 
  icon, 
  label, 
  onClick 
}: { 
  href: string; 
  icon: React.ReactNode; 
  label: string; 
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2 rounded-xl
               text-sm text-slate-700 dark:text-slate-300
               hover:bg-slate-100 dark:hover:bg-slate-800
               hover:text-slate-900 dark:hover:text-slate-100
               transition-colors duration-150"
    >
      <span className="text-slate-400 dark:text-slate-500">{icon}</span>
      {label}
    </Link>
  );
}
Claude Execution Script
powershell
# === STEP 0: DIAGNOSE ===
# Find why auth state doesn't show on the AI search page
Write-Host "`n=== DIAGNOSTIC: Auth provider boundaries ===" -ForegroundColor Cyan
Get-ChildItem src -Recurse -Filter "*.tsx" | Select-String -Pattern "AuthContext|AuthProvider|DesktopNav|MobileNav" | Select-Object -First 20

# Check if ai-search uses a different layout
if (Test-Path src/app/ai-search/layout.tsx) { 
  Write-Host "`n--- ai-search/layout.tsx exists ---" -ForegroundColor Yellow
  Get-Content src/app/ai-search/layout.tsx
} else { 
  Write-Host "`n--- ai-search uses root layout ---" -ForegroundColor Green 
}

# === STEP 1: INSTALL DEPENDENCY ===
npm install framer-motion

# === STEP 2: CREATE AuthNav.tsx ===
$authNavPath = "src/components/layout/AuthNav.tsx"
# PASTE the component code above into $authNavPath

# === STEP 3: REPLACE in DesktopNav.tsx & MobileNav.tsx ===
# Find the old auth button block (Log In / Get Started / avatar dropdown) 
# and replace with: <AuthNav />
# Keep your existing useAuth() import path — this component consumes it.

# === STEP 4: TYPE CHECK & BUILD ===
npm run typecheck
if ($LASTEXITCODE -ne 0) { exit 1 }
npm run build
if ($LASTEXITCODE -ne 0) { exit 1 }

# === STEP 5: COMMIT & PUSH ===
git add -A
git commit -m "refactor(nav): unify auth nav with framer-motion dropdown"
git push
What Changed from My First Spec
Table
First Spec (Wrong)	This Spec (Right)
Created new AuthContext + createClient()	Uses your existing useAuth() context
Assumed profiles table with avatar_url, role	Uses user.user_metadata / user.email only — matches your real schema
Assumed Header.tsx exists	Injects into your existing DesktopNav.tsx / MobileNav.tsx
Added role badges (Admin/Student/Advertiser)	Removed — your data model hardcodes 'student' only