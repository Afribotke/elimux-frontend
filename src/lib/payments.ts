const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

export interface SubscriptionPlan {
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
}

export interface Subscription {
  id: string
  subscriber_id: string
  plan_id: string
  status: 'pending' | 'active' | 'cancelled' | 'expired'
  current_period_start: string | null
  current_period_end: string | null
  created_at: string
  cancelled_at: string | null
  plan: SubscriptionPlan
}

export interface Payment {
  id: string
  amount: number
  currency: string
  paystack_reference: string
  status: 'pending' | 'success' | 'failed' | 'refunded'
  payment_method: string | null
  created_at: string
}

export interface SubscriberSession {
  email: string
  access_token: string
}

const SESSION_KEY = 'elimux-subscriber-session'

export function saveSubscriberSession(session: SubscriberSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function getSubscriberSession(): SubscriberSession | null {
  const stored = localStorage.getItem(SESSION_KEY)
  return stored ? JSON.parse(stored) : null
}

export function clearSubscriberSession() {
  localStorage.removeItem(SESSION_KEY)
}

async function handleResponse<T>(res: Response): Promise<T> {
  const body = await res.json()
  if (!res.ok) throw new Error(body.error || 'Request failed')
  return body.data as T
}

export async function fetchPlans(): Promise<SubscriptionPlan[]> {
  const res = await fetch(`${API_URL}/api/payments/plans`)
  return handleResponse(res)
}

export interface InitializePaymentParams {
  email: string
  name?: string
  phone?: string
  country?: string
  plan_id: string
}

export interface InitializePaymentResult {
  free?: boolean
  authorization_url?: string
  reference?: string
  subscriber_email: string
  access_token: string
}

export async function initializePayment(params: InitializePaymentParams): Promise<InitializePaymentResult> {
  const res = await fetch(`${API_URL}/api/payments/initialize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  return handleResponse(res)
}

export interface VerifyPaymentResult {
  status: 'success' | 'failed' | 'abandoned'
  payment: Payment & { subscription: Subscription | null }
}

export async function verifyPayment(reference: string): Promise<VerifyPaymentResult> {
  const res = await fetch(`${API_URL}/api/payments/verify/${encodeURIComponent(reference)}`)
  return handleResponse(res)
}

export async function fetchSubscriptionStatus(session: SubscriberSession): Promise<Subscription | null> {
  const params = new URLSearchParams({ email: session.email, token: session.access_token })
  const res = await fetch(`${API_URL}/api/payments/subscription?${params.toString()}`)
  return handleResponse(res)
}

export async function fetchPaymentHistory(session: SubscriberSession): Promise<Payment[]> {
  const params = new URLSearchParams({ email: session.email, token: session.access_token })
  const res = await fetch(`${API_URL}/api/payments/history?${params.toString()}`)
  return handleResponse(res)
}

export async function cancelSubscription(session: SubscriberSession, subscriptionId: string): Promise<Subscription> {
  const res = await fetch(`${API_URL}/api/payments/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: session.email, token: session.access_token, subscription_id: subscriptionId }),
  })
  return handleResponse(res)
}
