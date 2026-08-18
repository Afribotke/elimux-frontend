===START===

## KIMI DESIGN (Current)

# INSTRUCTION 020: Build Admin Approval Queue for Provider Registrations

**Background:** Cycle 019 created provider registration, but new providers start as `status: 'pending'` with no way to activate them. We need a super admin interface to review, approve, or reject pending provider registrations.

**Task 1 — Create admin API routes for provider management:**
Create `elimux-backend/src/routes/admin-bursary-providers.ts` with:

```typescript
import { Router } from 'express';
import { supabase } from '../lib/supabase';
import { adminAuth } from '../middleware/auth';

const router = Router();

// GET /api/admin/bursary/providers
// Protected: super admin only
router.get('/', adminAuth, async (req, res) => {
  const { status = 'pending', page = '1', limit = '20' } = req.query;
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  const { data: providers, error, count } = await supabase
    .from('tenants')
    .select('id, slug, name, type, status, verification_status, contact, registration_number, created_at, updated_at', { count: 'exact' })
    .eq('status', status)
    .order('created_at', { ascending: false })
    .range(offset, offset + parseInt(limit as string) - 1);

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({
    providers: providers || [],
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total: count || 0,
      totalPages: Math.ceil((count || 0) / parseInt(limit as string)),
    },
  });
});

// GET /api/admin/bursary/providers/:id
// Protected: super admin
router.get('/:id', adminAuth, async (req, res) => {
  const { id } = req.params;

  const { data: provider } = await supabase
    .from('tenants')
    .select('*, tenant_branding(*)')
    .eq('id', id)
    .single();

  if (!provider) return res.status(404).json({ error: 'Provider not found' });

  return res.status(200).json({ provider });
});

// PATCH /api/admin/bursary/providers/:id/approve
// Protected: super admin
router.patch('/:id/approve', adminAuth, async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;

  const { data: provider, error } = await supabase
    .from('tenants')
    .update({
      status: 'active',
      verification_status: 'verified',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !provider) return res.status(404).json({ error: 'Provider not found' });

  console.log(`[Admin] Provider approved: ${provider.name} (${provider.slug}) by ${req.userId}. Notes: ${notes || 'none'}`);

  return res.status(200).json({
    success: true,
    message: 'Provider approved and activated',
    provider: {
      id: provider.id,
      slug: provider.slug,
      name: provider.name,
      status: provider.status,
      portalUrl: `https://${provider.slug}.bursary.elimux.ke`,
    },
  });
});

// PATCH /api/admin/bursary/providers/:id/reject
// Protected: super admin
router.patch('/:id/reject', adminAuth, async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const { data: provider, error } = await supabase
    .from('tenants')
    .update({
      status: 'cancelled',
      verification_status: 'suspended',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !provider) return res.status(404).json({ error: 'Provider not found' });

  console.log(`[Admin] Provider rejected: ${provider.name} (${provider.slug}) by ${req.userId}. Reason: ${reason || 'none'}`);

  return res.status(200).json({
    success: true,
    message: 'Provider rejected',
    provider: { id: provider.id, name: provider.name, status: provider.status },
  });
});

// PATCH /api/admin/bursary/providers/:id/suspend
// Protected: super admin
router.patch('/:id/suspend', adminAuth, async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const { data: provider, error } = await supabase
    .from('tenants')
    .update({
      status: 'suspended',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !provider) return res.status(404).json({ error: 'Provider not found' });

  return res.status(200).json({
    success: true,
    message: 'Provider suspended',
    provider: { id: provider.id, name: provider.name, status: provider.status },
  });
});

export default router;
```

**Task 2 — Mount the route:**
In `elimux-backend/src/index.ts`, add:
```typescript
import adminBursaryProvidersRouter from './routes/admin-bursary-providers';
```
And mount:
```typescript
app.use('/api/admin/bursary-providers', adminBursaryProvidersRouter);
```

**Task 3 — Create admin approval dashboard page:**
Create `elimux-frontend/src/app/admin/bursary-providers/page.tsx` with:

Requirements:
- Table showing all pending providers with columns: Name, Type, Email, Phone, County, Registration Number, Date Registered, Actions
- Actions: Approve (green button), Reject (red button), View Details (modal or expand)
- Pagination: 20 per page
- Filter tabs: Pending | Active | Suspended | All
- Search by name or email
- On Approve: Confirm dialog, then call PATCH /api/admin/bursary-providers/:id/approve
- On Reject: Prompt for reason, then call PATCH /api/admin/bursary-providers/:id/reject
- Show success/error toast notifications
- Protected by admin auth (reuse existing admin auth pattern)

**Task 4 — Add navigation link:**
In the admin dashboard navigation (wherever admin nav links are), add "Bursary Providers" linking to `/admin/bursary-providers`.

**Task 5 — Build check:**
Run `npm run build` in both repos. Both must pass.

**Task 6 — Commit:**
```bash
git add -A
git commit -m "cycle-020: add admin approval queue for bursary provider registrations"
git push origin main
```

**Acceptance Criteria:**
- [ ] Admin API routes created for listing, viewing, approving, rejecting, suspending providers
- [ ] Routes protected by adminAuth middleware
- [ ] Frontend admin dashboard page at /admin/bursary-providers
- [ ] Table with pagination, filtering, search
- [ ] Approve/Reject actions with confirmation dialogs
- [ ] Navigation link added to admin sidebar/menu
- [ ] npm run build passes in both repos
- [ ] Committed and pushed

**Risk:** DO NOT modify existing admin routes or auth logic. Reuse existing adminAuth middleware. DO NOT expose provider admin invites or tokens in the admin list view.
===END===
