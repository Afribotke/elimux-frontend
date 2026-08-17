===START===

## KIMI DESIGN (Current)

# INSTRUCTION 013: Implement M-Pesa STK Push payment endpoint

**Background:** M-Pesa is the primary payment method for Kenyan users. We need a backend endpoint that initiates an STK Push (Safaricom Daraja API) and handles the callback.

**Task 1 — Check existing M-Pesa code:**
In elimux-backend, search for existing M-Pesa integration. Run:
```bash
grep -rn "mpesa\|daraja\|stkpush\|lipa_na_mpes" src/ --include="*.ts" -i
Report what exists.
Task 2 — Install dependencies if needed:
If axios is not installed, run: npm install axios
Then run: npm run build to verify.
Task 3 — Create M-Pesa service:
Create elimux-backend/src/lib/mpesa.ts with this content:
import axios from 'axios';

const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const PASSKEY = process.env.MPESA_PASSKEY;
const SHORTCODE = process.env.MPESA_SHORTCODE || '174379'; // Test shortcode
const CALLBACK_URL = process.env.MPESA_CALLBACK_URL || `${process.env.FRONTEND_URL}/api/payments/mpesa-callback`;

if (!CONSUMER_KEY || !CONSUMER_SECRET || !PASSKEY) {
  console.error('M-Pesa credentials missing. Set MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_PASSKEY');
}

interface StkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage?: string;
}

export async function getAccessToken(): Promise<string> {
  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
  const response = await axios.get(
    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    { headers: { Authorization: `Basic ${auth}` } }
  );
  return response.data.access_token;
}

export async function initiateStkPush(
  phoneNumber: string,
  amount: number,
  accountReference: string,
  transactionDesc: string
): Promise<StkPushResponse> {
  const token = await getAccessToken();
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
  const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');

  const response = await axios.post(
    'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
    {
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: SHORTCODE,
      PhoneNumber: phoneNumber,
      CallBackURL: CALLBACK_URL,
      AccountReference: accountReference.slice(0, 12),
      TransactionDesc: transactionDesc.slice(0, 13),
    },
    { headers: { Authorization: `Bearer ${token}` } }
  );

  return response.data;
}

export function validateCallback(data: any): boolean {
  // Validate callback data structure
  return (
    data &&
    data.Body &&
    data.Body.stkCallback &&
    data.Body.stkCallback.ResultCode !== undefined
  );
}

export function getCallbackResult(data: any): {
  success: boolean;
  resultCode: number;
  resultDesc: string;
  checkoutRequestId: string;
  merchantRequestId: string;
  amount?: number;
  mpesaReceiptNumber?: string;
  transactionDate?: string;
  phoneNumber?: string;
} {
  const callback = data.Body.stkCallback;
  const resultCode = parseInt(callback.ResultCode, 10);
  const success = resultCode === 0;

  const metadata: Record<string, string> = {};
  if (callback.CallbackMetadata && callback.CallbackMetadata.Item) {
    for (const item of callback.CallbackMetadata.Item) {
      if (item.Name && item.Value !== undefined) {
        metadata[item.Name] = String(item.Value);
      }
    }
  }

  return {
    success,
    resultCode,
    resultDesc: callback.ResultDesc,
    checkoutRequestId: callback.CheckoutRequestID,
    merchantRequestId: callback.MerchantRequestID,
    amount: metadata.Amount ? parseFloat(metadata.Amount) : undefined,
    mpesaReceiptNumber: metadata.MpesaReceiptNumber,
    transactionDate: metadata.TransactionDate,
    phoneNumber: metadata.PhoneNumber,
  };
}
Task 4 — Create payment routes:
Create elimux-backend/src/routes/payments.ts with this content:
import { Router } from 'express';
import { requireUser } from '../middleware/user-auth';
import { initiateStkPush, validateCallback, getCallbackResult } from '../lib/mpesa';
import { supabase } from '../lib/supabase';

const router = Router();

// Initiate STK Push
router.post('/mpesa/initiate', requireUser, async (req, res) => {
  const { phoneNumber, amount, accountReference, transactionDesc } = req.body;

  // Basic validation
  if (!phoneNumber || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Phone number and positive amount required' });
  }

  // Normalize phone number (2547XXXXXXXX format)
  let normalizedPhone = phoneNumber.replace(/\D/g, '');
  if (normalizedPhone.startsWith('0')) {
    normalizedPhone = '254' + normalizedPhone.slice(1);
  }
  if (!normalizedPhone.startsWith('254') || normalizedPhone.length !== 12) {
    return res.status(400).json({ error: 'Invalid phone number. Use 07XX XXX XXX or 2547XX XXX XXX format' });
  }

  try {
    const result = await initiateStkPush(
      normalizedPhone,
      amount,
      accountReference || 'ElimuX',
      transactionDesc || 'Payment'
    );

    // Store pending transaction
    await supabase.from('payments').insert({
      user_id: req.userId,
      checkout_request_id: result.CheckoutRequestID,
      merchant_request_id: result.MerchantRequestID,
      amount,
      phone_number: normalizedPhone,
      status: 'pending',
      provider: 'mpesa',
      account_reference: accountReference,
      description: transactionDesc,
    });

    return res.status(200).json({
      success: result.ResponseCode === '0',
      message: result.CustomerMessage || result.ResponseDescription,
      checkoutRequestId: result.CheckoutRequestID,
      merchantRequestId: result.MerchantRequestID,
    });
  } catch (error: any) {
    console.error('M-Pesa STK Push error:', error.response?.data || error.message);
    return res.status(500).json({
      error: 'Failed to initiate M-Pesa payment',
      details: error.response?.data || error.message,
    });
  }
});

// Handle M-Pesa callback
router.post('/mpesa-callback', async (req, res) => {
  // Safaricom expects 200 OK immediately, then we process asynchronously
  res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });

  const data = req.body;

  if (!validateCallback(data)) {
    console.error('Invalid M-Pesa callback payload:', data);
    return;
  }

  const result = getCallbackResult(data);

  // Update payment record
  const { error } = await supabase
    .from('payments')
    .update({
      status: result.success ? 'completed' : 'failed',
      result_code: result.resultCode,
      result_description: result.resultDesc,
      mpesa_receipt_number: result.mpesaReceiptNumber,
      transaction_date: result.transactionDate,
      processed_at: new Date().toISOString(),
    })
    .eq('checkout_request_id', result.checkoutRequestId);

  if (error) {
    console.error('Failed to update payment record:', error);
  }

  // Log for audit
  console.log('M-Pesa callback processed:', {
    checkoutRequestId: result.checkoutRequestId,
    success: result.success,
    receipt: result.mpesaReceiptNumber,
  });
});

// Query payment status
router.get('/mpesa/status/:checkoutRequestId', requireUser, async (req, res) => {
  const { checkoutRequestId } = req.params;

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('checkout_request_id', checkoutRequestId)
    .eq('user_id', req.userId)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'Payment not found' });
  }

  return res.status(200).json({
    status: data.status,
    amount: data.amount,
    phoneNumber: data.phone_number,
    mpesaReceiptNumber: data.mpesa_receipt_number,
    createdAt: data.created_at,
    processedAt: data.processed_at,
  });
});

export default router;
Task 5 — Mount the route:
In elimux-backend/src/index.ts, add:
TypeScript
import paymentsRouter from './routes/payments';
And mount:
TypeScript
app.use('/api/payments', paymentsRouter);
Task 6 — Create payments table migration:
Create elimux-sql/NNN_create_payments_table.sql
sql
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  checkout_request_id text NOT NULL UNIQUE,
  merchant_request_id text NOT NULL,
  amount numeric NOT NULL,
  phone_number text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  provider text NOT NULL DEFAULT 'mpesa',
  account_reference text,
  description text,
  result_code int,
  result_description text,
  mpesa_receipt_number text,
  transaction_date text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_checkout ON payments(checkout_request_id);
CREATE INDEX idx_payments_status ON payments(status);

-- RLS: Users can only see their own payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own payments" ON payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin can manage all payments
CREATE POLICY "Admins manage payments" ON payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );
Run the migration against the live database.
Task 7 — Build check:
Run npm run build in elimux-backend. Must pass with zero errors.
Task 8 — Environment variables check:
Confirm these are set in Railway:
MPESA_CONSUMER_KEY
MPESA_CONSUMER_SECRET
MPESA_PASSKEY
MPESA_SHORTCODE (optional, defaults to test 174379)
MPESA_CALLBACK_URL (optional, defaults to FRONTEND_URL + /api/payments/mpesa-callback)
FRONTEND_URL
Report which are present and which are missing.
Acceptance Criteria:
[ ] M-Pesa service created at src/lib/mpesa.ts
[ ] Payment routes created at src/routes/payments.ts
[ ] Route mounted at /api/payments
[ ] STK Push endpoint at /api/payments/mpesa/initiate (protected by requireUser)
[ ] Callback endpoint at /api/payments/mpesa-callback (public, returns 200 immediately)
[ ] Status query endpoint at /api/payments/mpesa/status/:checkoutRequestId (protected)
[ ] Payments table migration created and run
[ ] npm run build passes in elimux-backend
[ ] Environment variables confirmed present in Railway
Risk: This uses the Safaricom sandbox. For production, the URLs change to api.safaricom.co.ke. DO NOT hardcode production credentials. The callback URL must be publicly accessible (Railway deployed URL). If testing locally, use ngrok or similar tunnel.
===END===