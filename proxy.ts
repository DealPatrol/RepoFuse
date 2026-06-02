import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse, NextRequest } from 'next/server'
import { isClerkConfigured } from '@/lib/clerk-auth'

const isDashboardRoute = createRouteMatcher(['/dashboard(.*)'])

export default clerkMiddleware(async (auth, request: NextRequest) => {
  try {
    if (!isDashboardRoute(request)) {
      return NextResponse.next()
    }

    if (isClerkConfigured()) {
      try {
        await auth.protect()
      } catch (error) {
        console.error('[proxy] Clerk auth.protect() failed:', error)
        return NextResponse.redirect(new URL('/?error=auth_failed', request.url))
      }
      return NextResponse.next()
    }

    const userId = request.cookies.get('github_user_id')?.value
    const accessToken = request.cookies.get('github_access_token')?.value
    if (!userId || !accessToken) {
      return NextResponse.redirect(new URL('/?error=auth_required', request.url))
    }
    return NextResponse.next()
  } catch (error) {
    console.error('[proxy] Invocation error:', error)
    return NextResponse.redirect(new URL('/?error=middleware_error', request.url))
  }
})

export const config = {
  matcher: ['/dashboard/:path*'],
}
