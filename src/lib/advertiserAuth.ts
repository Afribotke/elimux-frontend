import { supabase } from '@/lib/supabase'

export const ADVERTISER_LOGIN_PATH = '/advertiser/login'
const PENDING_REGISTRATION_KEY = 'elimux_pending_advertiser_registration'

export interface PendingAdvertiserRegistration {
  company_name: string
  company_email: string
  company_phone?: string
  company_website?: string
  industry_type: string
  tax_id?: string
  billing_address?: Record<string, string>
}

export function savePendingAdvertiserRegistration(data: PendingAdvertiserRegistration) {
  if (typeof window === 'undefined') return
  localStorage.setItem(PENDING_REGISTRATION_KEY, JSON.stringify(data))
}

export function takePendingAdvertiserRegistration(): PendingAdvertiserRegistration | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(PENDING_REGISTRATION_KEY)
  if (!raw) return null
  localStorage.removeItem(PENDING_REGISTRATION_KEY)
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

// Wraps fetch with the current Supabase session's access token and redirects
// to the advertiser login page on 401 (expired/missing session) or when no
// session exists at all - avoids repeating this in every advertiser page.
export async function advertiserFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    if (typeof window !== 'undefined') window.location.href = ADVERTISER_LOGIN_PATH
    throw new Error('Not authenticated')
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
      Authorization: `Bearer ${session.access_token}`,
    },
  })

  if (res.status === 401 && typeof window !== 'undefined') {
    window.location.href = ADVERTISER_LOGIN_PATH
  }

  return res
}

export function passwordStrengthError(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.'
  if (!/[A-Z]/.test(password)) return 'Password must include at least one uppercase letter.'
  if (!/[a-z]/.test(password)) return 'Password must include at least one lowercase letter.'
  if (!/[0-9]/.test(password)) return 'Password must include at least one number.'
  return null
}
