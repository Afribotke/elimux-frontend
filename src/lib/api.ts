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

export type InstitutionRow = Tables['institutions'] & {
  type?: { name: string; icon?: string | null } | null
  country?: { name: string; flag_emoji?: string | null } | null
  accreditations?: {
    accreditation_status: string
    body?: { name: string; code: string | null; logo_url: string | null } | null
  }[]
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
  accreditation_body_id?: string
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
  pros: string | null
  cons: string | null
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
  pros?: string
  cons?: string
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

export function deleteReview(id: string, adminKey: string) {
  return request<{ data: AdminReview; message: string }>(`/api/admin/reviews/${id}`, { method: 'DELETE' }, adminKey)
}

// Contact messages (admin)

export interface AdminMessage {
  id: string
  name: string
  email: string
  subject: string | null
  message: string
  status: 'new' | 'read' | 'archived'
  created_at: string
}

export function listAdminMessages(adminKey: string, status = 'new') {
  return request<{ data: AdminMessage[] }>(`/api/admin/messages?status=${encodeURIComponent(status)}`, {}, adminKey)
}

export function updateMessageStatus(id: string, status: 'new' | 'read' | 'archived', adminKey: string) {
  return request<{ data: AdminMessage; message: string }>(
    `/api/admin/messages/${id}`,
    { method: 'PATCH', body: JSON.stringify({ status }) },
    adminKey
  )
}

export function deleteMessage(id: string, adminKey: string) {
  return request<{ data: AdminMessage; message: string }>(`/api/admin/messages/${id}`, { method: 'DELETE' }, adminKey)
}

export interface PotentialEmployer {
  id: string
  company_name: string
  company_email: string
  company_phone: string | null
  industry: string | null
  website_url: string | null
  contact_person_name: string | null
  contact_person_email: string | null
  contact_person_phone: string | null
  source: string | null
  status: 'pending' | 'contacted' | 'approved' | 'rejected'
  admin_notes: string | null
  created_at: string
}

export function listPotentialEmployers(adminKey: string, status = 'all') {
  return request<{ data: PotentialEmployer[] }>(`/api/admin/potential-employers?status=${encodeURIComponent(status)}`, {}, adminKey)
}

export function updatePotentialEmployerStatus(
  id: string,
  status: PotentialEmployer['status'],
  adminKey: string,
  admin_notes?: string
) {
  return request<{ data: PotentialEmployer; message: string }>(
    `/api/admin/potential-employers/${id}`,
    { method: 'PATCH', body: JSON.stringify({ status, admin_notes }) },
    adminKey
  )
}

export interface BulkStudentUploadResult {
  success: number
  failed: number
  errors: string[]
}

export function bulkUploadStudents(
  students: Array<{
    registration_number: string
    full_name: string
    email: string
    phone?: string
    university_name?: string
    course_name?: string
    course_category?: string
    year_of_study?: number
  }>,
  adminKey: string
) {
  return request<BulkStudentUploadResult>(
    '/api/admin/students/bulk-upload',
    { method: 'POST', body: JSON.stringify({ students }) },
    adminKey
  )
}

// Admin: employers, students, internships — these use service-role backend
// endpoints because their tables' RLS only grants access via row ownership
// or a Supabase Auth admin session (auth.uid()), neither of which this
// panel has: it authenticates via the shared admin key, not Supabase Auth.

export interface AdminEmployerRow {
  id: string
  company_name: string
  company_email: string | null
  industry: string | null
  location_county: string | null
  verification_status: string
  is_verified: boolean
  created_at: string
}

export async function fetchAdminEmployers(adminKey: string): Promise<AdminEmployerRow[]> {
  const res = await request<{ success: boolean; data: AdminEmployerRow[] }>('/api/admin/employers', {}, adminKey)
  return res.data
}

export async function verifyEmployer(id: string, status: 'approved' | 'rejected' | 'pending', adminKey: string) {
  return request<{ success: boolean; data: AdminEmployerRow }>(
    `/api/admin/employers/${id}/verify`,
    { method: 'PATCH', body: JSON.stringify({ status }) },
    adminKey
  )
}

export interface AdminStudentRow {
  id: string
  registration_number: string | null
  full_name: string
  email: string | null
  university_name: string | null
  course_name: string | null
  year_of_study: number | null
  is_university_verified: boolean
  created_at: string
}

export async function fetchAdminStudents(adminKey: string): Promise<AdminStudentRow[]> {
  const res = await request<{ success: boolean; data: AdminStudentRow[] }>('/api/admin/students', {}, adminKey)
  return res.data
}

export interface AdminInternshipRow {
  id: string
  title: string
  status: string
  profession_category: string | null
  location_county: string | null
  total_slots: number | null
  remaining_slots: number | null
  created_at: string
  employer: { company_name: string } | null
  applications: { count: number }[] | null
}

export async function fetchAdminInternships(adminKey: string): Promise<AdminInternshipRow[]> {
  const res = await request<{ success: boolean; data: AdminInternshipRow[] }>('/api/admin/internships', {}, adminKey)
  return res.data
}

// AI gateway (admin)

export interface AIStatus {
  mode: 'launch' | 'scale'
  order: string[]
  embeddingsOrder: string[]
  providers: { name: string; available: boolean }[]
}

export function getAIStatus(adminKey: string) {
  return request<AIStatus>('/api/ai/status', {}, adminKey)
}

export function setAIMode(mode: 'launch' | 'scale', adminKey: string) {
  return request<{ mode: AIStatus['mode']; message: string }>(
    '/api/ai/mode',
    { method: 'POST', body: JSON.stringify({ mode }) },
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

export interface AdPaymentHistoryRow {
  id: string
  amount: number
  status: string
  paystack_reference: string | null
  created_at: string
  advertiser?: { organization_name: string; email: string } | null
}

export interface AnalyticsRevenue {
  mrr_kes: number
  revenue_by_plan: RevenueByPlan[]
  payment_history: PaymentHistoryRow[]
  ad_revenue_total_kes?: number
  ad_revenue_30d_kes?: number
  ad_payment_history?: AdPaymentHistoryRow[]
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

// Data scraper (admin)

export interface ScraperJob {
  id: string
  institution_id: string
  source_url: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  programs_found: number
  programs_updated: number
  programs_created: number
  errors: { message: string }[] | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  institution?: { name: string } | null
}

export interface ProgramChange {
  id: string
  institution_id: string
  program_id: string | null
  change_type: 'new' | 'updated' | 'deleted'
  field_name: string | null
  old_value: string | null
  new_value: string | null
  confidence_score: number
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  institution?: { name: string } | null
  program?: { name: string } | null
}

export interface ScrapingSource {
  id: string
  institution_id: string
  source_type: 'api' | 'website' | 'rss'
  url: string
  crawl_frequency: 'daily' | 'weekly' | 'monthly'
  last_crawled_at: string | null
  is_active: boolean
  selectors: Record<string, unknown> | null
  created_at: string
  institution?: { name: string } | null
}

export function runScraper(institution_id: string, source_url: string, adminKey: string) {
  return request<{ data: { job: ScraperJob; changes_filed: number } }>(
    '/api/admin/scraper/run',
    { method: 'POST', body: JSON.stringify({ institution_id, source_url }) },
    adminKey
  )
}

export function listScraperJobs(adminKey: string, params: { institution_id?: string; status?: string; page?: number; limit?: number } = {}) {
  return request<ApiListResponse<ScraperJob>>(`/api/admin/scraper/jobs${buildQuery(params)}`, {}, adminKey)
}

export function listProgramChanges(adminKey: string, params: { status?: string; institution_id?: string } = {}) {
  return request<{ data: ProgramChange[] }>(`/api/admin/scraper/changes${buildQuery(params)}`, {}, adminKey)
}

export function approveChange(id: string, adminKey: string) {
  return request<{ data: ProgramChange; message: string }>(`/api/admin/scraper/changes/${id}/approve`, { method: 'POST' }, adminKey)
}

export function rejectChange(id: string, adminKey: string) {
  return request<{ data: ProgramChange; message: string }>(`/api/admin/scraper/changes/${id}/reject`, { method: 'POST' }, adminKey)
}

export interface CreateScrapingSourceInput {
  institution_id: string
  url: string
  source_type?: 'api' | 'website' | 'rss'
  crawl_frequency?: 'daily' | 'weekly' | 'monthly'
}

export function listScrapingSources(adminKey: string, institution_id?: string) {
  return request<{ data: ScrapingSource[] }>(`/api/admin/scraper/sources${buildQuery({ institution_id })}`, {}, adminKey)
}

export function createScrapingSource(data: CreateScrapingSourceInput, adminKey: string) {
  return request<{ data: ScrapingSource }>('/api/admin/scraper/sources', { method: 'POST', body: JSON.stringify(data) }, adminKey)
}

export function updateScrapingSource(id: string, data: Partial<CreateScrapingSourceInput> & { is_active?: boolean }, adminKey: string) {
  return request<{ data: ScrapingSource; message: string }>(
    `/api/admin/scraper/sources/${id}`,
    { method: 'PATCH', body: JSON.stringify(data) },
    adminKey
  )
}

export function deleteScrapingSource(id: string, adminKey: string) {
  return request<{ message: string }>(`/api/admin/scraper/sources/${id}`, { method: 'DELETE' }, adminKey)
}

// TVETA registry scraper (separate from the AI program scraper above — this
// one cross-checks institutions against the government accreditation list)

export interface TvetaScrapedInstitution {
  id: string
  name: string
  registration_number: string | null
  category: string | null
  institution_type: string | null
  county: string | null
  status: string
  source_url: string
  scraped_at: string
  review_status: 'pending' | 'approved' | 'rejected' | 'duplicate'
}

export interface TvetaStatus {
  pending: number
  approved: number
  total: number
}

export interface TvetaRunResult {
  success: boolean
  pagesScanned: number
  institutionsFound: number
  inserted: number
  duplicates: number
  robotsRules: string
}

export function runTvetaScraper(adminKey: string) {
  return request<TvetaRunResult>('/api/tveta/run', { method: 'POST' }, adminKey)
}

export function getTvetaStatus(adminKey: string) {
  return request<TvetaStatus>('/api/tveta/status', {}, adminKey)
}

export function listTvetaPending(adminKey: string) {
  return request<{ data: TvetaScrapedInstitution[] }>('/api/tveta/pending', {}, adminKey)
}

export function approveTveta(id: string, adminKey: string) {
  return request<{ success: boolean; institutionId: string; message: string }>(
    `/api/tveta/approve/${id}`,
    { method: 'POST' },
    adminKey
  )
}

export function rejectTveta(id: string, adminKey: string) {
  return request<{ success: boolean }>(`/api/tveta/reject/${id}`, { method: 'POST' }, adminKey)
}

// Public TVETA lookup (no admin key) - used by /verify-college
export interface TvetaPublicSearchResult {
  id: string
  name: string
  registrationNumber: string | null
  accredited: boolean
  category: string | null
  county: string | null
}

export function searchTvetaPublic(q: string) {
  return request<{ data: TvetaPublicSearchResult[] }>(`/api/tveta/public-search${buildQuery({ q })}`)
}

// Scholarships

export interface ScholarshipRow {
  id: string
  title: string
  provider: string
  provider_logo_url: string | null
  description: string | null
  eligibility: string | null
  benefits: string | null
  amount: string | null
  currency: string
  coverage_type: string | null
  institution_id: string | null
  country_id: string | null
  study_levels: string[] | null
  disciplines: string[] | null
  target_groups: string[] | null
  application_opens: string | null
  application_deadline: string
  notification_date: string | null
  application_url: string | null
  application_process: string | null
  required_documents: string[] | null
  status: string
  is_featured: boolean
  source_url: string | null
  created_at: string
  updated_at: string
  institution?: { name: string } | null
  country?: { name: string } | null
}

export interface ScholarshipListParams {
  country_id?: string
  study_level?: string
  discipline?: string
  deadline_after?: string
  keyword?: string
  limit?: number
  offset?: number
}

export interface ScholarshipListResponse {
  data: ScholarshipRow[]
  meta: { limit: number; offset: number; total: number }
}

export function listScholarships(params: ScholarshipListParams = {}) {
  return request<ScholarshipListResponse>(`/api/scholarships${buildQuery(params)}`)
}

export function favoriteScholarship(id: string) {
  return request<{ data: unknown }>(`/api/scholarships/${id}/favorite`, { method: 'POST' })
}

export function unfavoriteScholarship(id: string) {
  return request<{ message: string }>(`/api/scholarships/${id}/favorite`, { method: 'DELETE' })
}

export interface ScholarshipFavoriteRow {
  id: string
  created_at: string
  scholarship: ScholarshipRow
}

export function listScholarshipFavorites() {
  return request<{ data: ScholarshipFavoriteRow[] }>('/api/scholarships/favorites')
}

export interface CreateScholarshipAlertInput {
  email?: string
  keywords?: string
  country_id?: string
  study_level?: string
}

export function createScholarshipAlert(data: CreateScholarshipAlertInput) {
  return request<{ data: unknown; message: string }>('/api/scholarships/alerts', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// Accreditation bodies

export interface AccreditationBodyRow {
  id: string
  name: string
  code: string | null
  description: string | null
  logo_url: string | null
  website_url: string | null
  country_id: string | null
  body_type: string
  is_active: boolean
  created_at: string
  country?: { name: string; flag_emoji: string | null } | null
}

export interface AccreditedInstitutionRow {
  id: string
  accreditation_number: string | null
  accreditation_status: string
  valid_from: string | null
  valid_until: string | null
  document_url: string | null
  institution: {
    id: string
    name: string
    slug: string | null
    logo_url: string | null
    city: string | null
    type?: { name: string } | null
  } | null
}

export interface AccreditationBodyDetail extends AccreditationBodyRow {
  institutions: AccreditedInstitutionRow[]
}

export interface AccreditationBodyListParams {
  country_id?: string
  body_type?: string
}

export function listAccreditationBodies(params: AccreditationBodyListParams = {}) {
  return request<{ data: AccreditationBodyRow[] }>(`/api/accreditation-bodies${buildQuery(params)}`)
}

export function getAccreditationBody(id: string) {
  return request<{ data: AccreditationBodyDetail }>(`/api/accreditation-bodies/${id}`)
}

export interface CreateAccreditationBodyInput {
  name: string
  code?: string
  description?: string
  logo_url?: string
  website_url?: string
  country_id?: string
  body_type: 'university' | 'tvet' | 'secondary' | 'professional'
  is_active?: boolean
}

export function createAccreditationBody(data: CreateAccreditationBodyInput, adminKey: string) {
  return request<{ data: AccreditationBodyRow; message: string }>(
    '/api/admin/accreditation-bodies',
    { method: 'POST', body: JSON.stringify(data) },
    adminKey
  )
}

export interface InstitutionAccreditationRow {
  id: string
  accreditation_number: string | null
  accreditation_status: string
  valid_from: string | null
  valid_until: string | null
  document_url: string | null
  created_at: string
  body: { id: string; name: string; code: string | null; logo_url: string | null; body_type: string } | null
}

export function listInstitutionAccreditations(institutionId: string) {
  return request<{ data: InstitutionAccreditationRow[] }>(`/api/institutions/${institutionId}/accreditations`)
}

export interface CreateInstitutionAccreditationInput {
  institution_id: string
  body_id: string
  accreditation_number?: string
  accreditation_status?: string
  valid_from?: string
  valid_until?: string
  document_url?: string
}

export function createInstitutionAccreditation(data: CreateInstitutionAccreditationInput, adminKey: string) {
  return request<{ data: unknown; message: string }>(
    '/api/admin/institution-accreditations',
    { method: 'POST', body: JSON.stringify(data) },
    adminKey
  )
}

// Major sponsor ("Powered by")

export interface MajorSponsorPublic {
  name: string
  logo_url: string | null
  tagline: string | null
  website_url: string | null
  tier: string
  show_in_header: boolean
  show_in_footer: boolean
  show_in_loading: boolean
  show_in_email: boolean
}

export function getMajorSponsor() {
  return request<{ data: MajorSponsorPublic | null }>('/api/major-sponsor')
}

export interface MajorSponsorRow {
  id: string
  organization_name: string
  logo_url: string | null
  tagline: string | null
  website_url: string | null
  sponsorship_tier: 'platinum' | 'gold' | 'silver' | 'bronze'
  start_date: string | null
  end_date: string | null
  show_in_header: boolean
  show_in_footer: boolean
  show_in_loading: boolean
  show_in_email: boolean
  is_active: boolean
  created_at: string
}

export function listAdminMajorSponsors(adminKey: string) {
  return request<{ data: MajorSponsorRow[] }>('/api/admin/major-sponsors', {}, adminKey)
}

export interface CreateMajorSponsorInput {
  organization_name: string
  logo_url?: string
  tagline?: string
  website_url?: string
  sponsorship_tier: 'platinum' | 'gold' | 'silver' | 'bronze'
  start_date?: string
  end_date?: string
  show_in_header?: boolean
  show_in_footer?: boolean
  show_in_loading?: boolean
  show_in_email?: boolean
}

export function createMajorSponsor(data: CreateMajorSponsorInput, adminKey: string) {
  return request<{ data: MajorSponsorRow; message: string }>(
    '/api/admin/major-sponsors',
    { method: 'POST', body: JSON.stringify(data) },
    adminKey
  )
}

export function updateMajorSponsor(id: string, data: Partial<CreateMajorSponsorInput> & { is_active?: boolean }, adminKey: string) {
  return request<{ data: MajorSponsorRow; message: string }>(
    `/api/admin/major-sponsors/${id}`,
    { method: 'PATCH', body: JSON.stringify(data) },
    adminKey
  )
}

export function activateMajorSponsor(id: string, adminKey: string) {
  return request<{ data: MajorSponsorRow; message: string }>(
    `/api/admin/major-sponsors/${id}/activate`,
    { method: 'PATCH' },
    adminKey
  )
}

// Shared searches (compare / search-results sharing)

export interface SharedProgramSnapshot {
  id: string
  name: string
  duration_months: number | null
  tuition_fees: number | null
  currency: string | null
  level: string | null
  mode: string | null
  institution?: { name: string; city?: string | null; country?: { name: string } | null } | null
}

export interface SharedSearchRow {
  id: string
  share_token: string
  user_email: string | null
  query_text: string | null
  programs: SharedProgramSnapshot[]
  view_count: number
  last_viewed_at: string | null
  created_at: string
}

export interface CreateSharedSearchInput {
  program_ids: string[]
  query?: string
  email?: string
}

export function createSharedSearch(data: CreateSharedSearchInput) {
  return request<{ success: boolean; token: string; shareUrl: string }>('/api/share/search', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function getSharedSearch(token: string) {
  return request<{ success: boolean; data: SharedSearchRow }>(`/api/share/search/${encodeURIComponent(token)}`)
}

// University analytics (admin)

export interface UniversityAnalyticsTopProgram {
  program_id: string
  name: string
  views: number
}

export interface UniversityAnalyticsSearchTerm {
  term: string
  count: number
}

export interface UniversityAnalyticsRegion {
  country: string
  count: number
}

export interface UniversityAnalyticsTrendPoint {
  date: string
  count: number
}

export interface UniversityAnalytics {
  institution_id: string
  period_days: number
  total_views: number
  total_applications: number
  conversion_rate: number
  top_programs: UniversityAnalyticsTopProgram[]
  top_search_terms: UniversityAnalyticsSearchTerm[]
  regional_interest: UniversityAnalyticsRegion[]
  views_trend: UniversityAnalyticsTrendPoint[]
}

export function getUniversityAnalytics(institutionId: string, adminKey: string) {
  return request<{ data: UniversityAnalytics }>(`/api/analytics/university/${institutionId}`, {}, adminKey)
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

// Admin dashboard

export interface AdminDashboardStats {
  totals: {
    institutions: number
    programs: number
    employers: number
    internships: number
    reviews: number
    attachments: number
    contact_messages: number
    open_nita_flags: number
  }
  growth_30d: {
    institutions: number
    employers: number
    internships: number
  }
  recent: {
    contact_messages: Array<{
      id: string
      name: string
      email: string
      subject: string
      created_at: string
    }>
    institutions: Array<{
      id: string
      name: string
      country: string
      created_at: string
    }>
  }
}

export function getAdminDashboardStats(adminKey: string) {
  return request<{ data: AdminDashboardStats }>('/api/admin/dashboard/stats', {}, adminKey)
}

export interface AdminAuditLogEntry {
  id: string
  action: string
  entity: string
  entity_type: string
  user_id: string | null
  user_email: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export function listAdminAuditLog(params: { page?: number; limit?: number } = {}, adminKey: string) {
  return request<{ data: AdminAuditLogEntry[]; total: number; page: number }>(
    `/api/admin/dashboard/audit-log${buildQuery(params)}`,
    {},
    adminKey
  )
}

export interface AdminNitaFlag {
  id: string
  employer_id: string | null
  flag_type: string
  flag_reason: string
  severity: string | null
  resolved: boolean
  created_at: string
  employer: { id: string; company_name: string; nita_employer_number: string | null; user_id: string | null } | null
}

export function listAdminNitaFlags(adminKey: string) {
  return request<{ data: AdminNitaFlag[] }>('/api/admin/dashboard/nita', {}, adminKey)
}

// ElimuX-owned compliance layer — separate from the NITA flags above.
// See elimux-sql/37_compliance_layer.sql for the schema and rationale.

export interface ComplianceFlag {
  id: string
  employer_id: string
  flag_type: 'fraud' | 'fake_listing' | 'policy_violation' | 'user_complaint' | 'payment_issue' | 'other'
  flag_reason: string
  severity: 'info' | 'warning' | 'high' | 'critical'
  source: 'admin' | 'user_report' | 'automated'
  resolved: boolean
  resolved_by: string | null
  resolution_notes: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
  employer: { id: string; company_name: string; company_email: string } | null
}

export function listComplianceFlags(
  adminKey: string,
  params: { resolved?: boolean; severity?: string; source?: string; limit?: number; offset?: number } = {}
) {
  return request<{ data: ComplianceFlag[]; count: number }>(
    `/api/admin/compliance-flags${buildQuery(params)}`,
    {},
    adminKey
  )
}

export function createComplianceFlag(
  payload: { employer_id: string; flag_type: ComplianceFlag['flag_type']; flag_reason: string; severity?: ComplianceFlag['severity']; source?: ComplianceFlag['source'] },
  adminKey: string
) {
  return request<{ data: ComplianceFlag; message: string }>(
    '/api/admin/compliance-flags',
    { method: 'POST', body: JSON.stringify(payload) },
    adminKey
  )
}

export function resolveComplianceFlag(
  id: string,
  payload: { resolved: boolean; resolution_notes?: string; resolved_by?: string },
  adminKey: string
) {
  return request<{ data: ComplianceFlag; message: string }>(
    `/api/admin/compliance-flags/${id}`,
    { method: 'PATCH', body: JSON.stringify(payload) },
    adminKey
  )
}

export interface VerifiedEmployer {
  id: string
  employer_id: string
  verified_by: string | null
  verification_method: 'document_review' | 'business_registry_check' | 'phone_verification' | 'automated'
  verification_notes: string | null
  documents_reviewed: string[]
  tier: 'standard' | 'premium' | 'verified_partner'
  verified_at: string
  expires_at: string | null
  is_active: boolean
  created_at: string
  employer: { id: string; company_name: string; company_email: string; industry: string | null; location_county: string | null } | null
}

export function listVerifiedEmployers(
  adminKey: string,
  params: { employer_id?: string; is_active?: boolean; limit?: number; offset?: number } = {}
) {
  return request<{ data: VerifiedEmployer[]; count: number }>(
    `/api/admin/verified-employers${buildQuery(params)}`,
    {},
    adminKey
  )
}

export function createVerifiedEmployer(
  payload: {
    employer_id: string
    verification_method: VerifiedEmployer['verification_method']
    verification_notes?: string
    documents_reviewed?: string[]
    tier?: VerifiedEmployer['tier']
    verified_by?: string
  },
  adminKey: string
) {
  return request<{ data: VerifiedEmployer; message: string }>(
    '/api/admin/verified-employers',
    { method: 'POST', body: JSON.stringify(payload) },
    adminKey
  )
}
