import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createAnalysis, getRepositoryById, linkAnalysisToRepository, getAllAnalyses } from '@/lib/queries'
import { createAnalysisRequestSchema } from '@/lib/schemas'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const analyses = await getAllAnalyses(user.id)
    return NextResponse.json(analyses)
  } catch (error) {
    console.error('Error fetching analyses:', error)
    return NextResponse.json({ error: 'Failed to fetch analyses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const parsedBody = createAnalysisRequestSchema.safeParse(await request.json())

    if (!parsedBody.success) {
      return NextResponse.json({ error: parsedBody.error.issues[0]?.message ?? 'Invalid analysis request' }, { status: 400 })
    }

    const { name, repositoryIds } = parsedBody.data
    const analysis = await createAnalysis(name.trim(), user.id)

    const linked: string[] = []
    for (const repoId of repositoryIds) {
      try {
        const repository = await getRepositoryById(repoId, user.id)
        if (!repository) {
          console.warn(`Skipping repository ${repoId}; it is not owned by ${user.id}`)
          continue
        }
        await linkAnalysisToRepository(analysis.id, repoId)
        linked.push(repoId as string)
      } catch (e) {
        console.error(`Failed to link repository ${repoId} to analysis ${analysis.id}:`, e)
      }
    }

    if (linked.length === 0) {
      return NextResponse.json(
        { error: 'Failed to link any repositories to the analysis. Verify repository IDs are valid.' },
        { status: 400 },
      )
    }

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Error creating analysis:', error)
    return NextResponse.json({ error: 'Failed to create analysis' }, { status: 500 })
  }
}
