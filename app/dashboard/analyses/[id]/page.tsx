import { notFound } from 'next/navigation'
import { AnalysisDetail } from '@/components/analysis-detail'
import {
  getAnalysisById,
  getBlueprintsByAnalysis,
  getRepositoriesForAnalysis,
  type Analysis,
  type AppBlueprint,
  type Repository,
} from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'
import { applyBlueprintAccess } from '@/lib/blueprint-access'

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
  let blueprintLimit = 1

  try {
    ;[analysis, repositories, blueprints] = await Promise.all([
      getAnalysisById(id, user.id),
      getRepositoriesForAnalysis(id, user.id),
      getBlueprintsByAnalysis(id, user.id),
    ])
  } catch {
    notFound()
  }

  try {
    const access = await applyBlueprintAccess(user, blueprints)
    blueprints = access.blueprints
    userPlan = access.userPlan
    viewedBlueprintIds = access.viewedBlueprintIds
    isTrialing = access.isTrialing
    blueprintLimit = access.blueprintLimit
  } catch {
    // Subscription/views table not available yet — use free defaults
  }

  if (!analysis) {
    notFound()
  }

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
