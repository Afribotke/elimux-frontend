import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('redirect') ?? '/dashboard';

  if (!code) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=oauth_no_code&message=${encodeURIComponent('Sign-in was cancelled or the authorization code was missing.')}`
    );
  }

  const supabase = await createClient();

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error('[OAuth Callback] exchangeCodeForSession failed:', exchangeError.message);
    return NextResponse.redirect(
      `${origin}/auth/login?error=oauth_exchange_failed&message=${encodeURIComponent(exchangeError.message)}`
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
