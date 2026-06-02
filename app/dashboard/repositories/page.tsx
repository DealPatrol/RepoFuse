import { Suspense } from 'react'
import { RepositoriesList } from '@/components/repositories-list'
import { getAllRepositories, type Repository } from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'

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
    const user = await getCurrentUser()
    if (user) {
      repositories = await getAllRepositories(user.id)
    }
  } catch {
    // Database not available yet
  }

  return (
    <Suspense fallback={<RepositoriesFallback />}>
      <RepositoriesList repositories={repositories} />
    </Suspense>
  )
}
