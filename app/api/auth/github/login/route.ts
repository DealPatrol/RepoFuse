import crypto from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { DEFAULT_GITHUB_RETURN_TO, getSafeRedirectPath } from '@/lib/redirects'

function getBaseUrl(request: NextRequest) {
  return process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
}

function getGitHubClientId() {
  return process.env.GITHUB_CLIENT_ID || process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID
}

export async function GET(request: NextRequest) {
  const clientId = getGitHubClientId()

  if (!clientId) {
    return NextResponse.redirect(new URL('/?error=github_oauth_not_configured', getBaseUrl(request)))
  }

  const state = crypto.randomUUID()
  const redirectUri = `${getBaseUrl(request)}/api/auth/github/callback`
  const returnTo = getSafeRedirectPath(request.nextUrl.searchParams.get('returnTo'), DEFAULT_GITHUB_RETURN_TO)

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'read:user repo',
    state,
  })

  const response = NextResponse.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`)
  response.cookies.set('github_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10,
  })
  response.cookies.set('github_oauth_return_to', returnTo, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10,
  })

  return response
}
