# docs/bridge.md — Cycle 161: Phase 3 — Africa's Talking SMS Integration

## Objective
Integrate Africa's Talking SMS into the unified CRM. Add SMS channel to templates, build smart routing (WhatsApp → Email → SMS → enrichment flag), create SMS send endpoint with delivery tracking, and register cost per message. WhatsApp remains schema-ready but not integrated yet.

## CRITICAL RULES
1. Do NOT drop any table.
2. Do NOT modify existing frontend pages or backend routes.
3. Append to `elimux-backend/src/lib/email.ts` — do NOT replace it.
4. Use `adminAuth` middleware on every new route.
5. Import shared `supabase` from `../lib/supabase` — do NOT instantiate a new client.
6. Run SQL one block at a time. Report EXACT output.
7. If any step fails, STOP and report the error.
8. Do NOT commit or push until instructed.
9. Validate with `npx tsc --noEmit` after any TypeScript change.

---

## STEP 0: Environment Check

Before writing code, verify these env vars exist. Report exact values (mask secrets).

```powershell
Get-Content elimux-backend/.env -ErrorAction SilentlyContinue | Select-String -Pattern "AFRICAS_TALKING|AT_USERNAME|AT_API_KEY|AT_SENDER"
Get-Content elimux-backend/.env.local -ErrorAction SilentlyContinue | Select-String -Pattern "AFRICAS_TALKING|AT_USERNAME|AT_API_KEY|AT_SENDER"
Get-Content elimux-frontend/.env.local -ErrorAction SilentlyContinue | Select-String -Pattern "AFRICAS_TALKING|AT_USERNAME|AT_API_KEY|AT_SENDER"
If ANY of these are missing, report exactly which ones, then STOP. Do not proceed without them.
STEP 1: Add SMS Bodies to Existing Templates
Run this SQL in Supabase SQL Editor:
sql
-- ============================================
-- 1.1 Update templates with SMS variants
-- ============================================
UPDATE crm_message_templates
SET 
  channel_sms = true,
  body_sms = CASE name
    WHEN 'University Partnership Invite' THEN 
      'Hello {{person_name}}, ElimuX partners with universities like {{contact_name}} to connect them with students. Visit: https://www.elimux.ke/institutions/{{slug}} or reply for more info. -{{assigned_rep_name}}'
    
    WHEN 'Company Attachment Partnership' THEN 
      'Hello {{person_name}}, ElimuX connects {{contact_name}} with talented interns. Register: https://www.elimux.ke/employers/register or reply for details. -{{assigned_rep_name}}'
    
    WHEN 'School Collaboration — ElimuX' THEN 
      'Dear Principal, ElimuX partners with schools in {{county}} to help students find scholarships & career paths. Reply to schedule a call. -{{assigned_rep_name}}'
    
    WHEN 'Private School Partnership — ElimuX SchoolConnect' THEN 
      'Hello {{person_name}}, grow {{contact_name}} enrollment with ElimuX SchoolConnect. Parents in {{county}} are searching. Learn more: https://www.elimux.ke/schools -{{assigned_rep_name}}'
    
    WHEN 'Follow-up — Checking In' THEN 
      'Hello {{person_name}}, following up on our ElimuX partnership for {{contact_name}}. Any questions? Reply or call +254 700 000 000. -{{assigned_rep_name}}'
    
    WHEN 'Re-engagement — Still Interested?' THEN 
      'Hello {{person_name}}, ElimuX now serves 10,000+ students monthly. Still interested in partnering with {{contact_name}}? See what is new: https://www.elimux.ke -{{assigned_rep_name}}'
  END
WHERE name IN (
  'University Partnership Invite',
  'Company Attachment Partnership',
  'School Collaboration — ElimuX',
  'Private School Partnership — ElimuX SchoolConnect',
  'Follow-up — Checking In',
  'Re-engagement — Still Interested?'
);

-- Report
SELECT name, channel_sms, LEFT(body_sms, 60) as body_preview 
FROM crm_message_templates 
WHERE channel_sms = true;
STEP 2: Append SMS Functions to email.ts
Read the current end of elimux-backend/src/lib/email.ts to find where to append. Then append this block after the last existing export:
TypeScript
// ============================================
// CRM SMS — Africa's Talking (appended, not replacing existing exports)
// ============================================

const AT_USERNAME = process.env.AT_USERNAME || process.env.AFRICAS_TALKING_USERNAME || '';
const AT_API_KEY = process.env.AT_API_KEY || process.env.AFRICAS_TALKING_API_KEY || '';
const AT_SENDER_ID = process.env.AT_SENDER_ID || process.env.AFRICAS_TALKING_SENDER || 'ELIMUX';

interface SendSmsOptions {
  to: string;
  message: string;
  from?: string;
}

interface SendSmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
  costKes?: number;
}

function normalizePhone(phone: string): string {
  // Convert to E.164 for Africa's Talking: +254XXXXXXXXX
  const cleaned = phone.replace(/\s/g, '').replace(/^0/, '+254').replace(/^254/, '+254');
  if (!cleaned.startsWith('+')) {
    return '+254' + cleaned;
  }
  return cleaned;
}

export async function sendSms(options: SendSmsOptions): Promise<SendSmsResult> {
  if (!AT_USERNAME || !AT_API_KEY) {
    console.warn('Africa''s Talking credentials not set — SMS not sent');
    return { success: false, error: 'AT_USERNAME or AT_API_KEY not configured' };
  }

  const to = normalizePhone(options.to);
  const message = options.message;
  const from = options.from || AT_SENDER_ID;

  // Africa's Talking charges per SMS segment (160 chars for GSM-7, 70 for Unicode)
  // Approximate cost: KES 0.80 per segment
  const segments = Math.ceil(message.length / 160);
  const costKes = segments * 0.80;

  try {
    const response = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'apiKey': AT_API_KEY,
      },
      body: new URLSearchParams({
        username: AT_USERNAME,
        to: to,
        message: message,
        from: from,
      }).toString(),
    });

    const data = await response.json();

    if (!response.ok || data.SMSMessageData?.Recipients?.[0]?.status !== 'Success') {
      const errorMsg = data.SMSMessageData?.Recipients?.[0]?.status ||
                       data.SMSMessageData?.Message ||
                       'Africa''s Talking API error';
      console.error('SMS send error:', errorMsg);
      return { success: false, error: errorMsg, costKes: 0 };
    }

    const recipient = data.SMSMessageData.Recipients[0];
    return {
      success: true,
      messageId: recipient.messageId,
      costKes,
    };
  } catch (error) {
    console.error('SMS send exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown SMS error',
      costKes: 0,
    };
  }
}

export async function sendTemplatedSms(
  template: any, // CRMMessageTemplate
  contact: any, // CRMContact
  person: any | null, // CRMContactPerson | null
  variables: Record<string, string>,
  sentBy: string,
  supabaseClient: any
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!template.channel_sms || !template.body_sms) {
    return { success: false, error: 'Template does not support SMS channel' };
  }

  const toPhone = person?.phone || contact.phone;
  if (!toPhone) {
    return { success: false, error: 'No phone number available' };
  }

  // Render template
  let body = template.body_sms;
  for (const [key, value] of Object.entries(variables)) {
    body = body.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
  }

  // Create message log
  const { data: messageLog, error: logError } = await supabaseClient
    .from('crm_messages')
    .insert({
      contact_id: contact.id,
      person_id: person?.id || null,
      template_id: template.id,
      channel: 'sms',
      body: body,
      status: 'queued',
      sent_by: sentBy,
    })
    .select('id')
    .single();

  if (logError || !messageLog) {
    return { success: false, error: `Failed to create message log: ${logError?.message}` };
  }

  // Send via Africa's Talking
  const result = await sendSms({ to: toPhone, message: body });

  // Update log
  await supabaseClient
    .from('crm_messages')
    .update({
      status: result.success ? 'sent' : 'failed',
      provider: 'africastalking',
      provider_msg_id: result.messageId || null,
      sent_at: result.success ? new Date().toISOString() : null,
      failed_at: result.success ? null : new Date().toISOString(),
      fail_reason: result.error || null,
      cost_kes: result.costKes || 0,
    })
    .eq('id', messageLog.id);

  // Update contact stats
  if (result.success) {
    await supabaseClient
      .from('crm_contacts')
      .update({
        last_contact_at: new Date().toISOString(),
        last_contact_via: 'sms',
        contact_count: (contact.contact_count || 0) + 1,
      })
      .eq('id', contact.id);
  }

  return { success: result.success, messageId: result.messageId, error: result.error };
}

// Smart channel router: picks best available channel for a contact
export async function sendTemplatedMessage(
  template: any,
  contact: any,
  person: any | null,
  variables: Record<string, string>,
  sentBy: string,
  baseUrl: string,
  supabaseClient: any
): Promise<{ success: boolean; messageId?: string; error?: string; channel?: string }> {
  // Priority: WhatsApp (not yet integrated) → Email → SMS → flag for enrichment
  
  // Check WhatsApp (schema-ready but not integrated yet)
  const whatsappNumber = person?.whatsapp || contact.whatsapp_number;
  if (template.channel_whatsapp && whatsappNumber && !contact.unsubscribed_whatsapp) {
    // Phase 4: WhatsApp Business API integration
    return { success: false, error: 'WhatsApp not yet integrated', channel: 'whatsapp' };
  }

  // Check Email
  const email = person?.email || contact.email;
  if (template.channel_email && email && !contact.unsubscribed_email) {
    const result = await sendTemplatedEmail(template, contact, person, variables, sentBy, baseUrl, supabaseClient);
    return { ...result, channel: 'email' };
  }

  // Check SMS
  const phone = person?.phone || contact.phone;
  if (template.channel_sms && phone && !contact.unsubscribed_sms) {
    const result = await sendTemplatedSms(template, contact, person, variables, sentBy, supabaseClient);
    return { ...result, channel: 'sms' };
  }

  // Nothing available
  return {
    success: false,
    error: 'No contact channel available. Needs enrichment: add email, phone, or WhatsApp.',
    channel: 'none',
  };
}
IMPORTANT: Read the current email.ts first. Find the last export statement. Append the new code AFTER it. Do NOT delete or modify any existing line.
After appending, run:
powershell
cd elimux-backend
npx tsc --noEmit
Report the result (success or exact errors).
STEP 3: Add SMS + Smart Router Endpoints to crm.ts
Read the current elimux-backend/src/routes/crm.ts to understand its structure. Then append these routes BEFORE the export default router; line:
TypeScript
// ============================================
// SMS Routes (appended to existing crm.ts)
// ============================================

import { sendTemplatedSms, sendTemplatedMessage } from '../lib/email';

// POST /api/crm/send-sms — send templated SMS
crmRouter.post('/send-sms', adminAuth, async (req, res) => {
  try {
    const { contact_id, person_id, template_id, sent_by } = req.body;

    const { data: contact, error: contactError } = await supabase
      .from('crm_contacts')
      .select('*')
      .eq('id', contact_id)
      .single();

    if (contactError || !contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    let person = null;
    if (person_id) {
      const { data: p } = await supabase
        .from('crm_contact_people')
        .select('*')
        .eq('id', person_id)
        .single();
      if (p) person = p;
    }

    const { data: template } = await supabase
      .from('crm_message_templates')
      .select('*')
      .eq('id', template_id)
      .single();

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const { data: senderUser } = await supabase.auth.admin.getUserById(sent_by);
    const senderName = senderUser?.user?.user_metadata?.name || 'ElimuX Team';

    const variables = {
      contact_name: contact.name,
      person_name: person?.name || 'Sir/Madam',
      county: contact.county || 'your county',
      slug: contact.slug || '',
      assigned_rep_name: senderName,
      elimux_url: 'https://www.elimux.ke',
    };

    const result = await sendTemplatedSms(template, contact, person, variables, sent_by, supabase);

    if (result.success) {
      await supabase.rpc('increment_template_usage', { template_id });
      await supabase.from('crm_activities').insert({
        user_id: sent_by,
        action: 'sms_sent',
        entity_type: 'contact',
        entity_id: contact_id,
        metadata: { template_id, template_name: template.name, channel: 'sms' },
      });
      res.json({ success: true, messageId: result.messageId, channel: 'sms' });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// POST /api/crm/send — smart channel router (email → SMS → enrichment flag)
crmRouter.post('/send', adminAuth, async (req, res) => {
  try {
    const { contact_id, person_id, template_id, sent_by, base_url } = req.body;

    const { data: contact, error: contactError } = await supabase
      .from('crm_contacts')
      .select('*')
      .eq('id', contact_id)
      .single();

    if (contactError || !contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    let person = null;
    if (person_id) {
      const { data: p } = await supabase
        .from('crm_contact_people')
        .select('*')
        .eq('id', person_id)
        .single();
      if (p) person = p;
    }

    const { data: template } = await supabase
      .from('crm_message_templates')
      .select('*')
      .eq('id', template_id)
      .single();

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const { data: senderUser } = await supabase.auth.admin.getUserById(sent_by);
    const senderName = senderUser?.user?.user_metadata?.name || 'ElimuX Team';

    const variables = {
      contact_name: contact.name,
      person_name: person?.name || 'Sir/Madam',
      county: contact.county || 'your county',
      slug: contact.slug || '',
      assigned_rep_name: senderName,
      elimux_url: 'https://www.elimux.ke',
    };

    const result = await sendTemplatedMessage(template, contact, person, variables, sent_by, base_url || 'https://www.elimux.ke', supabase);

    if (result.success && result.channel) {
      await supabase.rpc('increment_template_usage', { template_id });
      await supabase.from('crm_activities').insert({
        user_id: sent_by,
        action: `${result.channel}_sent`,
        entity_type: 'contact',
        entity_id: contact_id,
        metadata: { template_id, template_name: template.name, channel: result.channel },
      });
      res.json({ success: true, messageId: result.messageId, channel: result.channel });
    } else if (result.channel === 'none') {
      res.status(400).json({
        success: false,
        error: result.error,
        needs_enrichment: true,
        contact_id,
      });
    } else {
      res.status(500).json({ success: false, error: result.error, channel: result.channel });
    }
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// GET /api/crm/contacts/needs-enrichment — list contacts missing all channels
crmRouter.get('/contacts/needs-enrichment', adminAuth, async (req, res) => {
  try {
    const { entity_type, page = '1', limit = '50' } = req.query;
    
    let query = supabase
      .from('crm_contacts')
      .select('*', { count: 'exact' })
      .is('email', null)
      .is('phone', null)
      .is('whatsapp_number', null)
      .not('id', 'in', (
        supabase.from('crm_contact_people').select('contact_id').not('email', 'is', null)
          .or('phone.not.is.null,whatsapp.not.is.null')
      ));

    if (entity_type) query = query.eq('entity_type', entity_type);

    const from = (parseInt(page as string) - 1) * parseInt(limit as string);
    const to = from + parseInt(limit as string) - 1;

    const { data, error, count } = await query
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    res.json({
      data: data || [],
      meta: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: count || 0,
        pages: Math.ceil((count || 0) / parseInt(limit as string)),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});
IMPORTANT: Read the current crm.ts first. Find export default router;. Append the new routes BEFORE that line. Do NOT delete or modify any existing route.
After appending, run:
powershell
cd elimux-backend
npx tsc --noEmit
Report the result.
STEP 4: Create Africa's Talking Delivery Webhook
Create elimux-frontend/src/app/api/crm/webhook/africastalking/route.ts:
TypeScript
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData();
    
    const messageId = body.get('id') as string;
    const status = body.get('status') as string; // Sent, Delivered, Failed
    const phoneNumber = body.get('phoneNumber') as string;
    const networkCode = body.get('networkCode') as string;
    const failureReason = body.get('failureReason') as string;
    const retryCount = body.get('retryCount') as string;

    // Find the message by provider_msg_id
    const { data: messages, error: findError } = await supabase
      .from('crm_messages')
      .select('id')
      .eq('provider_msg_id', messageId)
      .eq('channel', 'sms')
      .limit(1);

    if (findError || !messages || messages.length === 0) {
      console.warn('AT webhook: message not found for ID', messageId);
      return NextResponse.json({ received: true });
    }

    const messageRow = messages[0];

    // Map Africa's Talking status to our status
    let ourStatus = 'sent';
    const timestamp = new Date().toISOString();

    switch (status?.toLowerCase()) {
      case 'delivered':
        ourStatus = 'delivered';
        await supabase
          .from('crm_messages')
          .update({ status: 'delivered', delivered_at: timestamp })
          .eq('id', messageRow.id);
        break;
      case 'failed':
      case 'rejected':
        ourStatus = 'failed';
        await supabase
          .from('crm_messages')
          .update({ 
            status: 'failed', 
            failed_at: timestamp,
            fail_reason: failureReason || `Network: ${networkCode}`
          })
          .eq('id', messageRow.id);
        break;
      case 'sent':
        // Already recorded at send time, no update needed
        break;
      default:
        console.log('AT webhook: unhandled status', status);
    }

    return NextResponse.json({ received: true, status: ourStatus });
  } catch (error) {
    console.error('AT webhook error:', error);
    return NextResponse.json({ received: true, error: 'processing failed' }, { status: 200 });
  }
}
After creating, run:
powershell
cd elimux-frontend
npx tsc --noEmit
Report the result.
STEP 5: Validation
5.1 Templates have SMS bodies
sql
SELECT name, channel_sms, LENGTH(body_sms) as sms_length 
FROM crm_message_templates 
WHERE channel_sms = true;
5.2 Check env vars are accessible to backend
powershell
cd elimux-backend
node -e "console.log('AT_USERNAME:', process.env.AT_USERNAME ? 'SET' : 'MISSING'); console.log('AT_API_KEY:', process.env.AT_API_KEY ? 'SET' : 'MISSING'); console.log('AT_SENDER_ID:', process.env.AT_SENDER_ID || process.env.AFRICAS_TALKING_SENDER || 'FALLBACK:ELIMUX')"
5.3 TypeScript compilation
powershell
cd elimux-backend && npx tsc --noEmit
cd ../elimux-frontend && npx tsc --noEmit
Report: BACKEND OK / ERRORS: ___ | FRONTEND OK / ERRORS: ___
5.4 Test SMS normalization
powershell
cd elimux-backend
node -e "
function normalizePhone(p) {
  const c = p.replace(/\s/g,'').replace(/^0/,'+254').replace(/^254/,'+254');
  return !c.startsWith('+') ? '+254'+c : c;
}
['0712345678','254712345678','+254712345678',' 0712 345 678'].forEach(p => console.log(p, '->', normalizePhone(p)));
"
Report output.
STEP 6: Report Template
plain
## CYCLE 161 VALIDATION REPORT — Phase 3: SMS Integration

### Environment
| Var | Status |
|---|---|
| AT_USERNAME | SET / MISSING |
| AT_API_KEY | SET / MISSING |
| AT_SENDER_ID | SET / FALLBACK |

### Templates Updated
| Template | SMS Body Length | Pass? |
|---|---|---|
| University Partnership Invite | | |
| Company Attachment Partnership | | |
| School Collaboration | | |
| Private School Partnership | | |
| Follow-up | | |
| Re-engagement | | |

### Files Created/Updated
| File | Status |
|---|---|
| elimux-backend/src/lib/email.ts | APPENDED |
| elimux-backend/src/routes/crm.ts | APPENDED |
| elimux-frontend/src/app/api/crm/webhook/africastalking/route.ts | CREATED |

### TypeScript Check
| Project | Result |
|---|---|
| elimux-backend | OK / ERRORS: ___ |
| elimux-frontend | OK / ERRORS: ___ |

### Phone Normalization Test
| Input | Output | Pass? |
|---|---|---|
| 0712345678 | +254712345678 | |
| 254712345678 | +254712345678 | |
| +254712345678 | +254712345678 | |

### Errors
| Step | Error | Resolution |
|---|---|---|
| | | |

### Ready for Phase 4 (WhatsApp Business API)?
YES / NO — (explain if NO)
CRITICAL RULES
Read existing files before appending. Do NOT replace.
Use adminAuth on every new route.
Import shared supabase from ../lib/supabase.
If npx tsc --noEmit fails, report exact errors and STOP.
Do NOT commit or push until instructed.
If Africa's Talking credentials are missing in Step 0, STOP immediately.