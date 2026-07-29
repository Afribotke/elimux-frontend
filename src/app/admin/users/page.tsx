'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { getAnalyticsUsers, type AnalyticsUserRow, type ActivityLevel } from '@/lib/api'
import { useAdminKey } from '@/components/admin/AdminKeyContext'
import { downloadCsv } from '@/lib/csv'
import { ArrowLeft, Users, Download } from 'lucide-react'

const PAGE_SIZE = 25

const LEVEL_OPTIONS: { value: ActivityLevel | 'all'; label: string }[] = [
  { value: 'all', label: 'All levels' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
  { value: 'none', label: 'None' },
]

const LEVEL_COLOR: Record<ActivityLevel, string> = {
  high: 'text-elimux-success',
  medium: 'text-primary-400',
  low: 'text-elimux-warning',
  none: 'text-muted',
}

export default function AdminUsersPage() {
  const { adminKey } = useAdminKey()
  const [users, setUsers] = useState<AnalyticsUserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [level, setLevel] = useState<ActivityLevel | 'all'>('all')
  const [page, setPage] = useState(1)

  const load = useCallback(() => {
    if (!adminKey) return
    setLoading(true)
    setError(null)
    getAnalyticsUsers(adminKey, level === 'all' ? undefined : level)
      .then((res) => setUsers(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load users'))
      .finally(() => setLoading(false))
  }, [adminKey, level])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [level])

  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE))
  const pagedUsers = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function exportCsv() {
    downloadCsv(
      'users',
      ['Device ID', 'Activity Count', 'Activity Level', 'Last Active'],
      users.map((u) => [u.device_id, u.activity_count, u.activity_level, new Date(u.last_active).toISOString()])
    )
  }

  return (
    <main className="min-h-screen py-12 px-4 max-w-6xl mx-auto">
      <Link href="/admin" className="text-sm text-muted hover:text-foreground flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Users className="w-8 h-8 text-primary-400" />
          Users
        </h1>

        <div className="flex items-center gap-3">
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as ActivityLevel | 'all')}
            className="px-4 py-2 rounded-lg bg-elimux-card border border-border text-foreground text-sm focus:outline-none focus:border-primary-500"
          >
            {LEVEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={exportCsv}
            disabled={users.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted hover:text-foreground hover:bg-muted/10 disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 px-4 py-2 rounded-lg bg-elimux-danger/10 border border-elimux-danger/30 text-elimux-danger text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted">Loading users...</p>
        </div>
      ) : (
        <div className="bg-elimux-card border border-border rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-elimux-dark text-muted text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Device ID</th>
                <th className="px-4 py-3 font-medium">Activity</th>
                <th className="px-4 py-3 font-medium">Level</th>
                <th className="px-4 py-3 font-medium">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {pagedUsers.map((u) => (
                <tr key={u.device_id} className="border-t border-border">
                  <td className="px-4 py-3 text-foreground font-mono text-xs">{u.device_id}</td>
                  <td className="px-4 py-3 text-muted tabular-nums">{u.activity_count}</td>
                  <td className={`px-4 py-3 font-medium ${LEVEL_COLOR[u.activity_level]}`}>{u.activity_level}</td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">{new Date(u.last_active).toLocaleString()}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted">
                    No users match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {users.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border text-sm">
              <span className="text-muted">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, users.length)} of {users.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg border border-border text-muted hover:text-foreground disabled:opacity-40 disabled:hover:text-muted"
                >
                  Previous
                </button>
                <span className="text-muted">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 rounded-lg border border-border text-muted hover:text-foreground disabled:opacity-40 disabled:hover:text-muted"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  )
}
