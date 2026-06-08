import { NextRequest, NextResponse } from 'next/server'
import { sanitizeReturnTo } from '@/lib/auth'

function getBaseUrl(request: NextRequest) {
  return process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
}

export async function GET(request: NextRequest) {
  const returnTo = sanitizeReturnTo(request.nextUrl.searchParams.get('returnTo'), '/dashboard')
  const url = new URL('/sign-in', getBaseUrl(request))

  url.searchParams.set('error', 'bitbucket_not_available')
  url.searchParams.set('returnTo', returnTo)

  return NextResponse.redirect(url)
}
