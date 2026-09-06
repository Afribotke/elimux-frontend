import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const { data: invite, error: inviteError } = await supabaseAdmin
    .from('institution_invites')
    .select('*, institutions(*)')
    .eq('token', token)
    .single();

  if (inviteError || !invite) {
    return NextResponse.json({ success: false, error: 'Invalid or expired invite' }, { status: 404 });
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ success: false, error: 'Invite expired' }, { status: 410 });
  }

  return NextResponse.json({
    success: true,
    data: {
      institution: invite.institutions,
      token: invite.token,
      click_count: invite.click_count,
    },
  });
}
