const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

export interface AdPaymentReceipt {
  id: string
  amount: number
  status: 'pending' | 'paid' | 'failed'
  paystack_reference: string
  paid_at: string | null
  created_at: string
  advertiser: { organization_name: string | null; email: string } | null
}

export async function fetchAdPaymentReceipt(reference: string): Promise<AdPaymentReceipt | null> {
  const res = await fetch(`${API_URL}/api/advertiser/payments/paystack/receipt/${encodeURIComponent(reference)}`)
  if (res.status === 404) return null
  const body = await res.json()
  if (!res.ok) throw new Error(body.error || 'Request failed')
  return body.data as AdPaymentReceipt
}
