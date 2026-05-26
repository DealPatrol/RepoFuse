import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getBillingState } from '@/lib/billing'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const billing = await getBillingState(user)

    return NextResponse.json({
      authenticated: true,
      username: user.github_username,
      user: {
        github_id: user.github_id,
        github_username: user.github_username,
        github_avatar_url: user.github_avatar_url,
      },
      billing,
    })
  } catch (error) {
    console.error('Error fetching auth status:', error)
    return NextResponse.json(
      { authenticated: false, error: 'Authentication is not configured yet.' },
      { status: 500 },
    )
  }
}
