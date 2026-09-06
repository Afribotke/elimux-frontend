'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useAdminKey } from '@/components/admin/AdminKeyContext'
import { useCRMActingUser } from '@/components/crm/CRMActingUserContext'
import {
  getCRMTemplates,
  sendMessage,
  type CRMContact,
  type CRMMessageTemplate,
} from '@/lib/crm-api'
import { Mail, MessageSquare, AlertTriangle, X, Loader2, Send } from 'lucide-react'

interface SendMessageModalProps {
  contact: CRMContact
  onClose: () => void
  onSent?: () => void
}

// Same variable set the backend actually substitutes (see sendEmail/sendSms/
// send routes in crm.ts) - mirrored here for an accurate preview, not
// re-derived from scratch.
function renderPreview(body: string, contact: CRMContact, repName: string): string {
  const variables: Record<string, string> = {
    contact_name: contact.name,
    person_name: 'Sir/Madam',
    county: contact.county || 'your county',
    slug: contact.slug || '',
    assigned_rep_name: repName || 'ElimuX Team',
    elimux_url: 'https://www.elimux.ke',
  }
  let result = body
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value)
  }
  return result
}

function resolveChannel(contact: CRMContact, template: CRMMessageTemplate | null): { channel: 'email' | 'sms' | 'none'; reason: string } {
  if (!template) return { channel: 'none', reason: 'Select a template' }
  if (template.channel_email && contact.email && !contact.unsubscribed_email) {
    return { channel: 'email', reason: contact.email }
  }
  if (template.channel_sms && contact.phone && !contact.unsubscribed_sms) {
    return { channel: 'sms', reason: contact.phone }
  }
  return { channel: 'none', reason: 'Contact has no email or phone this template can use — needs enrichment' }
}

export function SendMessageModal({ contact, onClose, onSent }: SendMessageModalProps) {
  const { adminKey } = useAdminKey()
  const { actingUserId } = useCRMActingUser()
  const [templates, setTemplates] = useState<CRMMessageTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [templateId, setTemplateId] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!adminKey) return
    getCRMTemplates(adminKey, contact.entity_type)
      .then(setTemplates)
      .catch((err) => toast.error(err.message || 'Failed to load templates'))
      .finally(() => setLoading(false))
  }, [adminKey, contact.entity_type])

  const template = useMemo(() => templates.find((t) => t.id === templateId) || null, [templates, templateId])
  const { channel, reason } = resolveChannel(contact, template)

  const previewSubject = template?.subject_email ? renderPreview(template.subject_email, contact, 'ElimuX Team') : null
  const previewBody =
    channel === 'sms'
      ? template?.body_sms
        ? renderPreview(template.body_sms, contact, 'ElimuX Team')
        : null
      : template?.body_html
        ? renderPreview(template.body_html, contact, 'ElimuX Team')
        : null

  async function handleSend() {
    if (!adminKey || !template) return
    if (!actingUserId) {
      toast.error('Select who you are acting as first (top of the CRM section)')
      return
    }
    setSending(true)
    try {
      const result = await sendMessage(adminKey, {
        contact_id: contact.id,
        template_id: template.id,
        sent_by: actingUserId,
        base_url: 'https://www.elimux.ke',
      })
      if (result.success) {
        toast.success(`Sent via ${result.channel || 'unknown channel'}`)
        onSent?.()
        onClose()
      } else if (result.needs_enrichment) {
        toast.error('Contact needs enrichment before it can be reached')
      } else {
        toast.error(result.error || 'Send failed')
      }
    } catch (err: any) {
      toast.error(err.message || 'Send failed')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="rounded-xl border border-border bg-card p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Send message to {contact.name}</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : templates.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No templates available for entity type &quot;{contact.entity_type}&quot;.</p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Template</label>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">— choose a template —</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {template && (
              <>
                <div
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                    channel === 'email'
                      ? 'bg-blue-50 text-blue-700'
                      : channel === 'sms'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {channel === 'email' && <Mail className="h-4 w-4 shrink-0" />}
                  {channel === 'sms' && <MessageSquare className="h-4 w-4 shrink-0" />}
                  {channel === 'none' && <AlertTriangle className="h-4 w-4 shrink-0" />}
                  <span>
                    {channel === 'email' && `Will send by Email to ${reason}`}
                    {channel === 'sms' && `Will send by SMS to ${reason}`}
                    {channel === 'none' && reason}
                  </span>
                </div>

                {previewBody && (
                  <div className="rounded-lg border border-border p-3 bg-muted/30 text-sm space-y-2">
                    {previewSubject && (
                      <p className="font-medium">{previewSubject}</p>
                    )}
                    {channel === 'email' ? (
                      <div
                        className="text-muted-foreground max-h-48 overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: previewBody }}
                      />
                    ) : (
                      <div className="text-muted-foreground max-h-48 overflow-y-auto whitespace-pre-wrap">
                        {previewBody}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={onClose} className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-accent">
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={!template || channel === 'none' || sending}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
