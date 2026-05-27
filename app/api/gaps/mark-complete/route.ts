import { NextRequest, NextResponse } from 'next/server'
import { markGapAsComplete, getCompletedGapCount, getMissingGapsByBlueprint } from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { gapId, blueprintId } = body
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (!gapId || !blueprintId) {
      return NextResponse.json(
        { error: 'Missing gapId or blueprintId' },
        { status: 400 }
      )
    }

    const gaps = await getMissingGapsByBlueprint(blueprintId, user.id)
    if (!gaps.some((gap) => gap.id === gapId)) {
      return NextResponse.json({ error: 'Gap not found' }, { status: 404 })
    }

    const completedGap = await markGapAsComplete(gapId, blueprintId, user.id)
    const completedCount = await getCompletedGapCount(blueprintId)

    return NextResponse.json(
      { 
        success: true,
        completedGap,
        completedCount,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Error marking gap as complete:', error)
    return NextResponse.json(
      { error: 'Failed to mark gap as complete' },
      { status: 500 }
    )
  }
}
