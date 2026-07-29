'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import StatCard from '@/components/admin/StatCard'
import { ArrowLeft, Briefcase, CheckCircle2, PauseCircle, XCircle } from 'lucide-react'

interface AdminInternshipRow {
  id: string
  title: string
  status: string
  profession_category: string | null
  location_county: string | null
  total_slots: number | null
  remaining_slots: number | null
  created_at: string
  employer: { company_name: string } | null
  applications: { count: number }[] | null
}

export default function AdminInternshipsPage() {
  const [internships, setInternships] = useState<AdminInternshipRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data, error: err } = await supabase
        .from('internships')
        .select('*, employer:employers(company_name), applications:applications(count)')
        .order('created_at', { ascending: false })

      if (err) setError(err.message)
      else setInternships((data || []) as unknown as AdminInternshipRow[])
      setLoading(false)
    }
    load()
  }, [])

  const active = internships.filter((i) => i.status === 'active').length
  const draft = internships.filter((i) => i.status === 'draft' || i.status === 'paused').length
  const closed = internships.filter((i) => i.status === 'closed' || i.status === 'completed').length

  return (
    <main className="min-h-screen py-12 px-4 max-w-6xl mx-auto">
      <Link href="/admin" className="text-sm text-muted hover:text-foreground flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
        <Briefcase className="w-8 h-8 text-primary-400" />
        Internships
      </h1>
      <p className="text-muted mb-6">Internship and attachment listings posted by employers.</p>

      {error && (
        <div className="mb-6 px-4 py-2 rounded-lg bg-elimux-danger/10 border border-elimux-danger/30 text-elimux-danger text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted">Loading internships...</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <StatCard icon={Briefcase} label="Total Listings" value={String(internships.length)} />
            <StatCard icon={CheckCircle2} label="Active" value={String(active)} color="text-elimux-success" />
            <StatCard icon={PauseCircle} label="Draft / Paused" value={String(draft)} color="text-elimux-warning" />
            <StatCard icon={XCircle} label="Closed" value={String(closed)} color="text-elimux-danger" />
          </div>

          <div className="bg-elimux-card border border-border rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-elimux-dark text-muted text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Employer</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Slots</th>
                  <th className="px-4 py-3 font-medium">Applications</th>
                  <th className="px-4 py-3 font-medium">Posted</th>
                </tr>
              </thead>
              <tbody>
                {internships.map((i) => (
                  <tr key={i.id} className="border-t border-border">
                    <td className="px-4 py-3 text-foreground font-medium">{i.title}</td>
                    <td className="px-4 py-3 text-muted">{i.employer?.company_name || '—'}</td>
                    <td className="px-4 py-3 text-muted">{i.location_county || '—'}</td>
                    <td className="px-4 py-3">
                      <StatusPill status={i.status} />
                    </td>
                    <td className="px-4 py-3 text-muted tabular-nums">
                      {i.remaining_slots ?? '—'} / {i.total_slots ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-muted tabular-nums">{i.applications?.[0]?.count ?? 0}</td>
                    <td className="px-4 py-3 text-muted">{new Date(i.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {internships.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted">
                      No internships found.
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
    draft: 'bg-muted/10 text-muted',
    active: 'bg-elimux-success/10 text-elimux-success',
    paused: 'bg-elimux-warning/10 text-elimux-warning',
    closed: 'bg-elimux-danger/10 text-elimux-danger',
    completed: 'bg-primary-500/10 text-primary-400',
  }
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || styles.draft}`}>
      {status}
    </span>
  )
}
