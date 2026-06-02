import { Suspense } from 'react'
import { getAllAnalyses, type Analysis } from '@/lib/queries'
import { PatternAnalyzer } from '@/components/pattern-analyzer'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function PatternAnalyzerPage() {
  let analyses: Analysis[] = []

  try {
<<<<<<< HEAD
    const all = await getAllAnalyses()
    analyses = all.filter((a) => a.status === 'complete')
  } catch (error) {
    console.error('[pattern-analyzer] Failed to load analyses:', error)
=======
    const user = await getCurrentUser()
    if (user) {
      const all = await getAllAnalyses(user.id)
      analyses = all.filter((a) => a.status === 'complete')
    }
  } catch {
    // Database not available
>>>>>>> origin/main
  }

  return (
    <Suspense fallback={<div className="text-muted-foreground text-sm">Loading chat…</div>}>
      <PatternAnalyzer completedAnalyses={analyses} />
    </Suspense>
  )
}
