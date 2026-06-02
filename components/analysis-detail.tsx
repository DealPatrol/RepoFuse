'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  Sparkles,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  FolderGit2,
  Code2,
  FileCode,
  Plus,
  Zap,
  Download,
  Lock,
  Crown,
  Hammer,
} from 'lucide-react'
import type { Analysis, Repository, AppBlueprint } from '@/lib/queries'
import { BuildAppModal } from '@/components/build-app-modal'
import {
  getBlueprintTier,
  tierCopy,
  type BlueprintTier,
} from '@/lib/blueprint-tiers'
import {
  getExecutionRisk,
  getOpportunityScore,
  getSuggestedFirstStep,
} from '@/lib/opportunity-metrics'

interface AnalysisDetailProps {
  analysis: Analysis
  repositories: Repository[]
  blueprints: AppBlueprint[]
  blueprintLimit?: number
  viewedBlueprintIds?: string[]
  isTrialing?: boolean
  userPlan?: string
}

const statusConfig: Record<Analysis['status'], {
  icon: typeof Clock
  label: string
  color: string
  spin?: boolean
  pulse?: boolean
}> = {
  pending: { icon: Clock, label: 'Pending', color: 'text-muted-foreground' },
  scanning: { icon: Loader2, label: 'Scanning repositories...', color: 'text-chart-1', spin: true },
  analyzing: { icon: Sparkles, label: 'AI analyzing files...', color: 'text-chart-1', pulse: true },
  complete: { icon: CheckCircle2, label: 'Analysis Complete', color: 'text-chart-1' },
  failed: { icon: XCircle, label: 'Analysis Failed', color: 'text-destructive' },
}

const complexityColors = {
  simple: 'bg-chart-1/20 text-chart-1',
  moderate: 'bg-chart-4/20 text-chart-4',
  complex: 'bg-chart-5/20 text-chart-5',
}

export function AnalysisDetail({ 
  analysis, 
  repositories, 
  blueprints, 
  blueprintLimit = -1,
  viewedBlueprintIds = [],
  isTrialing = false,
  userPlan = 'free',
}: AnalysisDetailProps) {
  const router = useRouter()
  const [trackedViews, setTrackedViews] = useState<Set<string>>(new Set(viewedBlueprintIds))
  const isFreePlan = userPlan === 'free' && !isTrialing
  const viewLimit = blueprintLimit > 0 ? blueprintLimit : Infinity
  const [scaffoldLoadingId, setScaffoldLoadingId] = useState<string | null>(null)
  const [buildModalBlueprint, setBuildModalBlueprint] = useState<AppBlueprint | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [status, setStatus] = useState(analysis.status)
  const [progress, setProgress] = useState(
    analysis.total_files > 0 
      ? Math.round((analysis.analyzed_files / analysis.total_files) * 100)
      : 0
  )
  const [localBlueprints, setLocalBlueprints] = useState(blueprints)
  const [runErrorMessage, setRunErrorMessage] = useState<string | null>(analysis.error_message)

  useEffect(() => {
    setStatus(analysis.status)
    setLocalBlueprints(blueprints)
    setRunErrorMessage(analysis.error_message)
    setProgress(
      analysis.total_files > 0
        ? Math.round((analysis.analyzed_files / analysis.total_files) * 100)
        : 0,
    )
  }, [
    analysis.id,
    analysis.status,
    analysis.error_message,
    analysis.total_files,
    analysis.analyzed_files,
    blueprints,
  ])

  const statusInfo = statusConfig[status]
  const StatusIcon = statusInfo.icon

  const generateScaffold = async (blueprint: AppBlueprint) => {
    setScaffoldLoadingId(blueprint.id)
    try {
      const res = await fetch('/api/generate-scaffold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appName: blueprint.name,
          description: blueprint.description ?? '',
          technologies: blueprint.technologies,
          existingFiles: blueprint.existing_files.map((f) => f.path),
          missingFiles: blueprint.missing_files.map(
            (f) => `${f.name} — ${f.purpose}`,
          ),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || 'Generation failed')
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json;charset=utf-8',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${blueprint.name.replace(/\s+/g, '-').toLowerCase()}-scaffold.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      alert(e instanceof Error ? e.message : 'Could not generate scaffold. Add ANTHROPIC_API_KEY in production if missing.')
    } finally {
      setScaffoldLoadingId(null)
    }
  }

  const exportAllBlueprints = () => {
    if (localBlueprints.length === 0) return
    const payload = {
      exported_at: new Date().toISOString(),
      analysis: { id: analysis.id, name: analysis.name },
      repositories: repositories.map((r) => ({
        full_name: r.full_name,
        url: r.url,
        language: r.language,
      })),
      blueprints: localBlueprints.map((bp) => ({
        ...bp,
        tier: getBlueprintTier(bp),
        opportunity_score: getOpportunityScore(bp),
        execution_risk: getExecutionRisk(bp),
        suggested_first_step: getSuggestedFirstStep(bp),
      })),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${analysis.name.replace(/\s+/g, '-').toLowerCase()}-all-blueprints.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadBuildPlan = (blueprint: AppBlueprint) => {
    const tier = getBlueprintTier(blueprint)
    const lines = [
      `# ${blueprint.name} - Build Plan`,
      '',
      `- Tier: ${tier}`,
      `- Opportunity score: ${getOpportunityScore(blueprint)}`,
      `- Reuse: ${blueprint.reuse_percentage}%`,
      `- Complexity: ${blueprint.complexity}`,
      `- Risk: ${getExecutionRisk(blueprint)}`,
      `- Estimated effort: ${blueprint.estimated_effort ?? 'TBD'}`,
      '',
      '## First step',
      getSuggestedFirstStep(blueprint),
      '',
      '## Reuse first',
      ...(blueprint.existing_files.length
        ? blueprint.existing_files.map((file) => `- [ ] ${file.path} - ${file.purpose}`)
        : ['- [ ] Identify reusable modules from connected repositories']),
      '',
      '## Missing files to create',
      ...(blueprint.missing_files.length
        ? blueprint.missing_files.map((file) => `- [ ] ${file.name} - ${file.purpose}`)
        : ['- [ ] No missing files identified']),
    ]

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${blueprint.name.replace(/\s+/g, '-').toLowerCase()}-build-plan.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const tierOrder: BlueprintTier[] = ['ship_ready', 'almost_there', 'foundation']
  const topOpportunities = [...localBlueprints]
    .sort((a, b) => getOpportunityScore(b) - getOpportunityScore(a))
    .slice(0, 3)

  const runAnalysis = async () => {
    setIsRunning(true)
    setStatus('scanning')
    setProgress(0)
    setRunErrorMessage(null)
    setLocalBlueprints([])

    try {
      const response = await fetch(`/api/analyses/${analysis.id}/run`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to run analysis')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response stream available')
      }

      const decoder = new TextDecoder()
      let sseBuffer = ''
      let streamEndedFailed = false

      while (true) {
        const { done, value } = await reader.read()
        if (value) {
          sseBuffer += decoder.decode(value, { stream: true })
        }
        if (done) {
          sseBuffer += decoder.decode(undefined, { stream: false })
        }
        const rawLines = sseBuffer.split('\n')
        sseBuffer = rawLines.pop() ?? ''

        for (const line of rawLines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue
          try {
            const data = JSON.parse(trimmed.slice(6)) as {
              status?: Analysis['status']
              progress?: number
              blueprints?: AppBlueprint[]
              error?: string
            }

            if (typeof data.error === 'string') {
              setRunErrorMessage(data.error)
              if (!data.status) {
                streamEndedFailed = true
                setStatus('failed')
              }
            }
            if (data.status === 'failed') {
              streamEndedFailed = true
              setStatus('failed')
            }
            if (data.status && data.status !== 'failed') {
              setStatus(data.status)
            }
            if (data.progress !== undefined) setProgress(data.progress)
            if (data.blueprints) setLocalBlueprints(data.blueprints)
          } catch {
            /* incomplete JSON chunk — wait for next read */
          }
        }

        if (done) break
      }

      if (!streamEndedFailed) {
        setStatus('complete')
      }
      router.refresh()
    } catch (error) {
      console.error('Analysis error:', error)
      setStatus('failed')
      setRunErrorMessage(error instanceof Error ? error.message : 'Analysis request failed')
    } finally {
      setIsRunning(false)
    }
  }

  const isInProgress = status === 'scanning' || status === 'analyzing'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/analyses">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold text-foreground">{analysis.name}</h1>
          </div>
          <div className="flex items-center gap-2 ml-11">
            <StatusIcon className={`h-4 w-4 ${statusInfo.color} ${statusInfo.spin ? 'animate-spin' : ''} ${statusInfo.pulse ? 'animate-pulse' : ''}`} />
            <span className={`text-sm ${statusInfo.color}`}>{statusInfo.label}</span>
          </div>
        </div>
        
        {(status === 'pending' || status === 'failed' || status === 'complete') && (
          <Button onClick={runAnalysis} disabled={isRunning}>
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                {status === 'complete' ? 'Run again' : 'Run Analysis'}
              </>
            )}
          </Button>
        )}
      </div>

      {runErrorMessage && (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {runErrorMessage}
        </Card>
      )}

      {/* Progress */}
      {isInProgress && (
        <Card className="p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {status === 'scanning' ? 'Scanning repositories...' : 'AI analyzing files...'}
              </span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </Card>
      )}

      {/* Repositories */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Repositories</h2>
        <div className="flex flex-wrap gap-3">
          {repositories.map((repo) => (
            <div
              key={repo.id}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-sm"
            >
              <FolderGit2 className="h-4 w-4 text-muted-foreground" />
              <span>{repo.name}</span>
              {repo.language && (
                <span className="text-xs text-muted-foreground">({repo.language})</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* App Blueprints */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-foreground">Discovered App Blueprints</h2>
          <div className="flex flex-wrap items-center gap-2">
            {localBlueprints.length > 0 && (
              <>
                <span className="text-sm text-muted-foreground">
                  {localBlueprints.length} app{localBlueprints.length !== 1 ? 's' : ''} discovered
                </span>
                <Button variant="outline" size="sm" type="button" onClick={exportAllBlueprints}>
                  <Download className="h-4 w-4 mr-2" />
                  Export all blueprints (JSON)
                </Button>
              </>
            )}
          </div>
        </div>

        {status === 'complete' && topOpportunities.length > 0 && (
          <Card className="p-5 border-border/80 bg-card/60">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Recommended launch queue</p>
                <h3 className="font-semibold text-foreground">Start with these highest-leverage projects</h3>
              </div>
              <span className="text-xs text-muted-foreground">Ranked by reuse, gap size, and complexity</span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {topOpportunities.map((bp, index) => (
                <div key={bp.id} className="rounded-lg border border-border p-3 bg-background/40">
                  <p className="text-xs text-muted-foreground">#{index + 1} pick</p>
                  <p className="text-sm font-semibold text-foreground mt-1">{bp.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {bp.reuse_percentage}% reusable · {bp.missing_files.length} missing file{bp.missing_files.length === 1 ? '' : 's'}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {status === 'pending' && (
          <Card className="border-dashed p-12 text-center">
            <Sparkles className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Ready to analyze</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Click Run Analysis to let AI discover what applications you can build from your code.
            </p>
            <Button onClick={runAnalysis}>
              <Sparkles className="h-4 w-4 mr-2" />
              Start Analysis
            </Button>
          </Card>
        )}

        {status === 'complete' && localBlueprints.length === 0 && (
          <Card className="border-dashed p-12 text-center">
            <Code2 className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No blueprints found</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              The analysis did not discover any reusable app patterns. Try adding more repositories.
            </p>
          </Card>
        )}

        {localBlueprints.length > 0 && (
          <div className="space-y-12">
            {tierOrder.map((tier) => {
              const inTier = localBlueprints
                .filter((b) => getBlueprintTier(b) === tier)
                .sort((a, b) => getOpportunityScore(b) - getOpportunityScore(a))
              if (inTier.length === 0) return null
              const meta = tierCopy[tier]
              return (
                <div key={tier} className="space-y-4">
                  <div className="border-b border-border pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded-md border ${meta.badgeClass}`}
                      >
                        {tier === 'ship_ready'
                          ? 'Quick win'
                          : tier === 'almost_there'
                            ? 'Missing a few files'
                            : 'Bigger build — still leverage your code'}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mt-2">{meta.title}</h3>
                    <p className="text-sm text-muted-foreground max-w-3xl">{meta.subtitle}</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {inTier.map((blueprint, idx) => {
                      // Check if this blueprint is viewable
                      const isViewed = trackedViews.has(blueprint.id)
                      const currentViewCount = trackedViews.size
                      const canView = !isFreePlan || isViewed || currentViewCount < viewLimit
                      const isLocked = isFreePlan && !canView

                      // Track view when first rendered (if allowed)
                      if (canView && !isViewed && isFreePlan) {
                        // Track this view
                        fetch('/api/blueprints/track-view', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ blueprintId: blueprint.id }),
                        }).catch(() => {})
                        setTrackedViews(prev => new Set([...prev, blueprint.id]))
                      }

                      if (isLocked) {
                        return (
                          <Card key={blueprint.id} className="p-6 flex flex-col border-dashed opacity-75">
                            <div className="flex items-start justify-between mb-4">
                              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                <Lock className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                                  Locked
                                </span>
                              </div>
                            </div>
                            <h3 className="font-semibold text-muted-foreground text-lg mb-2">{blueprint.name}</h3>
                            <p className="text-sm text-muted-foreground mb-4 flex-1 line-clamp-2">{blueprint.description}</p>
                            <div className="pt-4 border-t border-border">
                              <Link href="/pricing">
                                <Button size="sm" className="w-full">
                                  <Crown className="h-4 w-4 mr-2" />
                                  Upgrade to View — 7 days free
                                </Button>
                              </Link>
                            </div>
                          </Card>
                        )
                      }

                      return (
                      <Card key={blueprint.id} className="p-6 flex flex-col">
                        <div className="flex items-start justify-between mb-4">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                            <Zap className="h-5 w-5" />
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`text-xs px-2 py-1 rounded-full ${complexityColors[blueprint.complexity]}`}>
                              {blueprint.complexity}
                            </span>
                            <span className="text-sm font-medium text-chart-1">
                              {blueprint.reuse_percentage}% reusable
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Score {getOpportunityScore(blueprint)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Risk {getExecutionRisk(blueprint)}
                            </span>
                          </div>
                        </div>

                        <h3 className="font-semibold text-foreground text-lg mb-2">{blueprint.name}</h3>
                        <p className="text-sm text-muted-foreground mb-4 flex-1">{blueprint.description}</p>

                        {blueprint.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {blueprint.technologies.map((tech, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="space-y-3 text-sm flex-1">
                          {blueprint.existing_files.length > 0 && (
                            <div>
                              <p className="font-medium text-foreground mb-1 flex items-center gap-1">
                                <FileCode className="h-3.5 w-3.5" />
                                Already in your repos ({blueprint.existing_files.length})
                              </p>
                              <ul className="text-muted-foreground space-y-0.5">
                                {blueprint.existing_files.slice(0, 4).map((file, i) => (
                                  <li key={i} className="truncate font-mono text-xs">{file.path}</li>
                                ))}
                                {blueprint.existing_files.length > 4 && (
                                  <li className="text-xs">+{blueprint.existing_files.length - 4} more</li>
                                )}
                              </ul>
                            </div>
                          )}

                          {blueprint.missing_files.length > 0 && (
                            <div>
                              <p className="font-medium text-foreground mb-1 flex items-center gap-1">
                                <Plus className="h-3.5 w-3.5" />
                                Bridge the gap ({blueprint.missing_files.length} files)
                              </p>
                              <ul className="text-muted-foreground space-y-0.5">
                                {blueprint.missing_files.map((file, i) => (
                                  <li key={i} className="text-xs">
                                    <span className="font-medium text-foreground">{file.name}</span>
                                    {' — '}
                                    {file.purpose}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        <Button
                          className="mt-4 w-full"
                          onClick={() => setBuildModalBlueprint(blueprint)}
                        >
                          <Hammer className="h-4 w-4 mr-2" />
                          Build This App
                        </Button>

                        {blueprint.missing_files.length > 0 ? (
                          <Button
                            variant="secondary"
                            className="mt-2 w-full"
                            disabled={scaffoldLoadingId === blueprint.id}
                            onClick={() => void generateScaffold(blueprint)}
                          >
                            {scaffoldLoadingId === blueprint.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Drafting missing pieces…
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Generate missing file stubs (download JSON)
                              </>
                            )}
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          className="mt-2 w-full"
                          onClick={() => downloadBuildPlan(blueprint)}
                        >
                          Download build plan (Markdown)
                        </Button>

                        {blueprint.ai_explanation ? (
                          <div className="mt-4 pt-4 border-t border-border">
                            <p className="text-xs text-muted-foreground leading-relaxed">{blueprint.ai_explanation}</p>
                            <p className="text-xs text-foreground mt-2">
                              Next step: {getSuggestedFirstStep(blueprint)}
                            </p>
                          </div>
                        ) : null}
                      </Card>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {buildModalBlueprint && (
        <BuildAppModal
          blueprint={buildModalBlueprint}
          open={buildModalBlueprint !== null}
          onOpenChange={(open) => { if (!open) setBuildModalBlueprint(null) }}
        />
      )}
    </div>
  )
}
