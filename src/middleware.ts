import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Protected routes that require authentication
const PROTECTED_PATHS = ["/dashboard", "/admin"]

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

  // SINGLE-HOP REDIRECT: /internships → /opportunities/ (runs before trailingSlash normalization)
  if (request.nextUrl.pathname === '/internships' || request.nextUrl.pathname === '/internships/') {
    return NextResponse.redirect(new URL('/opportunities/', request.url), 308)
  }

  const { pathname } = request.nextUrl

  // Check if this is a protected route
  const isProtected = PROTECTED_PATHS.some(path => pathname === path || pathname.startsWith(path + "/"))
  if (!isProtected) {
    return NextResponse.next()
  }

  // Check for Supabase SSR session cookie
  // @supabase/ssr names cookies: sb-<project-ref>-auth-token, often chunked as sb-<ref>-auth-token.0, .1, etc.
  const hasSession = request.cookies.has("sb-ohlgjvenwekpbpkykutz-auth-token") ||
                     request.cookies.has("sb-auth-token") ||
                     Array.from(request.cookies.getAll()).some(c => c.name.startsWith("sb-") && c.name.includes("auth-token"))

  if (!hasSession) {
    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
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

