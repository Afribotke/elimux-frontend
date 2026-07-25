const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export interface StripeSession {
  sessionId: string;
  url: string;
}

export async function createStripeSession(params: {
  planId: string;
  successUrl: string;
  cancelUrl: string;
  userId?: string;
  email?: string;
}): Promise<StripeSession> {
  const res = await fetch(`${API_BASE}/api/payments/stripe/create-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Stripe session failed (${res.status})`);
  }

  return res.json();
}

export async function getStripeSubscription(userId: string) {
  const res = await fetch(`${API_BASE}/api/payments/stripe/subscription?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error("Failed to fetch subscription");
  return res.json();
}

export async function cancelStripeSubscription(subscriptionId: string) {
  const res = await fetch(`${API_BASE}/api/payments/stripe/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscriptionId }),
  });
  if (!res.ok) throw new Error("Failed to cancel subscription");
  return res.json();
}
