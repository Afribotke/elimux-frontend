'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, GraduationCap, FileText, Settings, LogOut, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getUserWithTimeout } from '@/lib/client-auth'

const NAV_ITEMS = [
  { href: '/bursary/provider/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/bursary/provider/dashboard/bursaries', label: 'Bursaries', icon: GraduationCap },
  { href: '/bursary/provider/dashboard/applications', label: 'Applications', icon: FileText },
  { href: '/bursary/provider/dashboard/settings', label: 'Settings', icon: Settings },
]

export default function BursaryProviderDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [providerName, setProviderName] = useState('')
  const [authorized, setAuthorized] = useState(false)

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  useEffect(() => {
    let cancelled = false

    async function checkAuth() {
      const { data: { user } } = await getUserWithTimeout()
      if (!user) {
        router.push('/auth/login?redirect=/bursary/provider/dashboard')
        return
      }

      const { data: role } = await supabase
        .from('user_tenant_roles')
        .select('role, status, tenants(name)')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .eq('status', 'active')
        .single()

      if (cancelled) return

      if (!role) {
        router.push('/unauthorized')
        return
      }

      const tenant = Array.isArray(role.tenants) ? role.tenants[0] : role.tenants
      setProviderName((tenant as any)?.name || 'Provider Portal')
      setAuthorized(true)
      setLoading(false)
    }

    checkAuth()
    return () => {
      cancelled = true
    }
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-elimux-dark flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-400 mx-auto mb-3" />
          <p className="text-muted">Loading provider portal…</p>
        </div>
      </div>
    )
  }

  if (!authorized) return null

  return (
    <div className="min-h-screen flex bg-elimux-dark">
      <aside className="w-64 bg-elimux-card border-r border-border min-h-screen p-6 flex flex-col">
        <div className="mb-8">
          <h2 className="text-lg font-bold text-foreground">{providerName}</h2>
          <p className="text-xs text-muted">Bursary Management</p>
        </div>
        <nav className="space-y-1 flex-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary-500/10 text-primary-400' : 'text-muted hover:bg-elimux-dark hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="pt-4 border-t border-border">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
