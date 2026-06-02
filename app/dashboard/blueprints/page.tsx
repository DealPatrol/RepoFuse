import { getCurrentUser } from '@/lib/auth'
import { getAllAnalyses, getBlueprintsByAnalysis } from '@/lib/queries'
import { resolveProAccess } from '@/lib/pro-access'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileCode, Lock, Crown, ArrowRight, Layers, GitBranch, Database, Code2, Download } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

// This is a PRO feature - full project blueprints with architecture
interface BlueprintCard {
  id: string
  analysisId: string
  name: string
  description: string
  techStack: string[]
  architecture: string
  estimatedFiles: number
  codeReuse: number
  generatedAt: string
}

async function getBlueprintsFromAnalyses(userId: string): Promise<BlueprintCard[]> {
  const analyses = (await getAllAnalyses(userId)).filter((a) => a.status === 'complete')
  if (analyses.length === 0) return []

  const cards: BlueprintCard[] = []
  for (const analysis of analyses.slice(0, 8)) {
    const blueprints = await getBlueprintsByAnalysis(analysis.id, userId)
    for (const bp of blueprints) {
      cards.push({
        id: bp.id,
        analysisId: analysis.id,
        name: bp.name,
        description: bp.description || 'Blueprint from your repository analysis.',
        techStack: bp.technologies?.length ? bp.technologies : ['From your repos'],
        architecture: bp.complexity === 'complex' ? 'Multi-service' : bp.complexity === 'moderate' ? 'Modular' : 'Monolith',
        estimatedFiles: (bp.existing_files?.length || 0) + (bp.missing_files?.length || 0),
        codeReuse: Math.round(bp.reuse_percentage || 0),
        generatedAt: new Date(bp.created_at).toLocaleDateString(),
      })
    }
  }
  return cards.sort((a, b) => b.codeReuse - a.codeReuse)
}

export default async function BlueprintsPage() {
  const user = await getCurrentUser()
  let blueprints: BlueprintCard[] = []

  try {
<<<<<<< HEAD
    blueprints = await getBlueprintsFromAnalyses()
  } catch (error) {
    console.error('[blueprints] Failed to load blueprints:', error)
  }

  // Check if user is Pro
  const isPro = false // In production: check user.subscription_tier === 'pro'
=======
    if (user) {
      blueprints = await getBlueprintsFromAnalyses(user.id)
    }
  } catch {
    // Database not available
  }
  
  const { canAccessPro: isPro } = user ? await resolveProAccess(user) : { canAccessPro: false }
>>>>>>> origin/main

  if (!isPro) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <FileCode className="h-6 w-6 text-purple-400" />
            Blueprints
            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
              <Lock className="h-3 w-3 mr-1" />
              Pro
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-1">
            Complete project blueprints with architecture and implementation guides
          </p>
        </div>

        {/* Pro Upgrade Card */}
        <Card className="bg-gradient-to-br from-purple-950/40 via-card to-orange-950/20 border-purple-500/30">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-purple-500/20 mb-6">
              <Crown className="h-12 w-12 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Full Project Blueprints</h2>
            <p className="text-muted-foreground text-center max-w-lg mb-8">
              Get complete blueprints with file structures, architecture diagrams,
              database schemas, and step-by-step implementation guides.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 w-full max-w-3xl">
              <div className="text-center p-4 rounded-lg bg-card/50 border border-border/50">
                <Layers className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                <div className="font-semibold">Architecture</div>
                <div className="text-sm text-muted-foreground">Full system design</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-card/50 border border-border/50">
                <GitBranch className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                <div className="font-semibold">File Structure</div>
                <div className="text-sm text-muted-foreground">Ready to scaffold</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-card/50 border border-border/50">
                <Database className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                <div className="font-semibold">DB Schemas</div>
                <div className="text-sm text-muted-foreground">SQL included</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-card/50 border border-border/50">
                <Code2 className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                <div className="font-semibold">Code Snippets</div>
                <div className="text-sm text-muted-foreground">Copy & paste</div>
              </div>
            </div>

            <Button asChild size="lg" className="bg-gradient-to-r from-purple-500 to-orange-500 hover:from-purple-400 hover:to-orange-400 text-white font-bold">
              <Link href="/pricing">
                Upgrade to Pro
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Blurred Preview */}
        {blueprints.length > 0 && (
          <div className="relative">
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 flex items-center justify-center">
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-lg px-4 py-2">
                <Lock className="h-4 w-4 mr-2" />
                Pro Feature Preview
              </Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 opacity-50">
              {blueprints.map((blueprint) => (
                <Card key={blueprint.id} className="bg-card/50 border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">{blueprint.name}</CardTitle>
                    <CardDescription>{blueprint.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-1.5">
                      {blueprint.techStack.map((tech) => (
                        <Badge key={tech} variant="secondary" className="text-xs">{tech}</Badge>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Files</span>
                        <p className="font-medium">{blueprint.estimatedFiles}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Code Reuse</span>
                        <p className="font-medium text-green-400">{blueprint.codeReuse}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Pro user view
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <FileCode className="h-6 w-6 text-purple-400" />
            Blueprints
          </h1>
          <p className="text-muted-foreground mt-1">
            Complete project blueprints ready to implement
          </p>
        </div>
      </div>

      {blueprints.length === 0 ? (
        <Card className="bg-card/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileCode className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Blueprints Yet</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Run an analysis on your repositories to generate project blueprints.
            </p>
            <Button asChild>
              <Link href="/dashboard/analyses">Start Analysis</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {blueprints.map((blueprint) => (
            <Card key={blueprint.id} className="bg-card/50 border-border/50 hover:border-purple-500/30 transition-colors group">
              <CardHeader>
                <CardTitle className="text-lg group-hover:text-purple-400 transition-colors">
                  {blueprint.name}
                </CardTitle>
                <CardDescription>{blueprint.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-1.5">
                  {blueprint.techStack.map((tech) => (
                    <Badge key={tech} variant="secondary" className="text-xs">{tech}</Badge>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">Architecture</span>
                    <p className="font-medium">{blueprint.architecture}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Files</span>
                    <p className="font-medium">{blueprint.estimatedFiles}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Reuse</span>
                    <p className="font-medium text-green-400">{blueprint.codeReuse}%</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-border/50">
                  <Button size="sm" className="flex-1" asChild>
                    <Link href={`/dashboard/analyses/${blueprint.analysisId}`}>
                      View in Analysis
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/dashboard/analyses/${blueprint.analysisId}`} aria-label="Open analysis">
                      <Download className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
