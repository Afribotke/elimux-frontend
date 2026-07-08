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
