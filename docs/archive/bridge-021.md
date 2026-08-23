===START===

## KIMI DESIGN (Current)

# INSTRUCTION 021: Test Paystack disbursement end-to-end

**Background:** Paystack key is now activated. Cycle 018 built the disbursement service but never tested it against real Paystack API. We need to verify the full flow works: recipient creation, transfer initiation, webhook callback, and database updates.

**Task 1 — Verify Paystack API access:**
In `elimux-backend`, run a quick test using the existing `lib/paystack-disbursement.ts`:

```typescript
// Temporary test script — run once, do not commit
import { createRecipient, initiateTransfer, verifyTransfer } from './src/lib/paystack-disbursement';

async function test() {
  try {
    // Test 1: Create a recipient (your own phone number for safety)
    const recipient = await createRecipient('Test Recipient', '2547XXXXXXXX');
    console.log('Recipient created:', recipient.recipient_code);

    // Test 2: Initiate a small transfer (KES 10)
    const transfer = await initiateTransfer(10, recipient.recipient_code, 'Test disbursement');
    console.log('Transfer initiated:', transfer.transfer_code, transfer.status);

    // Test 3: Verify immediately
    const status = await verifyTransfer(transfer.transfer_code);
    console.log('Transfer status:', status.status);

    return { recipient, transfer, status };
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
}
```

Run this test. Report:
- Does createRecipient succeed? What recipient_code is returned?
- Does initiateTransfer succeed? What transfer_code and status?
- Does verifyTransfer return the transfer details?
- Any errors from Paystack API?

**Task 2 — Verify webhook handling:**
After initiating the test transfer:
- Check Paystack dashboard for the transfer status
- If Paystack sends a webhook to https://api.elimux.ke/api/bursary/payments/paystack/webhook, check Railway logs for the webhook processing
- Verify the webhook signature verification works (check logs for `[Paystack Webhook] Processed:` or errors)
- Check if bursary_paystack_transfers and bursary_disbursements tables were updated
- If no webhook was received (Paystack may not send webhooks for test transfers), manually simulate one:
```bash
curl -X POST https://api.elimux.ke/api/bursary/payments/paystack/webhook \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: TEST_SIGNATURE" \
  -d '{"event":"transfer.success","data":{"transfer_code":"TEST_CODE","reference":"TEST_REF","status":"success","amount":1000,"recipient":{"name":"Test"}}}'
```
Report what the webhook endpoint returns (200, 401, 500, etc.).

**Task 4 — Fix any issues found:**
If any step fails:
- Paystack API errors: Report exact error message and code
- Webhook signature failures: Debug the HMAC verification
- Database insert failures: Check column names and types match
- Fix issues and re-test

**Task 5 — Document results:**
Write a summary to docs/bridge.md CLAUDE EXECUTION:
- What worked
- What failed
- What was fixed
- Whether the disbursement service is ready for production use

**Acceptance Criteria:**
- [ ] Paystack API responds successfully to recipient creation
- [ ] Transfer initiation returns a valid transfer code
- [ ] Webhook endpoint responds correctly (200 for valid, 401 for invalid signature)
- [ ] Database records are created and updated
- [ ] Any issues are fixed and re-tested
- [ ] Summary documented

**Risk:** Use small amounts (KES 10) for testing. Use your own phone number. Delete all test data after verification. DO NOT test with real applicant data until the flow is confirmed working.
===END===
