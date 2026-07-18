import { supabase } from '@/lib/supabase'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export async function institutionFetch(path: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not signed in')

  const res = await fetch(API_URL + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      ...(options.headers || {}),
    },
  })

  const json = await res.json()
  if (!res.ok) {
    const err: any = new Error(json.error || 'Request failed')
    err.status = res.status
    throw err
  }
  return json
}

const PENDING_KEY = 'elimux-pending-institution-registration'

export function savePendingInstitutionRegistration(data: { institution_id: string; contact_name: string }) {
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(data))
}

export function takePendingInstitutionRegistration(): { institution_id: string; contact_name: string } | null {
  const raw = sessionStorage.getItem(PENDING_KEY)
  if (!raw) return null
  sessionStorage.removeItem(PENDING_KEY)
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}
