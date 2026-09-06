# Login-hang fix brief — AUDITED, NOT EXECUTED — 3 real problems found

Prior content (the client.ts/login/middleware rewrite brief) archived to
`docs/archive/bridge-146.md`. Per this session's standing rule, read and
audited before touching anything — did not execute. None of the three file
replacements should go in as written.

## Problem 1: `client.ts` rewrite would break the build and reintroduce an already-fixed bug

- `import type { Database } from '@/types/supabase'` — **this file doesn't
  exist** (`find src/types -iname "*supabase*"` returns nothing). Build
  fails immediately.
- Deletes `setSessionMarkers`, `hasValidSessionMarkers`, `clearSessionMarkers`
  — **13 other files import these**: `AuthContext.tsx`, `client-auth.ts`,
  and 11 pages (advertiser billing/campaigns/dashboard, employer
  attachments, institution dashboard, 3 nita pages, student logbook,
  university placements, plus `auth/login/page.tsx` itself). Removing the
  exports breaks all of them.
- Sets `detectSessionInUrl: true`. The current file explicitly sets this to
  `false`, with a comment explaining why: with it `true`, any page loaded
  with a `?code=` param (the password-reset link landing on
  `/auth/reset-password`) gets its single-use PKCE code silently consumed
  by auto-detection before the page's own explicit exchange runs, breaking
  password reset with a `bad_code_verifier` error. This was already found
  and fixed earlier this session — this rewrite would undo that fix.
- Also drops the singleton's `signOut` wrapper that keeps the
  `elimux_active`/`elimux_remember` cookies in sync with the real session on
  every one of the 9+ call sites that call `signOut()` directly.

## Problem 2: `login/page.tsx` rewrite calls a React hook where hooks can't be called

```ts
try {
  const { useRouter } = await import('next/navigation')
  const router = useRouter()
  router.push(redirect)
  ...
```

`useRouter()` is a React hook, called here inside an async event handler,
after an `await`, via a dynamically-imported module. Hooks can only be
called synchronously in a component's render body. This isn't a style nit —
it's invalid and would throw at runtime, so it wouldn't successfully
navigate anywhere; it would be a new, different failure in the same spot
the current bug already is. The rest of the file (the `withTimeout` wrapper,
the debug log panel) is a reasonable idea in isolation, but this piece
would need `useRouter()` called normally at the top of `LoginForm` (which
the current code already does) rather than reached for inside the handler.

## Problem 3: `middleware.ts` rewrite would lock anonymous visitors out of nearly the whole site

This is the serious one. The real, current `src/middleware.ts` is
**default-allow**: only three paths require auth (`/dashboard`, `/admin`,
`/bursary/provider/dashboard`) via `PROTECTED_PATHS`; everything else passes
through freely.

The proposed replacement flips this to **default-deny**: everything
*except* a hardcoded `publicPaths` list (`/`, `/auth/login`,
`/auth/register`, `/auth/callback`, `/auth/reset-password`, `/ai-search`,
`/schools`, `/about`, `/contact` — several of which, like `/about`, don't
even exist in this project) redirects to login. That means institutions,
programs, scholarships, internships, attachments, bursary, and
`/pathways`/`/pathways/select` (not in the list either) would all suddenly
require login for anonymous visitors. That's most of the site — this would
be a severe, site-wide regression, not a fix, and far worse than the
current login hang.

## What I did instead

Nothing to the three files. Confirmed via grep/read against the real
codebase rather than trusting the brief's own claims about what's broken —
this brief reads like a generic Supabase-troubleshooting template, not
something written against this project's actual files (the nonexistent
`@/types/supabase` import and the guessed `publicPaths` list are the
tells).

## What's actually worth keeping from this brief

The core diagnostic idea — wrap the *existing* `signInWithPassword` call in
a hard timeout so a hang surfaces as a visible error instead of an infinite
spinner — is sound and low-risk, applied to the current file rather than
the full rewrite. I haven't done this yet since the last instruction was
just "read bridge.md," not "execute." Say the word and I'll add a scoped
timeout + console logging to the *current* `auth/login/page.tsx` only,
leaving `client.ts` and `middleware.ts` untouched, then redeploy and retry
the signed-in pathway test that's still blocked.
