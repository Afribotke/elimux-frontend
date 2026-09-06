# setSession() workaround deployed — hangs identically. Root cause is NOT the network call.

Prior content archived to `docs/archive/bridge-148.md`.

## The workaround didn't work — but it proved something important

Deployed the fetch-directly + `setSession()` hydration fix (commit
`274ecb6`), retried live with a fresh test account:

```
[Login] calling auth endpoint directly...
[Login] auth endpoint status: 200
[Login] auth endpoint returned tokens
  (nothing for 20+ seconds - no "setSession resolved" log, ever)
```

The raw fetch works exactly as expected (200, real tokens, instant). Then
`supabase.auth.setSession({ access_token, refresh_token })` - a call that
does **no network request of its own**, just writes the given tokens into
the client's local state/storage - hangs exactly the same way
`signInWithPassword()` did. No timeout wraps this one, so the button is
just stuck on "Signing in..." again, indefinitely, with no error surfaced
this time (didn't wait it out to infinity, but 20+ seconds with zero
progress on an operation that should take single-digit milliseconds is
conclusive enough).

## What this rules out and rules in

This kills the "it's the network round-trip inside signInWithPassword"
theory - `setSession()` never touches the network. Both methods share one
thing: after they have tokens (from the API response or handed to them
directly), they both go through the same internal
`_saveSession`/storage-write path in the GoTrueClient. **That shared path is
almost certainly where the actual hang is** - most likely the
`@supabase/ssr` browser client's cookie-writing (via
`createBrowserClient`'s `cookies` handlers in `src/lib/supabase/client.ts`)
or an internal `navigator.locks`-based mutex GoTrueClient uses to
serialize session writes, that's stuck (never released) rather than the
auth network call.

## Where this leaves things

Two attempted fixes (front-load a timeout around `signInWithPassword`;
bypass it via direct fetch + `setSession`) both correctly diagnosed a real
symptom but neither fixes it, because the actual bottleneck sits one layer
deeper than either targeted - in the client's session-persistence
mechanism itself, not in whichever SDK method is asked to trigger it.

Next reasonable things to try, in rough order of how targeted they are:
1. Add the same timeout wrapper around `setSession()` too, so it at least
   fails visibly (this alone won't fix login, just stops the infinite
   spinner on this path the way it did for `signInWithPassword`).
2. Look directly at `src/lib/supabase/client.ts`'s custom `cookies` handling
   (if there is any beyond the default `createBrowserClient` behavior) for
   something that could block on write.
3. Try `@supabase/supabase-js`/`@supabase/ssr` version bumps in isolation
   (still not attempted) - this could be a known, since-fixed SDK bug.
4. Instrument `_saveSession` isn't accessible from outside without
   patching the SDK itself, so a maintainer with SDK-source access (or
   Supabase support, if this is a known issue) is probably the fastest
   path from here rather than more app-level workarounds.

Test account cleaned up as before. Still blocked on the original ask
(signed-in pathway-selection test) - genuinely can't get a session
established through this app right now, by any method tried so far.
