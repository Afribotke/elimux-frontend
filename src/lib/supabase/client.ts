import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

// Every call site does `const supabase = createClient()` at component-body
// scope (not memoized), so without caching here each render/component
// spins up its own GoTrueClient - hence the "Multiple GoTrueClient
// instances detected" warning. Verified in production that this causes
// getSession() to intermittently miss a perfectly valid, non-expired
// session (confirmed the token itself was live against Supabase's
// /auth/v1/user directly), which broke employer registration outright.
// One browser tab should only ever have one auth client.
let browserClient: SupabaseClient | undefined;

export function createClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        // Default true: on any page load with a `?code=` param (e.g. the
        // password-recovery link landing on /auth/reset-password), the SDK
        // silently exchanges it for a session in the background the moment
        // this client is created - before the user submits anything. That
        // burns the single-use PKCE code, so reset-password's own deliberate
        // submit-time exchangeCodeForSession(code) call then fails with
        // "bad_code_verifier" a couple seconds later. No flow in this app
        // (no OAuth/magic-link sign-in) depends on automatic detection, so
        // it's safe to disable app-wide.
        auth: { detectSessionInUrl: false },
      }
    );
  }
  return browserClient;
}
