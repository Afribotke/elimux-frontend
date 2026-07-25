"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  GraduationCap,
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
  User,
  LogOut,
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

export default function MobileNav() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const userRole = (user as any)?.role;

  return (
    <>
      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white lg:hidden">
        <div className="flex items-center justify-around px-2 py-1">
          {[
            { href: "/", label: "Home", icon: GraduationCap },
            { href: "/institutions", label: "Institutions", icon: Building2 },
            { href: "/ai-search", label: "AI", icon: Sparkles },
            { href: "/internships", label: "Jobs", icon: Briefcase },
          ].map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-xs font-medium ${
                  active ? "text-blue-600" : "text-slate-500"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}

          <button
            onClick={() => setOpen(true)}
            className="flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-xs font-medium text-slate-500"
          >
            <Menu className="h-5 w-5" />
            More
          </button>
        </div>
      </nav>

      {/* Full Mobile Menu Overlay */}
      {open && (
        <div className="fixed inset-0 z-[60] bg-white lg:hidden">
          <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4">
            <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
              <GraduationCap className="h-7 w-7 text-blue-600" />
              <span className="text-lg font-bold text-slate-900">ElimuX</span>
            </Link>
            <button
              onClick={() => setOpen(false)}
              className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-1 px-4 py-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 3.5rem)" }}>
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium ${
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50"
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
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium ${
                  pathname.startsWith("/admin")
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Shield className="h-5 w-5" />
                Admin
              </Link>
            )}

            <div className="my-3 border-t border-slate-200" />

            {user ? (
              <>
                <Link
                  href="/student/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  <User className="h-5 w-5" />
                  My Profile
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-600"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="rounded-lg bg-blue-600 px-4 py-3 text-center text-sm font-medium text-white"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
