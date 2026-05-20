import { notFound } from 'next/navigation'
import { AnalysisDetail } from '@/components/analysis-detail'
import {
  getAnalysisById,
  getBlueprintsByAnalysis,
  getRepositoriesForAnalysis,
  getSubscriptionByGithubId,
  getUserViewedBlueprintIds,
} from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'
import { PLANS } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export default async function AnalysisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()

  let analysis = null
  let repositories: any[] = []
  let blueprints: any[] = []
  let userPlan = 'free'
  let viewedBlueprintIds: string[] = []
  let isTrialing = false

  try {
    ;[analysis, repositories, blueprints] = await Promise.all([
      getAnalysisById(id),
      getRepositoriesForAnalysis(id),
      getBlueprintsByAnalysis(id),
    ])
  } catch {
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
    } catch {
      // Subscription/views table not available yet — use free defaults
    }
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
