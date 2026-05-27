import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAccessToken, getCurrentUser } from '@/lib/auth'
import { listGitHubRepositories } from '@/lib/github'
import { createRepository, getAllRepositories, getSubscriptionByGithubId, upsertSubscription } from '@/lib/queries'
import { PLANS, isPaidPlan } from '@/lib/stripe'
import { isPaidPlan, PLANS } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const accessToken = await getCurrentAccessToken()
    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated with GitHub' }, { status: 401 })
    }

    const body = await request.json()
    const repositoryIds = Array.isArray(body.repositoryIds) ? body.repositoryIds : []

    if (repositoryIds.length === 0) {
      return NextResponse.json({ error: 'At least one repository must be selected' }, { status: 400 })
    }

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    let repoLimit = -1
    let sub = await getSubscriptionByGithubId(user.github_id).catch(() => null)
    if (!sub) {
      sub = await upsertSubscription({ github_id: user.github_id }).catch(() => null)
    }
    if (sub && !isPaidPlan(sub.plan)) {
      repoLimit = PLANS.free.repos_limit
    if (user) {
      let sub = await getSubscriptionByGithubId(user.github_id).catch(() => null)
      if (!sub) {
        sub = await upsertSubscription({ github_id: user.github_id }).catch(() => null)
      }
      if (sub && !isPaidPlan(sub.plan)) {
        repoLimit = PLANS.free.repos_limit
      }
    }

    if (repoLimit > 0) {
      const existingRepos = await getAllRepositories(user.id)
      const slotsLeft = repoLimit - existingRepos.length
      if (slotsLeft <= 0) {
        return NextResponse.json(
          { error: `Free plan is limited to ${repoLimit} repositories. Upgrade to Pro for unlimited repos.` },
          { status: 403 },
        )
      }
      if (repositoryIds.length > slotsLeft) {
        return NextResponse.json(
          { error: `You can only add ${slotsLeft} more repo${slotsLeft === 1 ? '' : 's'} on the free plan. Upgrade to Pro for unlimited.` },
          { status: 403 },
        )
      }
    }

    const githubRepositories = await listGitHubRepositories(accessToken)
    const selectedRepositories = githubRepositories.filter((repo) => repositoryIds.includes(repo.id))

    if (selectedRepositories.length === 0) {
      return NextResponse.json({ error: 'Selected repositories were not found on GitHub' }, { status: 404 })
    }

    const imported = []

    for (const repo of selectedRepositories) {
      const saved = await createRepository({
        user_id: user.id,
        github_id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        url: repo.url,
        default_branch: repo.default_branch,
        language: repo.language,
        stars: repo.stars,
      })

      imported.push(saved)
    }

    return NextResponse.json({ imported, count: imported.length })
  } catch (error) {
    console.error('Error importing repositories:', error)
    return NextResponse.json({ error: 'Failed to import repositories' }, { status: 500 })
  }
}
