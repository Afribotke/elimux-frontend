"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  GraduationCap,
  Search,
  Building2,
  BookOpen,
  Sparkles,
  Briefcase,
  Users,
  Trophy,
  Handshake,
  Shield,
  Menu,
  X,
  ChevronDown,
  LogOut,
  User,
} from "lucide-react";

const navLinks = [
  { href: "/", label: "Home", icon: GraduationCap },
  { href: "/institutions", label: "Institutions", icon: Building2 },
  { href: "/programs", label: "Programs", icon: BookOpen },
  { href: "/ai-search", label: "AI Search", icon: Sparkles },
  { href: "/internships", label: "Internships", icon: Briefcase },
  { href: "/for-employers", label: "For Employers", icon: Users },
  { href: "/achievements", label: "Achievements", icon: Trophy },
  { href: "/partner", label: "Partner", icon: Handshake },
];

export default function DesktopNav() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const userRole = (user as any)?.role;
  const userName = (user as any)?.full_name || (user as any)?.email?.split("@")[0] || "Account";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold text-foreground">ElimuX</span>
        </Link>

        {/* Desktop Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}

          {/* Admin Link (conditional) */}
          {userRole === "admin" && (
            <Link
              href="/admin"
              className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                pathname.startsWith("/admin")
                  ? "bg-blue-50 text-blue-700"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          )}
        </nav>

        {/* Right Side */}
        <div className="hidden lg:flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/ai-search"
            className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm text-muted-foreground hover:bg-secondary transition-colors"
          >
            <Search className="h-4 w-4" />
            <span>Search...</span>
          </Link>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                <User className="h-4 w-4" />
                <span className="max-w-[100px] truncate">{userName}</span>
                <ChevronDown className="h-3 w-3" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-background py-1 shadow-lg">
                  <Link
                    href="/student/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted"
                    onClick={() => setProfileOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  {userRole === "admin" && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted"
                      onClick={() => setProfileOpen(false)}
                    >
                      <Shield className="h-4 w-4" />
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      signOut();
                      setProfileOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden rounded-md p-2 text-muted-foreground hover:bg-muted"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-background">
          <div className="space-y-1 px-4 py-3">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium ${
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                </Link>
              );
            })}

            {userRole === "admin" && (
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium ${
                  pathname.startsWith("/admin")
                    ? "bg-blue-50 text-blue-700"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Shield className="h-5 w-5" />
                Admin
              </Link>
            )}

            <div className="my-2 border-t border-border" />

            {user ? (
              <>
                <Link
                  href="/student/profile"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
                >
                  <User className="h-5 w-5" />
                  Profile
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setMobileOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md border border-border px-4 py-2.5 text-center text-sm font-medium text-muted-foreground"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md bg-blue-600 px-4 py-2.5 text-center text-sm font-medium text-white"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
