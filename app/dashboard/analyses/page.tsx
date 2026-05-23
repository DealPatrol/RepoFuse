import { getAllAnalyses, getAllRepositories, type Analysis, type Repository } from '@/lib/queries'
import { AnalysesList } from '@/components/analyses-list'

export const dynamic = 'force-dynamic'

export default async function AnalysesPage() {
  let analyses: Analysis[] = []
  let repositories: Repository[] = []

  try {
    analyses = await getAllAnalyses()
    repositories = await getAllRepositories()
  } catch (error) {
    console.error('[analyses] Failed to load page data:', error)
  }

  return <AnalysesList analyses={analyses} repositories={repositories} />
}
