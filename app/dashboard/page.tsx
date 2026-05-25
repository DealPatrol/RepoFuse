import { getAllRepositories, getAllAnalyses, getGapSummary, type Analysis, type Repository } from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FolderGit2, Sparkles, Code2, Plus, ArrowRight, Zap, AlertCircle, Lightbulb } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  let repositories: Repository[] = []
  let analyses: Analysis[] = []
  let gapSummary = { total_gaps: 0, blocking_gaps: 0, total_hours: 0, completed_count: 0, by_category: {} }

  try {
    const user = await getCurrentUser()
    if (user) {
      repositories = await getAllRepositories(user.id)
      analyses = await getAllAnalyses(user.id)
      gapSummary = await getGapSummary(user.id)
    }
  } catch {
    // Database not available yet
  }

  const completedAnalyses = analyses.filter((analysis) => analysis.status === 'complete')

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-lg">Your code intelligence overview</p>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="group p-6 hover:shadow-lg hover:shadow-black/5 transition-all duration-300 hover:border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Repositories</p>
              <p className="text-3xl font-bold text-foreground mt-1 tabular-nums">{repositories.length}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-chart-1/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <FolderGit2 className="h-6 w-6 text-chart-1" />
            </div>
          </div>
        </Card>
        <Card className="group p-6 hover:shadow-lg hover:shadow-black/5 transition-all duration-300 hover:border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Analyses Run</p>
              <p className="text-3xl font-bold text-foreground mt-1 tabular-nums">{analyses.length}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-chart-2/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Sparkles className="h-6 w-6 text-chart-2" />
            </div>
          </div>
        </Card>
        <Card className="group p-6 hover:shadow-lg hover:shadow-black/5 transition-all duration-300 hover:border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Completed</p>
              <p className="text-3xl font-bold text-foreground mt-1 tabular-nums">{completedAnalyses.length}</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-chart-4/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Code2 className="h-6 w-6 text-chart-4" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <section className="space-y-5">
        <h2 className="text-xl font-semibold text-foreground">Quick Actions</h2>
        
        {repositories.length === 0 ? (
          <Card className="border-dashed border-2 p-10 text-center hover:border-border transition-colors">
            <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <FolderGit2 className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Connect your first repository</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Start by adding your GitHub repositories. We&apos;ll scan all files and prepare them for AI analysis.
            </p>
            <Button size="lg" asChild>
              <Link href="/dashboard/repositories">
                <Plus className="h-4 w-4 mr-2" />
                Add Repository
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="group p-6 hover:shadow-lg hover:shadow-black/5 transition-all duration-300 hover:border-border">
              <div className="flex items-start justify-between mb-5">
                <div className="h-12 w-12 rounded-xl bg-chart-1/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <FolderGit2 className="h-6 w-6 text-chart-1" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                  {repositories.length} connected
                </span>
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-1">Repositories</h3>
              <p className="text-sm text-muted-foreground mb-5">
                Manage your connected GitHub repositories and add new ones.
              </p>
              <Button variant="outline" size="sm" className="group-hover:bg-foreground/5" asChild>
                <Link href="/dashboard/repositories">
                  Manage Repos
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </Card>

            <Card className="group p-6 hover:shadow-lg hover:shadow-black/5 transition-all duration-300 hover:border-border">
              <div className="flex items-start justify-between mb-5">
                <div className="h-12 w-12 rounded-xl bg-chart-2/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Zap className="h-6 w-6 text-chart-2" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                  {completedAnalyses.length} complete
                </span>
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-1">Run Analysis</h3>
              <p className="text-sm text-muted-foreground mb-5">
                Let AI discover what apps you can build from your existing code.
              </p>
              <Button size="sm" asChild>
                <Link href="/dashboard/analyses">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Start Analysis
                </Link>
              </Button>
            </Card>

            <Card className="group p-6 hover:shadow-lg hover:shadow-black/5 transition-all duration-300 hover:border-border">
              <div className="flex items-start justify-between mb-5">
                <div className="h-12 w-12 rounded-xl bg-chart-3/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Lightbulb className="h-6 w-6 text-chart-3" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                  Quick ideas
                </span>
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-1">Template Hub</h3>
              <p className="text-sm text-muted-foreground mb-5">
                Pre-configured combinations you can assemble into products today.
              </p>
              <Button variant="outline" size="sm" className="group-hover:bg-foreground/5" asChild>
                <Link href="/dashboard/templates/browse">
                  Explore Templates
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </Card>

            {gapSummary.total_gaps > 0 && (
              <Card className="group p-6 hover:shadow-lg hover:shadow-black/5 transition-all duration-300 hover:border-border border-amber-200 bg-amber-50/50">
                <div className="flex items-start justify-between mb-5">
                  <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <AlertCircle className="h-6 w-6 text-amber-600" />
                  </div>
                  <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                    {gapSummary.total_gaps} open
                  </span>
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-1">Missing Code</h3>
                <p className="text-sm text-muted-foreground mb-5">
                  {Math.round(gapSummary.total_hours)} hours of features ready to build
                </p>
                <Button size="sm" asChild>
                  <Link href="/dashboard/gaps">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    View Dashboard
                  </Link>
                </Button>
              </Card>
            )}
          </div>
        )}
      </section>

      {/* Recent Repositories */}
      {repositories.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Recent Repositories</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/repositories">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {repositories.slice(0, 6).map((repo) => (
              <Card key={repo.id} className="group p-5 hover:shadow-md hover:shadow-black/5 transition-all duration-200 hover:border-border">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center flex-shrink-0 group-hover:bg-muted transition-colors">
                    <FolderGit2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-foreground truncate">{repo.name}</h3>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{repo.full_name}</p>
                    {repo.language && (
                      <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                        {repo.language}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
