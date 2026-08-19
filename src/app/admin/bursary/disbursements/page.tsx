'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAdminKey } from '@/components/admin/AdminKeyContext'
import {
  listAdminBursaryDisbursements,
  listAdminBursaryApplications,
  initiateAdminBursaryDisbursement,
  type AdminBursaryDisbursementRow,
  type AdminBursaryApplicationRow,
} from '@/lib/api'
import { Wallet, Plus, X, RefreshCw } from 'lucide-react'

const TABS = ['all', 'pending', 'initiated', 'completed', 'failed']

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  initiated: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  success: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  otp: 'bg-amber-100 text-amber-700',
}

export default function AdminBursaryDisbursementsPage() {
  const { adminKey } = useAdminKey()
  const [tab, setTab] = useState('all')
  const [disbursements, setDisbursements] = useState<AdminBursaryDisbursementRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showInitiate, setShowInitiate] = useState(false)
  const [approvedApps, setApprovedApps] = useState<AdminBursaryApplicationRow[]>([])
  const [selectedAppId, setSelectedAppId] = useState('')
  const [amount, setAmount] = useState('')
  const [phone, setPhone] = useState('')
  const [initiating, setInitiating] = useState(false)
  const [refreshingId, setRefreshingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!adminKey) return
    setLoading(true)
    setError(null)
    try {
      const res = await listAdminBursaryDisbursements({ status: tab, limit: 50 }, adminKey)
      setDisbursements(res.disbursements)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load disbursements')
    } finally {
      setLoading(false)
    }
  }, [adminKey, tab])

  useEffect(() => {
    load()
  }, [load])

  async function openInitiate() {
    if (!adminKey) return
    setShowInitiate(true)
    try {
      const [appsRes, disbRes] = await Promise.all([
        listAdminBursaryApplications({ status: 'approved', limit: 100 }, adminKey),
        listAdminBursaryDisbursements({ status: 'all', limit: 200 }, adminKey),
      ])
      const alreadyDisbursed = new Set(disbRes.disbursements.map((d) => d.applicationId))
      setApprovedApps(appsRes.applications.filter((a) => !alreadyDisbursed.has(a.id)))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load approved applications')
    }
  }

  function onSelectApp(id: string) {
    setSelectedAppId(id)
    const app = approvedApps.find((a) => a.id === id)
    setPhone(app?.applicant.phone || '')
  }

  async function handleInitiate(e: React.FormEvent) {
    e.preventDefault()
    if (!adminKey) return
    const app = approvedApps.find((a) => a.id === selectedAppId)
    if (!app) return

    setInitiating(true)
    try {
      await initiateAdminBursaryDisbursement(
        { applicationId: app.id, phoneNumber: phone, amount: Number(amount), recipientName: app.applicant.fullName || undefined },
        adminKey,
        app.tenantId
      )
      toast.success('Disbursement initiated')
      setShowInitiate(false)
      setSelectedAppId('')
      setAmount('')
      setPhone('')
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to initiate disbursement')
    } finally {
      setInitiating(false)
    }
  }

  async function refreshStatus(d: AdminBursaryDisbursementRow) {
    if (!adminKey || !d.transferCode) return
    setRefreshingId(d.id)
    try {
      // Real-time status needs the owning tenant's x-tenant-id, which isn't
      // on the disbursement list row - re-fetching per-row here would need
      // a tenant lookup this endpoint doesn't currently expose. Falls back
      // to just re-loading the list (which reflects the DB's last known
      // state, e.g. from a webhook) rather than a live Paystack round-trip.
      await load()
      toast.success('Refreshed from last known status')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to refresh status')
    } finally {
      setRefreshingId(null)
    }
  }

  return (
    <main className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Wallet className="w-6 h-6 text-amber-600" />
          Disbursements
        </h1>
        <button
          onClick={openInitiate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Initiate Disbursement
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-6">Track and initiate Paystack disbursements for approved applications.</p>

      {showInitiate && (
        <div className="mb-6 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Initiate Disbursement</h2>
            <button onClick={() => setShowInitiate(false)} className="p-1 rounded-md hover:bg-gray-100 text-gray-400">
              <X className="w-4 h-4" />
            </button>
          </div>
          {approvedApps.length === 0 ? (
            <p className="text-sm text-gray-400">No approved applications are awaiting disbursement.</p>
          ) : (
            <form onSubmit={handleInitiate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-500 mb-1">Application *</label>
                <select
                  required
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm w-full"
                  value={selectedAppId}
                  onChange={(e) => onSelectApp(e.target.value)}
                >
                  <option value="">Select an approved application…</option>
                  {approvedApps.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.applicant.fullName || 'Unnamed'} — {a.fund.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Amount (KES) *</label>
                <input
                  required
                  type="number"
                  min="1"
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm w-full"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">M-Pesa Phone *</label>
                <input
                  required
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm w-full"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="07XX XXX XXX"
                />
              </div>
              <div className="sm:col-span-2 flex justify-end gap-2">
                <button
                  type="submit"
                  disabled={initiating}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium disabled:opacity-50"
                >
                  {initiating ? 'Initiating…' : 'Initiate'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 mb-4 w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && <div className="mb-4 px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : disbursements.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-sm">No disbursements in this view.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Applicant</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Paystack Status</th>
                  <th className="px-4 py-3 font-medium">Transfer Code</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {disbursements.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{d.applicantName || 'Unnamed'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {d.currency} {d.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[d.status] || 'bg-gray-100 text-gray-700'}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {d.paystackStatus ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[d.paystackStatus] || 'bg-gray-100 text-gray-700'}`}>
                          {d.paystackStatus}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">{d.transferCode || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{new Date(d.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => refreshStatus(d)}
                        disabled={refreshingId === d.id}
                        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
                        aria-label="Refresh status"
                      >
                        <RefreshCw className={`w-4 h-4 ${refreshingId === d.id ? 'animate-spin' : ''}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
