// src/app/api/institution/alerts/route.ts
// Trending alerts for the signed-in institution admin's own institution
//
// KNOWN GAP, not fixed by this permission unification: the table this route
// queries (trending_alerts) does not exist anywhere in this database, in any
// schema - confirmed via information_schema before touching this file, and
// confirmed nothing (no migration file, no backend code) creates or writes to
// it either. This route has almost certainly 500'd on every real call since
// it shipped (Cycle 028) - the frontend's own empty .catch() on the fetch
// masks that as "no alerts yet" rather than surfacing the real error. Fixing
// the permission-resolution mechanism below (institution_accounts, matching
// the rest of the app, instead of the never-populated institutions.
// admin_user_id) is still worth doing for consistency, but it does NOT make
// this feature actually load data - that needs a real decision (create the
// table + a real data source, or retire the feature) that's out of scope
// for a permission-consolidation cycle. Flagged in bridge.md.

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // UNIFIED PERMISSION: resolve institution via institution_accounts (active only)
  const { data: account, error: accountError } = await supabase
    .from('institution_accounts')
    .select('institution_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (accountError || !account) {
    // Return empty array with 200 to preserve existing frontend contract
    return NextResponse.json({ success: true, data: [] });
  }

  const { data: alerts, error: alertsError } = await supabase
    .from('trending_alerts')
    .select('*')
    .eq('institution_id', account.institution_id)
    .order('sent_at', { ascending: false });

  if (alertsError) {
    console.error('Alerts fetch error:', alertsError);
    return NextResponse.json({ success: false, error: alertsError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: alerts || [] });
}
