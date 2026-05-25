import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, Rocket, Zap, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TemplateAssemblyCard } from '@/components/template-assembly-card'
import { getAllAnalyses, getAllTemplates, type Template } from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-40 bg-secondary rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-56 bg-secondary rounded-lg" />
        ))}
      </div>
    </div>
  )
}

async function TemplatesByAnalysisContent({ analysisId }: { analysisId: string }) {
  let analyses = []
  let allTemplates: Template[] = []
  let currentAnalysis = null
  let filteredTemplates: Template[] = []

  try {
    const user = await getCurrentUser()
    if (user) {
      ;[analyses, allTemplates] = await Promise.all([
        getAllAnalyses(user.id),
        getAllTemplates(user.id),
      ])
    }

    currentAnalysis = analyses.find(a => a.id === analysisId)
    
    if (!currentAnalysis) {
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/templates/browse">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Analysis not found</h1>
            </div>
          </div>

          <Card className="p-12 text-center border-2 border-dashed">
            <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Analysis not found</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              The analysis you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Button asChild>
              <Link href="/dashboard/templates/browse">
                Back to Templates
              </Link>
            </Button>
          </Card>
        </div>
      )
    }

    // Filter templates - get blueprints for this analysis and find templates that use them
    // Since we don't have direct analysis->blueprint relation, we filter by checking if templates
    // could belong to this analysis based on creation context
    // For now, show all templates (in production, you'd need a proper analysis_id or blueprint relation)
    filteredTemplates = allTemplates.length > 0 ? allTemplates : []
  } catch (error) {
    console.error('[v0] Failed to fetch templates:', error)
  }

  if (!currentAnalysis || filteredTemplates.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/templates/browse">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{currentAnalysis?.name || 'Templates'}</h1>
            <p className="text-muted-foreground">No templates available</p>
          </div>
        </div>

        <Card className="p-12 text-center border-2 border-dashed">
          <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No templates yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Templates will be available after analysis completes and templates are generated.
          </p>
          <Button asChild>
            <Link href="/dashboard/templates/browse">
              Browse Other Analyses
            </Link>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/templates/browse">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{currentAnalysis?.name}</h1>
            <p className="text-muted-foreground">
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available to assemble
            </p>
          </div>
        </div>
      </div>

      {/* Featured Section */}
      {filteredTemplates.some(t => t.featured) && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-chart-2" />
            <h2 className="text-xl font-semibold">Featured Combinations</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTemplates.filter(t => t.featured).map(template => (
              <TemplateAssemblyCard key={template.id} template={template} />
            ))}
          </div>
        </section>
      )}

      {/* All Templates */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-chart-1" />
          <h2 className="text-xl font-semibold">All Templates</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.filter(t => !t.featured).map(template => (
            <TemplateAssemblyCard key={template.id} template={template} />
          ))}
        </div>
      </section>
    </div>
  )
}

interface PageProps {
  params: Promise<{ analysisId: string }>
}

export default async function TemplatesByAnalysisPage({ params }: PageProps) {
  const { analysisId } = await params

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <TemplatesByAnalysisContent analysisId={analysisId} />
    </Suspense>
  )
}
