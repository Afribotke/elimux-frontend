'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { fetchAdminEmployerNames, type EmployerNameRow } from '@/lib/api'
import { useAdminKey } from '@/components/admin/AdminKeyContext'
import { ArrowLeft, Building2, Search, ExternalLink } from 'lucide-react'

const PAGE_SIZE = 25

export default function AdminEmployerNamesPage() {
  const { adminKey } = useAdminKey()
  const [rows, setRows] = useState<EmployerNameRow[]>([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!adminKey) return
    setLoading(true)
    try {
      const res = await fetchAdminEmployerNames(adminKey, {
        page,
        limit: PAGE_SIZE,
        q: appliedSearch || undefined,
      })
      setRows(res.data)
      setCount(res.count)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load employer names')
    } finally {
      setLoading(false)
    }
  }, [adminKey, page, appliedSearch])

  useEffect(() => {
    load()
  }, [load])

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    setAppliedSearch(search.trim())
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))

  return (
    <main className="min-h-screen py-12 px-4 max-w-6xl mx-auto">
      <Link href="/admin/employers" className="text-sm text-muted hover:text-foreground flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Employers
      </Link>

      <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
        <Building2 className="w-8 h-8 text-primary-400" />
        Uploaded Employer Names
      </h1>
      <p className="text-muted mb-6">{count.toLocaleString()} names uploaded to date.</p>

      <form onSubmit={handleSearchSubmit} className="mb-6 flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-elimux-dark border border-border text-foreground text-sm focus:outline-none focus:border-primary-500"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium"
        >
          Search
        </button>
      </form>

      {error && (
        <div className="mb-6 px-4 py-2 rounded-lg bg-elimux-danger/10 border border-elimux-danger/30 text-elimux-danger text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted">Loading...</p>
        </div>
      ) : (
        <>
          <div className="bg-elimux-card border border-border rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-elimux-dark text-muted text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Website</th>
                  <th className="px-4 py-3 font-medium">Verification</th>
                  <th className="px-4 py-3 font-medium">Discovery</th>
                  <th className="px-4 py-3 font-medium">Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const url = r.verified_website_url || r.suggested_website_url
                  return (
                    <tr key={r.id} className="border-t border-border">
                      <td className="px-4 py-3 text-foreground">{r.name}</td>
                      <td className="px-4 py-3">
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary-400 hover:text-primary-300"
                          >
                            {url.replace(/^https?:\/\//, '')}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            r.verification_status === 'verified'
                              ? 'bg-elimux-success/10 text-elimux-success'
                              : 'bg-elimux-warning/10 text-elimux-warning'
                          }`}
                        >
                          {r.verification_status || 'unverified'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted">{r.discovery_status || '—'}</td>
                      <td className="px-4 py-3 text-muted">{new Date(r.created_at).toLocaleDateString()}</td>
                    </tr>
                  )
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted">
                      No employer names found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg bg-elimux-card border border-border text-muted disabled:opacity-50 text-sm"
              >
                Previous
              </button>
              <span className="text-sm text-muted">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg bg-elimux-card border border-border text-muted disabled:opacity-50 text-sm"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </main>
  )
}
