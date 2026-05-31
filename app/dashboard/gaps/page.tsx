import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, AlertCircle, TrendingUp, Clock, Zap, Lock, Crown, ArrowRight, Target, Code2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GapPriorityMatrix } from '@/components/gap-priority-matrix'
import {
  getAllMissingGaps,
  getGapSummary,
  getCompletedGapIdsForUser,
  type GapSummary,
  type MissingFileGap,
} from '@/lib/queries'
import { GapsPriorityGroups } from '@/components/gaps-priority-groups'
import { gapCategories, groupGapsByPriority, calculateTotalEffort } from '@/lib/gap-priorities'
import { getCurrentUser } from '@/lib/auth'
import { resolveProAccess } from '@/lib/pro-access'

export const dynamic = 'force-dynamic'

// Pro gate component
function ProUpgradeGate() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-red-400" />
          Missing Code
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
            <Lock className="h-3 w-3 mr-1" />
            Pro
          </Badge>
        </h1>
        <p className="text-muted-foreground mt-1">
          See exactly what code is missing before you can ship
        </p>
      </div>

      {/* Pro Upgrade Card */}
      <Card className="bg-gradient-to-br from-red-950/40 via-card to-orange-950/20 border-red-500/30">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="p-4 rounded-full bg-red-500/20 mb-6">
            <Crown className="h-12 w-12 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Unlock Missing Code Analysis</h2>
          <p className="text-muted-foreground text-center max-w-lg mb-8">
            Pro users get a detailed breakdown of every gap in their codebase,
            prioritized by impact and effort required.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 w-full max-w-3xl">
            <div className="text-center p-4 rounded-lg bg-card/50 border border-border/50">
              <Target className="h-6 w-6 text-red-400 mx-auto mb-2" />
              <div className="font-semibold">Priority Matrix</div>
              <div className="text-sm text-muted-foreground">What to fix first</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-card/50 border border-border/50">
              <Clock className="h-6 w-6 text-red-400 mx-auto mb-2" />
              <div className="font-semibold">Time Estimates</div>
              <div className="text-sm text-muted-foreground">Per gap & total</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-card/50 border border-border/50">
              <Code2 className="h-6 w-6 text-red-400 mx-auto mb-2" />
              <div className="font-semibold">Code Suggestions</div>
              <div className="text-sm text-muted-foreground">AI-generated fixes</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-card/50 border border-border/50">
              <CheckCircle className="h-6 w-6 text-red-400 mx-auto mb-2" />
              <div className="font-semibold">Progress Tracking</div>
              <div className="text-sm text-muted-foreground">Mark as done</div>
            </div>
          </div>

          <Button asChild size="lg" className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 text-white font-bold">
            <Link href="/pricing">
              Upgrade to Pro
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Blurred Preview */}
      <div className="relative">
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 flex items-center justify-center">
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-lg px-4 py-2">
            <Lock className="h-4 w-4 mr-2" />
            Pro Feature Preview
          </Badge>
        </div>
        <div className="opacity-50 space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="text-2xl font-bold">12</div>
              <p className="text-sm text-muted-foreground">Total Gaps</p>
            </Card>
            <Card className="p-4 bg-red-950/30">
              <div className="text-2xl font-bold text-red-400">3</div>
              <p className="text-sm text-muted-foreground">Critical</p>
            </Card>
            <Card className="p-4">
              <div className="text-2xl font-bold">24h</div>
              <p className="text-sm text-muted-foreground">Total Effort</p>
            </Card>
            <Card className="p-4 bg-green-950/30">
              <div className="text-2xl font-bold text-green-400">5</div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-40 bg-secondary rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-secondary rounded-lg" />
        ))}
      </div>
    </div>
  )
}

async function GapsDashboardContent({ userId }: { userId: string }) {
  let gaps: MissingFileGap[] = []
  let summary: GapSummary = { total_gaps: 0, blocking_gaps: 0, total_hours: 0, by_category: {}, completed_count: 0 }
  let setupRequired = false

  try {
    [gaps, summary] = await Promise.all([
      getAllMissingGaps(userId),
      getGapSummary(userId),
    ])
  } catch (error) {
    console.error('[v0] Failed to fetch gaps:', error)
    setupRequired = true
  }

  if (setupRequired || !gaps.length) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/analyses">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Missing Code Dashboard</h1>
            <p className="text-muted-foreground">Strategic view of everything that needs to be built</p>
          </div>
        </div>

        <Card className="p-12 text-center border-2 border-dashed">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No gaps found yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Run an analysis on your repositories first to discover missing code that needs to be built.
          </p>
          <Button asChild>
            <Link href="/dashboard/analyses">
              Run an Analysis
            </Link>
          </Button>
        </Card>
      </div>
    )
  }

  try {
    ;[gaps, summary] = await Promise.all([
      getAllMissingGaps(userId),
      getGapSummary(userId),
    ])
  } catch {
    // Database tables may not exist yet
  }

  let completedGapIds: string[] = []
  try {
    completedGapIds = await getCompletedGapIdsForUser(userId)
  } catch {
    completedGapIds = []
  }

  const gapsByPriority = groupGapsByPriority(gaps)
  const priorityCounts = {
    critical: gapsByPriority.critical.length,
    high: gapsByPriority.high.length,
    medium: gapsByPriority.medium.length,
    low: gapsByPriority.low.length,
  }

  const categoryGroups = gaps.reduce((acc, gap) => {
    if (!acc[gap.category]) {
      acc[gap.category] = []
    }
    acc[gap.category].push(gap)
    return acc
  }, {} as Record<string, typeof gaps>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/analyses">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Missing Code Dashboard</h1>
          <p className="text-muted-foreground">
            Strategic view of everything that needs to be built across all projects
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold mb-1">Total Gaps</p>
              <p className="text-2xl font-bold">{summary.total_gaps}</p>
            </div>
            <AlertCircle className="w-5 h-5 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold mb-1 text-red-700">Critical Gaps</p>
              <p className="text-2xl font-bold text-red-600">{priorityCounts.critical}</p>
              <p className="text-xs text-red-600/70 mt-1">
                Quick wins & blockers
              </p>
            </div>
            <Zap className="w-5 h-5 text-red-600" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold mb-1">Total Effort</p>
              <p className="text-2xl font-bold">{Math.round(summary.total_hours)}h</p>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(summary.total_hours / 8)} days @ 8h/day
              </p>
            </div>
            <Clock className="w-5 h-5 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-4 border-green-200 bg-green-50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold mb-1 text-green-700">Completed</p>
              <p className="text-2xl font-bold text-green-600">{summary.completed_count}</p>
              <p className="text-xs text-green-600/70 mt-1">
                {summary.total_gaps > 0 ? Math.round((summary.completed_count / summary.total_gaps) * 100) : 0}% of targets
              </p>
            </div>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Priority Matrix */}
      <GapPriorityMatrix gaps={gaps} />

      <GapsPriorityGroups gaps={gaps} completedGapIds={completedGapIds} />

      {/* Category Breakdown */}
      {Object.keys(categoryGroups).length > 0 && (
        <div className="space-y-4 pt-6 border-t border-border/50">
          <h2 className="text-lg font-semibold">By Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(categoryGroups).map(([category, categoryGaps]) => {
              const cat = gapCategories[category] || gapCategories.other
              const gaps_array = categoryGaps as MissingFileGap[]
              return (
                <Card key={category} className="p-3">
                  <div className="flex items-start gap-2">
                    <span className="text-xl">{cat.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-muted-foreground">
                        {cat.name}
                      </p>
                      <p className="text-lg font-bold">
                        {gaps_array.length}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {Math.round(calculateTotalEffort(gaps_array))}h
                      </p>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default async function GapsDashboardPage() {
  // Check if user is Pro
  const user = await getCurrentUser()
  const { canAccessPro: isPro } = user ? await resolveProAccess(user) : { canAccessPro: false }

  if (!user || !isPro) {
    return (
      <div className="p-6 space-y-6">
        <ProUpgradeGate />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <Suspense fallback={<LoadingSkeleton />}>
        <GapsDashboardContent userId={user.id} />
      </Suspense>
    </div>
  )
}
