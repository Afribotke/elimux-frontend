import type { Tables } from './supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

export interface ApiListMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ApiListResponse<T> {
  data: T[]
  meta: ApiListMeta
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
    if (res.status === 403) throw new Error('Invalid admin key')
    if (res.status === 404) throw new Error(json?.error || 'Not found')
    throw new Error(json?.details || json?.error || `Request failed (${res.status})`)
  }

  return json as T
}

export async function checkApiHealth(): Promise<{ ok: boolean; timestamp?: string }> {
  try {
    const res = await fetch(`${API_URL}/health`, { cache: 'no-store' })
    if (!res.ok) return { ok: false }
    const data = await res.json()
    return { ok: data.status === 'ok', timestamp: data.timestamp }
  } catch {
    return { ok: false }
  }
}

type InstitutionRow = Tables['institutions'] & {
  type?: { name: string; icon?: string | null } | null
  country?: { name: string; flag_emoji?: string | null } | null
}

type ProgramRow = Tables['programs'] & {
  institution?: { name: string; city?: string | null } | null
  category?: { name: string; color?: string | null } | null
}

function buildQuery<T extends object>(params: T): string {
  const qs = new URLSearchParams()
  Object.entries(params as Record<string, string | number | undefined>).forEach(([key, value]) => {
    if (value !== undefined && value !== '') qs.set(key, String(value))
  })
  const query = qs.toString()
  return query ? `?${query}` : ''
}

// Institutions

export interface InstitutionListParams {
  page?: number
  limit?: number
  search?: string
  country_id?: string
  type_id?: string
}

export function listInstitutions(params: InstitutionListParams = {}) {
  return request<ApiListResponse<InstitutionRow>>(`/api/institutions${buildQuery(params)}`)
}

export function createInstitution(data: object, adminKey: string) {
  return request<{ data: InstitutionRow; message: string }>(
    '/api/institutions',
    { method: 'POST', body: JSON.stringify(data) },
    adminKey
  )
}

export function updateInstitution(id: string, data: object, adminKey: string) {
  return request<{ data: InstitutionRow; message: string }>(
    `/api/institutions/${id}`,
    { method: 'PUT', body: JSON.stringify(data) },
    adminKey
  )
}

export function deleteInstitution(id: string, adminKey: string) {
  return request<{ message: string }>(`/api/institutions/${id}`, { method: 'DELETE' }, adminKey)
}

// Programs

export interface ProgramListParams {
  page?: number
  limit?: number
  search?: string
  institution_id?: string
  category_id?: string
  level?: string
  min_tuition?: number
  max_tuition?: number
}

export function listPrograms(params: ProgramListParams = {}) {
  return request<ApiListResponse<ProgramRow>>(`/api/programs${buildQuery(params)}`)
}

export function createProgram(data: object, adminKey: string) {
  return request<{ data: ProgramRow; message: string }>(
    '/api/programs',
    { method: 'POST', body: JSON.stringify(data) },
    adminKey
  )
}

export function updateProgram(id: string, data: object, adminKey: string) {
  return request<{ data: ProgramRow; message: string }>(
    `/api/programs/${id}`,
    { method: 'PUT', body: JSON.stringify(data) },
    adminKey
  )
}

export function deleteProgram(id: string, adminKey: string) {
  return request<{ message: string }>(`/api/programs/${id}`, { method: 'DELETE' }, adminKey)
}

// Reviews

export interface ReviewRow {
  id: string
  program_id: string | null
  institution_id: string | null
  user_id: string | null
  reviewer_name: string | null
  reviewer_email: string | null
  rating: number
  title: string | null
  content: string | null
  pros: string[] | null
  cons: string[] | null
  would_recommend: boolean | null
  is_verified: boolean
  helpful_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ReviewListResponse {
  reviews: ReviewRow[]
  meta: ApiListMeta
}

export interface ReviewListParams {
  program_id?: string
  institution_id?: string
  page?: number
  limit?: number
}

export function listReviews(params: ReviewListParams = {}) {
  return request<ReviewListResponse>(`/api/reviews${buildQuery(params)}`)
}

export interface CreateReviewInput {
  program_id?: string
  institution_id?: string
  reviewer_name?: string
  reviewer_email?: string
  rating: number
  title?: string
  content?: string
  pros?: string[]
  cons?: string[]
  would_recommend?: boolean | null
}

export function createReview(data: CreateReviewInput) {
  return request<ReviewRow>('/api/reviews', { method: 'POST', body: JSON.stringify(data) })
}

export function markReviewHelpful(id: string) {
  return request<{ success: boolean }>(`/api/reviews/${id}/helpful`, { method: 'POST' })
}

// Institution onboarding applications

export interface InstitutionApplyInput {
  name: string
  type_id: string
  country_id: string
  city: string
  website: string
  email: string
  phone: string
  description: string
}

export interface InstitutionApplyResult {
  id: string
  access_token: string
  status: string
  submitted_at: string
}

export function applyInstitution(data: InstitutionApplyInput) {
  return request<{ data: InstitutionApplyResult; message: string }>(
    '/api/institutions/apply',
    { method: 'POST', body: JSON.stringify(data) }
  )
}

export interface ProgramApplyInput {
  institution_application_id: string
  name: string
  category_id: string
  level: string
  duration_months: number | null
  tuition_fees: number | null
  currency: string
  description: string
  requirements: string
}

export function applyProgram(data: ProgramApplyInput) {
  return request<{ data: { id: string; status: string; submitted_at: string }; message: string }>(
    '/api/programs/apply',
    { method: 'POST', body: JSON.stringify(data) }
  )
}

export interface ProgramApplicationStatus {
  id: string
  name: string
  level: string | null
  duration_months: number | null
  tuition_fees: number | null
  currency: string | null
  status: 'pending' | 'approved' | 'rejected'
  admin_notes: string | null
  submitted_at: string
}

export interface InstitutionApplicationStatus {
  id: string
  name: string
  type_id: string | null
  country_id: string | null
  city: string | null
  website: string | null
  email: string
  phone: string | null
  description: string | null
  status: 'pending' | 'approved' | 'rejected'
  admin_notes: string | null
  submitted_at: string
  reviewed_at: string | null
  programs: ProgramApplicationStatus[]
}

export function getApplicationStatus(token: string) {
  return request<{ data: InstitutionApplicationStatus }>(`/api/institutions/apply/${token}`)
}

// Applications (admin review)

export interface AdminInstitutionApplication extends InstitutionApplicationStatus {
  type?: { name: string } | null
  country?: { name: string } | null
}

export function listAdminApplications(adminKey: string, status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : ''
  return request<{ data: AdminInstitutionApplication[] }>(`/api/admin/applications${query}`, {}, adminKey)
}

export function approveApplication(id: string, adminKey: string, admin_notes?: string) {
  return request<{ data: AdminInstitutionApplication; message: string }>(
    `/api/admin/applications/${id}/approve`,
    { method: 'POST', body: JSON.stringify({ admin_notes }) },
    adminKey
  )
}

export function rejectApplication(id: string, adminKey: string, admin_notes?: string) {
  return request<{ data: AdminInstitutionApplication; message: string }>(
    `/api/admin/applications/${id}/reject`,
    { method: 'POST', body: JSON.stringify({ admin_notes }) },
    adminKey
  )
}

export function approveProgramApplication(id: string, adminKey: string, admin_notes?: string) {
  return request<{ data: ProgramApplicationStatus; message: string }>(
    `/api/admin/applications/programs/${id}/approve`,
    { method: 'POST', body: JSON.stringify({ admin_notes }) },
    adminKey
  )
}

export function rejectProgramApplication(id: string, adminKey: string, admin_notes?: string) {
  return request<{ data: ProgramApplicationStatus; message: string }>(
    `/api/admin/applications/programs/${id}/reject`,
    { method: 'POST', body: JSON.stringify({ admin_notes }) },
    adminKey
  )
}

// Subscription plans (admin)

export interface SubscriptionPlanRow {
  id: string
  name: string
  slug: string
  description: string | null
  price_kes: number
  price_usd: number | null
  currency: string
  duration_months: number
  features: string[] | null
  is_active: boolean
  created_at: string
  subscriber_count: number
}

export function listAdminPlans(adminKey: string) {
  return request<{ data: SubscriptionPlanRow[] }>('/api/admin/plans', {}, adminKey)
}

export function createPlan(data: object, adminKey: string) {
  return request<{ data: SubscriptionPlanRow; message: string }>(
    '/api/admin/plans',
    { method: 'POST', body: JSON.stringify(data) },
    adminKey
  )
}

export function updatePlan(id: string, data: object, adminKey: string) {
  return request<{ data: SubscriptionPlanRow; message: string }>(
    `/api/admin/plans/${id}`,
    { method: 'PUT', body: JSON.stringify(data) },
    adminKey
  )
}

export function deactivatePlan(id: string, adminKey: string) {
  return request<{ data: SubscriptionPlanRow; message: string }>(
    `/api/admin/plans/${id}`,
    { method: 'DELETE' },
    adminKey
  )
}
