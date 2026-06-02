import { getAllAnalyses, getAllRepositories, type Analysis, type Repository } from '@/lib/queries'
import { AnalysesList } from '@/components/analyses-list'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function AnalysesPage() {
  let analyses: Analysis[] = []
  let repositories: Repository[] = []

  try {
<<<<<<< HEAD
    analyses = await getAllAnalyses()
    repositories = await getAllRepositories()
  } catch (error) {
    console.error('[analyses] Failed to load page data:', error)
=======
    const user = await getCurrentUser()
    if (user) {
      analyses = await getAllAnalyses(user.id)
      repositories = await getAllRepositories(user.id)
    }
  } catch {
    // Database not available
>>>>>>> origin/main
  }

  return <AnalysesList analyses={analyses} repositories={repositories} />
}
