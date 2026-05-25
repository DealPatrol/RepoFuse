import { NextRequest, NextResponse } from 'next/server'
import { getAllMissingGaps, getMissingGapsByBlueprint, getGapSummary } from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const blueprintId = searchParams.get('blueprintId')
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (blueprintId) {
      // Get gaps for specific blueprint
      const gaps = await getMissingGapsByBlueprint(blueprintId, user.id)
      return NextResponse.json({ gaps }, { status: 200 })
    }

    // Get all gaps and summary
    const [gaps, summary] = await Promise.all([
      getAllMissingGaps(user.id),
      getGapSummary(user.id),
    ])

    return NextResponse.json({ gaps, summary }, { status: 200 })
  } catch (error) {
    console.error('[v0] Error fetching gaps:', error)
    return NextResponse.json(
      { error: 'Failed to fetch gaps' },
      { status: 500 }
    )
  }
}
