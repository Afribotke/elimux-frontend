// Typed client for elimux-backend's /api/crm/* routes (src/routes/crm.ts).
// Follows the same request/adminKey pattern as src/lib/api.ts, kept separate
// per the brief's own file layout rather than merged into that file.

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

export type CRMEntityType = 'university' | 'school_public' | 'school_private' | 'company' | 'government' | 'partner' | 'other'
export type CRMStatus = 'new' | 'contacted' | 'responded' | 'negotiating' | 'onboarded' | 'active' | 'dormant' | 'rejected' | 'blacklisted'
export type CRMPriority = 'low' | 'medium' | 'high'
export type CRMCountryRelevance = 'kenya' | 'foreign' | 'unknown'
export type CRMTeamRole = 'super_admin' | 'manager' | 'sales_rep' | 'viewer'

export interface CRMContact {
  id: string
  entity_type: CRMEntityType
  name: string
  slug?: string
  linked_institution_id?: string
  country?: string
  county?: string
  constituency?: string
  town?: string
  email?: string | null
  phone?: string | null
  whatsapp_number?: string | null
  website?: string | null
  status: CRMStatus
  priority: CRMPriority
  country_relevance?: CRMCountryRelevance
  assigned_to?: string | null
  assigned_by?: string | null
  assigned_at?: string | null
  last_contact_at?: string | null
  last_contact_via?: string | null
  contact_count: number
  response_count: number
  source: string
  notes?: string | null
  tags?: string[] | null
  enriched_at?: string | null
  scrape_attempted_at?: string | null
  unsubscribed_email: boolean
  unsubscribed_sms: boolean
  unsubscribed_whatsapp: boolean
  created_at: string
  updated_at: string
}

export interface CRMContactPerson {
  id: string
  contact_id: string
  name: string
  title?: string | null
  email?: string | null
  phone?: string | null
  whatsapp?: string | null
  is_primary?: boolean
  is_decision_maker?: boolean
  notes?: string | null
  created_at: string
}

export interface CRMMessageTemplate {
  id: string
  name: string
  category: string
  channel_email: boolean
  subject_email?: string | null
  body_html?: string | null
  body_text?: string | null
  channel_sms: boolean
  body_sms?: string | null
  channel_whatsapp: boolean
  body_whatsapp?: string | null
  target_entity_types?: CRMEntityType[] | null
  is_active: boolean
  usage_count: number
  created_at: string
  updated_at: string
}

export interface CRMMessage {
  id: string
  contact_id: string
  person_id?: string | null
  template_id?: string | null
  channel: 'email' | 'sms' | 'whatsapp'
  subject?: string | null
  body: string
  status: string
  provider?: string | null
  sent_at?: string | null
  delivered_at?: string | null
  opened_at?: string | null
  clicked_at?: string | null
  replied_at?: string | null
  failed_at?: string | null
  fail_reason?: string | null
  created_at: string
}

export interface CRMActivity {
  id: string
  user_id?: string | null
  action: string
  entity_type: string
  entity_id?: string | null
  metadata?: Record<string, unknown>
  created_at: string
  user?: { email?: string; name?: string } | null
}

export interface CRMTeamMember {
  id: string
  user_id: string
  role: CRMTeamRole
  reports_to?: string | null
  county_scope?: string[] | null
  entity_type_scope?: CRMEntityType[] | null
  is_active: boolean
  created_at: string
  user?: { id: string; email?: string; name?: string; user_role?: string } | null
}

export interface CRMListMeta {
  page: number
  limit: number
  total: number
  pages: number
}

async function request<T>(path: string, options: RequestInit = {}, adminKey?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }
  if (adminKey) headers['x-admin-key'] = adminKey

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })
  const json = await res.json().catch(() => null)

  if (!res.ok) {
    if (res.status === 403 || res.status === 401) throw new Error('Invalid admin key')
    if (res.status === 404) throw new Error(json?.error || 'Not found')
    throw new Error(json?.error || json?.details || `Request failed (${res.status})`)
  }

  return json as T
}

function buildQuery<T extends object>(params: T): string {
  const qs = new URLSearchParams()
  Object.entries(params as Record<string, string | number | undefined>).forEach(([key, value]) => {
    if (value !== undefined && value !== '') qs.set(key, String(value))
  })
  const query = qs.toString()
  return query ? `?${query}` : ''
}

// ── Contacts ──────────────────────────────────────────────

export interface ContactFilters {
  entity_type?: string
  status?: string
  county?: string
  assigned_to?: string
  country_relevance?: string
  search?: string
  page?: number
  limit?: number
}

export async function getCRMContacts(adminKey: string, filters: ContactFilters = {}) {
  return request<{ data: CRMContact[]; meta: CRMListMeta }>(
    `/api/crm/contacts${buildQuery(filters)}`,
    {},
    adminKey
  )
}

export async function getCRMContact(adminKey: string, id: string) {
  return request<{ contact: CRMContact; people: CRMContactPerson[]; messages: CRMMessage[] }>(
    `/api/crm/contacts/${id}`,
    {},
    adminKey
  )
}

export async function enrichContact(
  adminKey: string,
  id: string,
  data: {
    email?: string
    phone?: string
    whatsapp_number?: string
    website?: string
    county?: string
    constituency?: string
    town?: string
    notes?: string
    updated_by?: string
  }
) {
  return request<CRMContact>(`/api/crm/contacts/${id}/enrich`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }, adminKey)
}

export async function updateContact(adminKey: string, id: string, updates: Record<string, unknown>) {
  return request<CRMContact>(`/api/crm/contacts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  }, adminKey)
}

export async function assignContact(adminKey: string, id: string, assignedTo: string, assignedBy?: string) {
  return request<CRMContact>(`/api/crm/contacts/${id}/assign`, {
    method: 'PATCH',
    body: JSON.stringify({ assigned_to: assignedTo, assigned_by: assignedBy }),
  }, adminKey)
}

export async function getContactsNeedingEnrichment(adminKey: string, filters: { entity_type?: string; page?: number; limit?: number } = {}) {
  return request<{ data: CRMContact[]; meta: CRMListMeta }>(
    `/api/crm/contacts/needs-enrichment${buildQuery(filters)}`,
    {},
    adminKey
  )
}

export async function bulkEnrichContacts(
  adminKey: string,
  updates: Array<{ id: string; email?: string; phone?: string; whatsapp_number?: string; notes?: string }>,
  updatedBy?: string
) {
  return request<{ success: number; failed: number; results: CRMContact[]; errors: { id: string; error: string }[] }>(
    '/api/crm/contacts/bulk-enrich',
    { method: 'POST', body: JSON.stringify({ updates, updated_by: updatedBy }) },
    adminKey
  )
}

// ── Key people ────────────────────────────────────────────

export async function getContactPeople(adminKey: string, contactId: string) {
  return request<CRMContactPerson[]>(`/api/crm/contacts/${contactId}/people`, {}, adminKey)
}

export async function addContactPerson(
  adminKey: string,
  contactId: string,
  data: {
    name: string
    title?: string
    email?: string
    phone?: string
    whatsapp?: string
    is_primary?: boolean
    is_decision_maker?: boolean
    notes?: string
    created_by?: string
  }
) {
  return request<CRMContactPerson>(`/api/crm/contacts/${contactId}/people`, {
    method: 'POST',
    body: JSON.stringify(data),
  }, adminKey)
}

export async function removeContactPerson(adminKey: string, personId: string) {
  return request<{ success: true }>(`/api/crm/contacts/people/${personId}`, { method: 'DELETE' }, adminKey)
}

// ── Templates ─────────────────────────────────────────────

export async function getCRMTemplates(adminKey: string, entityType?: string, category?: string) {
  return request<CRMMessageTemplate[]>(
    `/api/crm/templates${buildQuery({ entity_type: entityType, category })}`,
    {},
    adminKey
  )
}

export interface TemplateInput {
  name: string
  category: string
  channel_email?: boolean
  subject_email?: string
  body_html?: string
  body_text?: string
  channel_sms?: boolean
  body_sms?: string
  channel_whatsapp?: boolean
  body_whatsapp?: string
  target_entity_types?: CRMEntityType[]
  created_by?: string
}

export async function createTemplate(adminKey: string, data: TemplateInput) {
  return request<CRMMessageTemplate>('/api/crm/templates', { method: 'POST', body: JSON.stringify(data) }, adminKey)
}

export async function updateTemplate(adminKey: string, id: string, data: Partial<TemplateInput> & { is_active?: boolean }) {
  return request<CRMMessageTemplate>(`/api/crm/templates/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, adminKey)
}

// ── Sending ───────────────────────────────────────────────

export interface SendMessagePayload {
  contact_id: string
  person_id?: string
  template_id: string
  sent_by: string
  base_url?: string
}

export async function sendEmail(adminKey: string, payload: SendMessagePayload) {
  return request<{ success: boolean; messageId?: string; error?: string; needs_enrichment?: boolean }>(
    '/api/crm/send-email',
    { method: 'POST', body: JSON.stringify(payload) },
    adminKey
  )
}

export async function sendSms(adminKey: string, payload: SendMessagePayload) {
  return request<{ success: boolean; messageId?: string; channel?: string; error?: string }>(
    '/api/crm/send-sms',
    { method: 'POST', body: JSON.stringify(payload) },
    adminKey
  )
}

// Smart router: email -> sms -> flags for enrichment. Prefer this over
// sendEmail/sendSms directly - it picks the channel the contact actually has.
export async function sendMessage(adminKey: string, payload: SendMessagePayload) {
  return request<{ success: boolean; messageId?: string; channel?: string; error?: string; needs_enrichment?: boolean; contact_id?: string }>(
    '/api/crm/send',
    { method: 'POST', body: JSON.stringify(payload) },
    adminKey
  )
}

// ── Activities ────────────────────────────────────────────

export async function getCRMActivities(adminKey: string, filters: { user_id?: string; action?: string; entity_type?: string; entity_id?: string; page?: number; limit?: number } = {}) {
  return request<{ data: CRMActivity[]; meta: CRMListMeta }>(
    `/api/crm/activities${buildQuery(filters)}`,
    {},
    adminKey
  )
}

// ── Team ──────────────────────────────────────────────────

export async function getCRMTeam(adminKey: string) {
  return request<CRMTeamMember[]>('/api/crm/team', {}, adminKey)
}

export async function addTeamMember(
  adminKey: string,
  data: { user_id: string; role: CRMTeamRole; reports_to?: string; county_scope?: string[]; entity_type_scope?: CRMEntityType[]; created_by?: string }
) {
  return request<CRMTeamMember>('/api/crm/team', { method: 'POST', body: JSON.stringify(data) }, adminKey)
}

export async function removeTeamMember(adminKey: string, id: string, removedBy?: string) {
  return request<{ success: true }>(`/api/crm/team/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ removed_by: removedBy }),
  }, adminKey)
}

// ── Stats ─────────────────────────────────────────────────

export interface CRMDashboardStats {
  // get_crm_stats_by_type() groups by (entity_type, status) - multiple rows
  // per entity_type, one per status present. Sum by entity_type client-side
  // for a total; do not treat a single row's count as the type's total.
  by_type: { entity_type: string; status: string; count: number }[]
  by_county: { county: string; count: number }[]
  messages: { channel: string; status: string; count: number; total_cost: number }[]
}

export async function getCRMStats(adminKey: string) {
  return request<CRMDashboardStats>('/api/crm/stats/dashboard', {}, adminKey)
}

export interface CRMTeamStat {
  user_id: string
  user_name: string
  role: string
  contacts_assigned: number
  contacts_contacted: number
  emails_sent: number
  sms_sent: number
  messages_opened: number
  messages_replied: number
  last_active: string | null
}

export async function getCRMTeamStats(adminKey: string) {
  return request<CRMTeamStat[]>('/api/crm/stats/team', {}, adminKey)
}
