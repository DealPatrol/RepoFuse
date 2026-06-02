import { getAllAnalyses, getAllRepositories, type Analysis, type Repository } from '@/lib/queries'
import { AnalysesList } from '@/components/analyses-list'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function AnalysesPage() {
  let analyses: Analysis[] = []
  let repositories: Repository[] = []

  try {
    const user = await getCurrentUser()
    if (user) {
      analyses = await getAllAnalyses(user.id)
      repositories = await getAllRepositories(user.id)
    }
  } catch {
    // Database not available
  }

  return <AnalysesList analyses={analyses} repositories={repositories} />
}
