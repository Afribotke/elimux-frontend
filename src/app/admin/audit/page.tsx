'use client'

import { useEffect, useState } from 'react'
import { useAdminKey } from '@/components/admin/AdminKeyContext'
import { listAdminAuditLog, type AdminAuditLogEntry } from '@/lib/api'

const PAGE_SIZE = 50

export default function AdminAuditLogPage() {
  const { adminKey } = useAdminKey()
  const [entries, setEntries] = useState<AdminAuditLogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!adminKey) return
    setLoading(true)
    listAdminAuditLog({ page, limit: PAGE_SIZE }, adminKey)
      .then((res) => {
        setEntries(res.data)
        setTotal(res.total)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load audit log'))
      .finally(() => setLoading(false))
  }, [adminKey, page])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Audit Log</h1>
      <p className="text-gray-500 mb-6">Recorded admin and system actions</p>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">When</th>
                <th className="px-4 py-3 text-left">Action</th>
                <th className="px-4 py-3 text-left">Entity</th>
                <th className="px-4 py-3 text-left">By</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
              ) : entries.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No audit entries recorded yet.</td></tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(entry.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{entry.action}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {entry.entity_type}
                      {entry.entity ? ` · ${entry.entity}` : ''}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{entry.user_email || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-100 flex justify-between items-center">
          <span className="text-sm text-gray-500">Showing {entries.length} of {total}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm">Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * PAGE_SIZE >= total}
              className="px-3 py-1 border rounded text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
