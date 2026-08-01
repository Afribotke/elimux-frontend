import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Protected routes that require authentication
const PROTECTED_PATHS = ["/dashboard", "/admin"]

export async function middleware(request: NextRequest) {
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
  matcher: ["/dashboard/:path*", "/admin/:path*"]
}
