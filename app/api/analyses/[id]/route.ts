import { NextRequest, NextResponse } from 'next/server'
import { getAnalysisById, getBlueprintsByAnalysis, getRepositoriesForAnalysis } from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const analysis = await getAnalysisById(id, user.id)

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
    }

    const [repositories, blueprints] = await Promise.all([
      getRepositoriesForAnalysis(id, user.id),
      getBlueprintsByAnalysis(id, user.id),
    ])

    return NextResponse.json({
      ...analysis,
      repositories,
      blueprints,
      apps: blueprints,
    })
  } catch (error) {
    console.error('Error fetching analysis details:', error)
    return NextResponse.json({ error: 'Failed to fetch analysis details' }, { status: 500 })
  }
}
