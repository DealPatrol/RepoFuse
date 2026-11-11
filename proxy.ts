import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse, type NextRequest } from 'next/server'

const clerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() &&
    process.env.CLERK_SECRET_KEY?.trim(),
)

const PROTECTED_PREFIXES = ['/dashboard', '/prospects']

/** Signed-in-only pages: the dashboard and the internal prospect-engine prototype. */
function isDashboardRequest(request: NextRequest): boolean {
  const { pathname } = request.nextUrl
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
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
function hasLegacyGitHubSession(request: NextRequest): boolean {
  return Boolean(
    request.cookies.get('github_user_id')?.value && request.cookies.get('github_access_token')?.value,
  )
}

function signInRedirect(request: NextRequest) {
  const signInPath = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL?.trim() || '/sign-in'
  const url = new URL(signInPath, request.url)
  url.searchParams.set('redirect_url', `${request.nextUrl.pathname}${request.nextUrl.search}`)
  return NextResponse.redirect(url)
}

/**
 * With Clerk enabled, a dashboard request is allowed when it has a Clerk session
 * or a legacy GitHub OAuth cookie session (the sign-in page still uses the legacy
 * GitHub OAuth app when it is configured). Signed-out visitors go to sign-in
 * instead of hitting auth.protect()'s 404.
 */
const proxy = clerkConfigured
  ? clerkMiddleware(async (auth, request: NextRequest) => {
      if (!isDashboardRequest(request)) {
        return NextResponse.next()
      }
      try {
        const { userId } = await auth()
        if (userId) {
          return NextResponse.next()
        }
      } catch (error) {
        console.error('[proxy] Clerk auth() failed:', error)
      }
      if (hasLegacyGitHubSession(request)) {
        return NextResponse.next()
      }
      return signInRedirect(request)
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
