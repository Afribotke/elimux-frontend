===START===

## KIMI DESIGN (Current)

# INSTRUCTION 019: Build Provider Onboarding Flow

**Background:** The Bursary Engine needs a way for funding providers (County, NG-CDF, NGO, CSR, Foundation, School) to register and create their own branded portal. This is the entry point for all provider activity. No payments are required for registration — it is free tier by default.

**Task 1 — Create provider registration API route:**
Create `elimux-backend/src/routes/bursary-providers.ts` with:

```typescript
import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { createHash } from 'crypto';

const router = Router();

// POST /api/bursary/providers/register
// Public: No auth required
router.post('/register', async (req, res) => {
  const {
    name,
    type,
    registrationNumber,
    email,
    phone,
    county,
    subCounty,
    ward,
    address,
    adminName,
    adminEmail,
    adminPhone,
  } = req.body;

  // Validation
  if (!name || !type || !email || !phone || !adminName || !adminEmail) {
    return res.status(400).json({ error: 'Missing required fields: name, type, email, phone, adminName, adminEmail' });
  }

  const validTypes = ['county', 'ngcdf', 'ward', 'ngo', 'csr', 'foundation', 'alumni', 'school', 'individual'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
  }

  // Generate slug from name
  const baseSlug = name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
  
  // Ensure unique slug
  let slug = baseSlug;
  let suffix = 1;
  while (true) {
    const { data: existing } = await supabase.from('tenants').select('id').eq('slug', slug).single();
    if (!existing) break;
    slug = `${baseSlug}-${suffix}`;
    suffix++;
  }

  try {
    // Create tenant
    const { data: tenant, error: tErr } = await supabase
      .from('tenants')
      .insert({
        slug,
        name,
        type,
        registration_number: registrationNumber,
        status: 'pending',
        verification_status: 'pending',
        contact: { email, phone, county, sub_county: subCounty, ward, address },
        active_modules: ['MOD_CORE', 'MOD_AI_ELIGIBILITY', 'MOD_AI_FORENSICS', 'MOD_AI_FRAUD', 'MOD_DISBURSE_MPESA', 'MOD_DISBURSE_EXTERNAL', 'MOD_VERIFY_INSTITUTION', 'MOD_SCHOOL_MEDIATED', 'MOD_GUARDIAN_CONSENT', 'MOD_OFFLINE_QUEUE'],
        module_settings: {},
        budget_settings: { total: 0, committed: 0, disbursed: 0, currency: 'KES' },
      })
      .select()
      .single();

    if (tErr) throw tErr;

    // Create default branding
    const { error: bErr } = await supabase
      .from('tenant_branding')
      .insert({
        tenant_id: tenant.id,
        name,
        primary_color: '#0052CC',
        secondary_color: '#FF6B00',
        font_family: 'Inter',
        language: 'en',
        support_email: email,
        support_phone: phone,
        meta_title: `${name} - Bursary Portal`,
        meta_description: `Apply for bursaries and funding opportunities from ${name}`,
        email_sender_name: name,
      });

    if (bErr) throw bErr;

    // Generate admin invite token
    const inviteToken = createHash('sha256')
      .update(`${tenant.id}-${adminEmail}-${Date.now()}`)
      .digest('hex')
      .slice(0, 32);

    // Store invite (in a real system, send email with link)
    // For now, return the invite token in response (founder will distribute manually)
    console.log(`[Provider Onboarding] Admin invite for ${name}: token=${inviteToken}, email=${adminEmail}`);

    return res.status(201).json({
      success: true,
      message: 'Provider registered successfully. Pending verification.',
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        type: tenant.type,
        status: tenant.status,
        portalUrl: `https://${slug}.bursary.elimux.ke`,
      },
      adminInvite: {
        email: adminEmail,
        token: inviteToken,
        // In production, this would be sent via email instead of returned
      },
    });
  } catch (error: any) {
    console.error('[Provider Registration] Error:', error);
    return res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// GET /api/bursary/providers/:slug
// Public: View provider public profile
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, slug, name, type, status, verification_status, contact, created_at')
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (!tenant) return res.status(404).json({ error: 'Provider not found' });

  const { data: branding } = await supabase
    .from('tenant_branding')
    .select('*')
    .eq('tenant_id', tenant.id)
    .single();

  return res.status(200).json({
    ...tenant,
    branding: branding || {},
  });
});

// GET /api/bursary/providers/:slug/funds
// Public: View open funds for this provider
router.get('/:slug/funds', async (req, res) => {
  const { slug } = req.params;

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (!tenant) return res.status(404).json({ error: 'Provider not found' });

  const { data: funds } = await supabase
    .from('bursary_funds')
    .select('id, name, description, fund_type, status, budget, eligibility_rules, application_window, created_at')
    .eq('tenant_id', tenant.id)
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  return res.status(200).json({ funds: funds || [] });
});

export default router;
```

**Task 2 — Mount the route:**
In `elimux-backend/src/index.ts`, add:
```typescript
import bursaryProvidersRouter from './routes/bursary-providers';
```
And mount BEFORE auth-gated routes:
```typescript
app.use('/api/bursary/providers', bursaryProvidersRouter);
```

**Task 3 — Create provider registration frontend page:**
Create `elimux-frontend/src/app/bursary/provider/register/page.tsx` with a registration form:

Requirements:
- Clean, branded form matching ElimuX design system
- Fields: Organization Name, Type (dropdown), Registration Number, Email, Phone, County, Sub-County, Ward, Address, Admin Name, Admin Email, Admin Phone
- Type dropdown options: County Government, NG-CDF, Ward Office, NGO, Corporate CSR, Foundation, Alumni Association, School, Individual
- On submit: POST to /api/bursary/providers/register
- On success: Show success message with portal URL and admin invite token
- On error: Show error message
- Include link back to bursary.elimux.ke

**Task 4 — Update Coming Soon page:**
In `elimux-frontend/src/app/bursary/page.tsx`, add:
- A prominent "Register as Provider" button linking to `/bursary/provider/register`
- Keep the existing email capture form
- Keep the "Powered by ElimuX" footer

**Task 5 — Create provider public page (placeholder):**
Create `elimux-frontend/src/app/bursary/provider/[slug]/page.tsx` with:
- Simple placeholder: "This is the portal for [Provider Name]. Coming soon."
- Fetch provider data from `/api/bursary/providers/:slug`
- Show provider name, type, and contact info
- List open funds (if any)

**Task 6 — Build check:**
Run `npm run build` in both `elimux-frontend` and `elimux-backend`. Both must pass with zero errors.

**Task 7 — Commit:**
```bash
git add -A
git commit -m "cycle-019: add provider onboarding flow (registration API + frontend)"
git push origin main
```

**Acceptance Criteria:**
- [ ] Provider registration API created at /api/bursary/providers/register
- [ ] Public provider profile endpoint at /api/bursary/providers/:slug
- [ ] Public funds list endpoint at /api/bursary/providers/:slug/funds
- [ ] Frontend registration page at /bursary/provider/register
- [ ] Coming Soon page updated with "Register as Provider" button
- [ ] Provider public placeholder page at /bursary/provider/[slug]
- [ ] npm run build passes in both frontend and backend
- [ ] Committed and pushed

**Risk:** DO NOT require authentication for registration — it must be public. DO NOT send real emails yet (no Resend domain verified). Return invite token in response for manual distribution. DO NOT modify existing auth flows or admin dashboards.
===END===
