const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export interface PaystackInitializeParams {
  email: string;
  amount: number; // in kobo (smallest currency unit)
  plan?: string;
  metadata?: Record<string, unknown>;
  callback_url?: string;
  userId?: string;
}

export interface PaystackInitializeResult {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export async function initializePaystackPayment(
  params: PaystackInitializeParams
): Promise<PaystackInitializeResult> {
  const res = await fetch(`${API_BASE}/api/payments/paystack/initialize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Paystack initialization failed (${res.status})`);
  }

  return res.json();
}

export async function verifyPaystackPayment(reference: string) {
  const res = await fetch(
    `${API_BASE}/api/payments/paystack/verify/${encodeURIComponent(reference)}`
  );
  if (!res.ok) throw new Error("Failed to verify Paystack payment");
  return res.json();
}

export async function getPaystackSubscription(userId?: string) {
  const url = userId
    ? `${API_BASE}/api/payments/paystack/subscription?userId=${encodeURIComponent(userId)}`
    : `${API_BASE}/api/payments/paystack/subscription`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch Paystack subscription");
  return res.json();
}

export async function cancelPaystackSubscription(code: string, token: string) {
  const res = await fetch(`${API_BASE}/api/payments/paystack/subscription/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, token }),
  });
  if (!res.ok) throw new Error("Failed to cancel Paystack subscription");
  return res.json();
}

export async function getPaystackHistory(userId?: string) {
  const url = userId
    ? `${API_BASE}/api/payments/paystack/history?userId=${encodeURIComponent(userId)}`
    : `${API_BASE}/api/payments/paystack/history`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch Paystack history");
  return res.json();
}
