import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getDb } from '@/lib/db'
import { GITHUB_ACCESS_TOKEN_COOKIE, sanitizeReturnTo } from '@/lib/auth'
import { upsertSubscription } from '@/lib/queries'

function getBaseUrl(request: NextRequest) {
  return process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
}

function getGitHubClientId() {
  return process.env.GITHUB_CLIENT_ID || process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID
}

async function fetchPrimaryEmail(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'RepoFuse',
      },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const emails = (await res.json()) as Array<{ email: string; primary: boolean; verified: boolean }>
    const primary = emails.find((e) => e.primary && e.verified)
    return primary?.email ?? emails.find((e) => e.verified)?.email ?? null
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    const cookieStore = await cookies()
    const savedState = cookieStore.get('github_oauth_state')?.value
    const returnTo = sanitizeReturnTo(cookieStore.get('github_oauth_return_to')?.value)

    if (error) {
      console.error('[v0] GitHub returned OAuth error:', error, errorDescription)
      return NextResponse.redirect(new URL(`/?error=${error}`, getBaseUrl(request)))
    }

    if (!code) {
      return NextResponse.redirect(new URL('/?error=missing_code', getBaseUrl(request)))
    }

    if (!state || !savedState || state !== savedState) {
      console.error('[v0] OAuth state mismatch', { state, savedState })
      return NextResponse.redirect(new URL('/?error=invalid_oauth_state', getBaseUrl(request)))
    }

    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: getGitHubClientId(),
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${getBaseUrl(request)}/api/auth/github/callback`,
      }),
    })

    if (!tokenResponse.ok) {
      return NextResponse.redirect(new URL('/?error=token_exchange_failed', getBaseUrl(request)))
    }

    const tokenJson = (await tokenResponse.json()) as { access_token?: string; error?: string }
    const access_token = tokenJson.access_token

    if (!access_token) {
      console.error('[v0] Token response missing access_token', tokenJson)
      return NextResponse.redirect(new URL('/?error=token_exchange_failed', getBaseUrl(request)))
    }

    // Fetch user profile and primary email in parallel
    const [userResponse, primaryEmail] = await Promise.all([
      fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: 'application/vnd.github+json',
        },
      }),
      fetchPrimaryEmail(access_token),
    ])

    if (!userResponse.ok) {
      return NextResponse.redirect(new URL('/?error=github_user_fetch_failed', getBaseUrl(request)))
    }

    const githubUser = await userResponse.json()

    try {
      const sql = getDb()
      await sql`
        INSERT INTO user_auth (github_id, github_username, github_avatar_url, access_token, email)
        VALUES (${githubUser.id}, ${githubUser.login}, ${githubUser.avatar_url}, ${access_token}, ${primaryEmail})
        ON CONFLICT (github_id)
        DO UPDATE SET
          access_token = ${access_token},
          github_username = ${githubUser.login},
          github_avatar_url = ${githubUser.avatar_url},
          email = COALESCE(${primaryEmail}, user_auth.email),
          updated_at = CURRENT_TIMESTAMP
      `
      await upsertSubscription({ github_id: githubUser.id })
    } catch (dbError) {
      console.error('[v0] OAuth callback DB write failed; continuing with cookie session:', dbError)
    }

    const launchSignupCookie = cookieStore.get('launch_signup')?.value
    let redirectUrl = returnTo

    if (launchSignupCookie) {
      try {
        const launchData = JSON.parse(launchSignupCookie)
        if (launchData.wantsStripe) {
          redirectUrl = '/api/stripe/checkout-redirect'
        } else {
          redirectUrl = '/dashboard?trial=started'
        }
      } catch (e) {
        console.error('[v0] Failed to parse launch_signup cookie:', e)
      }
    }

    const response = NextResponse.redirect(new URL(redirectUrl, getBaseUrl(request)))
    response.cookies.set('github_user_id', String(githubUser.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
    response.cookies.set(GITHUB_ACCESS_TOKEN_COOKIE, access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
    response.cookies.set('github_oauth_state', '', { path: '/', maxAge: 0 })
    response.cookies.set('github_oauth_return_to', '', { path: '/', maxAge: 0 })
    response.cookies.set('launch_signup', '', { path: '/', maxAge: 0 })

    return response
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(new URL('/?error=oauth_callback_failed', getBaseUrl(request)))
  }
}