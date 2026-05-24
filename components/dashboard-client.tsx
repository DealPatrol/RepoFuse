'use client'

import { useState, useCallback } from 'react'
import { CTOModeSwitch, type CTOMode } from '@/components/cto-mode-switch'
import { FounderPreferencesEditor, useFounderPreferences } from '@/components/founder-preferences'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  FolderGit2,
  Sparkles,
  Code2,
  Plus,
  ArrowRight,
  Zap,
  AlertCircle,
  Lightbulb,
  UserCog,
  GitBranch,
  BarChart3,
  Shield,
} from 'lucide-react'
import Link from 'next/link'
import type { Analysis, Repository } from '@/lib/queries'

interface DashboardClientProps {
  repositories: Repository[]
  analyses: Analysis[]
  completedAnalyses: Analysis[]
  gapSummary: {
    total_gaps: number
    blocking_gaps: number
    total_hours: number
    completed_count: number
    by_category: Record<string, unknown>
  }
}

export function DashboardClient({
  repositories,
  analyses,
  completedAnalyses,
  gapSummary,
}: DashboardClientProps) {
  const [mode, setMode] = useState<CTOMode>('strategic')
  const [showPrefs, setShowPrefs] = useState(false)
  const { prefs } = useFounderPreferences()

  const handleModeChange = useCallback((m: CTOMode) => setMode(m), [])

  const hasPrefs = prefs.architecture || prefs.priority || prefs.stack.length > 0

  return (
    <div className="space-y-10">
      {/* Header + CTO Mode Switch */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground text-lg">Your code intelligence overview</p>
          </div>
          <div className="flex items-center gap-3">
            <CTOModeSwitch onChange={handleModeChange} />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPrefs(!showPrefs)}
              className={hasPrefs ? 'text-cyan-400' : 'text-muted-foreground'}
              title="Founder preferences"
            >
              <UserCog className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Founder preferences panel */}
        {showPrefs && (
          <div className="max-w-lg">
            <FounderPreferencesEditor onClose={() => setShowPrefs(false)} />
          </div>
        )}

        {/* Mode description */}
        <div className="h-6 mt-2">
          {mode === 'strategic' && (
            <p className="text-xs text-cyan-400/60 font-mono">Viewing strategic layer — ideas, opportunities, architecture</p>
          )}
          {mode === 'tactical' && (
            <p className="text-xs text-cyan-400/60 font-mono">Viewing tactical layer — tasks, roadmaps, PRs</p>
          )}
          {mode === 'operational' && (
            <p className="text-xs text-cyan-400/60 font-mono">Viewing operational layer — deployments, logs, monitoring</p>
          )}
        </div>
      </div>

      {/* Quick stats — always visible */}
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

      {/* Strategic Mode Content */}
      {mode === 'strategic' && (
        <section className="space-y-5">
          <h2 className="text-xl font-semibold text-foreground">Strategic Actions</h2>
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
                  <div className="h-12 w-12 rounded-xl bg-chart-2/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Zap className="h-6 w-6 text-chart-2" />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                    {completedAnalyses.length} complete
                  </span>
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-1">Discover Opportunities</h3>
                <p className="text-sm text-muted-foreground mb-5">
                  Let AI discover what apps you can build from your existing code.
                </p>
                <Button size="sm" asChild>
                  <Link href="/dashboard/analyses">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Run Analysis
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
                <h3 className="font-semibold text-lg text-foreground mb-1">App Idea Chat</h3>
                <p className="text-sm text-muted-foreground mb-5">
                  Brainstorm architecture and product ideas with AI.
                </p>
                <Button variant="outline" size="sm" className="group-hover:bg-foreground/5" asChild>
                  <Link href="/dashboard/pattern-analyzer">
                    Explore Ideas
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </Card>

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
                  Manage your connected GitHub repositories.
                </p>
                <Button variant="outline" size="sm" className="group-hover:bg-foreground/5" asChild>
                  <Link href="/dashboard/repositories">
                    Manage
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </Card>
            </div>
          )}
        </section>
      )}

      {/* Tactical Mode Content */}
      {mode === 'tactical' && (
        <section className="space-y-5">
          <h2 className="text-xl font-semibold text-foreground">Tactical View</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="group p-6 hover:shadow-lg transition-all duration-300 hover:border-border">
              <div className="flex items-start justify-between mb-5">
                <div className="h-12 w-12 rounded-xl bg-chart-2/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Sparkles className="h-6 w-6 text-chart-2" />
                </div>
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-1">Active Analyses</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {analyses.filter(a => a.status === 'scanning' || a.status === 'analyzing').length} running, {completedAnalyses.length} complete
              </p>
              <Button size="sm" asChild>
                <Link href="/dashboard/analyses">
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </Card>

            <Card className="group p-6 hover:shadow-lg transition-all duration-300 hover:border-border">
              <div className="flex items-start justify-between mb-5">
                <div className="h-12 w-12 rounded-xl bg-chart-3/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Lightbulb className="h-6 w-6 text-chart-3" />
                </div>
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-1">Template Hub</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Pre-configured combinations for rapid assembly.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/templates/browse">
                  Browse Templates
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </Card>

            {gapSummary.total_gaps > 0 && (
              <Card className="group p-6 hover:shadow-lg transition-all duration-300 border-amber-500/20">
                <div className="flex items-start justify-between mb-5">
                  <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <AlertCircle className="h-6 w-6 text-amber-400" />
                  </div>
                  <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full">
                    {gapSummary.total_gaps} gaps
                  </span>
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-1">Missing Code</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {Math.round(gapSummary.total_hours)} hours of buildable features.
                </p>
                <Button size="sm" asChild>
                  <Link href="/dashboard/gaps">
                    View Gaps
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* Operational Mode Content */}
      {mode === 'operational' && (
        <section className="space-y-5">
          <h2 className="text-xl font-semibold text-foreground">Operational Overview</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="group p-6 hover:shadow-lg transition-all duration-300 hover:border-border">
              <div className="flex items-start justify-between mb-5">
                <div className="h-12 w-12 rounded-xl bg-chart-1/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <GitBranch className="h-6 w-6 text-chart-1" />
                </div>
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-1">Repository Health</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {repositories.length} repos tracked across {new Set(repositories.map(r => r.language).filter(Boolean)).size} languages
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/repositories">
                  Review
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </Card>

            <Card className="group p-6 hover:shadow-lg transition-all duration-300 hover:border-border">
              <div className="flex items-start justify-between mb-5">
                <div className="h-12 w-12 rounded-xl bg-chart-4/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="h-6 w-6 text-chart-4" />
                </div>
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-1">Analysis History</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {analyses.filter(a => a.status === 'failed').length} failed, {completedAnalyses.length} successful
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/analyses">
                  View Log
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </Card>

            <Card className="group p-6 hover:shadow-lg transition-all duration-300 hover:border-border">
              <div className="flex items-start justify-between mb-5">
                <div className="h-12 w-12 rounded-xl bg-chart-5/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Shield className="h-6 w-6 text-chart-5" />
                </div>
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-1">Billing & Usage</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Manage your plan and monitor credit usage.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/billing">
                  Manage Billing
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </Card>
          </div>
        </section>
      )}

      {/* Recent Repositories — always visible */}
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
