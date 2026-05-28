import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { isClerkConfigured } from '@/lib/clerk-auth'

const isDashboardRoute = createRouteMatcher(['/dashboard(.*)'])

export default clerkMiddleware(async (auth, request) => {
  if (!isDashboardRoute(request)) {
    return
  }

  if (isClerkConfigured()) {
    await auth.protect()
    return
  }

  const userId = request.cookies.get('github_user_id')?.value
  const accessToken = request.cookies.get('github_access_token')?.value
  if (!userId || !accessToken) {
    return NextResponse.redirect(new URL('/?error=auth_required', request.url))
  }
})

export const config = {
  matcher: ['/dashboard/:path*'],
}
