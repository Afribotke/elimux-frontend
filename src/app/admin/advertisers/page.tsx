'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useAdminKey } from '@/components/admin/AdminKeyContext'
import { ArrowLeft, Building2 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL

type Advertiser = {
  id: string
  organization_name: string
  email: string
  balance: number
  total_spent: number
  status: string
  created_at: string
  campaign_count: number
}

const kes = (n: number) => 'KES ' + Number(n).toLocaleString('en-KE', { minimumFractionDigits: 2 })

export default function AdminAdvertisersPage() {
  const { adminKey } = useAdminKey()
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!adminKey) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(API_URL + '/api/admin/advertisers', {
        headers: { 'X-Admin-Key': adminKey },
      })
      if (!res.ok) throw new Error('Request failed: ' + res.status)
      const json = await res.json()
      setAdvertisers(json.data || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [adminKey])

  useEffect(() => { load() }, [load])

  const setStatus = async (adv: Advertiser, status: 'active' | 'suspended') => {
    if (status === 'suspended' && !window.confirm('Suspend ' + adv.organization_name + '? They will not be able to create campaigns or top up.')) return
    setBusyId(adv.id)
    try {
      const res = await fetch(API_URL + '/api/admin/advertisers/' + adv.id + '/status', {
        method: 'PATCH',
        headers: { 'X-Admin-Key': adminKey || '', 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Action failed')
      await load()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <main className="min-h-screen py-12 px-4 max-w-6xl mx-auto">
      <Link href="/admin" className="text-sm text-muted hover:text-foreground flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold text-foreground mb-8 flex items-center gap-3">
        <Building2 className="w-8 h-8 text-primary-400" />
        Advertisers
      </h1>

      {error && (
        <div className="mb-6 px-4 py-2 rounded-lg bg-elimux-danger/10 border border-elimux-danger/30 text-elimux-danger text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted">Loading advertisers...</p>
        </div>
      ) : (
        <div className="bg-elimux-card border border-border rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-elimux-dark text-muted text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Balance</th>
                <th className="px-4 py-3 font-medium">Total spent</th>
                <th className="px-4 py-3 font-medium">Campaigns</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {advertisers.map((a) => (
                <tr key={a.id} className="border-t border-border">
                  <td className="px-4 py-3 text-foreground">{a.organization_name}</td>
                  <td className="px-4 py-3 text-muted">{a.email}</td>
                  <td className="px-4 py-3 text-foreground tabular-nums">{kes(a.balance)}</td>
                  <td className="px-4 py-3 text-muted tabular-nums">{kes(a.total_spent)}</td>
                  <td className="px-4 py-3 text-muted">{a.campaign_count}</td>
                  <td className="px-4 py-3">
                    <span className={a.status === 'active' ? 'text-elimux-success' : a.status === 'suspended' ? 'text-elimux-danger' : 'text-elimux-warning'}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">{new Date(a.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {a.status === 'active' ? (
                      <button
                        disabled={busyId === a.id}
                        onClick={() => setStatus(a, 'suspended')}
                        className="px-3 py-1.5 rounded-lg bg-elimux-danger/20 text-elimux-danger hover:bg-elimux-danger/30 text-xs font-medium disabled:opacity-50"
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        disabled={busyId === a.id}
                        onClick={() => setStatus(a, 'active')}
                        className="px-3 py-1.5 rounded-lg bg-elimux-success/20 text-elimux-success hover:bg-elimux-success/30 text-xs font-medium disabled:opacity-50"
                      >
                        Reactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {advertisers.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted">
                    No advertisers yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
