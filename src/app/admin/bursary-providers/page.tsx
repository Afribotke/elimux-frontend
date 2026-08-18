'use client'

import { Fragment, useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAdminKey } from '@/components/admin/AdminKeyContext'
import {
  listAdminBursaryProviders,
  approveBursaryProvider,
  rejectBursaryProvider,
  type AdminBursaryProviderRow,
} from '@/lib/api'
import { Landmark, ChevronDown, ChevronUp, Search, CheckCircle2, XCircle } from 'lucide-react'

const TYPE_LABELS: Record<string, string> = {
  county: 'County Government',
  ngcdf: 'NG-CDF',
  ward: 'Ward Office',
  ngo: 'NGO',
  csr: 'Corporate CSR',
  foundation: 'Foundation',
  alumni: 'Alumni Association',
  school: 'School',
  individual: 'Individual',
}

const TABS: { value: 'pending' | 'active' | 'suspended' | 'all'; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'all', label: 'All' },
]

const PAGE_SIZE = 20

export default function AdminBursaryProvidersPage() {
  const { adminKey } = useAdminKey()
  const [tab, setTab] = useState<'pending' | 'active' | 'suspended' | 'all'>('pending')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [providers, setProviders] = useState<AdminBursaryProviderRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!adminKey) return
    setLoading(true)
    setError(null)
    try {
      const res = await listAdminBursaryProviders({ status: tab, page, limit: PAGE_SIZE, search: search || undefined }, adminKey)
      setProviders(res.providers)
      setTotal(res.pagination.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load providers')
    } finally {
      setLoading(false)
    }
  }, [adminKey, tab, page, search])

  useEffect(() => {
    load()
  }, [load])

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  async function handleApprove(provider: AdminBursaryProviderRow) {
    if (!adminKey) return
    if (!confirm(`Approve "${provider.name}" and activate their portal?`)) return

    setActionId(provider.id)
    try {
      await approveBursaryProvider(provider.id, adminKey)
      toast.success(`${provider.name} approved and activated`)
      setProviders((prev) => prev.filter((p) => p.id !== provider.id))
      setTotal((t) => Math.max(0, t - 1))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve provider')
    } finally {
      setActionId(null)
    }
  }

  async function handleReject(provider: AdminBursaryProviderRow) {
    if (!adminKey) return
    const reason = prompt(`Reason for rejecting "${provider.name}"?`)
    if (reason === null) return

    setActionId(provider.id)
    try {
      await rejectBursaryProvider(provider.id, adminKey, reason || undefined)
      toast.success(`${provider.name} rejected`)
      setProviders((prev) => prev.filter((p) => p.id !== provider.id))
      setTotal((t) => Math.max(0, t - 1))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject provider')
    } finally {
      setActionId(null)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <main className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-1">
        <Landmark className="w-6 h-6 text-amber-600" />
        Bursary Providers
      </h1>
      <p className="text-sm text-gray-500 mb-6">Review, approve, or reject provider registrations for the Bursary Engine.</p>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => {
                setTab(t.value)
                setPage(1)
              }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === t.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={submitSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or email"
            className="pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm w-64 focus:outline-none focus:border-amber-400"
          />
        </form>
      </div>

      {error && <div className="mb-4 px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Loading…</p>
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-16">
            <Landmark className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No providers in this view.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">County</th>
                  <th className="px-4 py-3 font-medium">Reg. Number</th>
                  <th className="px-4 py-3 font-medium">Date Registered</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {providers.map((p) => (
                  <Fragment key={p.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                      <td className="px-4 py-3 text-gray-600">{TYPE_LABELS[p.type] || p.type}</td>
                      <td className="px-4 py-3 text-gray-600">{p.contact?.email || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{p.contact?.phone || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{p.contact?.county || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{p.registration_number || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{new Date(p.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
                            aria-label="View details"
                          >
                            {expandedId === p.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          {p.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(p)}
                                disabled={actionId === p.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white text-xs font-medium disabled:opacity-50"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(p)}
                                disabled={actionId === p.id}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-medium disabled:opacity-50"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedId === p.id && (
                      <tr className="bg-gray-50">
                        <td colSpan={8} className="px-4 py-4">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                            <div>
                              <p className="text-gray-400 uppercase tracking-wide mb-0.5">Slug</p>
                              <p className="text-gray-700">{p.slug}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 uppercase tracking-wide mb-0.5">Status</p>
                              <p className="text-gray-700">{p.status} / {p.verification_status}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 uppercase tracking-wide mb-0.5">Sub-county / Ward</p>
                              <p className="text-gray-700">{[p.contact?.sub_county, p.contact?.ward].filter(Boolean).join(' / ') || '—'}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 uppercase tracking-wide mb-0.5">Address</p>
                              <p className="text-gray-700">{p.contact?.address || '—'}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <span>
            Page {page} of {totalPages} ({total} total)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-md border border-gray-200 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-md border border-gray-200 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
