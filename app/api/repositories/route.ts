import { NextRequest, NextResponse } from 'next/server'
import { getAllRepositories, createRepository, getSubscriptionByGithubId, upsertSubscription } from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'
import { PLANS, isPaidPlan } from '@/lib/stripe'
import { createRepositoryRequestSchema, parseGitHubRepositoryUrl } from '@/lib/schemas'

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const repositories = await getAllRepositories(user.id)
    return NextResponse.json(repositories)
  } catch (error) {
    console.error('Error fetching repositories:', error)
    return NextResponse.json({ error: 'Failed to fetch repositories' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    let sub = await getSubscriptionByGithubId(user.github_id).catch(() => null)
    if (!sub) {
      sub = await upsertSubscription({ github_id: user.github_id }).catch(() => null)
    }
    if (sub && !isPaidPlan(sub.plan)) {
      const repos = await getAllRepositories(user.id)
      if (repos.length >= PLANS.free.repos_limit) {
        return NextResponse.json(
          { error: `Free plan is limited to ${PLANS.free.repos_limit} repositories. Upgrade to Pro for unlimited repos.` },
          { status: 403 },
        )
      }
    }

    const parsedBody = createRepositoryRequestSchema.safeParse(await request.json())

    if (!parsedBody.success) {
      return NextResponse.json({ error: parsedBody.error.issues[0]?.message ?? 'Invalid repository URL' }, { status: 400 })
    }

    const parsedRepo = parseGitHubRepositoryUrl(parsedBody.data.url)

    if (!parsedRepo) {
      return NextResponse.json({ error: 'Invalid GitHub repository URL' }, { status: 400 })
    }

    const { owner, repo } = parsedRepo

    const githubRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `Bearer ${user.access_token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'RepoFuse',
      },
    })

    if (!githubRes.ok) {
      if (githubRes.status === 404 || githubRes.status === 403) {
        return NextResponse.json({ error: 'Repository not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch repository from GitHub' }, { status: 500 })
    }

    const githubData = await githubRes.json()

    const repository = await createRepository({
      user_id: user.id,
      github_id: githubData.id,
      name: githubData.name,
      full_name: githubData.full_name,
      description: githubData.description,
      url: githubData.html_url,
      default_branch: githubData.default_branch,
      language: githubData.language,
      stars: githubData.stargazers_count,
    })

    return NextResponse.json(repository)
  } catch (error) {
    console.error('Error creating repository:', error)
    return NextResponse.json({ error: 'Failed to add repository' }, { status: 500 })
  }
}
