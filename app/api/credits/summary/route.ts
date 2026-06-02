import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateUserCredits, getCreditUsageSummary } from '@/lib/credits'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const requestedUserId = request.nextUrl.searchParams.get('userId')
    if (requestedUserId && requestedUserId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userId = user.id

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
