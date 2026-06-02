// app/api/auth/vercel/route.ts
// Kicks off Vercel OAuth — redirects user to Vercel's consent screen

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.redirect(new URL('/', request.nextUrl.origin))

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
  const clientId = process.env.VERCEL_CLIENT_ID

  if (!clientId) {
    console.error('[vercel-oauth] VERCEL_CLIENT_ID not set')
    return NextResponse.redirect(new URL('/dashboard/settings?error=vercel_not_configured', baseUrl))
  }

  // CSRF protection — random state token
  const state = crypto.randomUUID()
  const cookieStore = await cookies()
  cookieStore.set('vercel_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  })

  const redirectUri = `${baseUrl}/api/auth/vercel/callback`
  const authUrl = new URL('https://vercel.com/oauth/authorize')
  authUrl.searchParams.set('client_id', clientId)
  authUrl.searchParams.set('redirect_uri', redirectUri)
  authUrl.searchParams.set('state', state)

  return NextResponse.redirect(authUrl.toString())
}
