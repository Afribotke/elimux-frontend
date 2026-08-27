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

const ACTIVE_SESSION_COOKIE = 'elimux_active'
const REMEMBER_COOKIE = 'elimux_remember'
const REMEMBER_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

// Marks this browser as logged-in for middleware's protected-path check
// (see middleware.ts). elimux_active is a true session cookie (no Max-Age)
// so it disappears when the browser fully closes, forcing re-login on
// shared/cyber-cafe machines. elimux_remember opts a trusted device out of
// that by persisting for 30 days. These are independent of, and don't
// modify, Supabase's own auth-token cookie - deliberately, since that
// cookie is written by a client-side singleton (see comment above) whose
// cookieOptions are fixed at construction time and can't react to a
// checkbox toggled after mount.
export function setSessionMarkers(remember: boolean) {
  if (typeof document === 'undefined') return
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  document.cookie = `${ACTIVE_SESSION_COOKIE}=1; Path=/; SameSite=Lax${secure}`
  document.cookie = remember
    ? `${REMEMBER_COOKIE}=1; Path=/; Max-Age=${REMEMBER_MAX_AGE}; SameSite=Lax${secure}`
    : `${REMEMBER_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`
}

export function clearSessionMarkers() {
  if (typeof document === 'undefined') return
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  document.cookie = `${ACTIVE_SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`
  document.cookie = `${REMEMBER_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`
}

// Same check middleware.ts does for its 3 gated paths, exposed for every
// other page's own client-side auth guard to call alongside its existing
// Supabase session check. On the server (no document) there's nothing to
// read - true here means "don't block", since middleware already owns the
// server-side gate for the paths it covers.
export function hasValidSessionMarkers(): boolean {
  if (typeof document === 'undefined') return true
  return document.cookie.includes(`${ACTIVE_SESSION_COOKIE}=1`) || document.cookie.includes(`${REMEMBER_COOKIE}=1`)
}

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

    // Nine call sites across the app invoke supabase.auth.signOut()
    // directly instead of going through a shared helper. Wrapping it once
    // here - rather than editing every call site - guarantees the
    // elimux_active/elimux_remember markers always clear together with the
    // real session, with no risk of a call site being missed.
    const originalSignOut = browserClient.auth.signOut.bind(browserClient.auth);
    browserClient.auth.signOut = ((...args: Parameters<typeof originalSignOut>) => {
      clearSessionMarkers();
      return originalSignOut(...args);
    }) as typeof browserClient.auth.signOut;
  }
  return browserClient;
}
