# docs/bridge.md — Cycle 161B: Patch — Email-First Router + Sandbox SMS

## Objective
Update the smart router to prioritize email as the default channel. Document that SMS remains sandbox-only. No new features — just alignment with the email-first decision.

## CRITICAL RULES
1. Do NOT drop any table.
2. Append-only to existing files. Do NOT replace.
3. Run `npx tsc --noEmit` after any change.
4. Do NOT commit or push until instructed.

---

## STEP 1: Update Smart Router in email.ts

Read the current `sendTemplatedMessage` function in `elimux-backend/src/lib/email.ts`. Replace ONLY the channel priority logic inside that function with this exact block:

```typescript
  // Priority: Email (default for now) → SMS (sandbox-only) → WhatsApp (not yet integrated) → enrichment flag
  
  // 1. Email — primary channel
  const email = person?.email || contact.email;
  if (template.channel_email && email && !contact.unsubscribed_email) {
    const result = await sendTemplatedEmail(template, contact, person, variables, sentBy, baseUrl, supabaseClient);
    return { ...result, channel: 'email' };
  }

  // 2. SMS — sandbox only, not for real outreach yet
  const phone = person?.phone || contact.phone;
  if (template.channel_sms && phone && !contact.unsubscribed_sms) {
    const result = await sendTemplatedSms(template, contact, person, variables, sentBy, supabaseClient);
    return { ...result, channel: 'sms' };
  }

  // 3. WhatsApp — Phase 4, not integrated
  const whatsappNumber = person?.whatsapp || contact.whatsapp_number;
  if (template.channel_whatsapp && whatsappNumber && !contact.unsubscribed_whatsapp) {
    return { success: false, error: 'WhatsApp not yet integrated', channel: 'whatsapp' };
  }

  // Nothing available
  return {
    success: false,
    error: 'No contact channel available. Needs enrichment: add email, phone, or WhatsApp.',
    channel: 'none',
  };
IMPORTANT: Only replace the channel priority block inside sendTemplatedMessage. Do NOT touch sendSms, sendTemplatedSms, sendTemplatedEmail, or any other function.
After editing, run:
powershell
cd elimux-backend
npx tsc --noEmit
Report: OK or exact errors.
STEP 2: Add Sandbox Warning Comment
In the same file (elimux-backend/src/lib/email.ts), find the sendSms function. Add this comment directly above the function signature:
TypeScript
/**
 * WARNING: AT_USERNAME is set to 'sandbox'.
 * Africa's Talking sandbox does NOT deliver to real phone numbers.
 * Only use this for testing with simulator-registered numbers.
 * For real outreach, switch to a production AT account first.
 */
Do NOT modify any code inside sendSms. Only add the comment above it.
Run npx tsc --noEmit again. Report: OK or errors.
STEP 3: Report Template
plain
## CYCLE 161B VALIDATION REPORT

### Changes Made
| File | Change | Status |
|---|---|---|
| elimux-backend/src/lib/email.ts | Router priority: email → sms → whatsapp | |
| elimux-backend/src/lib/email.ts | Sandbox warning comment added | |

### TypeScript Check
| Project | Result |
|---|---|
| elimux-backend | OK / ERRORS: ___ |

### Ready for live email outreach?
YES — email is primary, SMS is sandbox-only, WhatsApp is Phase 4.
CRITICAL RULES
Only patch the router priority block and add the comment.
Do NOT modify any other function.
Do NOT commit or push until instructed.