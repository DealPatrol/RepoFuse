import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, trialType, wantsStripe } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    // Store the launch signup data in a cookie so we can use it after OAuth
    const cookieStore = await cookies()
    cookieStore.set('launch_signup', JSON.stringify({
      name,
      email,
      trialType: trialType || '14-days',
      wantsStripe: wantsStripe || false,
      timestamp: Date.now(),
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    })

    // Return success - the user will be redirected to GitHub/GitLab OAuth
    return NextResponse.json({ 
      success: true,
      message: 'Signup data saved. Please connect your GitHub or GitLab account to continue.',
    })
  } catch (error) {
    console.error('[v0] Launch signup error:', error)
    return NextResponse.json({ error: 'Failed to process signup' }, { status: 500 })
  }
}
