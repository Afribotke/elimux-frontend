'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AdminKeyProvider, useAdminKey } from '@/components/admin/AdminKeyContext'
import { LayoutDashboard, Building2, GraduationCap, MessageSquare, Users, BarChart3, KeyRound } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/institutions', label: 'Institutions', icon: Building2, exact: false },
  { href: '/admin/programs', label: 'Programs', icon: GraduationCap, exact: false },
]

const COMING_SOON_ITEMS = [
  { label: 'Reviews', icon: MessageSquare },
  { label: 'Users', icon: Users },
  { label: 'Analytics', icon: BarChart3 },
]

function AdminKeyBar() {
  const { adminKey, setAdminKey } = useAdminKey()
  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
      <KeyRound className="w-4 h-4 text-muted flex-shrink-0" />
      <input
        type="password"
        value={adminKey}
        onChange={(e) => setAdminKey(e.target.value)}
        placeholder="Admin key (required to add/edit/delete)"
        className="w-full max-w-sm px-3 py-1.5 text-sm rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
      />
    </div>
  )
}

function AdminNav() {
  const pathname = usePathname()
  return (
    <nav className="flex flex-col gap-1 p-4 w-56 flex-shrink-0 border-r border-border">
      {NAV_ITEMS.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              active ? 'bg-primary-500/10 text-primary-400' : 'text-muted hover:text-foreground hover:bg-muted/10'
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        )
      })}
      <div className="mt-2 pt-2 border-t border-border">
        {COMING_SOON_ITEMS.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted/50 cursor-not-allowed"
          >
            <item.icon className="w-4 h-4" />
            {item.label}
            <span className="ml-auto text-[10px] uppercase tracking-wide">Soon</span>
          </div>
        ))}
      </div>
    </nav>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminKeyProvider>
      <div className="min-h-screen flex flex-col">
        <AdminKeyBar />
        <div className="flex flex-1">
          <AdminNav />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </AdminKeyProvider>
  )
}
