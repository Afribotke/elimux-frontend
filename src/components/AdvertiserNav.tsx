'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Megaphone, BarChart3, CreditCard, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const LINKS = [
  { href: '/advertiser/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/advertiser/campaigns', label: 'Campaigns', icon: Megaphone },
  { href: '/advertiser/dashboard#analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/advertiser/billing', label: 'Billing', icon: CreditCard },
]

export default function AdvertiserNav() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/advertiser/login')
  }

  return (
    <nav className="border-b border-border bg-elimux-card mb-8">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between overflow-x-auto">
        <div className="flex items-center gap-1">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href.split('#')[0]
            return (
              <Link
                key={label}
                href={href}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-primary-500 text-primary-400'
                    : 'border-transparent text-muted hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            )
          })}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-muted hover:text-elimux-danger whitespace-nowrap"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </nav>
  )
}
