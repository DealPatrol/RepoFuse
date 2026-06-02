import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getDb } from '@/lib/db'
import { upsertSubscription } from '@/lib/queries'

function getBaseUrl(request: NextRequest) {
  return process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
}

function getGitLabClientId() {
  return process.env.GITLAB_CLIENT_ID
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    const cookieStore = await cookies()
    const savedState = cookieStore.get('gitlab_oauth_state')?.value

    console.log('[v0] GitLab OAuth callback received', {
      hasCode: !!code,
      hasState: !!state,
      hasSavedState: !!savedState,
      stateMatch: state === savedState,
      baseUrl: getBaseUrl(request),
      clientId: getGitLabClientId(),
      hasClientSecret: !!process.env.GITLAB_CLIENT_SECRET,
      error,
      errorDescription,
    })

    if (error) {
      console.error('[v0] GitLab returned OAuth error:', error, errorDescription)
      return NextResponse.redirect(new URL(`/?error=${error}`, getBaseUrl(request)))
    }

    if (!code) {
      return NextResponse.redirect(new URL('/?error=missing_code', getBaseUrl(request)))
    }

    if (!state || !savedState || state !== savedState) {
      console.error('[v0] OAuth state mismatch', { state, savedState })
      return NextResponse.redirect(new URL('/?error=invalid_oauth_state', getBaseUrl(request)))
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://gitlab.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: getGitLabClientId(),
        client_secret: process.env.GITLAB_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${getBaseUrl(request)}/api/auth/gitlab/callback`,
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

    // Get user info from GitLab
    const userResponse = await fetch('https://gitlab.com/api/v4/user', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    })

    if (!userResponse.ok) {
      return NextResponse.redirect(new URL('/?error=gitlab_user_fetch_failed', getBaseUrl(request)))
    }

    const gitlabUser = await userResponse.json()

    // Persisting auth row is best-effort; cookie-based session should still be created.
    try {
      const sql = getDb()
      await sql`
        INSERT INTO user_auth (github_id, github_username, github_avatar_url, access_token)
        VALUES (${gitlabUser.id}, ${gitlabUser.username}, ${gitlabUser.avatar_url}, ${access_token})
        ON CONFLICT (github_id)
        DO UPDATE SET
          access_token = ${access_token},
          github_username = ${gitlabUser.username},
          github_avatar_url = ${gitlabUser.avatar_url},
          updated_at = CURRENT_TIMESTAMP
      `
      await upsertSubscription({ github_id: gitlabUser.id })
    } catch (dbError) {
      console.error('[v0] OAuth callback DB write failed; continuing with cookie session:', dbError)
    }

    // Check if this is a launch signup flow
    const launchSignupCookie = cookieStore.get('launch_signup')?.value
    let redirectUrl = '/dashboard/repositories?connected=gitlab'
    
    if (launchSignupCookie) {
      try {
        const launchData = JSON.parse(launchSignupCookie)
        console.log('[v0] GitLab launch signup flow detected:', launchData)
        
        if (launchData.wantsStripe) {
          // Redirect to Stripe checkout
          redirectUrl = '/api/stripe/checkout-redirect'
        } else {
          // Free trial - just go to dashboard
          redirectUrl = '/dashboard?trial=started'
        }
      } catch (e) {
        console.error('[v0] Failed to parse launch_signup cookie:', e)
      }
    }

    // Session cookies — token cookie lets APIs work even if DB persistence failed
    const response = NextResponse.redirect(new URL(redirectUrl, getBaseUrl(request)))
    response.cookies.set('github_user_id', String(gitlabUser.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })
    response.cookies.set('github_access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
    response.cookies.set('gitlab_oauth_state', '', { path: '/', maxAge: 0 })
    // Clear the launch signup cookie after use
    response.cookies.set('launch_signup', '', { path: '/', maxAge: 0 })

    return response
  } catch (error) {
    console.error('GitLab OAuth callback error:', error)
    return NextResponse.redirect(new URL('/?error=oauth_callback_failed', getBaseUrl(request)))
  }
}
