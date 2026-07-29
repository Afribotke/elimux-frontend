'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import StatCard from '@/components/admin/StatCard'
import { ArrowLeft, Building2, CheckCircle2, XCircle, Mail } from 'lucide-react'

interface AdminEmployerRow {
  id: string
  company_name: string
  company_email: string | null
  industry: string | null
  location_county: string | null
  verification_status: string
  is_verified: boolean
  created_at: string
}

export default function AdminEmployersPage() {
  const [employers, setEmployers] = useState<AdminEmployerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data, error: err } = await supabase
        .from('employers')
        .select('*')
        .order('created_at', { ascending: false })

      if (err) setError(err.message)
      else setEmployers((data || []) as AdminEmployerRow[])
      setLoading(false)
    }
    load()
  }, [])

  async function updateStatus(id: string, status: 'verified' | 'rejected') {
    setBusyId(id)
    const supabase = createClient()
    const { error: err } = await supabase
      .from('employers')
      .update({ verification_status: status, is_verified: status === 'verified' })
      .eq('id', id)

    if (!err) {
      setEmployers((prev) =>
        prev.map((e) => (e.id === id ? { ...e, verification_status: status, is_verified: status === 'verified' } : e))
      )
    }
    setBusyId(null)
  }

  const verified = employers.filter((e) => e.verification_status === 'verified').length
  const pending = employers.filter((e) => e.verification_status === 'pending').length
  const rejected = employers.filter((e) => e.verification_status === 'rejected').length

  return (
    <main className="min-h-screen py-12 px-4 max-w-6xl mx-auto">
      <Link href="/admin" className="text-sm text-muted hover:text-foreground flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
        <Building2 className="w-8 h-8 text-primary-400" />
        Employers
      </h1>
      <p className="text-muted mb-6">Employer accounts and verification status.</p>

      {error && (
        <div className="mb-6 px-4 py-2 rounded-lg bg-elimux-danger/10 border border-elimux-danger/30 text-elimux-danger text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted">Loading employers...</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <StatCard icon={Building2} label="Total Employers" value={String(employers.length)} />
            <StatCard icon={CheckCircle2} label="Verified" value={String(verified)} color="text-elimux-success" />
            <StatCard icon={Building2} label="Pending" value={String(pending)} color="text-elimux-warning" />
            <StatCard icon={XCircle} label="Rejected" value={String(rejected)} color="text-elimux-danger" />
          </div>

          <div className="bg-elimux-card border border-border rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-elimux-dark text-muted text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Industry</th>
                  <th className="px-4 py-3 font-medium">County</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employers.map((e) => (
                  <tr key={e.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <p className="text-foreground font-medium">{e.company_name}</p>
                      {e.company_email && (
                        <p className="text-xs text-muted flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {e.company_email}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">{e.industry || '—'}</td>
                    <td className="px-4 py-3 text-muted">{e.location_county || '—'}</td>
                    <td className="px-4 py-3">
                      <StatusPill status={e.verification_status} />
                    </td>
                    <td className="px-4 py-3 text-muted">{new Date(e.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {e.verification_status !== 'verified' && (
                          <button
                            onClick={() => updateStatus(e.id, 'verified')}
                            disabled={busyId === e.id}
                            className="px-2.5 py-1.5 rounded-lg bg-elimux-success/10 text-elimux-success text-xs font-medium disabled:opacity-50"
                          >
                            Verify
                          </button>
                        )}
                        {e.verification_status !== 'rejected' && (
                          <button
                            onClick={() => updateStatus(e.id, 'rejected')}
                            disabled={busyId === e.id}
                            className="px-2.5 py-1.5 rounded-lg bg-elimux-danger/10 text-elimux-danger text-xs font-medium disabled:opacity-50"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {employers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted">
                      No employers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  )
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    verified: 'bg-elimux-success/10 text-elimux-success',
    pending: 'bg-elimux-warning/10 text-elimux-warning',
    rejected: 'bg-elimux-danger/10 text-elimux-danger',
  }
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || styles.pending}`}>
      {status}
    </span>
  )
}
