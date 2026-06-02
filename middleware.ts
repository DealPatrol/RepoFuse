import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse, NextRequest } from 'next/server'

const isDashboardRoute = createRouteMatcher(['/dashboard(.*)'])

const clerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() &&
    process.env.CLERK_SECRET_KEY?.trim(),
)

function githubCookieMiddleware(request: NextRequest) {
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

export default clerkConfigured
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
        console.error('[v0] Middleware error:', error)
        return NextResponse.redirect(new URL('/?error=middleware_error', request.url))
      }
    })
  : githubCookieMiddleware

export const config = {
  matcher: ['/dashboard/:path*'],
}
