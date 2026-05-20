import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, Rocket, Zap, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TemplateAssemblyCard } from '@/components/template-assembly-card'
import { CreateTemplateModal } from '@/components/create-template-modal'
import { getAllTemplates, getFeaturedTemplates, type Template } from '@/lib/queries'

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

async function TemplateHubContent() {
  let featured: Template[] = []
  let all: Template[] = []
  let setupRequired = false

  try {
    const result = await Promise.all([
      getFeaturedTemplates(),
      getAllTemplates(),
    ])
    featured = result[0]
    all = result[1]
  } catch (error) {
    console.error('[v0] Failed to fetch templates:', error)
    setupRequired = true
  }

  if (setupRequired || !all.length) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/analyses">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Template Assembly Hub</h1>
              <p className="text-muted-foreground">Pre-built project combinations ready to assemble</p>
            </div>
          </div>
          <CreateTemplateModal />
        </div>

        <Card className="p-12 text-center border-2 border-dashed">
          <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No templates yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Create a template by combining blueprints from your analyses, or run an analysis to discover new blueprints.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <CreateTemplateModal />
            <Button variant="outline" asChild>
              <Link href="/dashboard/analyses">Run an Analysis</Link>
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  try {
    ;[featured, all] = await Promise.all([
      getFeaturedTemplates(),
      getAllTemplates(),
    ])
  } catch {
    // Database tables may not exist yet
  }

  const nonFeatured = all.filter(t => !featured.some(f => f.id === t.id))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/analyses">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Template Assembly Hub</h1>
              <p className="text-muted-foreground">
                Start building today from code you already have. Pre-configured templates combine your best pieces.
              </p>
            </div>
          </div>
          <CreateTemplateModal />
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
          <Card className="p-4 border-green-200 bg-green-50">
            <div className="flex items-start gap-3">
              <Rocket className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm text-green-900">Ship Faster</p>
                <p className="text-xs text-green-700/80">
                  Templates show exactly what's needed to launch
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-blue-200 bg-blue-50">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm text-blue-900">Reuse Everything</p>
                <p className="text-xs text-blue-700/80">
                  See % of code already ready in your repos
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-purple-200 bg-purple-50">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm text-purple-900">Creative Starting Point</p>
                <p className="text-xs text-purple-700/80">
                  Get inspired by templates you can assemble today
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Featured Templates */}
      {featured.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-1">Quick Wins</h2>
            <p className="text-sm text-muted-foreground">
              These templates are ready to ship with minimal additions
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featured.map(template => (
              <TemplateAssemblyCard key={template.id} template={template} />
            ))}
          </div>
        </div>
      )}

      {/* All Templates */}
      {nonFeatured.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-1">Other Combinations</h2>
            <p className="text-sm text-muted-foreground">
              More possibilities from your codebase
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nonFeatured.map(template => (
              <TemplateAssemblyCard key={template.id} template={template} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {featured.length === 0 && nonFeatured.length === 0 && (
        <Card className="p-12 text-center border-dashed">
          <Rocket className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Templates Yet</h3>
          <p className="text-muted-foreground mb-6">
            Run an analysis to discover templates from your repositories
          </p>
          <Link href="/dashboard/analyses">
            <Button>View Analyses</Button>
          </Link>
        </Card>
      )}

      {/* CTA Section */}
      <Card className="p-8 bg-gradient-to-r from-primary/10 to-chart-1/10 border-primary/20">
        <div className="text-center space-y-4">
          <h3 className="text-xl font-bold">Missing ideas you could build?</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Check the Missing Code Dashboard to see all the opportunities across your projects. 
            Find high-impact features that are quick wins.
          </p>
          <Link href="/dashboard/gaps">
            <Button size="lg">Explore Missing Code</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}

export default function TemplateHubPage() {
  return (
    <div className="p-6">
      <Suspense fallback={<LoadingSkeleton />}>
        <TemplateHubContent />
      </Suspense>
    </div>
  )
}
