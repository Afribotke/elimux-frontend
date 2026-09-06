'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAdminKey } from '@/components/admin/AdminKeyContext'
import { useCRMActingUser } from '@/components/crm/CRMActingUserContext'
import { SendMessageModal } from '@/components/crm/SendMessageModal'
import {
  getCRMContact,
  enrichContact,
  addContactPerson,
  removeContactPerson,
  getCRMActivities,
  type CRMContact,
  type CRMContactPerson,
  type CRMMessage,
  type CRMActivity,
} from '@/lib/crm-api'
import {
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Send,
  Plus,
  Trash2,
  Star,
  ShieldCheck,
  Clock,
  MessageSquare,
} from 'lucide-react'

const emptyPersonForm = { name: '', title: '', email: '', phone: '', whatsapp: '', is_primary: false, is_decision_maker: false, notes: '' }

export default function CRMContactDetailPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { adminKey } = useAdminKey()
  const { actingUserId } = useCRMActingUser()

  const [contact, setContact] = useState<CRMContact | null>(null)
  const [people, setPeople] = useState<CRMContactPerson[]>([])
  const [messages, setMessages] = useState<CRMMessage[]>([])
  const [activities, setActivities] = useState<CRMActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [showEnrich, setShowEnrich] = useState(searchParams.get('enrich') === '1')
  const [enrichForm, setEnrichForm] = useState({ email: '', phone: '', whatsapp_number: '', website: '', county: '', constituency: '', town: '', notes: '' })
  const [savingEnrich, setSavingEnrich] = useState(false)

  const [showAddPerson, setShowAddPerson] = useState(false)
  const [personForm, setPersonForm] = useState(emptyPersonForm)
  const [savingPerson, setSavingPerson] = useState(false)

  const [showSend, setShowSend] = useState(false)

  useEffect(() => {
    if (!adminKey || !id) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKey, id])

  async function load() {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await getCRMContact(adminKey, id)
      setContact(res.contact)
      setPeople(res.people)
      setMessages(res.messages)
      setEnrichForm({
        email: res.contact.email || '',
        phone: res.contact.phone || '',
        whatsapp_number: res.contact.whatsapp_number || '',
        website: res.contact.website || '',
        county: res.contact.county || '',
        constituency: res.contact.constituency || '',
        town: res.contact.town || '',
        notes: res.contact.notes || '',
      })
      const activityRes = await getCRMActivities(adminKey, { entity_id: id, limit: 30 })
      setActivities(activityRes.data)
    } catch (err: any) {
      setLoadError(err.message || 'Failed to load contact')
      toast.error(err.message || 'Failed to load contact')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveEnrich() {
    setSavingEnrich(true)
    try {
      await enrichContact(adminKey, id, { ...enrichForm, updated_by: actingUserId || undefined })
      toast.success('Contact updated')
      setShowEnrich(false)
      load()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update contact')
    } finally {
      setSavingEnrich(false)
    }
  }

  async function handleAddPerson() {
    if (!personForm.name.trim()) {
      toast.error('Name is required')
      return
    }
    setSavingPerson(true)
    try {
      await addContactPerson(adminKey, id, { ...personForm, created_by: actingUserId || undefined })
      toast.success('Person added')
      setPersonForm(emptyPersonForm)
      setShowAddPerson(false)
      load()
    } catch (err: any) {
      toast.error(err.message || 'Failed to add person')
    } finally {
      setSavingPerson(false)
    }
  }

  async function handleRemovePerson(personId: string) {
    try {
      await removeContactPerson(adminKey, personId)
      toast.success('Person removed')
      load()
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove person')
    }
  }

  if (!adminKey) {
    return <div className="flex h-96 items-center justify-center text-sm text-muted-foreground">Admin key required</div>
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  }

  if (loadError || !contact) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-sm text-red-500">
        <p>Failed to load: {loadError}</p>
        <button onClick={load} className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent">Retry</button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <button onClick={() => router.push('/admin/crm')} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />Back to contacts
      </button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{contact.name}</h1>
          <p className="text-sm text-muted-foreground capitalize">
            {contact.entity_type.replace(/_/g, ' ')}
            {contact.country_relevance && ` · ${contact.country_relevance}`}
            {contact.county && ` · ${contact.county}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowEnrich(true)} className="rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-accent">
            Enrich
          </button>
          <button
            onClick={() => setShowSend(true)}
            disabled={!contact.email && !contact.phone}
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
          >
            <Send className="h-4 w-4" />Send Message
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Contact details card */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h2 className="font-semibold">Contact Details</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                {contact.email ? <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">{contact.email}</a> : <span className="text-muted-foreground">No email</span>}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                {contact.phone ? <span>{contact.phone}</span> : <span className="text-muted-foreground">No phone</span>}
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                {contact.website ? <a href={contact.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">{contact.website}</a> : <span className="text-muted-foreground">No website</span>}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{[contact.town, contact.constituency, contact.county].filter(Boolean).join(', ') || 'No location'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span> <span className="capitalize font-medium">{contact.status}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Priority:</span> <span className="capitalize font-medium">{contact.priority}</span>
              </div>
            </div>
            {contact.notes && (
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p className="text-sm">{contact.notes}</p>
              </div>
            )}
            {contact.tags && contact.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2">
                {contact.tags.map((t) => (
                  <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-xs">{t}</span>
                ))}
              </div>
            )}
          </div>

          {/* Key people */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Key People</h2>
              <button onClick={() => setShowAddPerson((v) => !v)} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                <Plus className="h-3.5 w-3.5" />Add Person
              </button>
            </div>

            {showAddPerson && (
              <div className="rounded-lg border border-border p-3 space-y-2 bg-muted/20">
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="Name *" value={personForm.name} onChange={(e) => setPersonForm({ ...personForm, name: e.target.value })} className="rounded-md border border-border bg-background px-2 py-1.5 text-sm" />
                  <input placeholder="Title" value={personForm.title} onChange={(e) => setPersonForm({ ...personForm, title: e.target.value })} className="rounded-md border border-border bg-background px-2 py-1.5 text-sm" />
                  <input placeholder="Email" value={personForm.email} onChange={(e) => setPersonForm({ ...personForm, email: e.target.value })} className="rounded-md border border-border bg-background px-2 py-1.5 text-sm" />
                  <input placeholder="Phone" value={personForm.phone} onChange={(e) => setPersonForm({ ...personForm, phone: e.target.value })} className="rounded-md border border-border bg-background px-2 py-1.5 text-sm" />
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5"><input type="checkbox" checked={personForm.is_primary} onChange={(e) => setPersonForm({ ...personForm, is_primary: e.target.checked })} />Primary contact</label>
                  <label className="flex items-center gap-1.5"><input type="checkbox" checked={personForm.is_decision_maker} onChange={(e) => setPersonForm({ ...personForm, is_decision_maker: e.target.checked })} />Decision maker</label>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowAddPerson(false)} className="px-3 py-1.5 rounded-md border border-border text-xs">Cancel</button>
                  <button onClick={handleAddPerson} disabled={savingPerson} className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs disabled:opacity-50">
                    {savingPerson ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            )}

            {people.length === 0 ? (
              <p className="text-sm text-muted-foreground">No key people added yet.</p>
            ) : (
              <div className="space-y-2">
                {people.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-border p-2.5 text-sm">
                    <div>
                      <p className="font-medium flex items-center gap-1.5">
                        {p.name}
                        {p.is_primary && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                        {p.is_decision_maker && <ShieldCheck className="h-3 w-3 text-blue-500" />}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[p.title, p.email, p.phone].filter(Boolean).join(' · ') || 'No details'}
                      </p>
                    </div>
                    <button onClick={() => handleRemovePerson(p.id)} className="p-1.5 rounded-md hover:bg-red-50 text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message history */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h2 className="font-semibold">Message History</h2>
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No messages sent yet.</p>
            ) : (
              <div className="space-y-2">
                {messages.map((m) => (
                  <div key={m.id} className="flex items-start gap-3 rounded-lg border border-border p-2.5 text-sm">
                    <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium capitalize">{m.channel} — {m.subject || m.body?.slice(0, 60)}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.status}{m.opened_at ? ' · opened' : ''}{m.clicked_at ? ' · clicked' : ''}{m.replied_at ? ' · replied' : ''} · {new Date(m.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Activity log */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3 h-fit">
          <h2 className="font-semibold">Activity Log</h2>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {activities.map((a) => (
                <div key={a.id} className="flex items-start gap-2 text-sm">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1" />
                  <div>
                    <p className="capitalize">{a.action.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.user?.name || a.user?.email || 'System'} · {new Date(a.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showEnrich && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="rounded-xl border border-border bg-card p-6 w-full max-w-md space-y-3">
            <h3 className="font-semibold text-lg">Enrich {contact.name}</h3>
            <input placeholder="Email" value={enrichForm.email} onChange={(e) => setEnrichForm({ ...enrichForm, email: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <input placeholder="Phone" value={enrichForm.phone} onChange={(e) => setEnrichForm({ ...enrichForm, phone: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <input placeholder="WhatsApp" value={enrichForm.whatsapp_number} onChange={(e) => setEnrichForm({ ...enrichForm, whatsapp_number: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <input placeholder="Website" value={enrichForm.website} onChange={(e) => setEnrichForm({ ...enrichForm, website: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
            <div className="grid grid-cols-3 gap-2">
              <input placeholder="County" value={enrichForm.county} onChange={(e) => setEnrichForm({ ...enrichForm, county: e.target.value })} className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <input placeholder="Constituency" value={enrichForm.constituency} onChange={(e) => setEnrichForm({ ...enrichForm, constituency: e.target.value })} className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <input placeholder="Town" value={enrichForm.town} onChange={(e) => setEnrichForm({ ...enrichForm, town: e.target.value })} className="rounded-md border border-border bg-background px-3 py-2 text-sm" />
            </div>
            <textarea placeholder="Notes" value={enrichForm.notes} onChange={(e) => setEnrichForm({ ...enrichForm, notes: e.target.value })} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" rows={3} />
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setShowEnrich(false)} className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-accent">Cancel</button>
              <button onClick={handleSaveEnrich} disabled={savingEnrich} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                {savingEnrich ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSend && (
        <SendMessageModal contact={contact} onClose={() => setShowSend(false)} onSent={load} />
      )}
    </div>
  )
}
