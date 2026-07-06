const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

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

async function adminPost(path: string, data: object, adminKey: string) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey,
    },
    body: JSON.stringify(data),
  })

  const json = await res.json().catch(() => null)

  if (!res.ok || !json?.success) {
    if (res.status === 403) throw new Error('Invalid admin key')
    throw new Error(json?.error || `Request failed (${res.status})`)
  }

  return json.data
}

export function createInstitution(data: object, adminKey: string) {
  return adminPost('/api/institutions', data, adminKey)
}

export function createProgram(data: object, adminKey: string) {
  return adminPost('/api/programs', data, adminKey)
}
