'use client'

// ============================================
// ELIMUX INSTITUTION PORTAL - DASHBOARD
// /institution/dashboard
// ============================================

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, LogOut, Plus, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { institutionFetch } from '@/lib/institutionAuth'

type Institution = {
  id: string
  name: string
  city?: string
  website_url?: string
  email?: string
  phone?: string
  description?: string
  logo_url?: string
  cover_image_url?: string
}

type Program = {
  id: string
  name: string
  level?: string
  duration_months?: number
  tuition_fees?: number
  currency?: string
  description?: string
  is_active: boolean
}

const PROFILE_FIELDS: { key: keyof Institution; label: string }[] = [
  { key: 'description', label: 'Description' },
  { key: 'city', label: 'City' },
  { key: 'website_url', label: 'Website URL' },
  { key: 'email', label: 'Contact email' },
  { key: 'phone', label: 'Phone' },
  { key: 'logo_url', label: 'Logo URL' },
  { key: 'cover_image_url', label: 'Cover image URL' },
]

const emptyProgramForm = { name: '', level: '', duration_months: '', tuition_fees: '', currency: 'KES', description: '' }

export default function InstitutionDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [pending, setPending] = useState(false)
  const [institution, setInstitution] = useState<Institution | null>(null)
  const [tab, setTab] = useState<'profile' | 'programs' | 'analytics'>('profile')

  const [profileForm, setProfileForm] = useState<Record<string, string>>({})
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')

  const [programs, setPrograms] = useState<Program[]>([])
  const [programForm, setProgramForm] = useState(emptyProgramForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [savingProgram, setSavingProgram] = useState(false)
  const [programMsg, setProgramMsg] = useState('')

  const [analytics, setAnalytics] = useState<any>(null)

  const loadPrograms = useCallback(async () => {
    const res = await institutionFetch('/api/institution-portal/programs')
    setPrograms(res.data || [])
  }, [])

  useEffect(() => {
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/institution/login')
        return
      }
      try {
        const res = await institutionFetch('/api/institution-portal/profile')
        const inst = res.data?.institution
        setInstitution(inst)
        const form: Record<string, string> = {}
        for (const f of PROFILE_FIELDS) form[f.key] = (inst?.[f.key] as string) || ''
        setProfileForm(form)
        await loadPrograms()
        const a = await institutionFetch('/api/institution-portal/analytics')
        setAnalytics(a.data)
      } catch (err: any) {
        if (err.status === 403) {
          setPending(true)
        } else {
          setPageError(err.message || 'Failed to load your institution.')
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [router, loadPrograms])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/institution/login')
  }

  const saveProfile = async () => {
    setSavingProfile(true)
    setProfileMsg('')
    try {
      const res = await institutionFetch('/api/institution-portal/institution', {
        method: 'PUT',
        body: JSON.stringify(profileForm),
      })
      setInstitution(res.data)
      setProfileMsg('Profile saved.')
    } catch (err: any) {
      setProfileMsg(err.message || 'Save failed.')
    } finally {
      setSavingProfile(false)
    }
  }

  const submitProgram = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProgram(true)
    setProgramMsg('')
    const body = {
      name: programForm.name,
      level: programForm.level || undefined,
      duration_months: programForm.duration_months ? Number(programForm.duration_months) : undefined,
      tuition_fees: programForm.tuition_fees ? Number(programForm.tuition_fees) : undefined,
      currency: programForm.currency || 'KES',
      description: programForm.description || undefined,
    }
    try {
      if (editingId) {
        await institutionFetch(`/api/institution-portal/programs/${editingId}`, { method: 'PUT', body: JSON.stringify(body) })
        setProgramMsg('Program updated.')
      } else {
        await institutionFetch('/api/institution-portal/programs', { method: 'POST', body: JSON.stringify(body) })
        setProgramMsg('Program added.')
      }
      setProgramForm(emptyProgramForm)
      setEditingId(null)
      await loadPrograms()
    } catch (err: any) {
      setProgramMsg(err.message || 'Save failed.')
    } finally {
      setSavingProgram(false)
    }
  }

  const editProgram = (p: Program) => {
    setEditingId(p.id)
    setProgramForm({
      name: p.name || '',
      level: p.level || '',
      duration_months: p.duration_months ? String(p.duration_months) : '',
      tuition_fees: p.tuition_fees ? String(p.tuition_fees) : '',
      currency: p.currency || 'KES',
      description: p.description || '',
    })
  }

  const removeProgram = async (p: Program) => {
    if (!window.confirm(`Remove "${p.name}"? It will be hidden from students.`)) return
    await institutionFetch(`/api/institution-portal/programs/${p.id}`, { method: 'DELETE' })
    await loadPrograms()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-elimux-dark flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (pending) {
    return (
      <div className="min-h-screen bg-elimux-dark py-12 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-elimux-card rounded-xl border border-border p-8 text-center">
          <Building2 className="w-10 h-10 text-elimux-warning mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Claim pending approval</h1>
          <p className="text-muted text-sm mb-6">Your institution claim is being reviewed by the ElimuX team. You will get full access once approved.</p>
          <button onClick={signOut} className="text-sm text-primary-400 hover:text-primary-300">Sign out</button>
        </div>
      </div>
    )
  }

  if (pageError || !institution) {
    return (
      <div className="min-h-screen bg-elimux-dark py-12 px-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-elimux-card rounded-xl border border-border p-8 text-center">
          <p className="text-elimux-danger mb-4">{pageError || 'No institution account found.'}</p>
          <button onClick={signOut} className="text-sm text-primary-400 hover:text-primary-300">Sign out</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-elimux-dark py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Building2 className="w-8 h-8 text-primary-400" />
              {institution.name}
            </h1>
            <p className="text-muted text-sm mt-1">Institution Portal</p>
          </div>
          <button onClick={signOut} className="flex items-center gap-2 text-sm text-muted hover:text-foreground">
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          {(['profile', 'programs', 'analytics'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${tab === t ? 'bg-primary-600 text-elimux-dark' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'profile' && (
          <div className="bg-elimux-card rounded-xl border border-border p-6 space-y-5">
            <h2 className="text-lg font-semibold text-foreground">Public profile</h2>
            <p className="text-muted text-sm">These fields appear on your public institution page. Name and institution type are managed by ElimuX — contact support to change them.</p>
            {PROFILE_FIELDS.map((f) => (
              <div key={f.key}>
                <label className="text-sm text-muted mb-1 block">{f.label}</label>
                {f.key === 'description' ? (
                  <textarea
                    rows={4}
                    value={profileForm[f.key] || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, [f.key]: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                  />
                ) : (
                  <input
                    type="text"
                    value={profileForm[f.key] || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, [f.key]: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500"
                  />
                )}
              </div>
            ))}
            <div className="flex items-center gap-4">
              <button
                onClick={saveProfile}
                disabled={savingProfile}
                className="px-6 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-elimux-dark font-semibold disabled:opacity-50"
              >
                {savingProfile ? 'Saving...' : 'Save profile'}
              </button>
              {profileMsg && <span className="text-sm text-muted">{profileMsg}</span>}
            </div>
          </div>
        )}

        {tab === 'programs' && (
          <div className="space-y-6">
            <div className="bg-elimux-card rounded-xl border border-border overflow-hidden overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-elimux-dark text-muted text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Level</th>
                    <th className="px-4 py-3 font-medium">Duration</th>
                    <th className="px-4 py-3 font-medium">Fees</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {programs.map((p) => (
                    <tr key={p.id} className="border-t border-border">
                      <td className="px-4 py-3 text-foreground">{p.name}</td>
                      <td className="px-4 py-3 text-muted">{p.level || '—'}</td>
                      <td className="px-4 py-3 text-muted">{p.duration_months ? `${p.duration_months} mo` : '—'}</td>
                      <td className="px-4 py-3 text-muted">{p.tuition_fees ? `${p.currency || 'KES'} ${Number(p.tuition_fees).toLocaleString()}` : '—'}</td>
                      <td className="px-4 py-3">
                        <span className={p.is_active ? 'text-elimux-success' : 'text-elimux-danger'}>
                          {p.is_active ? 'active' : 'hidden'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => editProgram(p)} className="p-1.5 rounded bg-white/10 hover:bg-white/20" title="Edit">
                            <Pencil className="w-3.5 h-3.5 text-foreground" />
                          </button>
                          <button onClick={() => removeProgram(p)} className="p-1.5 rounded bg-elimux-danger/20 hover:bg-elimux-danger/30" title="Remove">
                            <Trash2 className="w-3.5 h-3.5 text-elimux-danger" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {programs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted">No programs yet — add your first one below.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <form onSubmit={submitProgram} className="bg-elimux-card rounded-xl border border-border p-6 space-y-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary-400" />
                {editingId ? 'Edit program' : 'Add program'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted mb-1 block">Name *</label>
                  <input required type="text" value={programForm.name} onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })} className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500" />
                </div>
                <div>
                  <label className="text-sm text-muted mb-1 block">Level</label>
                  <input type="text" placeholder="e.g. Certificate, Diploma, Bachelor" value={programForm.level} onChange={(e) => setProgramForm({ ...programForm, level: e.target.value })} className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500" />
                </div>
                <div>
                  <label className="text-sm text-muted mb-1 block">Duration (months)</label>
                  <input type="number" min="1" value={programForm.duration_months} onChange={(e) => setProgramForm({ ...programForm, duration_months: e.target.value })} className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500" />
                </div>
                <div>
                  <label className="text-sm text-muted mb-1 block">Tuition fees</label>
                  <input type="number" min="0" value={programForm.tuition_fees} onChange={(e) => setProgramForm({ ...programForm, tuition_fees: e.target.value })} className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500" />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted mb-1 block">Description</label>
                <textarea rows={3} value={programForm.description} onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })} className="w-full px-4 py-2 rounded-lg bg-elimux-dark border border-border text-foreground focus:outline-none focus:border-primary-500" />
              </div>
              <div className="flex items-center gap-4">
                <button type="submit" disabled={savingProgram} className="px-6 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-elimux-dark font-semibold disabled:opacity-50">
                  {savingProgram ? 'Saving...' : editingId ? 'Update program' : 'Add program'}
                </button>
                {editingId && (
                  <button type="button" onClick={() => { setEditingId(null); setProgramForm(emptyProgramForm) }} className="text-sm text-muted hover:text-foreground">
                    Cancel edit
                  </button>
                )}
                {programMsg && <span className="text-sm text-muted">{programMsg}</span>}
              </div>
            </form>
          </div>
        )}

        {tab === 'analytics' && (
          <div className="space-y-6">
            {!analytics ? (
              <p className="text-muted">Loading analytics...</p>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-elimux-card rounded-xl border border-border p-5">
                    <p className="text-sm text-muted mb-1">Profile views (30d)</p>
                    <p className="text-2xl font-bold text-foreground">{analytics.total_views}</p>
                  </div>
                  <div className="bg-elimux-card rounded-xl border border-border p-5">
                    <p className="text-sm text-muted mb-1">Applications (30d)</p>
                    <p className="text-2xl font-bold text-foreground">{analytics.total_applications}</p>
                  </div>
                  <div className="bg-elimux-card rounded-xl border border-border p-5">
                    <p className="text-sm text-muted mb-1">Conversion</p>
                    <p className="text-2xl font-bold text-foreground">{analytics.conversion_rate}%</p>
                  </div>
                  <div className="bg-elimux-card rounded-xl border border-border p-5">
                    <p className="text-sm text-muted mb-1">Reviews</p>
                    <p className="text-2xl font-bold text-foreground">{analytics.avg_rating > 0 ? `${analytics.avg_rating} ★ (${analytics.review_count})` : analytics.review_count}</p>
                  </div>
                </div>

                <div className="bg-elimux-card rounded-xl border border-border p-6">
                  <h2 className="text-sm font-medium text-foreground mb-4">Views trend (30 days)</h2>
                  {analytics.views_trend.length === 0 ? (
                    <p className="text-muted text-sm">No views recorded yet.</p>
                  ) : (
                    <div className="flex items-end gap-1 h-32">
                      {analytics.views_trend.map((d: any) => {
                        const max = Math.max(...analytics.views_trend.map((x: any) => x.count), 1)
                        return (
                          <div key={d.date} className="flex-1 bg-primary-600/70 rounded-t" style={{ height: `${(d.count / max) * 100}%` }} title={`${d.date}: ${d.count} views`} />
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-elimux-card rounded-xl border border-border p-6">
                    <h2 className="text-sm font-medium text-foreground mb-4">Top programs by views</h2>
                    {analytics.top_programs.length === 0 ? (
                      <p className="text-muted text-sm">No program views yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {analytics.top_programs.map((p: any) => (
                          <div key={p.program_id} className="flex justify-between text-sm">
                            <span className="text-foreground truncate mr-4">{p.name}</span>
                            <span className="text-muted shrink-0">{p.views}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="bg-elimux-card rounded-xl border border-border p-6">
                    <h2 className="text-sm font-medium text-foreground mb-4">Where interest comes from</h2>
                    {analytics.regional_interest.length === 0 ? (
                      <p className="text-muted text-sm">No data yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {analytics.regional_interest.map((r: any) => (
                          <div key={r.country} className="flex justify-between text-sm">
                            <span className="text-foreground">{r.country}</span>
                            <span className="text-muted">{r.count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
