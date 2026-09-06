SCOPED FIX — src/app/auth/login/page.tsx ONLY
Find this block (the timeout-wrapped signInWithPassword you just added):
TypeScript
      console.log('[login] calling signInWithPassword...')
      const AUTH_TIMEOUT_MS = 10000

      const { data, error } = await Promise.race([
        supabase.auth.signInWithPassword({ email, password }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Login request timed out. Please check your connection and try again.')),
            AUTH_TIMEOUT_MS
          )
        ),
      ])

      console.log('[login] signInWithPassword resolved — error:', error?.message ?? 'none')
Replace it with:
TypeScript
      console.log('[login] calling auth endpoint directly...')
      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
      const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      const authRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      console.log('[login] auth endpoint status:', authRes.status)

      if (!authRes.ok) {
        const errBody = await authRes.json().catch(() => ({}))
        throw new Error(errBody.message || errBody.msg || `Auth failed (${authRes.status})`)
      }

      const authData = await authRes.json()
      console.log('[login] auth endpoint returned tokens')

      // Hydrate the Supabase browser client with the session so
      // auto-refresh, RLS, and all other SDK features work normally
      const { data, error } = await supabase.auth.setSession({
        access_token: authData.access_token,
        refresh_token: authData.refresh_token,
      })

      console.log('[login] setSession result — error:', error?.message ?? 'none')
The rest of handleSubmit stays exactly as-is — if (error) throw error, setSessionMarkers(data.session), router.push(redirect), etc. all remain untouched.
WHY THIS WORKS
Table
Layer	What Happens
fetch to /auth/v1/token	Plain HTTP, no SDK internals, no navigator.locks, no cookie contention — returns in ~200ms
supabase.auth.setSession({ access_token, refresh_token })	Tells the browser client "here's your session, start managing it." Triggers the same auth-state change listeners as a normal login. Auto-refresh, RLS, realtime — all work.
Everything after	Unchanged. setSessionMarkers, navigation, post-login logic — all runs normally.
EXECUTE
Apply the replacement above, build, deploy, test with your throwaway account. The expected flow:
plain
[login] calling auth endpoint directly...
[login] auth endpoint status: 200
[login] auth endpoint returned tokens
[login] setSession result — error: none
[login] session received, calling setSessionMarkers...
[login] setSessionMarkers done, navigating to: /pathways/select