import { getAllRepositories, getAllAnalyses, getGapSummary, type Analysis, type Repository } from '@/lib/queries'
import { DashboardClient } from '@/components/dashboard-client'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  let repositories: Repository[] = []
  let analyses: Analysis[] = []
  let gapSummary = { total_gaps: 0, blocking_gaps: 0, total_hours: 0, completed_count: 0, by_category: {} }

  try {
    repositories = await getAllRepositories()
    analyses = await getAllAnalyses()
    gapSummary = await getGapSummary()
  } catch {
    // Database not available yet
  }

  const completedAnalyses = analyses.filter((analysis) => analysis.status === 'complete')

  return (
    <DashboardClient
      repositories={repositories}
      analyses={analyses}
      completedAnalyses={completedAnalyses}
      gapSummary={gapSummary}
    />
  )
}
