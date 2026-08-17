===START===

## KIMI DESIGN (Current)

# INSTRUCTION 010: Add Zod input validation to scholarship admin routes

**Background:** Currently, admin routes that create and update scholarships accept raw request bodies with no validation. Malformed data, wrong types, or injection payloads can reach the database. We add Zod schemas to validate all inputs before they touch Supabase.

**Task 1 — Check if Zod is installed:**
Open elimux-backend/package.json. Check for "zod" in dependencies. Report version or absence.

**Task 2 — Install if missing:**
If Zod is not installed, run: npm install zod
Then run: npm run build to verify install doesn't break anything.

**Task 3 — Create validation schemas:**
Create elimux-backend/src/lib/validation/scholarshipSchemas.ts with these Zod schemas:

```typescript
import { z } from 'zod';

export const createScholarshipSchema = z.object({
  title: z.string().min(1).max(200),
  provider: z.string().min(1).max(200),
  provider_id: z.string().uuid().optional(),
  description: z.string().max(5000).optional(),
  eligibility: z.string().max(2000).optional(),
  benefits: z.string().max(2000).optional(),
  amount: z.string().max(100).optional(),
  currency: z.string().max(3).default('KES'),
  coverage_type: z.string().max(50).optional(),
  institution_id: z.string().uuid().optional(),
  country_id: z.string().uuid().optional(),
  study_levels: z.array(z.string()).optional(),
  disciplines: z.array(z.string()).optional(),
  target_groups: z.array(z.string()).optional(),
  application_opens: z.string().datetime().optional(),
  application_deadline: z.string().datetime(),
  notification_date: z.string().datetime().optional(),
  application_url: z.string().url().max(500).optional(),
  application_process: z.string().max(2000).optional(),
  required_documents: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive', 'draft']).default('active'),
  is_featured: z.boolean().default(false),
  funding_amount: z.number().positive().optional(),
  duration: z.number().int().positive().optional(),
  duration_unit: z.enum(['days', 'weeks', 'months', 'years']).optional(),
  is_sponsored: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
  education_level: z.array(z.string()).optional(),
  field_of_study: z.array(z.string()).optional(),
  location_type: z.enum(['on-campus', 'online', 'hybrid']).optional(),
  country: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
});

export const updateScholarshipSchema = createScholarshipSchema.partial();

export type CreateScholarshipInput = z.infer<typeof createScholarshipSchema>;
export type UpdateScholarshipInput = z.infer<typeof updateScholarshipSchema>;
Task 4 — Apply validation to admin routes:
In elimux-backend/src/routes/admin.ts (where POST /scholarships and PATCH /scholarships/:id live), add validation:
At the top of the file, import:
TypeScript
import { createScholarshipSchema, updateScholarshipSchema } from '../lib/validation/scholarshipSchemas';
For POST /scholarships:
TypeScript
const parsed = createScholarshipSchema.safeParse(req.body);
if (!parsed.success) {
  return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
}
// Use parsed.data instead of req.body for the Supabase insert
For PATCH /scholarships/:id:
TypeScript
const parsed = updateScholarshipSchema.safeParse(req.body);
if (!parsed.success) {
  return res.status(400).json({ error: 'Invalid input', details: parsed.error.flatten() });
}
// Use parsed.data instead of req.body for the Supabase update
Task 5 — Build and verify:
Run npm run build in elimux-backend. Must pass with zero errors.
Acceptance Criteria:
[ ] Zod installed (or confirmed present)
[ ] Scholarship schemas created in src/lib/validation/scholarshipSchemas.ts
[ ] POST /api/admin/scholarships validates with createScholarshipSchema
[ ] PATCH /api/admin/scholarships/:id validates with updateScholarshipSchema
[ ] Invalid requests return 400 with error details
[ ] Valid requests continue to work normally
[ ] npm run build passes in elimux-backend
Risk: DO NOT modify the frontend. DO NOT change route logic beyond adding validation and using parsed.data instead of req.body.
===END===