import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VALID_LEVELS = ['EE', 'ME', 'AE', 'BE'];
const VALID_SUBJECTS = [
  'Mathematics', 'English', 'Kiswahili', 'Integrated Science',
  'Social Studies', 'Creative Arts', 'Agriculture', 'Physical Education',
  'Computer Studies', 'Business Studies',
];

// Manual entry only — no document/photo upload, per Kenya Data
// Protection Act compliance requirements for this module.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { results, session_id } = body;

    if (!results || !Array.isArray(results)) {
      return NextResponse.json({ error: 'Results array required' }, { status: 400 });
    }

    for (const r of results) {
      if (!VALID_SUBJECTS.includes(r.subject)) {
        return NextResponse.json({ error: `Invalid subject: ${r.subject}` }, { status: 400 });
      }
      if (!VALID_LEVELS.includes(r.level)) {
        return NextResponse.json({ error: `Invalid level: ${r.level}` }, { status: 400 });
      }
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .schema('pathways')
      .from('kjsa_results')
      .insert({
        results,
        session_id,
        uploaded_via: 'manual',
        parsed_confidence: 1.0,
        parent_confirmed: true,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ kjsa: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save KJSA results' }, { status: 500 });
  }
}
