'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAdminKey } from '@/components/admin/AdminKeyContext'
import { useCRMActingUser } from '@/components/crm/CRMActingUserContext'
import {
  getCRMTemplates,
  createTemplate,
  updateTemplate,
  type CRMMessageTemplate,
  type TemplateInput,
} from '@/lib/crm-api'
import { ArrowLeft, Loader2, Plus, Mail, MessageSquare, Edit2 } from 'lucide-react'

const CATEGORIES = ['onboarding', 'followup', 'reminder', 'negotiation', 're_engagement', 'announcement', 'custom']
const ENTITY_TYPES = ['university', 'school_public', 'school_private', 'company', 'government', 'partner', 'other']

const SAMPLE_VARIABLES: Record<string, string> = {
  contact_name: 'Kenyatta University',
  person_name: 'Jane Doe',
  county: 'Nairobi',
  slug: 'kenyatta-university',
  assigned_rep_name: 'ElimuX Team',
  elimux_url: 'https://www.elimux.ke',
}

function renderPreview(body: string): string {
  let result = body
  for (const [key, value] of Object.entries(SAMPLE_VARIABLES)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value)
  }
  return result
}

const emptyForm: TemplateInput = {
  name: '', category: 'custom', channel_email: true, subject_email: '', body_html: '',
  channel_sms: false, body_sms: '', channel_whatsapp: false, body_whatsapp: '', target_entity_types: [],
}

export default function CRMTemplatesPage() {
  const { adminKey } = useAdminKey()
  const { actingUserId } = useCRMActingUser()
  const [templates, setTemplates] = useState<CRMMessageTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<CRMMessageTemplate | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<TemplateInput>(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!adminKey) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKey])

  async function load() {
    setLoading(true)
    try {
      const data = await getCRMTemplates(adminKey)
      setTemplates(data)
    } catch (err: any) {
      toast.error(err.message || 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  function openEdit(t: CRMMessageTemplate) {
    setEditing(t)
    setForm({
      name: t.name,
      category: t.category,
      channel_email: t.channel_email,
      subject_email: t.subject_email || '',
      body_html: t.body_html || '',
      channel_sms: t.channel_sms,
      body_sms: t.body_sms || '',
      channel_whatsapp: t.channel_whatsapp,
      body_whatsapp: t.body_whatsapp || '',
      target_entity_types: t.target_entity_types || [],
    })
  }

  function openCreate() {
    setForm(emptyForm)
    setCreating(true)
  }

  function toggleTargetType(type: string) {
    const current = form.target_entity_types || []
    setForm({
      ...form,
      target_entity_types: current.includes(type as any)
        ? current.filter((t) => t !== type)
        : [...current, type as any],
    })
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('Name is required')
      return
    }
    setSaving(true)
    try {
      if (editing) {
        await updateTemplate(adminKey, editing.id, form)
        toast.success('Template updated')
      } else {
        await createTemplate(adminKey, { ...form, created_by: actingUserId || undefined })
        toast.success('Template created')
      }
      setEditing(null)
      setCreating(false)
      load()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  if (!adminKey) {
    return <div className="flex h-96 items-center justify-center text-sm text-muted-foreground">Admin key required</div>
  }

  const showForm = editing || creating

  return (
    <div className="space-y-6">
      <Link href="/admin/crm" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />Back to contacts
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Message Templates</h1>
          <p className="text-sm text-muted-foreground">Manage email, SMS, and WhatsApp templates.</p>
        </div>
        <button onClick={openCreate} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5">
          <Plus className="h-4 w-4" />New Template
        </button>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : templates.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">No templates yet.</div>
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Category</th>
                <th className="px-4 py-3 text-left font-medium">Channels</th>
                <th className="px-4 py-3 text-left font-medium">Usage</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{t.category.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {t.channel_email && <Mail className="h-4 w-4 text-blue-500" aria-label="Email" />}
                      {t.channel_sms && <MessageSquare className="h-4 w-4 text-green-500" aria-label="SMS" />}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{t.usage_count}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(t)} className="p-1.5 rounded-md hover:bg-accent">
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="rounded-xl border border-border bg-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <h3 className="font-semibold text-lg">{editing ? `Edit ${editing.name}` : 'New Template'}</h3>

            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Template name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
              </select>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Target entity types (leave empty for all)</p>
              <div className="flex flex-wrap gap-2">
                {ENTITY_TYPES.map((type) => (
                  <label key={type} className="flex items-center gap-1.5 text-xs rounded-full border border-border px-2.5 py-1 cursor-pointer">
                    <input type="checkbox" checked={(form.target_entity_types || []).includes(type as any)} onChange={() => toggleTargetType(type)} />
                    {type.replace(/_/g, ' ')}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2 rounded-lg border border-border p-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={!!form.channel_email} onChange={(e) => setForm({ ...form, channel_email: e.target.checked })} />
                <Mail className="h-4 w-4" />Email
              </label>
              {form.channel_email && (
                <>
                  <input placeholder="Subject" value={form.subject_email} onChange={(e) => setForm({ ...form, subject_email: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
                  <textarea placeholder="Body (HTML, supports {{variables}})" value={form.body_html} onChange={(e) => setForm({ ...form, body_html: e.target.value })} rows={5} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono text-xs" />
                  {form.body_html && (
                    <div className="rounded-md bg-muted/30 p-2 text-xs">
                      <p className="text-muted-foreground mb-1">Preview:</p>
                      <div dangerouslySetInnerHTML={{ __html: renderPreview(form.body_html) }} />
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="space-y-2 rounded-lg border border-border p-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={!!form.channel_sms} onChange={(e) => setForm({ ...form, channel_sms: e.target.checked })} />
                <MessageSquare className="h-4 w-4" />SMS
              </label>
              {form.channel_sms && (
                <>
                  <textarea placeholder="SMS body (supports {{variables}})" value={form.body_sms} onChange={(e) => setForm({ ...form, body_sms: e.target.value })} rows={3} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
                  {form.body_sms && (
                    <div className="rounded-md bg-muted/30 p-2 text-xs">
                      <p className="text-muted-foreground mb-1">Preview:</p>
                      <p className="whitespace-pre-wrap">{renderPreview(form.body_sms)}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Variables: {'{{contact_name}}'}, {'{{person_name}}'}, {'{{county}}'}, {'{{assigned_rep_name}}'}, {'{{elimux_url}}'}
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => { setEditing(null); setCreating(false) }} className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-accent">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
