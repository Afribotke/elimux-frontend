'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { listAccreditationBodies, type AccreditationBodyRow } from '@/lib/api'
import StatCard from '@/components/admin/StatCard'
import { ArrowLeft, Shield, CheckCircle2, XCircle, Globe } from 'lucide-react'

export default function AdminAccreditationPage() {
  const [bodies, setBodies] = useState<AccreditationBodyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const { data } = await listAccreditationBodies()
        setBodies(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load accreditation bodies')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const active = bodies.filter((b) => b.is_active).length

  return (
    <main className="min-h-screen py-12 px-4 max-w-6xl mx-auto">
      <Link href="/admin" className="text-sm text-muted hover:text-foreground flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
        <Shield className="w-8 h-8 text-primary-400" />
        Accreditation Bodies
      </h1>
      <p className="text-muted mb-6">Bodies that accredit institutions on the platform.</p>

      {error && (
        <div className="mb-6 px-4 py-2 rounded-lg bg-elimux-danger/10 border border-elimux-danger/30 text-elimux-danger text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted">Loading accreditation bodies...</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            <StatCard icon={Shield} label="Total Bodies" value={String(bodies.length)} />
            <StatCard icon={CheckCircle2} label="Active" value={String(active)} color="text-elimux-success" />
            <StatCard icon={XCircle} label="Inactive" value={String(bodies.length - active)} color="text-elimux-danger" />
          </div>

          <div className="bg-elimux-card border border-border rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-elimux-dark text-muted text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Country</th>
                  <th className="px-4 py-3 font-medium">Website</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {bodies.map((b) => (
                  <tr key={b.id} className="border-t border-border">
                    <td className="px-4 py-3 text-foreground font-medium">{b.name}</td>
                    <td className="px-4 py-3 text-muted capitalize">{b.body_type}</td>
                    <td className="px-4 py-3 text-muted">{b.country?.name || '—'}</td>
                    <td className="px-4 py-3">
                      {b.website_url ? (
                        <a
                          href={b.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary-400 hover:underline"
                        >
                          <Globe className="w-3.5 h-3.5" /> Visit
                        </a>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          b.is_active ? 'bg-elimux-success/10 text-elimux-success' : 'bg-elimux-danger/10 text-elimux-danger'
                        }`}
                      >
                        {b.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
                {bodies.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted">
                      No accreditation bodies found.
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
