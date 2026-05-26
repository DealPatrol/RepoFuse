import { getAllAnalyses, type Analysis } from '@/lib/queries'
import { PatternAnalyzer } from '@/components/pattern-analyzer'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function PatternAnalyzerPage() {
  let analyses: Analysis[] = []

  try {
    const user = await getCurrentUser()
    if (user) {
      const all = await getAllAnalyses(user.id)
      analyses = all.filter((a) => a.status === 'complete')
    }
  } catch {
    // Database not available
  }

  return <PatternAnalyzer completedAnalyses={analyses} />
}
