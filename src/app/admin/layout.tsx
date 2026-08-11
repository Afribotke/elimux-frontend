"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { AdminKeyProvider, useAdminKey } from "@/components/admin/AdminKeyContext";
import {
  LayoutDashboard,
  Building2,
  GraduationCap,
  MessageSquare,
  Star,
  Megaphone,
  CreditCard,
  Users,
  Search,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Bell,
  LogOut,
  Shield,
  Database,
  Briefcase,
  Award,
  Sparkles,
  TrendingUp,
  Zap,
  Upload,
  Tag,
  FileText,
  Globe,
  List,
  Monitor,
  Wrench,
  AlertCircle,
  DollarSign,
  PieChart,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ============================================================
// ADMINGATE — inline key-entry form, verified against the real
// backend contract: GET /api/admin/verify with x-admin-key header
// (see elimux-backend/src/middleware/auth.ts adminMiddleware)
// ============================================================

function AdminGate({ children }: { children: React.ReactNode }) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
  const { adminKey, setAdminKey } = useAdminKey();
  const [inputKey, setInputKey] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);

  if (!adminKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Access</h1>
            <p className="text-gray-500 mt-1">Enter your admin key to continue</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              setVerifying(true);

              try {
                const res = await fetch(`${API_URL}/api/admin/verify`, {
                  method: "GET",
                  headers: { "x-admin-key": inputKey },
                });

                const data = await res.json();

                if (res.ok && data.valid) {
                  setAdminKey(inputKey);
                } else {
                  setError(data.message || "Invalid admin key");
                }
              } catch (err) {
                setError("Network error. Please try again.");
              } finally {
                setVerifying(false);
              }
            }}
            className="space-y-4"
          >
            <Input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              placeholder="Enter admin key"
              className="w-full"
              required
            />
            <Button
              type="submit"
              disabled={verifying}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            >
              {verifying ? "Verifying..." : "Access Admin"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// ============================================================
// ALL 29 VERIFIED ADMIN ROUTES — SINGLE SOURCE OF TRUTH
// ============================================================

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

interface NavSection {
  title: string;
  icon: React.ElementType;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Platform",
    icon: Monitor,
    items: [
      { label: "Overview", href: "/admin", icon: LayoutDashboard },
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Analytics", href: "/admin/analytics", icon: TrendingUp },
      { label: "Searches", href: "/admin/searches", icon: Search },
      { label: "Institution Performance", href: "/admin/institutions-performance", icon: BarChart3 },
    ],
  },
  {
    title: "Content",
    icon: FileText,
    items: [
      { label: "Institutions", href: "/admin/institutions", icon: Building2 },
      { label: "Institution Claims", href: "/admin/institution-claims", icon: Shield },
      { label: "Programs", href: "/admin/programs", icon: GraduationCap },
      { label: "Reviews", href: "/admin/reviews", icon: Star, badge: 12 },
      { label: "Messages", href: "/admin/messages", icon: MessageSquare, badge: 3 },
      { label: "Bulk Upload", href: "/admin/bulk-upload", icon: Upload },
    ],
  },
  {
    title: "Revenue",
    icon: DollarSign,
    items: [
      { label: "Payments", href: "/admin/payments", icon: CreditCard },
      { label: "Pricing", href: "/admin/pricing", icon: Tag },
      { label: "Ad Pricing", href: "/admin/ad-pricing", icon: DollarSign },
      { label: "Ads", href: "/admin/ads", icon: Megaphone },
      { label: "Campaigns", href: "/admin/campaigns", icon: Zap },
      { label: "Revenue", href: "/admin/revenue", icon: PieChart },
      { label: "Advertisers", href: "/admin/advertisers", icon: Users },
      { label: "Major Sponsors", href: "/admin/major-sponsors", icon: Award },
    ],
  },
  {
    title: "Users",
    icon: Users,
    items: [
      { label: "All Users", href: "/admin/users", icon: Users },
      { label: "Students", href: "/admin/students", icon: GraduationCap },
        { label: "Assign Institutions", href: "/admin/student-assignments", icon: Building2 },
      { label: "Employers", href: "/admin/employers", icon: Briefcase },
      { label: "Discover Names", href: "/admin/employers/discover-names", icon: Search },
      { label: "Upload Employers", href: "/admin/employers/upload", icon: Upload },
      { label: "Potential Employers", href: "/admin/potential-employers", icon: Globe },
    ],
  },
  {
    title: "System",
    icon: Wrench,
    items: [
      { label: "Data Scraper", href: "/admin/scraper", icon: Database },
      { label: "Scraper Changes", href: "/admin/scraper/changes", icon: List },
      { label: "Scraper Sources", href: "/admin/scraper/sources", icon: FileText },
      { label: "TVETA Scraper", href: "/admin/tveta-scraper", icon: Monitor },
      { label: "Accreditation", href: "/admin/accreditation", icon: Award },
      { label: "Internships", href: "/admin/internships", icon: Briefcase },
        { label: "Attachment Reports", href: "/admin/reports", icon: FileText },
      { label: "NITA Compliance", href: "/admin/nita", icon: ShieldAlert },
      { label: "Compliance & Verification", href: "/admin/compliance", icon: Shield },
      { label: "Audit Log", href: "/admin/audit", icon: FileText },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

const ALL_NAV_ITEMS: (NavItem & { section: string })[] = NAV_SECTIONS.flatMap((section) =>
  section.items.map((item) => ({ ...item, section: section.title }))
);

// ============================================================
// SIDEBAR COMPONENTS
// ============================================================

function SidebarItem({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? "bg-amber-50 text-amber-700 border border-amber-200"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      <item.icon className="w-4 h-4 shrink-0" />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge ? (
        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}

function NavSectionComponent({
  section,
  pathname,
  onItemClick,
}: {
  section: NavSection;
  pathname: string;
  onItemClick?: () => void;
}) {
  const hasActive = section.items.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );
  const [isOpen, setIsOpen] = useState(hasActive);

  return (
    <div className="mb-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors ${
          hasActive ? "text-amber-700" : "text-gray-400"
        } hover:text-gray-600`}
      >
        <span className="flex items-center gap-2">
          <section.icon className="w-3.5 h-3.5" />
          {section.title}
        </span>
        {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>
      {isOpen && (
        <div className="mt-1 space-y-0.5 pl-1">
          {section.items.map((item) => (
            <SidebarItem
              key={item.href}
              item={item}
              isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
              onClick={onItemClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN LAYOUT INNER
// ============================================================

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    sessionStorage.removeItem("elimux-admin-key");
    sessionStorage.removeItem("elimux-admin-key-timestamp");
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return ALL_NAV_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.section.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [searchQuery]);

  const pageTitle = useMemo(() => {
    const item = ALL_NAV_ITEMS.find(
      (i) => pathname === i.href || pathname.startsWith(i.href + "/")
    );
    return item?.label || "Admin";
  }, [pathname]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center px-4 border-b border-gray-100 shrink-0">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900">ElimuX</span>
            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">
              ADMIN
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden ml-auto p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-3 pt-4 pb-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search admin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 h-9 text-sm bg-gray-50 border-gray-200 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {searchQuery && (
            <div className="mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {filteredItems.length === 0 ? (
                <div className="px-3 py-3 text-sm text-gray-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  No results found
                </div>
              ) : (
                filteredItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      setSearchQuery("");
                      setSidebarOpen(false);
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors border-b last:border-0"
                  >
                    <item.icon className="w-4 h-4 text-gray-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.label}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">{item.section}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {NAV_SECTIONS.map((section) => (
            <NavSectionComponent
              key={section.title}
              section={section}
              pathname={pathname}
              onItemClick={() => setSidebarOpen(false)}
            />
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100 shrink-0 space-y-1">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
              <Link href="/admin" className="hover:text-gray-700">Admin</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-gray-900 font-medium">{pageTitle}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 hover:bg-gray-100 rounded-lg">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 text-sm font-medium flex items-center justify-center cursor-pointer">
              AD
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

// ============================================================
// EXPORT — Wrapped with AdminKeyProvider + AdminGate
// ============================================================

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminKeyProvider>
      <AdminGate>
        <AdminLayoutInner>{children}</AdminLayoutInner>
      </AdminGate>
    </AdminKeyProvider>
  );
}
