'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getUserWithTimeout } from '@/lib/client-auth'
import { getBursaryNotifications, markBursaryNotificationRead } from '@/lib/api'
import type { BursaryNotification } from '@/types/bursary'
import { Bell } from 'lucide-react'

type Filter = 'all' | 'unread' | 'read'

export default function BursaryNotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<BursaryNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    checkAuthAndLoad()
  }, [])

  async function checkAuthAndLoad() {
    const { data } = await getUserWithTimeout()
    if (!data.user) {
      router.push('/auth/login?redirect=/bursary/notifications')
      return
    }
    fetchNotifications()
  }

  async function fetchNotifications() {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login?redirect=/bursary/notifications')
        return
      }
      setToken(session.access_token)
      const { notifications } = await getBursaryNotifications(session.access_token)
      setNotifications(notifications)
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  async function handleMarkRead(id: string) {
    if (!token) return
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    try {
      await markBursaryNotificationRead(id, token)
    } catch {
      fetchNotifications()
    }
  }

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead
    if (filter === 'read') return n.isRead
    return true
  })

  if (loading) {
    return (
      <main className="min-h-screen bg-elimux-dark flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-elimux-dark">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted mt-1">Updates on your bursary applications and saved funds.</p>
          </div>
          <Link href="/bursary" className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium">
            Browse Bursaries
          </Link>
        </div>

        <div className="flex items-center gap-1 bg-elimux-card border border-border rounded-lg p-1 mb-6 w-fit">
          {(['all', 'unread', 'read'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                filter === f ? 'bg-primary-500 text-white' : 'text-muted hover:text-foreground'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-red-400">{error}</div>}

        {filtered.length === 0 ? (
          <div className="bg-elimux-card border border-border rounded-xl p-12 text-center">
            <Bell className="w-8 h-8 text-muted mx-auto mb-3" />
            <p className="text-muted text-lg">
              {filter === 'all' ? "You don't have any notifications yet." : `No ${filter} notifications.`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((n) => (
              <div
                key={n.id}
                className={`bg-elimux-card border rounded-xl p-5 flex items-start justify-between gap-4 ${
                  n.isRead ? 'border-border' : 'border-primary-500/40'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-foreground">{n.title}</p>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />}
                  </div>
                  <p className="text-muted text-sm">{n.message}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                    <span>{new Date(n.createdAt).toLocaleString()}</span>
                    {n.fundId && (
                      <Link href={`/bursary/fund/${n.fundId}`} className="text-primary-400 hover:underline">
                        View fund
                      </Link>
                    )}
                    {n.applicationId && (
                      <Link href="/bursary/my-applications" className="text-primary-400 hover:underline">
                        View application
                      </Link>
                    )}
                  </div>
                </div>
                {!n.isRead && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="text-xs text-primary-400 hover:underline whitespace-nowrap shrink-0"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
