'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AdminKeyProvider, useAdminKey } from '@/components/admin/AdminKeyContext'
import { LayoutDashboard, Building2, GraduationCap, MessageSquare, Users, BarChart3, Lock, KeyRound, Tag, Megaphone, Rocket, Award, DollarSign, Search, Bot, Menu, X, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/institutions', label: 'Institutions', icon: Building2, exact: false },
  { href: '/admin/programs', label: 'Programs', icon: GraduationCap, exact: false },
  { href: '/admin/pricing', label: 'Pricing', icon: Tag, exact: false },
  { href: '/admin/reviews', label: 'Reviews', icon: MessageSquare, exact: false },
  { href: '/admin/ads', label: 'Sponsor Ads', icon: Megaphone, exact: false },
  { href: '/admin/campaigns', label: 'Campaigns', icon: Rocket, exact: false },
  { href: '/admin/advertisers', label: 'Advertisers', icon: Building2, exact: false },
  { href: '/admin/major-sponsors', label: 'Major Sponsors', icon: Award, exact: false },
  { href: '/admin/scraper', label: 'Data Scraper', icon: Bot, exact: false },
  { href: '/admin/revenue', label: 'Revenue', icon: DollarSign, exact: false },
  { href: '/admin/users', label: 'Users', icon: Users, exact: false },
  { href: '/admin/searches', label: 'Searches', icon: Search, exact: false },
  { href: '/admin/institutions-performance', label: 'Institution Performance', icon: BarChart3, exact: false },
  { href: '/admin/analytics', label: 'University Analytics', icon: BarChart3, exact: false },
  { href: '/admin/settings', label: 'Platform Pricing', icon: Settings, exact: false },
]

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

function AdminGate({ children }: { children: React.ReactNode }) {
  const { adminKey, setAdminKey } = useAdminKey()
  const [inputKey, setInputKey] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  async function verifyKey() {
    if (!inputKey.trim()) return
    setChecking(true)
    setError('')

    try {
      const res = await fetch(`${API_URL}/api/admin/verify`, {
        headers: { 'X-Admin-Key': inputKey.trim() },
      })

      if (res.ok) {
        // setAdminKey already persists to sessionStorage under the shared
        // 'elimux-admin-key' key - no separate write needed here.
        setAdminKey(inputKey.trim())
      } else {
        setError('Invalid admin key')
      }
    } catch {
      setError('Network error — try again')
    }
    setChecking(false)
  }

  if (adminKey) return <>{children}</>

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
      <div className="bg-elimux-card rounded-2xl border border-border p-8 max-w-md w-full">
        <div className="flex items-center justify-center mb-6">
          <div className="w-12 h-12 bg-primary-500/10 rounded-full flex items-center justify-center">
            <Lock className="w-6 h-6 text-primary-400" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-foreground mb-2">Admin Access</h1>
        <p className="text-muted text-center mb-6">Enter your admin key to access the dashboard</p>

        <div className="space-y-4">
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
            <input
              type="password"
              placeholder="Admin key"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && verifyKey()}
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
            />
          </div>

          {error && <p className="text-elimux-danger text-sm">{error}</p>}

          <button
            onClick={verifyKey}
            disabled={checking || !inputKey.trim()}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {checking ? 'Verifying...' : 'Access Dashboard'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AdminNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <>
      {NAV_ITEMS.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-2 px-3 py-3 md:py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
              active ? 'bg-primary-500/10 text-primary-400' : 'text-muted hover:text-foreground hover:bg-muted/10'
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </Link>
        )
      })}
    </>
  )
}

function AdminNav() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden md:flex flex-col gap-1 p-4 w-56 flex-shrink-0 border-r border-border">
        <AdminNavLinks />
      </nav>

      {/* Mobile top bar with hamburger */}
      <div className="md:hidden flex items-center justify-between px-4 h-14 border-b border-border">
        <span className="font-semibold text-foreground">Admin</span>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open admin menu"
          className="flex items-center justify-center w-11 h-11 rounded-lg hover:bg-muted/10 text-foreground"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <nav className="absolute top-0 left-0 bottom-0 w-72 max-w-[80%] bg-elimux-dark border-r border-border p-4 flex flex-col gap-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-foreground">Admin Menu</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close admin menu"
                className="flex items-center justify-center w-11 h-11 rounded-lg hover:bg-muted/10 text-foreground"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <AdminNavLinks onNavigate={() => setOpen(false)} />
          </nav>
        </div>
      )}
    </>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminKeyProvider>
      <AdminGate>
        <div className="flex flex-col md:flex-row min-h-screen">
          <AdminNav />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </AdminGate>
    </AdminKeyProvider>
  )
}
