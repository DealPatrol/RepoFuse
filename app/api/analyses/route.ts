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
      console.error('[v0] Validation error:', parsedBody.error.issues)
      return NextResponse.json({ error: parsedBody.error.issues[0]?.message ?? 'Invalid analysis request' }, { status: 400 })
    }

    const { name, repositoryIds } = parsedBody.data
    console.log('[v0] Creating analysis:', { name, repositoryIds, userId: user.id })
    
    const analysis = await createAnalysis(name.trim(), user.id)
    console.log('[v0] Analysis created:', analysis.id)

    const linked: string[] = []
    const failed: string[] = []
    
    for (const repoId of repositoryIds) {
      try {
        console.log('[v0] Linking repo', repoId, 'to analysis', analysis.id)
        const repository = await getRepositoryById(repoId, user.id)
        if (!repository) {
          console.warn(`[v0] Repository ${repoId} not found or not owned by ${user.id}`)
          failed.push(repoId)
          continue
        }
        await linkAnalysisToRepository(analysis.id, repoId)
        linked.push(repoId as string)
        console.log('[v0] Successfully linked repo', repoId)
      } catch (e) {
        console.error(`[v0] Failed to link repository ${repoId} to analysis ${analysis.id}:`, e)
        failed.push(repoId)
      }
    }

    console.log('[v0] Link summary - Linked:', linked.length, 'Failed:', failed.length)

    if (linked.length === 0) {
      console.error('[v0] No repositories were successfully linked. Failed repos:', failed)
      return NextResponse.json(
        { error: 'Failed to link any repositories to the analysis. Verify repository IDs are valid.' },
        { status: 400 },
      )
    }

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('[v0] Error creating analysis:', error)
    return NextResponse.json({ error: 'Failed to create analysis' }, { status: 500 })
  }
}
