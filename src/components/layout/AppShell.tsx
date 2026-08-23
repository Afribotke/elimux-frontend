"use client";

import React from "react";
import { Footer } from "./Footer";

interface AppShellProps {
  children: React.ReactNode;
  variant?: "default" | "minimal" | "dashboard";
}

/**
 * Cycle 025: page-level content wrapper. Does NOT render Navbar — DesktopNav
 * and MobileNav are already mounted once, globally, in src/app/layout.tsx,
 * so a per-page Navbar here would render the header twice. AppShell instead
 * standardizes background/min-height and opts pages into the (previously
 * unused) Footer. "dashboard" variant skips the footer and drops horizontal
 * page padding, matching the admin dashboard's own sidebar layout.
 */
export function AppShell({ children, variant = "default" }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1">{children}</main>
      {variant === "default" && <Footer />}
    </div>
  );
}
