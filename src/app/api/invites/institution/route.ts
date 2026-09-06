import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function generateToken(): string {
  return randomBytes(8).toString('hex').slice(0, 16);
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: { institution_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.institution_id) {
    return NextResponse.json({ success: false, error: 'institution_id required' }, { status: 400 });
  }

  // Verify institution exists
  const { data: institution, error: instError } = await supabaseAdmin
    .from('institutions')
    .select('id')
    .eq('id', body.institution_id)
    .single();

  if (instError || !institution) {
    return NextResponse.json({ success: false, error: 'Institution not found' }, { status: 404 });
  }

  // Generate unique token
  let token = generateToken();
  let attempts = 0;
  while (attempts < 5) {
    const { data: existing } = await supabaseAdmin
      .from('institution_invites')
      .select('id')
      .eq('token', token)
      .single();

    if (!existing) break;
    token = generateToken();
    attempts++;
  }

  const { data: invite, error: insertError } = await supabaseAdmin
    .from('institution_invites')
    .insert({
      institution_id: body.institution_id,
      token,
      created_by: user.id,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    })
    .select()
    .single();

  if (insertError) {
    console.error('Invite creation error:', insertError);
    return NextResponse.json({ success: false, error: 'Failed to create invite' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: {
      token: invite.token,
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.elimux.ke'}/invite/institution/${invite.token}`,
      expires_at: invite.expires_at,
    },
  });
}
