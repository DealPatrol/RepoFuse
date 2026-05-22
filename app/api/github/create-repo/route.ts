import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAccessToken } from '@/lib/auth'
import { requirePro } from '@/lib/billing'
import { createGitHubRepositoryFromBlueprint } from '@/lib/repofuse-core.js'
import { createGitHubRepositoryRequestSchema } from '@/lib/schemas'

export async function POST(request: NextRequest) {
  try {
    const [accessToken, proAccess] = await Promise.all([
      getCurrentAccessToken(),
      requirePro(),
    ])

    if (!proAccess.ok) {
      return proAccess.response
    }

    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const parsedBody = createGitHubRepositoryRequestSchema.safeParse(await request.json())

    if (!parsedBody.success) {
      return NextResponse.json({ error: parsedBody.error.issues[0]?.message ?? 'Invalid repository request' }, { status: 400 })
    }

    const result = await createGitHubRepositoryFromBlueprint({
      accessToken,
      repoName: parsedBody.data.repoName,
      app: parsedBody.data.app,
      privateRepo: false,
    })

    return NextResponse.json({
      success: true,
      repository: result.repository,
      filesCreated: result.files_created,
    })
  } catch (error) {
    console.error('Error creating repository:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create repository' },
      { status: 500 },
    )
  }
}
