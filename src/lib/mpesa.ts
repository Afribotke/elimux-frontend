const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export interface MpesaPaymentParams {
  phoneNumber: string;
  amount: number;
  accountReference?: string;
  transactionDesc?: string;
  userId?: string;
}

export interface MpesaPaymentResult {
  checkoutRequestId: string;
  merchantRequestId: string;
  responseCode: string;
  responseDescription: string;
  customerMessage: string;
}

export async function initiateMpesaPayment(params: MpesaPaymentParams): Promise<MpesaPaymentResult> {
  const res = await fetch(`${API_BASE}/api/payments/mpesa/stk-push`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `M-Pesa STK push failed (${res.status})`);
  }

  return res.json();
}

export async function checkMpesaStatus(checkoutRequestId: string) {
  const res = await fetch(
    `${API_BASE}/api/payments/mpesa/status?checkoutRequestId=${encodeURIComponent(checkoutRequestId)}`
  );
  if (!res.ok) throw new Error("Failed to check M-Pesa status");
  return res.json();
}

export async function getMpesaHistory(userId?: string) {
  const url = userId
    ? `${API_BASE}/api/payments/mpesa/history?userId=${encodeURIComponent(userId)}`
    : `${API_BASE}/api/payments/mpesa/history`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch M-Pesa history");
  return res.json();
}
