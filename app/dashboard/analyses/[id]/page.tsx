import { notFound } from 'next/navigation'
import { AnalysisDetail } from '@/components/analysis-detail'
import {
  getAnalysisById,
  getBlueprintsByAnalysis,
  getRepositoriesForAnalysis,
  getUserViewedBlueprintIds,
  type Analysis,
  type AppBlueprint,
  type Repository,
} from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'
import { resolveProAccess } from '@/lib/pro-access'
import { PLANS } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export default async function AnalysisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()

  if (!user) {
    notFound()
  }

  let analysis: Analysis | null = null
  let repositories: Repository[] = []
  let blueprints: AppBlueprint[] = []
  let userPlan = 'free'
  let viewedBlueprintIds: string[] = []
  let isTrialing = false

  try {
    ;[analysis, repositories, blueprints] = await Promise.all([
      getAnalysisById(id, user.id),
      getRepositoriesForAnalysis(id, user.id),
      getBlueprintsByAnalysis(id, user.id),
    ])
<<<<<<< HEAD
  } catch (error) {
    console.error('[analysis-detail] Failed to load analysis data:', error)
    notFound()
  }

  if (user) {
    try {
      const [subscription, viewedIds] = await Promise.all([
        getSubscriptionByGithubId(user.github_id),
        getUserViewedBlueprintIds(user.id),
      ])
      userPlan = subscription?.plan || 'free'
      viewedBlueprintIds = viewedIds
      isTrialing = subscription?.status === 'trialing'
    } catch (error) {
      console.error('[analysis-detail] Failed to load subscription/views, using free defaults:', error)
    }
=======
  } catch {
    notFound()
>>>>>>> origin/main
  }

  try {
    const [proAccess, viewedIds] = await Promise.all([
      resolveProAccess(user),
      getUserViewedBlueprintIds(user.id),
    ])
    userPlan = proAccess.canAccessPro ? proAccess.plan : 'free'
    viewedBlueprintIds = viewedIds
    isTrialing = proAccess.subscription?.status === 'trialing'
  } catch {
    // Subscription/views table not available yet — use free defaults
  }

  if (!analysis) {
    notFound()
  }

  const planConfig = PLANS[userPlan as keyof typeof PLANS] || PLANS.free
  const blueprintLimit = planConfig.blueprints_viewable

  return (
    <AnalysisDetail
      analysis={analysis}
      repositories={repositories}
      blueprints={blueprints}
      blueprintLimit={blueprintLimit}
      viewedBlueprintIds={viewedBlueprintIds}
      isTrialing={isTrialing}
      userPlan={userPlan}
    />
  )
}
