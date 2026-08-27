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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email_confirmed_at) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      `${origin}/auth/login?error=email_not_verified&message=${encodeURIComponent('Please verify your email before signing in. Check your inbox for the verification link.')}`
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
