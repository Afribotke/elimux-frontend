# docs/bridge.md — Cycle 163: Phase 6 — Contact Enrichment API

## Objective
Build the API endpoints that allow reps to enrich contacts with missing channel data: update contact email/phone/WhatsApp, add key personnel with their own contact details, and mark enrichment complete. Targets the 204 schools and any future contact with no reachable channel.

## CRITICAL RULES
1. Do NOT drop any table.
2. Append-only to crm.ts. Do NOT replace existing routes.
3. Use `adminAuth` on every new route.
4. Import shared `supabase` from `../lib/supabase`.
5. Run `npx tsc --noEmit` after any change.
6. Run SQL one block at a time. Report EXACT output.
7. If any step fails, STOP and report the error.
8. Do NOT commit or push until instructed.

---

## STEP 1: Add Enrichment Routes to crm.ts

Read the current end of `elimux-backend/src/routes/crm.ts`. Append these routes BEFORE `export default router;`:

```typescript
// ============================================
// Contact Enrichment Routes (appended to crm.ts)
// ============================================

// PATCH /api/crm/contacts/:id/enrich — update contact channel data
router.patch('/contacts/:id/enrich', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, phone, whatsapp_number, website, county, constituency, town, notes, updated_by } = req.body;

    // Build update object with only provided fields
    const updates: Record<string, any> = {
      enriched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (email !== undefined) updates.email = email || null;
    if (phone !== undefined) updates.phone = phone || null;
    if (whatsapp_number !== undefined) updates.whatsapp_number = whatsapp_number || null;
    if (website !== undefined) updates.website = website || null;
    if (county !== undefined) updates.county = county || null;
    if (constituency !== undefined) updates.constituency = constituency || null;
    if (town !== undefined) updates.town = town || null;
    if (notes !== undefined) updates.notes = notes || null;

    const { data: contact, error } = await supabase
      .from('crm_contacts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('crm_activities').insert({
      user_id: updated_by || null,
      action: 'contact_enriched',
      entity_type: 'contact',
      entity_id: id,
      metadata: { fields_updated: Object.keys(updates).filter(k => k !== 'enriched_at' && k !== 'updated_at') },
    });

    res.json(contact);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// POST /api/crm/contacts/:id/people — add a key person to a contact
router.post('/contacts/:id/people', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, title, email, phone, whatsapp, is_primary, is_decision_maker, notes, created_by } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const { data: person, error } = await supabase
      .from('crm_contact_people')
      .insert({
        contact_id: id,
        name,
        title: title || null,
        email: email || null,
        phone: phone || null,
        whatsapp: whatsapp || null,
        is_primary: is_primary || false,
        is_decision_maker: is_decision_maker || false,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) throw error;

    // If this person has email/phone and contact had none, log it
    const { data: contact } = await supabase
      .from('crm_contacts')
      .select('email, phone, whatsapp_number')
      .eq('id', id)
      .single();

    const gainedChannel = !contact?.email && email ? 'email' :
                          !contact?.phone && phone ? 'phone' :
                          !contact?.whatsapp_number && whatsapp ? 'whatsapp' : null;

    await supabase.from('crm_activities').insert({
      user_id: created_by || null,
      action: 'contact_person_added',
      entity_type: 'contact',
      entity_id: id,
      metadata: { 
        person_name: name, 
        person_id: person.id,
        gained_channel: gainedChannel,
        has_email: !!email,
        has_phone: !!phone,
        has_whatsapp: !!whatsapp,
      },
    });

    res.json(person);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// GET /api/crm/contacts/:id/people — list key people for a contact
router.get('/contacts/:id/people', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('crm_contact_people')
      .select('*')
      .eq('contact_id', id)
      .order('is_primary', { ascending: false })
      .order('is_decision_maker', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// DELETE /api/crm/contacts/people/:personId — remove a key person
router.delete('/contacts/people/:personId', adminAuth, async (req, res) => {
  try {
    const { personId } = req.params;

    const { data: person, error: findError } = await supabase
      .from('crm_contact_people')
      .select('contact_id, name')
      .eq('id', personId)
      .single();

    if (findError || !person) {
      return res.status(404).json({ error: 'Contact person not found' });
    }

    const { error } = await supabase
      .from('crm_contact_people')
      .delete()
      .eq('id', personId);

    if (error) throw error;

    await supabase.from('crm_activities').insert({
      user_id: null,
      action: 'contact_person_removed',
      entity_type: 'contact',
      entity_id: person.contact_id,
      metadata: { person_name: person.name, person_id: personId },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// POST /api/crm/contacts/bulk-enrich — bulk update contacts from research data
router.post('/contacts/bulk-enrich', adminAuth, async (req, res) => {
  try {
    const { updates, updated_by } = req.body;
    // updates: array of { id, email?, phone?, whatsapp_number?, notes? }

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'updates array required' });
    }

    if (updates.length > 100) {
      return res.status(400).json({ error: 'Max 100 contacts per bulk update' });
    }

    const results = [];
    const errors = [];

    for (const item of updates) {
      const { id, ...fields } = item;
      const updateObj: Record<string, any> = {
        enriched_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (fields.email !== undefined) updateObj.email = fields.email || null;
      if (fields.phone !== undefined) updateObj.phone = fields.phone || null;
      if (fields.whatsapp_number !== undefined) updateObj.whatsapp_number = fields.whatsapp_number || null;
      if (fields.notes !== undefined) updateObj.notes = fields.notes || null;

      const { data, error } = await supabase
        .from('crm_contacts')
        .update(updateObj)
        .eq('id', id)
        .select('id, name, email, phone')
        .single();

      if (error) {
        errors.push({ id, error: error.message });
      } else {
        results.push(data);
      }
    }

    await supabase.from('crm_activities').insert({
      user_id: updated_by || null,
      action: 'bulk_enrich',
      entity_type: 'contact',
      entity_id: null,
      metadata: { count: results.length, errors: errors.length },
    });

    res.json({ success: results.length, failed: errors.length, results, errors });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});
After appending, run:
powershell
cd elimux-backend
npx tsc --noEmit
Report: OK or exact errors.
STEP 2: Validation
2.1 TypeScript compilation
powershell
cd elimux-backend && npx tsc --noEmit
Report: OK or errors.
2.2 Count contacts needing enrichment
sql
SELECT entity_type, COUNT(*) as needs_enrichment 
FROM crm_contacts 
WHERE email IS NULL AND phone IS NULL AND whatsapp_number IS NULL
  AND id NOT IN (SELECT contact_id FROM crm_contact_people WHERE email IS NOT NULL OR phone IS NOT NULL OR whatsapp IS NOT NULL)
GROUP BY entity_type;
2.3 Test enrichment (dry run — do NOT execute, just report the SQL)
Show the exact UPDATE that would be run to add an email to one school. Do NOT run it.
2.4 Verify crm_contact_people is empty
sql
SELECT COUNT(*) as people_count FROM crm_contact_people;
STEP 3: Report Template
plain
## CYCLE 163 VALIDATION REPORT — Phase 6: Contact Enrichment API

### Routes Added
| Route | Method | Purpose | Status |
|---|---|---|---|
| /api/crm/contacts/:id/enrich | PATCH | Update contact channels | |
| /api/crm/contacts/:id/people | POST | Add key person | |
| /api/crm/contacts/:id/people | GET | List key people | |
| /api/crm/contacts/people/:personId | DELETE | Remove key person | |
| /api/crm/contacts/bulk-enrich | POST | Bulk update contacts | |

### TypeScript Check
| Project | Result |
|---|---|
| elimux-backend | OK / ERRORS: ___ |

### Enrichment Needs
| Entity Type | Count Missing All Channels |
|---|---|
| school_public | |
| school_private | |
| university | |
| company | |
| government | |
| partner | |

### Errors
| Step | Error | Resolution |
|---|---|---|
| | | |

### Ready for Phase 4 (WhatsApp Business API)?
YES / NO
CRITICAL RULES
Append-only to crm.ts. Do NOT replace existing routes.
Use the shared supabase client.
If tsc fails, report exact errors and STOP.
Do NOT commit or push until instructed.
