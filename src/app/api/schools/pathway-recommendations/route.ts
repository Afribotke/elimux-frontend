import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CLUSTER_RANK, type ClusterType } from '@/lib/schools-data';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: selection } = await supabase
      .from('student_pathway_selections')
      .select('*, pathway:career_pathways(*)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!selection || !selection.pathway) {
      return NextResponse.json({ data: null, pathway: null, schools: [] });
    }

    const pathway = selection.pathway;
    const requiredMin = pathway.required_cluster_min as ClusterType | null;

    // Curated pins first (pathway_school_mappings), then dynamic matches on
    // cluster selectivity, deduplicated, capped at 12.
    const { data: pinned } = await supabase
      .from('pathway_school_mappings')
      .select('school:senior_schools(*)')
      .eq('pathway_id', pathway.id);

    const pinnedSchools = (pinned || [])
      .map((p) => p.school)
      .filter((s): s is NonNullable<typeof s> => !!s);

    const eligibleClusters = requiredMin
      ? (Object.keys(CLUSTER_RANK) as ClusterType[]).filter((c) => CLUSTER_RANK[c] <= CLUSTER_RANK[requiredMin])
      : (Object.keys(CLUSTER_RANK) as ClusterType[]);

    const remainingSlots = Math.max(0, 12 - pinnedSchools.length);
    let dynamicSchools: unknown[] = [];
    if (remainingSlots > 0) {
      let query = supabase
        .from('senior_schools')
        .select('*')
        .in('cluster_type', eligibleClusters);

      // `.not('id', 'in', '(null)')` (the empty-pinnedSchools case) excludes
      // every row - SQL's `id IN (NULL)` is NULL, not false, so `NOT (...)`
      // never becomes true - so only apply the exclusion when there's
      // something real to exclude.
      if (pinnedSchools.length > 0) {
        const pinnedIds = pinnedSchools.map((s) => (s as unknown as { id: string }).id);
        query = query.not('id', 'in', `(${pinnedIds.map((id) => `"${id}"`).join(',')})`);
      }

      const { data, error: dynamicError } = await query.order('name', { ascending: true }).limit(remainingSlots);
      if (dynamicError) {
        return NextResponse.json({ error: dynamicError.message, stage: 'dynamicSchools' }, { status: 500 });
      }
      dynamicSchools = data || [];
    }

    return NextResponse.json({
      data: selection,
      pathway,
      schools: [...pinnedSchools, ...dynamicSchools],
      debug: { eligibleClusters, remainingSlots, pinnedCount: pinnedSchools.length },
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
