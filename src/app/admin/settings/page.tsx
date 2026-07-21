'use client'

// ============================================
// ADMIN - FOUNDER PRICING PORTAL
// /admin/settings
// Edit every platform price from one screen.
// ============================================

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Settings, Check } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL

type Setting = { key: string; value: string; description: string | null }

// Matches src/app/admin/campaigns/page.tsx's adminKey() helper.
const adminKey = () => sessionStorage.getItem('elimux-admin-key') || ''

const isBooleanKey = (k: string) => k === 'show_public_impressions'

const GROUPS: { title: string; match: (k: string) => boolean }[] = [
  { title: 'Advertising tier prices (KES / month)', match: (k) => k.startsWith('ad_tier_') && k.endsWith('_kes') },
  { title: 'Advertising tier prices (USD / month)', match: (k) => k.startsWith('ad_tier_') && k.endsWith('_usd') },
  { title: '"Your ad here" placeholder prices', match: (k) => k.startsWith('ad_placeholder_') },
  { title: 'Other settings', match: () => true },
]

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState('')
  const [savedKey, setSavedKey] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(API_URL + '/api/admin/settings', {
        headers: { 'X-Admin-Key': adminKey() },
      })
      if (!res.ok) throw new Error('Request failed: ' + res.status)
      const json = await res.json()
      const rows: Setting[] = json.data || []
      setSettings(rows)
      const d: Record<string, string> = {}
      rows.forEach((s) => { d[s.key] = s.value })
      setDrafts(d)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const save = async (key: string) => {
    setSaving(key)
    setSavedKey('')
    try {
      const res = await fetch(API_URL + '/api/admin/settings/' + encodeURIComponent(key), {
        method: 'PATCH',
        headers: { 'X-Admin-Key': adminKey(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: drafts[key] }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Save failed')
      setSettings((prev) => prev.map((s) => (s.key === key ? { ...s, value: drafts[key] } : s)))
      setSavedKey(key)
      setTimeout(() => setSavedKey(''), 2500)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSaving('')
    }
  }

  const assigned = new Set<string>()
  const grouped = GROUPS.map((g) => {
    const rows = settings.filter((s) => !assigned.has(s.key) && g.match(s.key))
    rows.forEach((r) => assigned.add(r.key))
    return { title: g.title, rows }
  }).filter((g) => g.rows.length > 0)

  return (
    <main className="min-h-screen py-12 px-4 max-w-3xl mx-auto">
      <Link href="/admin" className="text-sm text-muted hover:text-foreground flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to admin
      </Link>

      <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
        <Settings className="w-8 h-8 text-primary-500" />
        Platform Pricing
      </h1>
      <p className="text-muted mb-8">
        Every price on ElimuX is controlled from this screen. Changes take effect immediately — no code changes, no SQL.
      </p>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted">Loading settings...</p>
        </div>
      )}

      {error && (
        <div className="mb-6 px-4 py-2 rounded-lg border border-elimux-danger/30 text-elimux-danger text-sm">
          {error} — if you have not signed in, open /admin first, then return here.
        </div>
      )}

      {!loading && !error && settings.length === 0 && (
        <p className="text-muted text-sm bg-elimux-card rounded-xl p-4 border border-border">
          No settings found.
        </p>
      )}

      {grouped.map((g) => (
        <section key={g.title} className="mb-8">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">{g.title}</h2>
          <div className="space-y-3">
            {g.rows.map((s) => (
              <div key={s.key} className="rounded-xl border border-border bg-elimux-card p-4 flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <p className="text-sm text-foreground">{s.description || s.key}</p>
                  <p className="text-xs text-muted font-mono mt-0.5">{s.key}</p>
                </div>
                {isBooleanKey(s.key) ? (
                  <select
                    value={drafts[s.key] ?? s.value}
                    onChange={(e) => setDrafts((p) => ({ ...p, [s.key]: e.target.value }))}
                    className="px-3 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                  >
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    inputMode="decimal"
                    value={drafts[s.key] ?? ''}
                    onChange={(e) => setDrafts((p) => ({ ...p, [s.key]: e.target.value }))}
                    className="w-32 px-3 py-2 rounded-lg bg-elimux-dark border border-border text-foreground text-right focus:outline-none focus:border-primary-500"
                  />
                )}
                <button
                  onClick={() => save(s.key)}
                  disabled={saving === s.key || drafts[s.key] === s.value}
                  className="px-4 py-2 rounded-lg bg-primary-500/20 text-primary-500 hover:bg-primary-500/30 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {saving === s.key ? 'Saving...' : 'Save'}
                </button>
                {savedKey === s.key && (
                  <span className="flex items-center gap-1 text-elimux-success text-sm">
                    <Check className="w-4 h-4" /> Saved
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </main>
  )
}
