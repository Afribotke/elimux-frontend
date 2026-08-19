'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAdminKey } from '@/components/admin/AdminKeyContext'
import {
  listAdminBursaryFunds,
  listAdminBursaryFundTenants,
  createAdminBursaryFund,
  updateAdminBursaryFund,
  deleteAdminBursaryFund,
  type AdminBursaryFund,
  type AdminBursaryTenantOption,
} from '@/lib/api'
import { Landmark, Plus, Pencil, Trash2, X } from 'lucide-react'

const STATUS_TABS = ['all', 'draft', 'open', 'closed', 'disbursing', 'completed', 'cancelled']

const inputClass = 'px-3 py-2 rounded-lg border border-gray-200 text-sm w-full focus:outline-none focus:border-amber-400'
const labelClass = 'block text-xs font-medium text-gray-500 mb-1'

interface FormState {
  tenantId: string
  name: string
  description: string
  totalAmount: string
  currency: string
  deadline: string
}

const EMPTY_FORM: FormState = { tenantId: '', name: '', description: '', totalAmount: '', currency: 'KES', deadline: '' }

export default function AdminBursaryFundsPage() {
  const { adminKey } = useAdminKey()
  const [tab, setTab] = useState('all')
  const [funds, setFunds] = useState<AdminBursaryFund[]>([])
  const [tenants, setTenants] = useState<AdminBursaryTenantOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!adminKey) return
    setLoading(true)
    setError(null)
    try {
      const res = await listAdminBursaryFunds({ status: tab, limit: 50 }, adminKey)
      setFunds(res.funds)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load funds')
    } finally {
      setLoading(false)
    }
  }, [adminKey, tab])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!adminKey) return
    listAdminBursaryFundTenants(adminKey)
      .then((res) => setTenants(res.tenants))
      .catch(() => {})
  }, [adminKey])

  function openCreate() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  function openEdit(fund: AdminBursaryFund) {
    setEditingId(fund.id)
    setForm({
      tenantId: fund.tenant_id,
      name: fund.name,
      description: fund.description || '',
      totalAmount: String(fund.budget?.total ?? ''),
      currency: fund.budget?.currency || 'KES',
      deadline: fund.application_window?.deadline?.slice(0, 10) || '',
    })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!adminKey) return
    setSaving(true)
    try {
      const payload = {
        tenantId: form.tenantId,
        name: form.name,
        description: form.description || undefined,
        totalAmount: form.totalAmount ? Number(form.totalAmount) : undefined,
        currency: form.currency,
        deadline: form.deadline || undefined,
      }
      if (editingId) {
        await updateAdminBursaryFund(editingId, payload, adminKey)
        toast.success('Fund updated')
      } else {
        await createAdminBursaryFund(payload, adminKey)
        toast.success('Fund created')
      }
      setShowForm(false)
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save fund')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(fund: AdminBursaryFund) {
    if (!adminKey) return
    if (!confirm(`Cancel fund "${fund.name}"? This is a soft-delete (status set to cancelled), not a hard delete.`)) return
    try {
      await deleteAdminBursaryFund(fund.id, adminKey)
      toast.success('Fund cancelled')
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel fund')
    }
  }

  return (
    <main className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Landmark className="w-6 h-6 text-amber-600" />
          Bursary Funds
        </h1>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Create Fund
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-6">Manage funding opportunities across all bursary providers.</p>

      {showForm && (
        <div className="mb-6 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">{editingId ? 'Edit Fund' : 'Create Fund'}</h2>
            <button onClick={() => setShowForm(false)} className="p-1 rounded-md hover:bg-gray-100 text-gray-400">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass}>Provider *</label>
              <select
                required
                disabled={!!editingId}
                className={inputClass}
                value={form.tenantId}
                onChange={(e) => setForm((f) => ({ ...f, tenantId: e.target.value }))}
              >
                <option value="">Select a provider…</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Title *</label>
              <input required className={inputClass} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Description</label>
              <textarea
                className={inputClass}
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelClass}>Total Amount (KES)</label>
              <input
                type="number"
                min="0"
                className={inputClass}
                value={form.totalAmount}
                onChange={(e) => setForm((f) => ({ ...f, totalAmount: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelClass}>Application Deadline</label>
              <input type="date" className={inputClass} value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium disabled:opacity-50"
              >
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Fund'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 mb-4 w-fit flex-wrap">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
              tab === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {error && <div className="mb-4 px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-3" />
          </div>
        ) : funds.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-sm">No funds in this view.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Deadline</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Applicants</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {funds.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{f.name}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {f.budget?.currency} {f.budget?.total?.toLocaleString() ?? 0}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {f.application_window?.deadline ? new Date(f.application_window.deadline).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">{f.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{f.applicant_count}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(f)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500" aria-label="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(f)} className="p-1.5 rounded-md hover:bg-red-50 text-red-500" aria-label="Cancel fund">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
