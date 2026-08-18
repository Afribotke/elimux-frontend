===START===

## KIMI DESIGN (Current)

# INSTRUCTION 018 (CORRECTED): Build Paystack disbursement service for bursary payouts

**Background:** Paystack is ElimuX's live payment processor. We use Paystack's Transfer API to disburse bursary funds to students' M-Pesa wallets. This replaces direct M-Pesa Daraja integration. The existing `bursary_mpesa_transactions` table (Cycle 017) is reserved for future direct M-Pesa integration. Paystack transfers use a new table: `bursary_paystack_transfers`.

**CRITICAL BLOCKER:** The live Paystack secret key (`sk_live_...`) is returning `401 Invalid key` from Paystack's API. This is an account-level issue (merchant review pending). The code below is correct, but **actual money movement will fail until Paystack resolves the key issue.** The founder must contact Paystack support to confirm what "pending review" blocks.

---

## Task 1 — Create Paystack transfers table migration

Create `elimux-sql/46_create_bursary_paystack_transfers.sql` with this exact content:

```sql
CREATE TABLE IF NOT EXISTS bursary_paystack_transfers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    disbursement_id uuid REFERENCES bursary_disbursements(id),
    recipient_code text NOT NULL,
    transfer_code text UNIQUE,
    reference text UNIQUE,
    amount numeric NOT NULL,
    currency varchar(3) DEFAULT 'KES',
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'reversed', 'otp')),
    paystack_recipient_id bigint,
    paystack_transfer_id bigint,
    reason text,
    recipient_name text,
    recipient_phone text,
    recipient_account text,
    recipient_bank_code text,
    paystack_fee numeric,
    failed_reason text,
    paid_at timestamptz,
    failed_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_paystack_transfers_tenant ON bursary_paystack_transfers(tenant_id);
CREATE INDEX idx_paystack_transfers_disbursement ON bursary_paystack_transfers(disbursement_id);
CREATE INDEX idx_paystack_transfers_status ON bursary_paystack_transfers(status);
CREATE INDEX idx_paystack_transfers_reference ON bursary_paystack_transfers(reference);
CREATE INDEX idx_paystack_transfers_code ON bursary_paystack_transfers(transfer_code);

ALTER TABLE bursary_paystack_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "paystack_tenant_admin" ON bursary_paystack_transfers
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM user_tenant_roles
            WHERE user_id = auth.uid()
            AND role IN ('admin', 'super_admin', 'finance')
            AND status = 'active'
        )
    );
```

Run this migration against the live database using the Supabase MCP tool (same method as Cycle 017).

## Task 2 — Create Paystack disbursement library

Create `elimux-backend/src/lib/paystack-disbursement.ts` with:

```typescript
import { createHash, createHmac } from 'crypto';

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE = 'https://api.paystack.co';

if (!PAYSTACK_SECRET) {
  console.error('[Paystack] PAYSTACK_SECRET_KEY missing. Disbursement disabled.');
}

async function paystackRequest(path: string, options: RequestInit = {}) {
  const url = `${PAYSTACK_BASE}${path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${PAYSTACK_SECRET}`,
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(url, { ...options, headers });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Paystack API error: ${data.message || response.statusText}`);
  }

  return data;
}

// Create a transfer recipient (M-Pesa mobile money or bank)
export async function createRecipient(
  name: string,
  phoneNumber: string,
  accountNumber?: string,
  bankCode?: string
) {
  const isMobileMoney = !bankCode || bankCode === 'MPESA';

  const payload = {
    type: isMobileMoney ? 'mobile_money' : 'nuban',
    name,
    account_number: isMobileMoney ? phoneNumber : accountNumber,
    bank_code: isMobileMoney ? 'MPESA' : bankCode,
    currency: 'KES',
  };

  const { data } = await paystackRequest('/transferrecipient', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return data;
}

// Initiate a transfer
export async function initiateTransfer(
  amount: number,
  recipientCode: string,
  reason: string,
  reference?: string
) {
  const { data } = await paystackRequest('/transfer', {
    method: 'POST',
    body: JSON.stringify({
      source: 'balance',
      amount: Math.round(amount * 100),
      recipient: recipientCode,
      reason,
      reference: reference || `BURSARY_${Date.now()}`,
    }),
  });

  return data;
}

// Verify a transfer status
export async function verifyTransfer(transferCode: string) {
  const { data } = await paystackRequest(`/transfer/${transferCode}`);
  return data;
}

// Parse Paystack webhook payload
export function parseWebhookEvent(payload: any) {
  const event = payload.event;
  const data = payload.data;

  return {
    event,
    transferCode: data?.transfer_code,
    reference: data?.reference,
    status: data?.status,
    amount: data?.amount ? data.amount / 100 : 0,
    recipient: data?.recipient,
    reason: data?.reason,
    createdAt: data?.created_at,
    paidAt: data?.paid_at,
    failedAt: data?.failed_at,
  };
}

// Verify webhook signature using existing lib/paystack.ts pattern
export function verifyWebhookSignature(payload: string, signature: string): boolean {
  if (!PAYSTACK_SECRET) return false;
  const hash = createHmac('sha512', PAYSTACK_SECRET).update(payload).digest('hex');
  return hash === signature;
}

// Normalize Kenyan phone number
export function normalizePhone(phone: string): string {
  let normalized = phone.replace(/\D/g, '');
  if (normalized.startsWith('0')) normalized = '254' + normalized.slice(1);
  if (!normalized.startsWith('254') || normalized.length !== 12) {
    throw new Error('Invalid phone. Use 07XX XXX XXX or 2547XX XXX XXX');
  }
  return normalized;
}
```

## Task 3 — Create tenant middleware (if not exists)

If `elimux-backend/src/middleware/tenant.ts` does not exist, create it:

```typescript
import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      tenantId?: string | null;
    }
  }
}

export function resolveTenant(req: Request, res: Response, next: NextFunction) {
  // Phase 1: header-based tenant resolution
  // Future: subdomain-based resolution from Host header
  const tenantId = req.headers['x-tenant-id'] as string;
  req.tenantId = tenantId || null;
  next();
}
```

If the file already exists, confirm it sets `req.tenantId` and does not break existing routes.

## Task 4 — Create bursary payment routes

Create `elimux-backend/src/routes/bursary-payments.ts` with:

```typescript
import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { adminAuth } from '../middleware/auth';
import { resolveTenant } from '../middleware/tenant';
import {
  createRecipient,
  initiateTransfer,
  verifyTransfer,
  parseWebhookEvent,
  verifyWebhookSignature,
  normalizePhone,
} from '../lib/paystack-disbursement';

const router = Router();

// Apply tenant resolution BEFORE adminAuth on all routes in this router
router.use(resolveTenant);

// POST /api/bursary/payments/paystack/initiate
router.post('/paystack/initiate', adminAuth, async (req, res) => {
  const tenantId = req.tenantId;
  const { applicationId, phoneNumber, amount, recipientName, reason } = req.body;

  if (!tenantId) return res.status(400).json({ error: 'Tenant required. Pass x-tenant-id header.' });
  if (!applicationId || !phoneNumber || !amount || amount <= 0) {
    return res.status(400).json({ error: 'applicationId, phoneNumber, and positive amount required' });
  }

  try {
    const { data: app } = await supabase
      .from('bursary_applications')
      .select('id, applicant_id, tenant_id, status')
      .eq('id', applicationId)
      .eq('tenant_id', tenantId)
      .single();

    if (!app) return res.status(404).json({ error: 'Application not found' });
    if (app.status !== 'approved') return res.status(400).json({ error: 'Application must be approved' });

    const normalizedPhone = normalizePhone(phoneNumber);
    const name = recipientName || 'Bursary Recipient';

    const recipient = await createRecipient(name, normalizedPhone);

    const { data: disbursement, error: dErr } = await supabase
      .from('bursary_disbursements')
      .insert({
        application_id: applicationId,
        tenant_id: tenantId,
        applicant_id: app.applicant_id,
        amount,
        currency: 'KES',
        method: 'mpesa',
        status: 'initiated',
      })
      .select()
      .single();

    if (dErr) throw dErr;

    const reference = `BURSARY_${tenantId}_${disbursement.id}_${Date.now()}`;
    const transfer = await initiateTransfer(amount, recipient.recipient_code, reason || 'Bursary disbursement', reference);

    const { error: tErr } = await supabase
      .from('bursary_paystack_transfers')
      .insert({
        tenant_id: tenantId,
        disbursement_id: disbursement.id,
        recipient_code: recipient.recipient_code,
        transfer_code: transfer.transfer_code,
        reference: transfer.reference,
        amount,
        currency: 'KES',
        status: transfer.status === 'success' ? 'success' : 'pending',
        paystack_recipient_id: recipient.id,
        paystack_transfer_id: transfer.id,
        reason: reason || 'Bursary disbursement',
        recipient_name: name,
        recipient_phone: normalizedPhone,
        recipient_account: recipient.details?.account_number,
        recipient_bank_code: recipient.details?.bank_code,
      });

    if (tErr) throw tErr;

    return res.status(200).json({
      success: true,
      message: 'Transfer initiated',
      transferCode: transfer.transfer_code,
      reference: transfer.reference,
      status: transfer.status,
      disbursementId: disbursement.id,
    });
  } catch (error: any) {
    console.error('[Bursary Paystack] Initiate error:', error.message);
    return res.status(500).json({
      error: 'Failed to initiate transfer',
      details: error.message,
    });
  }
});

// POST /api/bursary/payments/paystack/webhook
// Public: Paystack calls this
router.post('/paystack/webhook', async (req, res) => {
  const signature = req.headers['x-paystack-signature'] as string;
  const payload = JSON.stringify(req.body);

  if (!verifyWebhookSignature(payload, signature)) {
    return res.status(401).send('Unauthorized');
  }

  res.status(200).send('OK');

  const event = parseWebhookEvent(req.body);
  if (!event.transferCode) return;

  const { data: transfers } = await supabase
    .from('bursary_paystack_transfers')
    .select('id, disbursement_id, tenant_id')
    .eq('transfer_code', event.transferCode);

  if (!transfers || transfers.length === 0) {
    console.error('[Paystack Webhook] Unknown transfer:', event.transferCode);
    return;
  }

  const transfer = transfers[0];

  await supabase
    .from('bursary_paystack_transfers')
    .update({
      status: event.status,
      paid_at: event.status === 'success' ? event.paidAt : null,
      failed_at: event.status === 'failed' ? event.failedAt : null,
      failed_reason: event.status === 'failed' ? event.reason : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', transfer.id);

  await supabase
    .from('bursary_disbursements')
    .update({
      status: event.status === 'success' ? 'completed' : event.status === 'failed' ? 'failed' : 'initiated',
      transaction_details: {
        paystackTransferCode: event.transferCode,
        paystackReference: event.reference,
        status: event.status,
        paidAt: event.paidAt,
        failedAt: event.failedAt,
      },
    })
    .eq('id', transfer.disbursement_id);

  console.log('[Paystack Webhook] Processed:', {
    transferCode: event.transferCode,
    status: event.status,
    amount: event.amount,
  });
});

// GET /api/bursary/payments/paystack/status/:transferCode
router.get('/paystack/status/:transferCode', adminAuth, async (req, res) => {
  const tenantId = req.tenantId;
  const { transferCode } = req.params;

  if (!tenantId) return res.status(400).json({ error: 'Tenant required' });

  const { data, error } = await supabase
    .from('bursary_paystack_transfers')
    .select('*')
    .eq('transfer_code', transferCode)
    .eq('tenant_id', tenantId)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Transfer not found' });

  return res.status(200).json({
    status: data.status,
    amount: data.amount,
    recipientName: data.recipient_name,
    recipientPhone: data.recipient_phone,
    reference: data.reference,
    transferCode: data.transfer_code,
    paidAt: data.paid_at,
    failedAt: data.failed_at,
    createdAt: data.created_at,
  });
});

// POST /api/bursary/payments/paystack/verify/:transferCode
router.post('/paystack/verify/:transferCode', adminAuth, async (req, res) => {
  const tenantId = req.tenantId;
  const { transferCode } = req.params;

  if (!tenantId) return res.status(400).json({ error: 'Tenant required' });

  try {
    const paystackData = await verifyTransfer(transferCode);

    await supabase
      .from('bursary_paystack_transfers')
      .update({
        status: paystackData.status,
        paid_at: paystackData.paid_at,
        updated_at: new Date().toISOString(),
      })
      .eq('transfer_code', transferCode)
      .eq('tenant_id', tenantId);

    return res.status(200).json({
      paystackStatus: paystackData.status,
      amount: paystackData.amount / 100,
      recipient: paystackData.recipient,
      createdAt: paystackData.created_at,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Verification failed', details: error.message });
  }
});

export default router;
```

## Task 5 — Mount the route

In `elimux-backend/src/index.ts`, add:
```typescript
import bursaryPaymentsRouter from './routes/bursary-payments';
```
And mount:
```typescript
app.use('/api/bursary/payments', bursaryPaymentsRouter);
```
Confirm this does NOT collide with existing `/api/payments` routes.

## Task 6 — Build check

Run `npm run build` in `elimux-backend`. Must pass with zero errors.

## Task 7 — Commit

```bash
git add -A
git commit -m "cycle-018: add Paystack disbursement service for bursary payouts"
git push origin main
```

## Acceptance Criteria

- [ ] bursary_paystack_transfers table created and migrated (Task 1)
- [ ] lib/paystack-disbursement.ts created using native fetch() (Task 2)
- [ ] middleware/tenant.ts created with resolveTenant (Task 3)
- [ ] routes/bursary-payments.ts created with all 4 endpoints (Task 4)
- [ ] Route mounted at /api/bursary/payments without collision (Task 5)
- [ ] Webhook signature verification uses HMAC-SHA512 (not commented out)
- [ ] req.tenantId is set by resolveTenant middleware before adminAuth
- [ ] npm run build passes in elimux-backend
- [ ] Committed and pushed

## Risk

- DO NOT modify existing /api/payments routes
- DO NOT delete the existing payments-mpesa.ts stub
- The live Paystack key is currently rejected (401 Invalid key) — actual transfers will fail until Paystack resolves the account issue. The code is correct and will work once the key is valid.
- bursary_mpesa_transactions (Cycle 017) is intentionally left unused — reserved for future direct M-Pesa integration
===END===
