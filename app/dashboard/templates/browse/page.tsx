import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AnalysisSelector } from '@/components/analysis-selector'
import { getAllAnalyses, getAllTemplates, type Analysis, type Template } from '@/lib/queries'
import { ArrowLeft } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function BrowseTemplatesPage() {
  let analyses: Analysis[] = []
  let templates: Template[] = []
  let templateCounts: Record<string, number> = {}

  try {
    const user = await getCurrentUser()
    if (user) {
      ;[analyses, templates] = await Promise.all([
        getAllAnalyses(user.id),
        getAllTemplates(user.id),
      ])
    }

    // Count templates per analysis by checking blueprint_ids overlap
    for (const analysis of analyses) {
      // Get blueprints for this analysis
      const analysisBlueprints = templates
        .filter(t => t.blueprint_ids?.length > 0)
        .map(t => t.blueprint_ids || [])
        .flat()
      
      // Count unique templates that have any blueprint from this analysis
      templateCounts[analysis.id] = templates.filter(t => 
        t.blueprint_ids?.some((bid: string) => analysisBlueprints.includes(bid))
      ).length
    }
  } catch (error) {
    console.error('[v0] Error loading templates:', error)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Explore Templates</h1>
            <p className="text-muted-foreground">
              Select an analysis to see all templates you can build from that project scan.
            </p>
          </div>
        </div>
      </div>

      {/* Analysis Selector */}
      <AnalysisSelector analyses={analyses} templateCounts={templateCounts} />
    </div>
  )
}
