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
  featured?: boolean
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

// Reviews (admin moderation)

export interface AdminReview {
  id: string
  reviewer_name: string | null
  is_anonymous: boolean
  rating: number
  title: string | null
  content: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  program?: { name: string } | null
  institution?: { name: string } | null
}

export function listAdminReviews(adminKey: string, status = 'pending') {
  return request<{ data: AdminReview[] }>(`/api/admin/reviews?status=${encodeURIComponent(status)}`, {}, adminKey)
}

export function updateReviewStatus(id: string, status: 'approved' | 'rejected', adminKey: string) {
  return request<{ data: AdminReview; message: string }>(
    `/api/admin/reviews/${id}`,
    { method: 'PATCH', body: JSON.stringify({ status }) },
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

// Gamification

export type GamificationActionType = 'search' | 'review' | 'share' | 'referral' | 'login'

export interface GamificationBadge {
  id: string
  name: string
  description: string | null
  icon: string | null
  criteria_type: string
  criteria_threshold: number
  points_reward: number | null
  is_active: boolean
}

export interface GamificationPointRow {
  id: string
  action_type: GamificationActionType
  points_earned: number
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface AwardPointsResult {
  data: GamificationPointRow
  total_points: number
  badges_earned: GamificationBadge[]
}

export interface EarnedBadge {
  badge_id: string
  earned_at: string
  badge: GamificationBadge
}

export interface MyGamificationState {
  total_points: number
  badges: EarnedBadge[]
}

export interface LeaderboardEntry {
  rank: number
  display_name: string
  total_points: number
  actions_count: number
  last_activity_at: string
}

export interface ReferralRow {
  id: string
  referrer_code: string
  referrer_email: string
  referred_email: string | null
  status: 'pending' | 'completed'
  reward_given: boolean
  created_at: string
  completed_at: string | null
}

// Current device's point total + earned badges. Read-only, no side effects -
// safe to call on every page load (e.g. to populate a header points badge).
export function getMyGamificationState() {
  return request<MyGamificationState>('/api/gamification/me')
}

export function awardPoints(
  action_type: GamificationActionType,
  opts: { metadata?: Record<string, unknown>; display_name?: string; email?: string } = {}
) {
  return request<AwardPointsResult>('/api/gamification/points', {
    method: 'POST',
    body: JSON.stringify({ action_type, ...opts }),
  })
}

export function listLeaderboard(limit = 20) {
  return request<{ data: LeaderboardEntry[] }>(`/api/gamification/leaderboard${buildQuery({ limit })}`)
}

export function listBadges() {
  return request<{ data: GamificationBadge[] }>('/api/gamification/badges')
}

export function createReferral(referrer_email: string) {
  return request<{ data: ReferralRow; message: string }>('/api/gamification/referrals', {
    method: 'POST',
    body: JSON.stringify({ referrer_email }),
  })
}

export function redeemReferral(referrer_code: string, referred_email: string) {
  return request<{ data: ReferralRow; message: string }>('/api/gamification/referrals', {
    method: 'POST',
    body: JSON.stringify({ referrer_code, referred_email }),
  })
}

export function getReferralStatus(code: string) {
  return request<{ data: ReferralRow }>(`/api/gamification/referrals/${encodeURIComponent(code)}`)
}

// Favorites

export function addFavorite(itemId: string, itemType: 'program' | 'institution') {
  return request<{ success: boolean; data: unknown }>('/api/favorites', {
    method: 'POST',
    body: JSON.stringify({ item_id: itemId, item_type: itemType }),
  })
}

export function removeFavorite(itemId: string, itemType: 'program' | 'institution') {
  return request<{ success: boolean; message: string }>('/api/favorites', {
    method: 'DELETE',
    body: JSON.stringify({ item_id: itemId, item_type: itemType }),
  })
}

// Sponsor ads

export interface SponsorAdRow {
  id: string
  sponsor_id: string | null
  title: string
  description: string | null
  image_url: string | null
  target_url: string
  placement: string
  start_date: string
  end_date: string
  is_active: boolean
  click_count: number
  created_at: string
  updated_at: string
  sponsor?: { name: string; logo_url: string | null } | null
}

export function listSponsorAds(placement: string) {
  return request<{ data: SponsorAdRow[] }>(`/api/sponsor-ads${buildQuery({ placement })}`)
}

export function listAdminSponsorAds(adminKey: string) {
  return request<{ data: SponsorAdRow[] }>('/api/sponsor-ads/admin', {}, adminKey)
}

export interface CreateSponsorAdInput {
  sponsor_id?: string | null
  title: string
  description?: string
  image_url?: string
  target_url: string
  placement: string
  start_date: string
  end_date: string
}

export function createSponsorAd(data: CreateSponsorAdInput, adminKey: string) {
  return request<{ data: SponsorAdRow; message: string }>(
    '/api/sponsor-ads',
    { method: 'POST', body: JSON.stringify(data) },
    adminKey
  )
}

export function updateSponsorAd(id: string, data: Partial<CreateSponsorAdInput> & { is_active?: boolean }, adminKey: string) {
  return request<{ data: SponsorAdRow; message: string }>(
    `/api/sponsor-ads/${id}`,
    { method: 'PATCH', body: JSON.stringify(data) },
    adminKey
  )
}

export function trackAdClick(id: string) {
  return request<{ success: boolean }>(`/api/sponsor-ads/${id}/click`, { method: 'POST' })
}

// Admin analytics

export interface AnalyticsOverview {
  total_users: number
  total_searches: { today: number; week: number; month: number }
  total_revenue_kes: number
  total_reviews: number
  total_applications: { institution_applications: number; program_applications: number; total: number }
}

export function getAnalyticsOverview(adminKey: string) {
  return request<{ data: AnalyticsOverview }>('/api/admin/analytics/overview', {}, adminKey)
}

export interface RevenueByPlan {
  plan: string
  revenue_kes: number
}

export interface PaymentHistoryRow {
  id: string
  amount: number
  currency: string
  status: string
  payment_method: string | null
  created_at: string
  subscriber?: { email: string } | null
  subscription?: { plan?: { name: string } | null } | null
}

export interface AnalyticsRevenue {
  mrr_kes: number
  revenue_by_plan: RevenueByPlan[]
  payment_history: PaymentHistoryRow[]
}

export function getAnalyticsRevenue(adminKey: string) {
  return request<{ data: AnalyticsRevenue }>('/api/admin/analytics/revenue', {}, adminKey)
}

export type ActivityLevel = 'none' | 'low' | 'medium' | 'high'

export interface AnalyticsUserRow {
  device_id: string
  activity_count: number
  activity_level: ActivityLevel
  last_active: string
}

export function getAnalyticsUsers(adminKey: string, level?: ActivityLevel) {
  const query = level ? `?level=${encodeURIComponent(level)}` : ''
  return request<{ data: AnalyticsUserRow[]; meta: { total: number } }>(`/api/admin/analytics/users${query}`, {}, adminKey)
}

export interface SearchTermRow {
  term: string
  count: number
}

export interface SearchTrendPoint {
  date: string
  count: number
}

export interface AnalyticsSearches {
  popular_terms: SearchTermRow[]
  zero_result_searches: SearchTermRow[]
  trend: SearchTrendPoint[]
}

export function getAnalyticsSearches(adminKey: string) {
  return request<{ data: AnalyticsSearches }>('/api/admin/analytics/searches', {}, adminKey)
}

export interface InstitutionRankRow {
  institution_id: string
  name: string
  count: number
  avg_rating?: number
}

export interface AnalyticsInstitutions {
  by_page_views: InstitutionRankRow[]
  by_applications: InstitutionRankRow[]
  by_reviews: InstitutionRankRow[]
}

export function getAnalyticsInstitutions(adminKey: string) {
  return request<{ data: AnalyticsInstitutions }>('/api/admin/analytics/institutions', {}, adminKey)
}

// PWA push subscriptions

export function subscribePush(deviceId: string, subscription: PushSubscriptionJSON, preferences?: Record<string, unknown>) {
  return request<{ data: unknown }>('/api/pwa/subscribe', {
    method: 'POST',
    body: JSON.stringify({ device_id: deviceId, subscription, preferences }),
  })
}

export function unsubscribePush(deviceId: string) {
  return request<{ message: string }>('/api/pwa/subscribe', {
    method: 'DELETE',
    body: JSON.stringify({ device_id: deviceId }),
  })
}
