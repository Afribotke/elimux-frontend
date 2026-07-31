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
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return browserClient;
}
