'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { listAdminSponsorAds, createSponsorAd, updateSponsorAd, type SponsorAdRow } from '@/lib/api'
import { useAdminKey } from '@/components/admin/AdminKeyContext'
import SponsorAdForm, { type SponsorAdFormInitialData } from '@/components/admin/SponsorAdForm'
import { ArrowLeft, Megaphone, Pencil, Ban, CheckCircle2, Plus, MousePointerClick } from 'lucide-react'

export default function AdManagerPage() {
  const { adminKey } = useAdminKey()
  const [ads, setAds] = useState<SponsorAdRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<SponsorAdFormInitialData | null>(null)

  const loadAds = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await listAdminSponsorAds(adminKey)
      setAds(res.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sponsor ads')
    } finally {
      setLoading(false)
    }
  }, [adminKey])

  useEffect(() => {
    loadAds()
  }, [loadAds])

  function flashSuccess(message: string) {
    setSuccessMessage(message)
    setTimeout(() => setSuccessMessage(null), 4000)
  }

  async function handleCreate(data: Parameters<typeof createSponsorAd>[0]) {
    await createSponsorAd(data, adminKey)
    setShowForm(false)
    flashSuccess('Sponsor ad created successfully.')
    await loadAds()
  }

  async function handleUpdate(data: Parameters<typeof createSponsorAd>[0]) {
    if (!editing) return
    await updateSponsorAd(editing.id, data, adminKey)
    setEditing(null)
    flashSuccess('Sponsor ad updated successfully.')
    await loadAds()
  }

  async function handleToggleActive(ad: SponsorAdRow) {
    try {
      await updateSponsorAd(ad.id, { is_active: !ad.is_active }, adminKey)
      flashSuccess(ad.is_active ? 'Ad deactivated.' : 'Ad activated.')
      await loadAds()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update ad status')
    }
  }

  function openEdit(ad: SponsorAdRow) {
    setEditing({
      id: ad.id,
      sponsor_id: ad.sponsor_id,
      title: ad.title,
      description: ad.description || '',
      image_url: ad.image_url || '',
      target_url: ad.target_url,
      placement: ad.placement,
      start_date: ad.start_date.slice(0, 10),
      end_date: ad.end_date.slice(0, 10),
    })
  }

  const totalClicks = ads.reduce((sum, ad) => sum + (ad.click_count || 0), 0)

  return (
    <main className="min-h-screen py-12 px-4 max-w-6xl mx-auto">
      <Link href="/admin" className="text-sm text-muted hover:text-foreground flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Megaphone className="w-8 h-8 text-primary-400" />
          Sponsor Ads
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Ad
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-elimux-card rounded-xl p-4 border border-border text-center">
          <p className="text-2xl font-bold text-foreground">{ads.length}</p>
          <p className="text-xs text-muted">Total Campaigns</p>
        </div>
        <div className="bg-elimux-card rounded-xl p-4 border border-border text-center">
          <p className="text-2xl font-bold text-elimux-success">{ads.filter((a) => a.is_active).length}</p>
          <p className="text-xs text-muted">Active</p>
        </div>
        <div className="bg-elimux-card rounded-xl p-4 border border-border text-center">
          <p className="text-2xl font-bold text-primary-400">{totalClicks.toLocaleString()}</p>
          <p className="text-xs text-muted">Total Clicks</p>
        </div>
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

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted">Loading sponsor ads...</p>
        </div>
      ) : (
        <div className="bg-elimux-card border border-border rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-elimux-dark text-muted text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Ad</th>
                <th className="px-4 py-3 font-medium">Placement</th>
                <th className="px-4 py-3 font-medium">Runs</th>
                <th className="px-4 py-3 font-medium">
                  <span className="flex items-center gap-1">
                    <MousePointerClick className="w-3.5 h-3.5" /> Clicks
                  </span>
                </th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ads.map((ad) => (
                <tr key={ad.id} className="border-t border-border">
                  <td className="px-4 py-3 text-foreground font-medium">
                    {ad.title}
                    {ad.sponsor?.name && <div className="text-xs text-muted">{ad.sponsor.name}</div>}
                  </td>
                  <td className="px-4 py-3 text-muted">{ad.placement}</td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">
                    {new Date(ad.start_date).toLocaleDateString()} &ndash; {new Date(ad.end_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-muted">{(ad.click_count || 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={ad.is_active ? 'text-elimux-success' : 'text-elimux-danger'}>
                      {ad.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(ad)}
                        className="p-1.5 rounded-lg hover:bg-muted/10 text-muted hover:text-foreground transition-colors"
                        aria-label="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(ad)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          ad.is_active
                            ? 'hover:bg-elimux-danger/10 text-muted hover:text-elimux-danger'
                            : 'hover:bg-elimux-success/10 text-muted hover:text-elimux-success'
                        }`}
                        aria-label={ad.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {ad.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {ads.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted">
                    No sponsor ads yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && <SponsorAdForm onSubmit={handleCreate} onClose={() => setShowForm(false)} />}

      {editing && <SponsorAdForm initialData={editing} onSubmit={handleUpdate} onClose={() => setEditing(null)} />}
    </main>
  )
}
