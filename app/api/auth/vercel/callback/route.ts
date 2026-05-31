// app/api/auth/vercel/callback/route.ts
// Handles Vercel OAuth callback — exchanges code for token, saves to DB

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getCurrentUser } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
  const settingsUrl = `${baseUrl}/dashboard/settings`

  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.redirect(new URL('/', baseUrl))

    const { searchParams } = request.nextUrl
    const code  = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      console.error('[vercel-oauth] Vercel returned error:', error)
      return NextResponse.redirect(`${settingsUrl}?error=vercel_denied`)
    }

    if (!code) return NextResponse.redirect(`${settingsUrl}?error=missing_code`)

    // Validate CSRF state
    const cookieStore = await cookies()
    const savedState  = cookieStore.get('vercel_oauth_state')?.value
    if (!state || !savedState || state !== savedState) {
      console.error('[vercel-oauth] State mismatch')
      return NextResponse.redirect(`${settingsUrl}?error=invalid_state`)
    }
    cookieStore.delete('vercel_oauth_state')

    // Exchange code for access token
    const redirectUri = `${baseUrl}/api/auth/vercel/callback`
    const tokenRes = await fetch('https://api.vercel.com/v2/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     process.env.VERCEL_CLIENT_ID!,
        client_secret: process.env.VERCEL_CLIENT_SECRET!,
        code,
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenRes.ok) {
      console.error('[vercel-oauth] Token exchange failed:', await tokenRes.text())
      return NextResponse.redirect(`${settingsUrl}?error=token_exchange_failed`)
    }

    const { access_token, team_id } = await tokenRes.json()
    if (!access_token) return NextResponse.redirect(`${settingsUrl}?error=no_token`)

    // Save to DB
    const db = getDb()
    await db`
      UPDATE users
      SET vercel_access_token = ${access_token},
          vercel_team_id      = ${team_id ?? null},
          updated_at          = NOW()
      WHERE id = ${user.id}
    `

    return NextResponse.redirect(`${settingsUrl}?vercel=connected`)

  } catch (err) {
    console.error('[vercel-oauth] Unexpected error:', err)
    return NextResponse.redirect(`${settingsUrl}?error=unexpected`)
  }
}
