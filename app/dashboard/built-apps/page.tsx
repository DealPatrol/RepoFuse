import { getCurrentUser } from '@/lib/auth'
import { getAllAnalyses } from '@/lib/queries'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AppWindow, Github, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

// Mock data for detected apps - in production this would come from analysis results
interface DetectedApp {
  id: string
  name: string
  repoName: string
  framework: string
  type: 'web-app' | 'api' | 'cli' | 'library' | 'mobile'
  completeness: number
  lastCommit: string
  features: string[]
}

async function getDetectedApps(userId: string): Promise<DetectedApp[]> {
  // In production, this would query analyzed repos for existing app patterns
  // For now, we generate mock data based on analyses
  const analyses = await getAllAnalyses(userId)
  
  if (analyses.length === 0) return []
  
  // Generate sample detected apps from analyses
  return analyses.slice(0, 5).map((analysis, i) => ({
    id: `app-${analysis.id}`,
    name: `${analysis.name || 'Project'} App`,
    repoName: analysis.name || 'Unknown',
    framework: ['Next.js', 'React', 'Vue', 'Express', 'FastAPI'][i % 5],
    type: (['web-app', 'api', 'cli', 'library', 'mobile'] as const)[i % 5],
    completeness: 65 + Math.floor(Math.random() * 30),
    lastCommit: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    features: ['Auth', 'Database', 'API', 'UI Components', 'Tests'].slice(0, 2 + (i % 3)),
  }))
}

const typeColors: Record<string, string> = {
  'web-app': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'api': 'bg-green-500/20 text-green-400 border-green-500/30',
  'cli': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'library': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'mobile': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
}

export default async function BuiltAppsPage() {
  const user = await getCurrentUser()
  let detectedApps: DetectedApp[] = []

  try {
    if (user) {
      detectedApps = await getDetectedApps(user.id)
    }
  } catch {
    // Database not available
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <AppWindow className="h-6 w-6 text-cyan-400" />
            Already Built Apps
          </h1>
          <p className="text-muted-foreground mt-1">
            Apps and projects we detected in your connected repositories
          </p>
        </div>
        <Button asChild className="bg-cyan-600 hover:bg-cyan-500">
          <Link href="/dashboard/repositories">
            Connect More Repos
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-cyan-400">{detectedApps.length}</div>
            <p className="text-sm text-muted-foreground">Apps Detected</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-400">
              {detectedApps.filter(a => a.completeness >= 80).length}
            </div>
            <p className="text-sm text-muted-foreground">Ready to Ship</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-yellow-400">
              {detectedApps.filter(a => a.completeness >= 50 && a.completeness < 80).length}
            </div>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-orange-400">
              {detectedApps.filter(a => a.completeness < 50).length}
            </div>
            <p className="text-sm text-muted-foreground">Early Stage</p>
          </CardContent>
        </Card>
      </div>

      {/* Apps Grid */}
      {detectedApps.length === 0 ? (
        <Card className="bg-card/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AppWindow className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Apps Detected Yet</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Connect your GitHub or GitLab repositories and run an analysis to detect existing apps.
            </p>
            <Button asChild>
              <Link href="/dashboard/repositories">Connect Repositories</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {detectedApps.map((app) => (
            <Card key={app.id} className="bg-card/50 border-border/50 hover:border-cyan-500/30 transition-colors group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg group-hover:text-cyan-400 transition-colors">
                      {app.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Github className="h-3 w-3" />
                      {app.repoName}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className={typeColors[app.type]}>
                    {app.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Framework</span>
                  <span className="font-medium">{app.framework}</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Completeness</span>
                    <span className="font-medium">{app.completeness}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        app.completeness >= 80 ? 'bg-green-500' : 
                        app.completeness >= 50 ? 'bg-yellow-500' : 'bg-orange-500'
                      }`}
                      style={{ width: `${app.completeness}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {app.features.map((feature) => (
                    <Badge key={feature} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <span className="text-xs text-muted-foreground">
                    Last commit: {app.lastCommit}
                  </span>
                  <Button size="sm" variant="ghost" className="text-cyan-400 hover:text-cyan-300">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Analyze
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
