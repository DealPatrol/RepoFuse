import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateUserCredits, getCreditUsageSummary } from '@/lib/credits'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Sign in with GitHub to view credits.' },
        { status: 401 }
      )
    }
    if (!user.id) {
      return NextResponse.json(
        { error: 'Unable to load your account. Please sign in again.' },
        { status: 401 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }
    if (userId !== user.id) {
      return NextResponse.json(
        { error: 'You can only view credits for your own account.' },
        { status: 403 }
      )
    }

    // Get credits and usage summary
    const [credits, summary] = await Promise.all([
      getOrCreateUserCredits(userId),
      getCreditUsageSummary(userId),
    ])

    return NextResponse.json({
      credits,
      summary,
    })
  } catch (error) {
    console.error('[v0] Failed to fetch credits summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch credits' },
      { status: 500 }
    )
  }
}
