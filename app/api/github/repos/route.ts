import { NextResponse } from 'next/server'
import { getCurrentAccessToken } from '@/lib/auth'
import { GitHubApiError, listGitHubRepositories } from '@/lib/github'

export async function GET() {
  try {
    const accessToken = await getCurrentAccessToken()

    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const repositories = await listGitHubRepositories(accessToken)
    return NextResponse.json(repositories)
  } catch (error) {
    console.error('Error fetching repos:', error)
    if (error instanceof GitHubApiError) {
      if (error.status === 401) {
        return NextResponse.json(
          { error: 'GitHub authorization expired. Please sign in with GitHub again.' },
          { status: 401 },
        )
      }

      if (error.status === 403) {
        return NextResponse.json(
          { error: 'GitHub denied repository access. Check that RepoFuse has permission to read your repositories.' },
          { status: 403 },
        )
      }

      return NextResponse.json(
        { error: `GitHub repository sync failed with status ${error.status}.` },
        { status: 502 },
      )
    }

    return NextResponse.json({ error: 'Failed to sync repositories from GitHub' }, { status: 500 })
  }
}
