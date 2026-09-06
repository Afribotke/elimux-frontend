# docs/bridge.md — Cycle 160: Phase 2 — Templates + Email Engine + Contact Enrichment

## Objective
Build the template engine, upgrade the Resend email integration with tracking, create the message send log, and add a contact enrichment workflow so schools (and any contact missing info) can be flagged for research. Future school data (C2–C4, PR, private) will sync via the same process from Cycle 159 — no code changes needed.

## CRITICAL RULES
1. Do NOT drop any table.
2. Do NOT modify existing frontend pages or backend routes.
3. Run SQL one block at a time. Report EXACT output.
4. If any step fails, STOP and report the error.
5. Do NOT commit or push until explicitly instructed.

---

## STEP 1: Seed Default Message Templates

Run this SQL in Supabase SQL Editor:

```sql
-- ============================================
-- 1.1 Seed onboarding templates for all entity types
-- ============================================
INSERT INTO crm_message_templates (name, category, channel_email, subject_email, body_html, body_text, target_entity_types, is_active, usage_count)
VALUES
-- University template
(
  'University Partnership Invite',
  'onboarding',
  true,
  'Partner with ElimuX — Reach More Students',
  '<p>Dear {{person_name}},</p>
   <p>ElimuX is Kenya''s leading education discovery platform, connecting students with scholarship and program opportunities.</p>
   <p>We would love to feature <strong>{{contact_name}}</strong> and help you reach qualified applicants across Kenya and beyond.</p>
   <p><a href="https://www.elimux.ke/institutions/{{slug}}?utm_source=crm&utm_campaign=university_onboarding">View your institution page</a></p>
   <p>Reply to this email or call us at +254 700 000 000 to get started.</p>
   <p>Best,<br>{{assigned_rep_name}}<br>ElimuX Partnerships Team</p>',
  'Dear {{person_name}},\n\nElimuX is Kenya''s leading education discovery platform. We would love to feature {{contact_name}} and help you reach qualified applicants.\n\nView your page: https://www.elimux.ke/institutions/{{slug}}\n\nReply or call +254 700 000 000 to get started.\n\nBest,\n{{assigned_rep_name}}\nElimuX Partnerships Team',
  ARRAY['university'],
  true,
  0
),

-- Company template
(
  'Company Attachment Partnership',
  'onboarding',
  true,
  'Host Talented Interns from ElimuX',
  '<p>Dear {{person_name}},</p>
   <p>ElimuX connects you with pre-vetted university students seeking attachment and internship opportunities.</p>
   <p>Partner with us to build your talent pipeline at <strong>{{contact_name}}</strong>.</p>
   <p><a href="https://www.elimux.ke/employers/register?utm_source=crm&utm_campaign=company_onboarding">Register as a partner</a></p>
   <p>Best,<br>{{assigned_rep_name}}<br>ElimuX Talent Team</p>',
  'Dear {{person_name}},\n\nElimuX connects you with pre-vetted university students seeking attachment and internship opportunities.\n\nPartner with us: https://www.elimux.ke/employers/register\n\nBest,\n{{assigned_rep_name}}\nElimuX Talent Team',
  ARRAY['company'],
  true,
  0
),

-- Public school template
(
  'School Collaboration — ElimuX',
  'onboarding',
  true,
  'Collaborate with ElimuX for Student Success',
  '<p>Dear Principal,</p>
   <p>ElimuX is working with schools across {{county}} County to help students discover scholarships, career pathways, and higher education opportunities.</p>
   <p>We would like to partner with <strong>{{contact_name}}</strong> to support your students'' transition to university and vocational training.</p>
   <p>Reply to this email to schedule a brief call.</p>
   <p>Best,<br>{{assigned_rep_name}}<br>ElimuX Schools Team</p>',
  'Dear Principal,\n\nElimuX is working with schools across {{county}} County to help students discover scholarships and career pathways.\n\nWe would like to partner with {{contact_name}}.\n\nReply to schedule a brief call.\n\nBest,\n{{assigned_rep_name}}\nElimuX Schools Team',
  ARRAY['school_public'],
  true,
  0
),

-- Private school template
(
  'Private School Partnership — ElimuX SchoolConnect',
  'onboarding',
  true,
  'Grow Your Enrollment with ElimuX SchoolConnect',
  '<p>Dear {{person_name}},</p>
   <p>ElimuX SchoolConnect helps parents discover and reserve admission slots at private schools like yours.</p>
   <p>Join <strong>{{contact_name}}</strong> on our platform to reach families actively searching for schools in {{county}}.</p>
   <p><a href="https://www.elimux.ke/schools?utm_source=crm&utm_campaign=private_school_onboarding">Learn more about SchoolConnect</a></p>
   <p>Best,<br>{{assigned_rep_name}}<br>ElimuX SchoolConnect Team</p>',
  'Dear {{person_name}},\n\nElimuX SchoolConnect helps parents discover and reserve admission slots at private schools.\n\nJoin us: https://www.elimux.ke/schools\n\nBest,\n{{assigned_rep_name}}\nElimuX SchoolConnect Team',
  ARRAY['school_private'],
  true,
  0
),

-- Follow-up #1 (generic, all types)
(
  'Follow-up — Checking In',
  'followup',
  true,
  'Following Up — ElimuX Partnership',
  '<p>Dear {{person_name}},</p>
   <p>I reached out last week about partnering with ElimuX. I wanted to follow up and see if you had any questions.</p>
   <p>We are currently onboarding partners in {{county}} and would love to include {{contact_name}}.</p>
   <p>Reply to this email or call +254 700 000 000.</p>
   <p>Best,<br>{{assigned_rep_name}}</p>',
  'Dear {{person_name}},\n\nI reached out last week about partnering with ElimuX. Any questions?\n\nWe are onboarding partners in {{county}}.\n\nReply or call +254 700 000 000.\n\nBest,\n{{assigned_rep_name}}',
  NULL, -- all entity types
  true,
  0
),

-- Re-engagement
(
  'Re-engagement — Still Interested?',
  're_engagement',
  true,
  'Reconnecting — ElimuX Partnership',
  '<p>Dear {{person_name}},</p>
   <p>It has been a while since we last connected. ElimuX has grown significantly — we now serve over 10,000 students monthly.</p>
   <p>We would still love to partner with {{contact_name}}.</p>
   <p><a href="https://www.elimux.ke?utm_source=crm&utm_campaign=reengagement">See what is new</a></p>
   <p>Best,<br>{{assigned_rep_name}}</p>',
  'Dear {{person_name}},\n\nIt has been a while. ElimuX now serves 10,000+ students monthly.\n\nWe would still love to partner.\n\nSee what is new: https://www.elimux.ke\n\nBest,\n{{assigned_rep_name}}',
  NULL,
  true,
  0
);

-- Report
SELECT category, target_entity_types, COUNT(*) as count 
FROM crm_message_templates 
GROUP BY category, target_entity_types;
```

## STEP 2: Create Email Tracking API Routes

Create these two files in `elimux-frontend/src/app/api/crm/track-open/` and `elimux-frontend/src/app/api/crm/track-click/`.

### 2.1 Track Open Pixel

Create `elimux-frontend/src/app/api/crm/track-open/route.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const messageId = searchParams.get('id');

  if (messageId) {
    await supabase
      .from('crm_messages')
      .update({ 
        opened_at: new Date().toISOString(),
        status: 'opened'
      })
      .eq('id', messageId)
      .eq('status', 'sent'); // only update if not already tracked
  }

  // Return 1x1 transparent GIF
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );

  return new NextResponse(pixel, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
```

### 2.2 Track Click + Redirect

Create `elimux-frontend/src/app/api/crm/track-click/route.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const messageId = searchParams.get('id');
  const targetUrl = searchParams.get('url');

  if (messageId) {
    await supabase
      .from('crm_messages')
      .update({ 
        clicked_at: new Date().toISOString(),
        status: 'clicked'
      })
      .eq('id', messageId);
  }

  // Redirect to target URL
  const redirectTo = targetUrl && targetUrl.startsWith('http') 
    ? targetUrl 
    : 'https://www.elimux.ke';

  return NextResponse.redirect(redirectTo, 302);
}
```

## STEP 3: Upgrade Backend Email Service

Replace the content of `elimux-backend/src/lib/email.ts` with this upgraded version that supports templates, tracking, and logging:

```typescript
import { CRMMessageTemplate, CRMContact, CRMContactPerson } from '../types/crm';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_API_URL = 'https://api.resend.com/emails';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string;
  trackId?: string; // crm_messages.id for tracking
}

interface TemplateVariables {
  contact_name: string;
  person_name?: string;
  county?: string;
  slug?: string;
  assigned_rep_name?: string;
  elimux_url?: string;
  [key: string]: string | undefined;
}

function renderTemplate(template: string, variables: TemplateVariables): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
  }
  return result;
}

function injectTrackingPixel(html: string, messageId: string, baseUrl: string): string {
  const pixelUrl = `${baseUrl}/api/crm/track-open?id=${messageId}`;
  return html + `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;" />`;
}

function wrapLinks(html: string, messageId: string, baseUrl: string): string {
  // Simple link wrapping — replace href="http..." with tracked version
  return html.replace(
    /href="(https?:\/\/[^"]+)"/g,
    (match, url) => `href="${baseUrl}/api/crm/track-click?id=${messageId}&url=${encodeURIComponent(url)}"`
  );
}

export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set — email not sent');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: options.from || 'ElimuX Partnerships <partnerships@elimux.ke>',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to: options.replyTo,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', data);
      return { success: false, error: data.message || 'Resend API error' };
    }

    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendTemplatedEmail(
  template: CRMMessageTemplate,
  contact: CRMContact,
  person: CRMContactPerson | null,
  variables: TemplateVariables,
  sentBy: string,
  baseUrl: string,
  supabaseClient: any // pass Supabase client for logging
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!template.channel_email || !template.subject_email || !template.body_html) {
    return { success: false, error: 'Template does not support email channel' };
  }

  const toEmail = person?.email || contact.email;
  if (!toEmail) {
    return { success: false, error: 'No email address available' };
  }

  // Render template
  const subject = renderTemplate(template.subject_email, variables);
  let html = renderTemplate(template.body_html, variables);
  const text = renderTemplate(template.body_text || template.body_html, variables);

  // Create message log entry first (to get ID for tracking)
  const { data: messageLog, error: logError } = await supabaseClient
    .from('crm_messages')
    .insert({
      contact_id: contact.id,
      person_id: person?.id || null,
      template_id: template.id,
      channel: 'email',
      subject,
      body: html,
      status: 'queued',
      sent_by: sentBy,
    })
    .select('id')
    .single();

  if (logError || !messageLog) {
    return { success: false, error: `Failed to create message log: ${logError?.message}` };
  }

  // Inject tracking
  html = injectTrackingPixel(html, messageLog.id, baseUrl);
  html = wrapLinks(html, messageLog.id, baseUrl);

  // Send via Resend
  const result = await sendEmail({
    to: toEmail,
    subject,
    html,
    text,
    trackId: messageLog.id,
  });

  // Update log with result
  await supabaseClient
    .from('crm_messages')
    .update({
      status: result.success ? 'sent' : 'failed',
      provider: 'resend',
      provider_msg_id: result.messageId || null,
      sent_at: result.success ? new Date().toISOString() : null,
      failed_at: result.success ? null : new Date().toISOString(),
      fail_reason: result.error || null,
    })
    .eq('id', messageLog.id);

  // Update contact stats
  if (result.success) {
    await supabaseClient
      .from('crm_contacts')
      .update({
        last_contact_at: new Date().toISOString(),
        last_contact_via: 'email',
        contact_count: contact.contact_count + 1,
      })
      .eq('id', contact.id);
  }

  return result;
}

// Legacy wrapper for backward compatibility
export async function sendSimpleEmail(to: string, subject: string, html: string, text?: string): Promise<boolean> {
  const result = await sendEmail({ to, subject, html, text: text || html });
  return result.success;
}
```

## STEP 4: Create Backend CRM Routes

Create `elimux-backend/src/routes/crm.ts`:

```typescript
import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { sendTemplatedEmail } from '../lib/email';

const router = Router();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/crm/contacts — list with filters
router.get('/contacts', async (req, res) => {
  try {
    const { entity_type, status, county, assigned_to, search, page = '1', limit = '50' } = req.query;
    
    let query = supabase
      .from('crm_contacts')
      .select('*', { count: 'exact' });

    if (entity_type) query = query.eq('entity_type', entity_type);
    if (status) query = query.eq('status', status);
    if (county) query = query.eq('county', county);
    if (assigned_to) query = query.eq('assigned_to', assigned_to);
    if (search) query = query.ilike('name', `%${search}%`);

    const from = (parseInt(page as string) - 1) * parseInt(limit as string);
    const to = from + parseInt(limit as string) - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    res.json({
      data,
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

// GET /api/crm/contacts/:id — single contact with people
router.get('/contacts/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: contact, error: contactError } = await supabase
      .from('crm_contacts')
      .select('*')
      .eq('id', id)
      .single();

    if (contactError) throw contactError;

    const { data: people, error: peopleError } = await supabase
      .from('crm_contact_people')
      .select('*')
      .eq('contact_id', id);

    if (peopleError) throw peopleError;

    const { data: messages, error: msgError } = await supabase
      .from('crm_messages')
      .select('*')
      .eq('contact_id', id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (msgError) throw msgError;

    res.json({ contact, people: people || [], messages: messages || [] });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// POST /api/crm/contacts/:id/people — add a contact person
router.post('/contacts/:id/people', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, title, email, phone, whatsapp, is_primary, is_decision_maker, notes } = req.body;

    const { data, error } = await supabase
      .from('crm_contact_people')
      .insert({
        contact_id: id,
        name,
        title,
        email,
        phone,
        whatsapp,
        is_primary: is_primary || false,
        is_decision_maker: is_decision_maker || false,
        notes,
      })
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await supabase.from('crm_activities').insert({
      user_id: req.body.sent_by,
      action: 'contact_person_added',
      entity_type: 'contact',
      entity_id: id,
      metadata: { person_name: name, email, phone },
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// GET /api/crm/templates — list templates
router.get('/templates', async (req, res) => {
  try {
    const { entity_type, category } = req.query;
    
    let query = supabase
      .from('crm_message_templates')
      .select('*')
      .eq('is_active', true);

    if (category) query = query.eq('category', category);
    
    if (entity_type) {
      query = query.or(`target_entity_types.cs.{${entity_type}},target_entity_types.is.null`);
    }

    const { data, error } = await query.order('usage_count', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// POST /api/crm/send-email — send templated email
router.post('/send-email', async (req, res) => {
  try {
    const { contact_id, person_id, template_id, sent_by, base_url } = req.body;

    // Fetch contact
    const { data: contact, error: contactError } = await supabase
      .from('crm_contacts')
      .select('*')
      .eq('id', contact_id)
      .single();

    if (contactError || !contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Check if contact has email
    if (!contact.email && !person_id) {
      return res.status(400).json({ 
        error: 'Contact has no email. Add a contact person with email first.',
        needs_enrichment: true 
      });
    }

    // Fetch person if specified
    let person = null;
    if (person_id) {
      const { data: p, error: personError } = await supabase
        .from('crm_contact_people')
        .select('*')
        .eq('id', person_id)
        .single();
      if (!personError && p) person = p;
    }

    // Fetch template
    const { data: template, error: templateError } = await supabase
      .from('crm_message_templates')
      .select('*')
      .eq('id', template_id)
      .single();

    if (templateError || !template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Fetch sender name
    const { data: sender } = await supabase
      .from('auth.users')
      .select('raw_user_meta_data->>name as name')
      .eq('id', sent_by)
      .single();

    const variables = {
      contact_name: contact.name,
      person_name: person?.name || 'Sir/Madam',
      county: contact.county || 'your county',
      slug: contact.slug || '',
      assigned_rep_name: sender?.name || 'ElimuX Team',
      elimux_url: 'https://www.elimux.ke',
    };

    const result = await sendTemplatedEmail(
      template,
      contact,
      person,
      variables,
      sent_by,
      base_url || 'https://www.elimux.ke',
      supabase
    );

    if (result.success) {
      // Increment template usage
      await supabase.rpc('increment_template_usage', { template_id });
      
      // Log activity
      await supabase.from('crm_activities').insert({
        user_id: sent_by,
        action: 'email_sent',
        entity_type: 'contact',
        entity_id: contact_id,
        metadata: { template_id, template_name: template.name, channel: 'email' },
      });

      res.json({ success: true, messageId: result.messageId });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// POST /api/crm/contacts/:id/enrich — update contact with research data
router.patch('/contacts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('crm_contacts')
      .update({
        ...updates,
        enriched_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await supabase.from('crm_activities').insert({
      user_id: updates.updated_by,
      action: 'contact_enriched',
      entity_type: 'contact',
      entity_id: id,
      metadata: { fields_updated: Object.keys(updates) },
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// GET /api/crm/stats/dashboard — executive dashboard data
router.get('/stats/dashboard', async (req, res) => {
  try {
    // Contacts by entity_type
    const { data: byType, error: typeError } = await supabase
      .from('crm_contacts')
      .select('entity_type, status, count')
      .select('entity_type, status');

    // Use RPC for aggregated counts
    const { data: typeCounts } = await supabase.rpc('get_crm_stats_by_type');
    const { data: countyCounts } = await supabase.rpc('get_crm_stats_by_county');
    const { data: messageStats } = await supabase.rpc('get_crm_message_stats');

    res.json({
      by_type: typeCounts || [],
      by_county: countyCounts || [],
      messages: messageStats || [],
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
```

## STEP 5: Create RPC Functions for Dashboard Stats

Run this SQL in Supabase SQL Editor:

```sql
-- ============================================
-- 5.1 Dashboard stats RPC functions
-- ============================================

CREATE OR REPLACE FUNCTION get_crm_stats_by_type()
RETURNS TABLE(entity_type text, status text, count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT c.entity_type, c.status, COUNT(*)::bigint
  FROM crm_contacts c
  GROUP BY c.entity_type, c.status
  ORDER BY c.entity_type, c.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_crm_stats_by_county()
RETURNS TABLE(county text, entity_type text, count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT c.county, c.entity_type, COUNT(*)::bigint
  FROM crm_contacts c
  WHERE c.county IS NOT NULL
  GROUP BY c.county, c.entity_type
  ORDER BY COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_crm_message_stats()
RETURNS TABLE(channel text, status text, count bigint, total_cost numeric) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.channel,
    m.status,
    COUNT(*)::bigint,
    COALESCE(SUM(m.cost_kes), 0)::numeric
  FROM crm_messages m
  GROUP BY m.channel, m.status
  ORDER BY m.channel, m.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_template_usage(template_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE crm_message_templates
  SET usage_count = usage_count + 1
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## STEP 6: Validation

Run these queries and report EXACT output:

```sql
-- 6.1 Templates seeded
SELECT name, category, channel_email, target_entity_types, is_active 
FROM crm_message_templates 
ORDER BY category, name;

-- 6.2 API routes created (Claude to verify files exist)
-- Report: elimux-frontend/src/app/api/crm/track-open/route.ts EXISTS / NOT FOUND
-- Report: elimux-frontend/src/app/api/crm/track-click/route.ts EXISTS / NOT FOUND
-- Report: elimux-backend/src/routes/crm.ts EXISTS / NOT FOUND
-- Report: elimux-backend/src/lib/email.ts UPDATED / NOT UPDATED

-- 6.3 RPC functions created
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('get_crm_stats_by_type', 'get_crm_stats_by_county', 'get_crm_message_stats', 'increment_template_usage');

-- 6.4 Test tracking endpoints (Claude to curl locally)
-- curl http://localhost:3000/api/crm/track-open?id=TEST-ID
-- curl http://localhost:3000/api/crm/track-click?id=TEST-ID&url=https://elimux.ke
```

## STEP 7: Report Template

```plain
## CYCLE 160 VALIDATION REPORT — Phase 2: Templates + Email

### Templates Seeded
| Template Name | Category | Channel | Target | Status |
|---|---|---|---|---|
| (fill) | | | | |

### Files Created/Updated
| File Path | Status |
|---|---|
| elimux-frontend/src/app/api/crm/track-open/route.ts | |
| elimux-frontend/src/app/api/crm/track-click/route.ts | |
| elimux-backend/src/routes/crm.ts | |
| elimux-backend/src/lib/email.ts | UPDATED |

### RPC Functions
| Function | Exists? |
|---|---|
| get_crm_stats_by_type | |
| get_crm_stats_by_county | |
| get_crm_message_stats | |
| increment_template_usage | |

### Test Results
| Endpoint | Status Code | Pass? |
|---|---|---|
| /api/crm/track-open | | |
| /api/crm/track-click | | |

### Errors
| Step | Error | Resolution |
|---|---|---|
| | | |

### Ready for Phase 3 (SMS + WhatsApp)?
YES / NO
```

## CRITICAL RULES
- Do NOT drop any table.
- Do NOT modify existing frontend pages.
- If any step fails, STOP and report.
- Do NOT commit or push until instructed.
- The sendTemplatedEmail function logs every send to crm_messages — verify this works.
