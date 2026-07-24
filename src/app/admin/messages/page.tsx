'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { listAdminMessages, updateMessageStatus, deleteMessage, type AdminMessage } from '@/lib/api'
import { useAdminKey } from '@/components/admin/AdminKeyContext'
import { ArrowLeft, Inbox, Mail, CheckCircle2, Archive, Trash2 } from 'lucide-react'

const STATUS_TABS: { value: AdminMessage['status'] | 'all'; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'read', label: 'Read' },
  { value: 'archived', label: 'Archived' },
  { value: 'all', label: 'All' },
]

export default function AdminMessagesPage() {
  const { adminKey } = useAdminKey()
  const [status, setStatus] = useState<AdminMessage['status'] | 'all'>('new')
  const [messages, setMessages] = useState<AdminMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const loadMessages = useCallback(async () => {
    if (!adminKey) return
    setLoading(true)
    setError(null)
    try {
      const { data } = await listAdminMessages(adminKey, status)
      setMessages(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages')
    } finally {
      setLoading(false)
    }
  }, [adminKey, status])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  async function handleStatusChange(id: string, next: AdminMessage['status']) {
    if (!adminKey) return
    setBusyId(id)
    try {
      await updateMessageStatus(id, next, adminKey)
      setMessages((prev) => prev.filter((m) => m.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update message')
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(id: string) {
    if (!adminKey) return
    if (!window.confirm('Permanently delete this message?')) return
    setBusyId(id)
    try {
      await deleteMessage(id, adminKey)
      setMessages((prev) => prev.filter((m) => m.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete message')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <main className="min-h-screen py-12 px-4 max-w-4xl mx-auto">
      <Link href="/admin" className="text-sm text-muted hover:text-foreground flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold text-foreground flex items-center gap-3 mb-2">
        <Inbox className="w-8 h-8 text-primary-400" />
        Contact Messages
        {messages.length > 0 && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400">
            {messages.length}
          </span>
        )}
      </h1>
      <p className="text-muted mb-6">Submissions from the public contact form.</p>

      <div className="flex items-center gap-2 mb-6">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatus(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              status === tab.value
                ? 'bg-primary-500/10 text-primary-400'
                : 'text-muted hover:text-foreground hover:bg-muted/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 px-4 py-2 rounded-lg bg-elimux-danger/10 border border-elimux-danger/30 text-elimux-danger text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted">Loading messages...</p>
        </div>
      ) : messages.length === 0 ? (
        <p className="text-muted text-sm bg-elimux-card rounded-xl p-4 border border-border">
          No {status === 'all' ? '' : status} messages.
        </p>
      ) : (
        <div className="bg-elimux-card border border-border rounded-xl divide-y divide-border">
          {messages.map((msg) => (
            <div key={msg.id} className="p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground">{msg.name}</p>
                    <a
                      href={`mailto:${msg.email}`}
                      className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1"
                    >
                      <Mail className="w-3 h-3" /> {msg.email}
                    </a>
                  </div>
                  <p className="text-xs text-muted">
                    {new Date(msg.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {msg.status !== 'read' && (
                    <button
                      onClick={() => handleStatusChange(msg.id, 'read')}
                      disabled={busyId === msg.id}
                      className="px-3 py-1.5 min-h-[36px] rounded-lg bg-elimux-success/10 text-elimux-success text-xs font-medium disabled:opacity-50 flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark Read
                    </button>
                  )}
                  {msg.status !== 'archived' && (
                    <button
                      onClick={() => handleStatusChange(msg.id, 'archived')}
                      disabled={busyId === msg.id}
                      className="px-3 py-1.5 min-h-[36px] rounded-lg bg-muted/10 text-muted text-xs font-medium disabled:opacity-50 flex items-center gap-1"
                    >
                      <Archive className="w-3.5 h-3.5" /> Archive
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(msg.id)}
                    disabled={busyId === msg.id}
                    className="px-3 py-1.5 min-h-[36px] rounded-lg bg-elimux-danger/10 text-elimux-danger text-xs font-medium disabled:opacity-50 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>

              {msg.subject && <p className="text-sm font-medium text-foreground mt-2">{msg.subject}</p>}
              <p className="text-sm text-muted mt-1 whitespace-pre-wrap">{msg.message}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
