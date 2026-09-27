import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse, type NextRequest } from 'next/server'

const clerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() &&
    process.env.CLERK_SECRET_KEY?.trim(),
)

function isDashboardRequest(request: NextRequest): boolean {
  const { pathname } = request.nextUrl
  return pathname === '/dashboard' || pathname.startsWith('/dashboard/')
}

function githubCookieProxy(request: NextRequest) {
  if (!isDashboardRequest(request)) {
    return NextResponse.next()
  }
  const userId = request.cookies.get('github_user_id')?.value
  const accessToken = request.cookies.get('github_access_token')?.value
  if (!userId || !accessToken) {
    return NextResponse.redirect(new URL('/?error=auth_required', request.url))
  }
  return NextResponse.next()
}

/**
 * Next.js 16 loads this root `proxy.ts` (the app directory is not under `src`).
 * Clerk's recommended matcher is required so `auth()` works on dashboard pages
 * and on every API route that calls it. Dashboard routes stay protected.
 * `/api/mcp` and `/.well-known/oauth-*` are not protected here; those handlers
 * keep their own responses.
 */
const proxy = clerkConfigured
  ? clerkMiddleware(async (auth, request: NextRequest) => {
      if (!isDashboardRequest(request)) {
        return NextResponse.next()
      }
      try {
        await auth.protect()
      } catch (error) {
        console.error('[v0] Clerk auth.protect() failed:', error)
        return NextResponse.redirect(new URL('/?error=auth_failed', request.url))
      }
      return NextResponse.next()
    })
  : githubCookieProxy

export default proxy

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    // Always run for Clerk-specific frontend API routes
    '/__clerk/(.*)',
  ],
}
