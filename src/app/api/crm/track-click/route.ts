import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DEFAULT_REDIRECT = 'https://www.elimux.ke';

function isAllowedRedirect(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && /(^|\.)elimux\.ke$/.test(parsed.hostname);
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const messageId = searchParams.get('id');
  const targetUrl = searchParams.get('url');

  if (messageId) {
    await supabase
      .from('crm_messages')
      .update({
        clicked_at: new Date().toISOString(),
        status: 'clicked'
      })
      .eq('id', messageId);
  }

  // Redirect to target URL — restricted to elimux.ke to avoid this becoming
  // an open redirect off a trusted domain (a common phishing vector).
  const redirectTo = targetUrl && isAllowedRedirect(targetUrl) ? targetUrl : DEFAULT_REDIRECT;

  return NextResponse.redirect(redirectTo, 302);
}
