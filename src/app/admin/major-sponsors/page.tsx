'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  listAdminMajorSponsors,
  createMajorSponsor,
  updateMajorSponsor,
  activateMajorSponsor,
  type MajorSponsorRow,
} from '@/lib/api'
import { useAdminKey } from '@/components/admin/AdminKeyContext'
import MajorSponsorForm, { type MajorSponsorFormInitialData } from '@/components/admin/MajorSponsorForm'
import { ArrowLeft, Award, Pencil, Ban, CheckCircle2, Plus } from 'lucide-react'

export default function MajorSponsorsPage() {
  const { adminKey } = useAdminKey()
  const [sponsors, setSponsors] = useState<MajorSponsorRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<MajorSponsorFormInitialData | null>(null)

  const loadSponsors = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await listAdminMajorSponsors(adminKey)
      setSponsors(res.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load major sponsors')
    } finally {
      setLoading(false)
    }
  }, [adminKey])

  useEffect(() => {
    loadSponsors()
  }, [loadSponsors])

  function flashSuccess(message: string) {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(null), 4000)
  }

  async function handleCreate(data: Parameters<typeof createMajorSponsor>[0]) {
    await createMajorSponsor(data, adminKey)
    setShowForm(false)
    flashSuccess('Major sponsor created successfully.')
    await loadSponsors()
  }

  async function handleUpdate(data: Parameters<typeof createMajorSponsor>[0]) {
    if (!editing) return
    await updateMajorSponsor(editing.id, data, adminKey)
    setEditing(null)
    flashSuccess('Major sponsor updated successfully.')
    await loadSponsors()
  }

  async function handleToggleActive(sponsor: MajorSponsorRow) {
    try {
      if (sponsor.is_active) {
        await updateMajorSponsor(sponsor.id, { is_active: false }, adminKey)
        flashSuccess('Sponsor deactivated.')
      } else {
        await activateMajorSponsor(sponsor.id, adminKey)
        flashSuccess('Sponsor activated.')
      }
      await loadSponsors()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update sponsor status')
    }
  }

  function openEdit(sponsor: MajorSponsorRow) {
    setEditing({
      id: sponsor.id,
      organization_name: sponsor.organization_name,
      logo_url: sponsor.logo_url || '',
      tagline: sponsor.tagline || '',
      website_url: sponsor.website_url || '',
      sponsorship_tier: sponsor.sponsorship_tier,
      start_date: sponsor.start_date ? sponsor.start_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      end_date: sponsor.end_date ? sponsor.end_date.slice(0, 10) : '',
      show_in_header: sponsor.show_in_header,
      show_in_footer: sponsor.show_in_footer,
      show_in_loading: sponsor.show_in_loading,
      show_in_email: sponsor.show_in_email,
    })
  }

  const activeSponsor = sponsors.find((s) => s.is_active) || null

  return (
    <main className="min-h-screen py-12 px-4 max-w-6xl mx-auto">
      <Link href="/admin" className="text-sm text-muted hover:text-foreground flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Award className="w-8 h-8 text-primary-400" />
          Major Sponsors
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Sponsor
        </button>
      </div>

      {successMessage && (
        <div className="mb-6 px-4 py-2 rounded-lg bg-elimux-success/10 border border-elimux-success/30 text-elimux-success text-sm">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-6 px-4 py-2 rounded-lg bg-elimux-danger/10 border border-elimux-danger/30 text-elimux-danger text-sm">
          {error}
        </div>
      )}

      {/* Live preview of the currently active sponsor */}
      <div className="mb-8 bg-elimux-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-semibold text-muted mb-4 uppercase tracking-wide">Live Preview</h2>
        {!activeSponsor ? (
          <p className="text-muted text-sm">No sponsor is currently active — nothing will show on the site.</p>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted mb-1.5">Header</p>
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-elimux-dark border border-border">
                <span className="font-bold text-foreground">ElimuX</span>
                <span className="flex items-center gap-1.5 text-muted text-xs">
                  Powered by
                  {activeSponsor.logo_url ? (
                    <img src={activeSponsor.logo_url} alt={activeSponsor.organization_name} className="h-5 w-auto object-contain" />
                  ) : (
                    <span className="font-semibold text-foreground">{activeSponsor.organization_name}</span>
                  )}
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted mb-1.5">Footer</p>
              <div className="text-center px-4 py-4 rounded-lg bg-elimux-dark border border-border">
                <p className="text-sm text-muted mb-2">
                  ElimuX is proudly powered by <span className="font-semibold text-foreground">{activeSponsor.organization_name}</span>
                </p>
                {activeSponsor.logo_url && (
                  <img src={activeSponsor.logo_url} alt={activeSponsor.organization_name} className="h-8 w-auto object-contain mx-auto mb-1" />
                )}
                {activeSponsor.tagline && <p className="text-xs text-muted">{activeSponsor.tagline}</p>}
              </div>
            </div>

            <div>
              <p className="text-xs text-muted mb-1.5">Loading Screen</p>
              <div className="flex flex-col items-center gap-2 px-4 py-6 rounded-lg bg-elimux-dark border border-border">
                <span className="text-lg font-bold text-foreground">ElimuX</span>
                <span className="text-xs text-muted">Powered by</span>
                {activeSponsor.logo_url ? (
                  <img src={activeSponsor.logo_url} alt={activeSponsor.organization_name} className="h-6 w-auto object-contain" />
                ) : (
                  <span className="text-sm font-semibold text-foreground">{activeSponsor.organization_name}</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted">Loading major sponsors...</p>
        </div>
      ) : (
        <div className="bg-elimux-card border border-border rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-elimux-dark text-muted text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Sponsor</th>
                <th className="px-4 py-3 font-medium">Tier</th>
                <th className="px-4 py-3 font-medium">Runs</th>
                <th className="px-4 py-3 font-medium">Placements</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sponsors.map((sponsor) => (
                <tr key={sponsor.id} className="border-t border-border">
                  <td className="px-4 py-3 text-foreground font-medium">
                    {sponsor.organization_name}
                    {sponsor.tagline && <div className="text-xs text-muted">{sponsor.tagline}</div>}
                  </td>
                  <td className="px-4 py-3 text-muted capitalize">{sponsor.sponsorship_tier}</td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">
                    {sponsor.start_date ? new Date(sponsor.start_date).toLocaleDateString() : '—'}
                    {' – '}
                    {sponsor.end_date ? new Date(sponsor.end_date).toLocaleDateString() : 'Ongoing'}
                  </td>
                  <td className="px-4 py-3 text-muted text-xs">
                    {[
                      sponsor.show_in_header && 'Header',
                      sponsor.show_in_footer && 'Footer',
                      sponsor.show_in_loading && 'Loading',
                      sponsor.show_in_email && 'Email',
                    ]
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={sponsor.is_active ? 'text-elimux-success' : 'text-elimux-danger'}>
                      {sponsor.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(sponsor)}
                        className="p-1.5 rounded-lg hover:bg-muted/10 text-muted hover:text-foreground transition-colors"
                        aria-label="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(sponsor)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          sponsor.is_active
                            ? 'hover:bg-elimux-danger/10 text-muted hover:text-elimux-danger'
                            : 'hover:bg-elimux-success/10 text-muted hover:text-elimux-success'
                        }`}
                        aria-label={sponsor.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {sponsor.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {sponsors.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted">
                    No major sponsors yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && <MajorSponsorForm onSubmit={handleCreate} onClose={() => setShowForm(false)} />}

      {editing && <MajorSponsorForm initialData={editing} onSubmit={handleUpdate} onClose={() => setEditing(null)} />}
    </main>
  )
}
