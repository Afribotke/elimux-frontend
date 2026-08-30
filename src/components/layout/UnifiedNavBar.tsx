"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Pill {
  key: string;
  label: string;
  icon: string;
  href: string;
  isActive: (pathname: string, searchParams: URLSearchParams) => boolean;
}

// next.config.js has trailingSlash:true, so usePathname() returns
// "/programs/" (with the trailing slash) at runtime, not "/programs".
const isProgramsRoute = (pathname: string) => pathname === "/programs" || pathname === "/programs/";

const PILLS: Pill[] = [
  {
    key: "university",
    label: "Universities & College",
    icon: "🎓",
    href: "/programs?type=university",
    isActive: (pathname, sp) => isProgramsRoute(pathname) && sp.get("type") === "university",
  },
  {
    key: "tvet",
    label: "Skills & Trades (TVET)",
    icon: "🔧",
    href: "/programs?type=tvet",
    isActive: (pathname, sp) => isProgramsRoute(pathname) && sp.get("type") === "tvet",
  },
  {
    key: "scholarships",
    label: "Scholarships",
    icon: "🏆",
    href: "/scholarships",
    isActive: (pathname) => pathname.startsWith("/scholarships"),
  },
  {
    key: "internship",
    label: "Internship",
    icon: "💼",
    href: "/internships",
    isActive: (pathname) => pathname.startsWith("/internships"),
  },
  {
    key: "attachment",
    label: "Attachment",
    icon: "📎",
    href: "/attachments",
    isActive: (pathname) => pathname.startsWith("/attachments"),
  },
  {
    key: "bursary",
    label: "Bursary",
    icon: "💰",
    href: "/bursary",
    isActive: (pathname) => pathname.startsWith("/bursary"),
  },
  {
    key: "schools",
    label: "Senior Schools",
    icon: "🏫",
    href: "/schools",
    isActive: (pathname) => pathname.startsWith("/schools"),
  },
  {
    key: "pathways",
    label: "Career Pathways",
    icon: "🧭",
    href: "/pathways",
    isActive: (pathname) => pathname.startsWith("/pathways"),
  },
];

/**
 * Cycle 025: global category pill bar, mounted once below the navbar in
 * root layout.tsx so it appears on every page. University/TVET filter
 * /programs in place (router.push to the same route - no full reload,
 * ProgramsPageInner picks the change up via a searchParams effect).
 * The other four always navigate - there is no shared taxonomy across
 * programs/scholarships/internships/attachments/bursary in the data
 * model, so "filtering in place" isn't meaningful for them (see
 * docs/bridge.md for the full reasoning this cycle).
 */
export function UnifiedNavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Live counts for the two pills backed by the shared `internships` table
  // (distinguished by its `type` column - see /internships and /attachments
  // page queries). Other pills don't get live counts yet - scholarships,
  // bursary, and university/tvet counts weren't asked for and their data
  // access patterns aren't all confirmed the way this one is.
  const [counts, setCounts] = useState<{ internship?: number; attachment?: number }>({});

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    Promise.all([
      supabase.from("internships").select("*", { count: "exact", head: true }).eq("status", "active").eq("type", "internship"),
      supabase.from("internships").select("*", { count: "exact", head: true }).eq("status", "active").eq("type", "attachment"),
    ]).then(([internshipRes, attachmentRes]) => {
      if (cancelled) return;
      setCounts({
        internship: internshipRes.count ?? undefined,
        attachment: attachmentRes.count ?? undefined,
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Cycle 027: hidden on the homepage only - the 6 categories live inside
  // the redesigned hero there instead. Checked after all hooks (rules of
  // hooks), not as an early return before them.
  if (pathname === "/") return null;

  return (
    <div className="sticky top-[52px] lg:top-[90px] z-40 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="relative max-w-7xl mx-auto">
        <div
          className="flex items-center gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {PILLS.map((pill) => {
            const active = pill.isActive(pathname, searchParams);
            const count = pill.key === "internship" ? counts.internship : pill.key === "attachment" ? counts.attachment : undefined;
            return (
              <button
                key={pill.key}
                onClick={() => router.push(pill.href)}
                style={{ scrollSnapAlign: "start" }}
                className={`relative shrink-0 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm transition-all duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  active
                    ? "bg-primary-600 text-white font-semibold shadow-soft"
                    : "bg-background border border-border text-muted font-medium hover:bg-muted/10"
                }`}
              >
                <span aria-hidden="true">{pill.icon}</span>
                {pill.label}
                {typeof count === "number" && count > 0 && (
                  <span
                    className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[10px] font-bold ${
                      active ? "bg-white text-primary-700" : "bg-primary-600 text-white"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Scrollability hints on mobile */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-background to-transparent lg:hidden" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-background to-transparent lg:hidden" />
      </div>
    </div>
  );
}
