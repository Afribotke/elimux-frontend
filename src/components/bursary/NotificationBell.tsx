'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getBursaryNotifications, markBursaryNotificationRead } from '@/lib/api'
import type { BursaryNotification } from '@/types/bursary'

export default function NotificationBell() {
  const router = useRouter()
  const { session } = useAuth()
  const [notifications, setNotifications] = useState<BursaryNotification[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!session?.access_token) return
    getBursaryNotifications(session.access_token)
      .then((res) => setNotifications(res.notifications))
      .catch(() => {})
  }, [session?.access_token])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (!session?.access_token) return null

  const unreadCount = notifications.filter((n) => !n.isRead).length

  async function handleNotificationClick(n: BursaryNotification) {
    setOpen(false)
    if (!n.isRead && session?.access_token) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)))
      markBursaryNotificationRead(n.id, session.access_token).catch(() => {})
    }
    if (n.fundId) {
      router.push(`/bursary/fund/${n.fundId}`)
    } else if (n.applicationId) {
      router.push('/bursary/my-applications')
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-background border border-border rounded-xl shadow-lg py-2 z-50 max-h-96 overflow-y-auto">
          <div className="px-4 py-2 flex items-center justify-between border-b border-border">
            <span className="text-sm font-semibold text-foreground">Notifications</span>
            <Link href="/bursary/notifications" onClick={() => setOpen(false)} className="text-xs text-primary-500 hover:underline">
              View all
            </Link>
          </div>
          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">No notifications yet.</p>
          ) : (
            notifications.slice(0, 8).map((n) => (
              <button
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`block w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b border-border last:border-b-0 ${
                  n.isRead ? '' : 'bg-primary-500/5'
                }`}
              >
                <p className="text-sm font-medium text-foreground">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
