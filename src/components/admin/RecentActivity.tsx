'use client'

import Link from 'next/link'
import { Mail, Building2 } from 'lucide-react'

interface RecentActivityProps {
  messages: Array<{
    id: string
    name: string
    email: string
    subject: string
    created_at: string
  }>
  institutions: Array<{
    id: string
    name: string
    country: string
    created_at: string
  }>
}

function TimeAgo({ date }: { date: string }) {
  const d = new Date(date)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60) return <span>Just now</span>
  if (diff < 3600) return <span>{Math.floor(diff / 60)}m ago</span>
  if (diff < 86400) return <span>{Math.floor(diff / 3600)}h ago</span>
  return <span>{d.toLocaleDateString()}</span>
}

export default function RecentActivity({ messages, institutions }: RecentActivityProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-elimux-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary-400" />
            <h3 className="text-sm font-semibold text-foreground">Recent Messages</h3>
          </div>
          <Link href="/admin/messages" className="text-xs font-medium text-primary-400 hover:underline">
            View all
          </Link>
        </div>
        <div className="divide-y divide-border">
          {messages.length === 0 ? (
            <p className="p-5 text-sm text-muted">No messages yet</p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="flex items-start justify-between p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{m.name}</p>
                  <p className="truncate text-xs text-muted">{m.subject || 'No subject'}</p>
                </div>
                <span className="ml-4 shrink-0 text-xs text-muted">
                  <TimeAgo date={m.created_at} />
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-elimux-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary-400" />
            <h3 className="text-sm font-semibold text-foreground">Recently Added</h3>
          </div>
          <Link href="/admin/institutions" className="text-xs font-medium text-primary-400 hover:underline">
            View all
          </Link>
        </div>
        <div className="divide-y divide-border">
          {institutions.length === 0 ? (
            <p className="p-5 text-sm text-muted">No institutions yet</p>
          ) : (
            institutions.map((i) => (
              <div key={i.id} className="flex items-start justify-between p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{i.name}</p>
                  <p className="truncate text-xs text-muted">{i.country || '—'}</p>
                </div>
                <span className="ml-4 shrink-0 text-xs text-muted">
                  <TimeAgo date={i.created_at} />
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
