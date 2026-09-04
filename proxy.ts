import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse, NextRequest } from 'next/server'

const isDashboardRoute = createRouteMatcher(['/dashboard(.*)'])

const clerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() &&
    process.env.CLERK_SECRET_KEY?.trim(),
)

function githubCookieProxy(request: NextRequest) {
  if (!isDashboardRoute(request)) {
    return NextResponse.next()
  }
  const userId = request.cookies.get('github_user_id')?.value
  const accessToken = request.cookies.get('github_access_token')?.value
  if (!userId || !accessToken) {
    return NextResponse.redirect(new URL('/?error=auth_required', request.url))
  }
  return NextResponse.next()
}

const proxy = clerkConfigured
  ? clerkMiddleware(async (auth, request: NextRequest) => {
      try {
        if (!isDashboardRoute(request)) {
          return NextResponse.next()
        }
        try {
          await auth.protect()
        } catch (error) {
          console.error('[v0] Clerk auth.protect() failed:', error)
          return NextResponse.redirect(new URL('/?error=auth_failed', request.url))
        }
        return NextResponse.next()
      } catch (error) {
        console.error('[v0] Proxy error:', error)
        return NextResponse.redirect(new URL('/?error=proxy_error', request.url))
      }
    })
  : githubCookieProxy

export default proxy

export const config = {
  matcher: ['/dashboard/:path*'],
}
