import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

// Protected routes that require authentication
const PROTECTED_PATHS = ["/dashboard", "/admin", "/bursary/provider/dashboard"]

// Matches "bursary.elimux.ke" or "bursary.elimux.ke:<port>" (local/preview
// dev) exactly — deliberately NOT a startsWith() check, since
// host.startsWith('bursary.elimux.ke') would also match a spoofed host like
// "bursary.elimux.ke.attacker.com".
const BURSARY_HOST = /^bursary\.elimux\.ke(:\d+)?$/

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''

  // Bursary Engine "Opening Soon" subdomain: rewrite every path to /bursary
  // (single coming-soon page today, per Cycle 016 — Task 2 creates only the
  // one page, so anything beyond the root still resolves to it via this
  // catch-all rewrite rather than 404ing).
  if (BURSARY_HOST.test(host)) {
    const url = request.nextUrl.clone()
    const path = request.nextUrl.pathname
    // Tolerate a path that already includes the /bursary prefix (e.g. someone
    // reuses a www.elimux.ke/bursary/... URL on this subdomain) instead of
    // double-prefixing it to /bursary/bursary/... and 404ing.
    if (path === '/') {
      url.pathname = '/bursary/'
    } else if (path === '/bursary' || path.startsWith('/bursary/')) {
      url.pathname = path
    } else {
      url.pathname = `/bursary${path}`
    }
    return NextResponse.rewrite(url)
  }

  const { pathname } = request.nextUrl

  // Check if this is a protected route
  const isProtected = PROTECTED_PATHS.some(path => pathname === path || pathname.startsWith(path + "/"))
  if (!isProtected) {
    return NextResponse.next()
  }

  // Check for Supabase SSR session cookie
  // @supabase/ssr names cookies: sb-<project-ref>-auth-token, often chunked as sb-<ref>-auth-token.0, .1, etc.
  const hasAuthCookie = request.cookies.has("sb-ohlgjvenwekpbpkykutz-auth-token") ||
                     request.cookies.has("sb-auth-token") ||
                     Array.from(request.cookies.getAll()).some(c => c.name.startsWith("sb-") && c.name.includes("auth-token"))

  // elimux_active is a true browser-session cookie (no Max-Age), set by
  // lib/supabase/client.ts on sign-in, so it disappears when the browser
  // fully closes - forcing re-login on shared/cyber-cafe machines even
  // though the underlying Supabase auth cookie may still be present.
  // elimux_remember opts a trusted device out of that for 30 days.
  const hasSessionMarker = request.cookies.get("elimux_active")?.value === "1" ||
                     request.cookies.get("elimux_remember")?.value === "1"

  const hasSession = hasAuthCookie && hasSessionMarker

  if (!hasSession) {
    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Cookie presence only proves a session exists, not that its email is
  // verified - no Supabase client existed in this file before this check,
  // so build one here (with cookie forwarding, per @supabase/ssr's
  // middleware pattern) rather than assuming one was already in scope.
  const response = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email_confirmed_at) {
    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("error", "email_not_verified")
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  // Broadened from the original ["/dashboard/:path*", "/admin/:path*",
  // "/internships", "/internships/"] — a strict superset, not a narrowing —
  // because the bursary-host rewrite above needs to run on every path on
  // that subdomain (root "/", not just the four previously-matched
  // patterns), not only on /dashboard, /admin, and /internships. This does
  // mean middleware now runs on effectively every request instead of four
  // route patterns; the existing auth-gate and redirect logic inside the
  // function are unchanged and still only act on their original paths.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
}

