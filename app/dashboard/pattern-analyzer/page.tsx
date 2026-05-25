import { getAllAnalyses, type Analysis } from '@/lib/queries'
import { PatternAnalyzer } from '@/components/pattern-analyzer'

export const dynamic = 'force-dynamic'

export default async function PatternAnalyzerPage() {
  let analyses: Analysis[] = []

  try {
    const all = await getAllAnalyses()
    analyses = all.filter((a) => a.status === 'complete')
  } catch {
    // Database not available
  }

  return <PatternAnalyzer completedAnalyses={analyses} />
}
