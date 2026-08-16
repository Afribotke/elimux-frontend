## KIMI DESIGN (Current)

# INSTRUCTION 002: Remove dead POST handler from admin-scholarships.ts

**Background:** admin-scholarships.ts has a POST / route that is unreachable. admin.ts mounts at /api/admin BEFORE admin-scholarships.ts mounts at /api/admin/scholarships, and admin.ts defines POST /scholarships, so it shadows the dead handler every time. The live creation endpoint is admin.ts POST /scholarships.

**Task 1 — Remove dead handler:**
In `elimux-backend/src/routes/admin-scholarships.ts`:
1. Remove the entire `POST /` route handler (the router.post('/', ...) block).
2. Add this comment at the top of the file, below imports:
   // NOTE: POST / omitted — admin.ts mounts first and shadows this route.
   // Scholarship creation lives in admin.ts POST /scholarships.
3. Verify `GET /`, `GET /:id`, `PUT /:id`, `DELETE /:id` remain intact.

**Task 2 — Verify no references:**
Run: `grep -r "admin-scholarships" elimux-backend/src/ --include="*.ts" | grep -v "import"`
Confirm no code imports or references the removed POST handler.

**Task 3 — Build check:**
Run `npm run build` in elimux-backend. Must pass with zero errors.

**Acceptance Criteria:**
- [ ] Dead POST / removed from admin-scholarships.ts
- [ ] Comment added explaining why POST is omitted
- [ ] All other routes (GET, PUT, DELETE) still present
- [ ] No code references the removed handler
- [ ] `npm run build` passes in elimux-backend

**Risk:** DO NOT modify admin.ts. DO NOT remove GET /, PUT /:id, or DELETE /:id.