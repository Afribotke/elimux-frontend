import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const KEYWORD_MAP: Record<string, { career: string; pathway: string; track: string }> = {
  lawyer: { career: 'Lawyer', pathway: 'SOCIAL_SCIENCES', track: 'HUMANITIES_BUSINESS' },
  doctor: { career: 'Doctor', pathway: 'STEM', track: 'PURE_SCIENCES' },
  engineer: { career: 'Civil Engineer', pathway: 'STEM', track: 'PURE_SCIENCES' },
  pilot: { career: 'Pilot', pathway: 'STEM', track: 'PURE_SCIENCES' },
  nurse: { career: 'Nurse', pathway: 'STEM', track: 'PURE_SCIENCES' },
  teacher: { career: 'Teacher', pathway: 'SOCIAL_SCIENCES', track: 'LANGUAGES_LITERATURE' },
  accountant: { career: 'Accountant', pathway: 'SOCIAL_SCIENCES', track: 'HUMANITIES_BUSINESS' },
  journalist: { career: 'Journalist', pathway: 'SOCIAL_SCIENCES', track: 'LANGUAGES_LITERATURE' },
  software: { career: 'Software Engineer', pathway: 'STEM', track: 'PURE_SCIENCES' },
  programmer: { career: 'Software Engineer', pathway: 'STEM', track: 'PURE_SCIENCES' },
  artist: { career: 'Graphic Designer', pathway: 'ARTS_SPORTS', track: 'ARTS' },
  musician: { career: 'Musician', pathway: 'ARTS_SPORTS', track: 'ARTS' },
  actor: { career: 'Actor', pathway: 'ARTS_SPORTS', track: 'ARTS' },
  athlete: { career: 'Professional Athlete', pathway: 'ARTS_SPORTS', track: 'SPORTS_RECREATION' },
  chef: { career: 'Chef', pathway: 'STEM', track: 'APPLIED_SCIENCES' },
  hotel: { career: 'Hotel Manager', pathway: 'SOCIAL_SCIENCES', track: 'HUMANITIES_BUSINESS' },
  police: { career: 'Police Officer', pathway: 'SOCIAL_SCIENCES', track: 'HUMANITIES_BUSINESS' },
  business: { career: 'Entrepreneur', pathway: 'SOCIAL_SCIENCES', track: 'HUMANITIES_BUSINESS' },
  farmer: { career: 'Agricultural Officer', pathway: 'STEM', track: 'APPLIED_SCIENCES' },
  electrician: { career: 'Electrician', pathway: 'STEM', track: 'APPLIED_SCIENCES' },
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query string required' }, { status: 400 });
    }

    const normalizedQuery = query.toLowerCase().trim();
    // Strip characters with special meaning in PostgREST's filter grammar
    // (comma separates filters, parens group them) before building .or().
    const safeQuery = normalizedQuery.replace(/[,()]/g, '');

    // Step 1: Search career mappings
    const { data: careers, error: careerError } = await supabase
      .schema('pathways')
      .from('career_mappings')
      .select('*, pathways(*), tracks(*)')
      .eq('is_verified', true)
      .or(`career_name.ilike.%${safeQuery}%,career_aliases.cs.{${safeQuery}}`)
      .limit(10);

    if (careerError) {
      return NextResponse.json({ error: careerError.message }, { status: 500 });
    }

    // Step 2: If no direct match, do keyword matching
    let matchedCareer = careers?.[0];

    if (!matchedCareer) {
      for (const [keyword, mapping] of Object.entries(KEYWORD_MAP)) {
        if (normalizedQuery.includes(keyword)) {
          const { data: pathwayData } = await supabase
            .schema('pathways')
            .from('pathways')
            .select('id, code, name')
            .eq('code', mapping.pathway)
            .single();

          const { data: trackData } = await supabase
            .schema('pathways')
            .from('tracks')
            .select('id, code, name')
            .eq('code', mapping.track)
            .single();

          matchedCareer = {
            career_name: mapping.career,
            pathway_id: pathwayData?.id,
            track_id: trackData?.id,
            pathways: pathwayData,
            tracks: trackData,
            description: `AI-matched career based on keyword "${keyword}"`,
          };
          break;
        }
      }
    }

    if (!matchedCareer) {
      return NextResponse.json({
        career: null,
        pathway: null,
        track: null,
        confidence: 0,
        message: 'No matching career found. Try being more specific (e.g., "I want to be a lawyer").',
      });
    }

    // Step 3: Get top 3 combinations for this track
    const { data: combinations, error: comboError } = await supabase
      .schema('pathways')
      .from('subject_combinations')
      .select('*')
      .eq('track_id', matchedCareer.track_id)
      .eq('is_active', true)
      .limit(3);

    if (comboError) {
      return NextResponse.json({ error: comboError.message }, { status: 500 });
    }

    // subject_combinations.subjects stores subject UUIDs, not names - resolve
    // them here so every consumer (wizard, PDF export, standalone results
    // page) gets human-readable subject names without each having to know
    // about pathways.subjects.
    const allSubjectIds = Array.from(
      new Set((combinations || []).flatMap((c: any) => c.subjects || []))
    );
    let subjectNameById: Record<string, string> = {};
    if (allSubjectIds.length > 0) {
      const { data: subjectRows } = await supabase
        .schema('pathways')
        .from('subjects')
        .select('id, name')
        .in('id', allSubjectIds);
      subjectNameById = Object.fromEntries((subjectRows || []).map((s: any) => [s.id, s.name]));
    }
    const combinationsWithNames = (combinations || []).map((c: any) => ({
      ...c,
      subjects: (c.subjects || []).map((id: string) => subjectNameById[id] || id),
    }));

    return NextResponse.json({
      career: {
        name: matchedCareer.career_name,
        description: matchedCareer.description,
      },
      pathway: matchedCareer.pathways,
      track: matchedCareer.tracks,
      combinations: combinationsWithNames,
      confidence: matchedCareer.career_name ? 0.9 : 0.5,
      message: `Based on your interest, we recommend the ${matchedCareer.pathways?.name} pathway with a focus on ${matchedCareer.tracks?.name}.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to interpret career query' }, { status: 500 });
  }
}
