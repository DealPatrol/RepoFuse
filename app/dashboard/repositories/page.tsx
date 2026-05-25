import { Suspense } from 'react'
import { RepositoriesList } from '@/components/repositories-list'
import { getAllRepositories, type Repository } from '@/lib/queries'

export const dynamic = 'force-dynamic'

function RepositoriesFallback() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Repositories</h1>
        <p className="text-muted-foreground">Loading your repository workspace...</p>
      </div>
    </div>
  )
}

export default async function RepositoriesPage() {
  let repositories: Repository[] = []

  try {
    repositories = await getAllRepositories()
  } catch (error) {
    console.error('[repositories] Failed to load repositories:', error)
  }

  return (
    <Suspense fallback={<RepositoriesFallback />}>
      <RepositoriesList repositories={repositories} />
    </Suspense>
  )
}
