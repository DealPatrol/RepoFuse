import { getAllAnalyses, type Analysis } from '@/lib/queries'
import { DebtScannerClient } from '@/components/debt-scanner-client'

export const dynamic = 'force-dynamic'

export default async function DebtScannerPage() {
  let analyses: Analysis[] = []
  try {
    const all = await getAllAnalyses()
    analyses = all.filter((a) => a.status === 'complete')
  } catch (error) {
    console.error('[debt-scanner] Failed to load analyses:', error)
  }

  return <DebtScannerClient completedAnalyses={analyses} />
}
