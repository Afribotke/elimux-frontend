import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  // Resolve invite
  const { data: invite, error: inviteError } = await supabaseAdmin
    .from('institution_invites')
    .select('token, institution_id')
    .eq('token', token)
    .single();

  if (inviteError || !invite) {
    return NextResponse.json({ success: false, error: 'Invalid invite' }, { status: 404 });
  }

  // Increment click count
  await supabaseAdmin.rpc('increment_invite_clicks', { invite_token: token });

  // Log detailed click
  const { error: clickError } = await supabaseAdmin.from('invite_clicks').insert({
    invite_token: token,
    institution_id: invite.institution_id,
  });

  if (clickError) {
    console.error('Click tracking error:', clickError);
  }

  return NextResponse.json({ success: true });
}
