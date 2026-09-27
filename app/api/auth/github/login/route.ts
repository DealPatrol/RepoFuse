import crypto from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getAuthUserFromClerkUserId, sanitizeReturnTo } from '@/lib/auth'
import { getSignInUrl } from '@/lib/auth-url'
import { isClerkConfigured } from '@/lib/clerk-auth'
import { GITHUB_ACCOUNT_NOT_LINKED_CODE } from '@/lib/github-account'
import { isLegacyGitHubOAuthConfigured, legacyGitHubClientId } from '@/lib/github-oauth'

function getBaseUrl(request: NextRequest) {
  return process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
}

function legacyGitHubOAuthRedirect(request: NextRequest) {
  const clientId = legacyGitHubClientId()
  if (!clientId) {
    return NextResponse.redirect(new URL('/?error=github_oauth_not_configured', getBaseUrl(request)))
  }

  const state = crypto.randomUUID()
  const redirectUri = `${getBaseUrl(request)}/api/auth/github/callback`
  const returnTo = sanitizeReturnTo(request.nextUrl.searchParams.get('returnTo'))

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

async function clerkGitHubConnectRedirect(request: NextRequest) {
  const baseUrl = getBaseUrl(request)
  const returnTo = sanitizeReturnTo(
    request.nextUrl.searchParams.get('returnTo'),
    '/dashboard/repositories',
  )

  if (!isClerkConfigured()) {
    return NextResponse.redirect(new URL('/?error=github_oauth_not_configured', baseUrl))
  }

  const { userId } = await auth()
  if (!userId) {
    return NextResponse.redirect(new URL(getSignInUrl(returnTo), baseUrl))
  }

  const linkedUser = await getAuthUserFromClerkUserId(userId, true)
  const destination = new URL(returnTo, baseUrl)
  if (!linkedUser?.access_token) {
    destination.searchParams.delete('connected')
    destination.searchParams.set('error', GITHUB_ACCOUNT_NOT_LINKED_CODE)
    return NextResponse.redirect(destination)
  }

  if (!destination.searchParams.has('connected')) {
    destination.searchParams.set('connected', 'github')
  }
  return NextResponse.redirect(destination)
}

export async function GET(request: NextRequest) {
  if (isLegacyGitHubOAuthConfigured()) {
    return legacyGitHubOAuthRedirect(request)
  }

  return clerkGitHubConnectRedirect(request)
}
