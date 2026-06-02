'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  ArrowRight,
  Code2,
  FilePlus2,
  Heart,
  LayoutGrid,
<<<<<<< HEAD
  Plus,
=======
  MessageSquare,
  Search,
  Sparkles,
  Trash2,
>>>>>>> origin/main
  type LucideIcon,
} from 'lucide-react'
import {
  getLikedApps,
  removeLikedApp,
  subscribeToLikedApps,
  type LikedApp,
  type LikedAppDifficulty,
} from '@/lib/liked-apps'

type DifficultyFilter = 'all' | LikedAppDifficulty

<<<<<<< HEAD
const STATUS_META: Record<
  Analysis['status'],
  { label: string; color: string; badgeClass: string; cardBorder: string; icon: LucideIcon }
> = {
  pending: {
    label: 'Pending',
    color: 'text-muted-foreground',
    badgeClass: 'bg-muted text-muted-foreground border-0',
    cardBorder: 'border-border/60',
    icon: Clock,
  },
  scanning: {
    label: 'Scanning',
    color: 'text-blue-500',
    badgeClass: 'bg-blue-500/10 text-blue-500 border-0',
    cardBorder: 'border-blue-500/30',
    icon: Loader2,
  },
  analyzing: {
    label: 'Analyzing',
    color: 'text-chart-2',
    badgeClass: 'bg-chart-2/10 text-chart-2 border-0',
    cardBorder: 'border-chart-2/30',
    icon: Sparkles,
  },
  complete: {
    label: 'Complete',
    color: 'text-chart-1',
    badgeClass: 'bg-chart-1/10 text-chart-1 border-0',
    cardBorder: 'border-chart-1/30',
    icon: CheckCircle2,
  },
  failed: {
    label: 'Failed',
    color: 'text-destructive',
    badgeClass: 'bg-destructive/10 text-destructive border-0',
    cardBorder: 'border-destructive/30',
    icon: XCircle,
  },
=======
const DIFFICULTY_META: Record<LikedAppDifficulty, { label: string; badgeClass: string; icon: LucideIcon }> = {
  easy: { label: 'Easy', badgeClass: 'bg-chart-1/10 text-chart-1 border-0', icon: Sparkles },
  medium: { label: 'Medium', badgeClass: 'bg-chart-2/10 text-chart-2 border-0', icon: LayoutGrid },
  hard: { label: 'Hard', badgeClass: 'bg-destructive/10 text-destructive border-0', icon: Code2 },
>>>>>>> origin/main
}

const DIFFICULTY_FILTERS: { value: DifficultyFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
]

function LikedAppCard({ app, onRemove }: { app: LikedApp; onRemove: (id: string) => void }) {
  const meta = DIFFICULTY_META[app.difficulty] ?? DIFFICULTY_META.medium
  const DifficultyIcon = meta.icon

  return (
<<<<<<< HEAD
    <Card className={`p-5 hover:shadow-lg transition-all duration-200 flex flex-col gap-4 border ${meta.cardBorder}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            analysis.status === 'complete' ? 'bg-chart-1/10' :
            analysis.status === 'failed' ? 'bg-destructive/10' :
            'bg-muted/60'
          }`}>
            <StatusIcon
              className={`h-5 w-5 ${meta.color} ${analysis.status === 'scanning' ? 'animate-spin' : analysis.status === 'analyzing' ? 'animate-pulse' : ''}`}
            />
=======
    <Card className="group flex flex-col gap-4 p-5 transition-all duration-200 hover:border-rose-500/30 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-rose-500/10">
            <Heart className="h-5 w-5 fill-current text-rose-500" />
>>>>>>> origin/main
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-foreground">{app.name}</h3>
            <p className="mt-0.5 text-xs font-medium text-chart-2">{app.tagline}</p>
          </div>
        </div>
<<<<<<< HEAD
        <Badge className={`text-xs shrink-0 ${meta.badgeClass}`}>
          {meta.label}
        </Badge>
      </div>

      {analysis.total_files > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{analysis.analyzed_files} / {analysis.total_files} files</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                analysis.status === 'complete' ? 'bg-chart-1' : 'bg-chart-2'
              }`}
              style={{ width: `${progress}%` }}
            />
=======
        <button
          type="button"
          onClick={() => onRemove(app.id)}
          aria-label={`Remove ${app.name}`}
          className="rounded-lg p-2 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <p className="line-clamp-3 text-sm text-muted-foreground">{app.description}</p>

      <div className="flex flex-wrap gap-1.5">
        <Badge variant="outline" className="text-xs">{app.type}</Badge>
        <Badge className={`text-xs ${meta.badgeClass}`}>
          <DifficultyIcon className="mr-1 h-3 w-3" />
          {meta.label}
        </Badge>
        {app.suggestedStack.slice(0, 4).map((tech) => (
          <Badge key={tech} variant="secondary" className="text-xs">{tech}</Badge>
        ))}
      </div>

      {app.reusePlan && (
        <div className="rounded-lg border border-chart-2/20 bg-chart-2/5 p-3 text-xs text-muted-foreground">
          <div className="mb-1 flex items-center gap-1.5 font-medium text-foreground">
            <Code2 className="h-3.5 w-3.5 text-chart-2" />
            RepoFuse reuse plan
>>>>>>> origin/main
          </div>
          {app.reusePlan}
        </div>
      )}

<<<<<<< HEAD
      {analysis.error_message && (
        <p className="text-xs text-destructive line-clamp-2 bg-destructive/5 rounded-lg px-3 py-2">
          {analysis.error_message}
        </p>
      )}

      <Button variant={analysis.status === 'complete' ? 'default' : 'outline'} size="sm" asChild className="self-start mt-auto">
        <Link href={`/dashboard/analyses/${analysis.id}`}>
          {analysis.status === 'complete' ? 'View Blueprints' : 'Open'}
          <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
        </Link>
      </Button>
=======
      <div className="grid gap-3 text-xs text-muted-foreground md:grid-cols-2">
        {app.sourceFiles && app.sourceFiles.length > 0 && (
          <div>
            <div className="mb-1 font-medium text-foreground">Reuse</div>
            <div className="space-y-1">
              {app.sourceFiles.slice(0, 3).map((file) => (
                <div key={file} className="truncate rounded bg-muted px-2 py-1 font-mono">{file}</div>
              ))}
            </div>
          </div>
        )}
        {app.filesToCreate && app.filesToCreate.length > 0 && (
          <div>
            <div className="mb-1 flex items-center gap-1 font-medium text-foreground">
              <FilePlus2 className="h-3 w-3" />
              Create
            </div>
            <div className="space-y-1">
              {app.filesToCreate.slice(0, 3).map((file) => (
                <div key={file} className="truncate rounded bg-muted px-2 py-1 font-mono">{file}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
        <span className="text-xs text-muted-foreground">
          Liked {new Date(app.selectedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/pattern-analyzer">
            Refine in Chat
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
>>>>>>> origin/main
    </Card>
  )
}

export function IdeaBoard() {
  const [likedApps, setLikedApps] = useState<LikedApp[]>([])
  const [search, setSearch] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all')

  useEffect(() => {
    const refresh = () => setLikedApps(getLikedApps())
    refresh()
    return subscribeToLikedApps(refresh)
  }, [])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return likedApps.filter((app) => {
      const matchesDifficulty = difficultyFilter === 'all' || app.difficulty === difficultyFilter
      const matchesSearch =
        !query ||
        app.name.toLowerCase().includes(query) ||
        app.description.toLowerCase().includes(query) ||
        app.suggestedStack.some((tech) => tech.toLowerCase().includes(query))
      return matchesDifficulty && matchesSearch
    })
  }, [difficultyFilter, likedApps, search])

  const counts = likedApps.reduce(
    (acc, app) => {
      acc[app.difficulty] += 1
      return acc
    },
    { easy: 0, medium: 0, hard: 0 } as Record<LikedAppDifficulty, number>,
  )

<<<<<<< HEAD
  const completeCount = counts['complete'] || 0
  const failedCount = counts['failed'] || 0
  const inProgressCount = (counts['scanning'] || 0) + (counts['analyzing'] || 0)
=======
  const handleRemove = (id: string) => {
    setLikedApps(removeLikedApp(id))
  }
>>>>>>> origin/main

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
<<<<<<< HEAD
          <div className="flex items-center gap-2.5 mb-1">
            <div className="h-8 w-8 rounded-lg bg-chart-2/10 flex items-center justify-center">
              <LayoutGrid className="h-4 w-4 text-chart-2" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Idea Board</h1>
          </div>
          <p className="text-muted-foreground text-sm">All your analyses at a glance — track progress and review results.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAnalyses(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" asChild>
            <Link href="/dashboard/analyses">
              <Plus className="h-4 w-4 mr-2" />
              New Analysis
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats strip */}
      {!loading && analyses.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <Card
            className={`p-4 cursor-pointer transition-all ${statusFilter === 'complete' ? 'ring-2 ring-chart-1' : 'hover:shadow-sm'}`}
            onClick={() => setStatusFilter(statusFilter === 'complete' ? 'all' : 'complete')}
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-chart-1/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-chart-1" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground tabular-nums">{completeCount}</p>
                <p className="text-xs text-muted-foreground">Complete</p>
              </div>
            </div>
          </Card>
          <Card
            className={`p-4 cursor-pointer transition-all ${inProgressCount > 0 ? 'hover:shadow-sm' : 'opacity-60'}`}
            onClick={() => inProgressCount > 0 && setStatusFilter('scanning')}
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-chart-2/10 flex items-center justify-center">
                <Loader2 className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground tabular-nums">{inProgressCount}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </Card>
          <Card
            className={`p-4 cursor-pointer transition-all ${statusFilter === 'failed' ? 'ring-2 ring-destructive' : failedCount > 0 ? 'hover:shadow-sm' : 'opacity-60'}`}
            onClick={() => failedCount > 0 && setStatusFilter(statusFilter === 'failed' ? 'all' : 'failed')}
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground tabular-nums">{failedCount}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </div>
          </Card>
=======
          <div className="mb-1 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10">
              <Heart className="h-4 w-4 fill-current text-rose-500" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Liked Apps</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Apps you picked from VibeCoding Chat, ready to refine into RepoFuse builds.
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href="/dashboard/pattern-analyzer">
            <MessageSquare className="mr-2 h-4 w-4" />
            Open VibeCoding Chat
          </Link>
        </Button>
      </div>

      {likedApps.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {(['easy', 'medium', 'hard'] as LikedAppDifficulty[]).map((difficulty) => {
            const meta = DIFFICULTY_META[difficulty]
            const Icon = meta.icon
            return (
              <Card
                key={difficulty}
                className={`cursor-pointer p-4 transition-all ${difficultyFilter === difficulty ? 'ring-2 ring-rose-500/60' : 'hover:shadow-sm'}`}
                onClick={() => setDifficultyFilter(difficultyFilter === difficulty ? 'all' : difficulty)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/60">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold tabular-nums text-foreground">{counts[difficulty]}</p>
                    <p className="text-xs text-muted-foreground">{meta.label} builds</p>
                  </div>
                </div>
              </Card>
            )
          })}
>>>>>>> origin/main
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search liked apps..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {DIFFICULTY_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setDifficultyFilter(filter.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                difficultyFilter === filter.value
                  ? 'bg-foreground text-background'
<<<<<<< HEAD
                  : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
              }`}
            >
              {f.label}
              {f.value !== 'all' && counts[f.value] != null && counts[f.value] > 0 && (
                <span className="ml-1.5 opacity-70">{counts[f.value]}</span>
              )}
=======
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              {filter.label}
>>>>>>> origin/main
            </button>
          ))}
        </div>
      </div>

<<<<<<< HEAD
      {/* Content */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">Loading analyses...</p>
          </div>
        </div>
      )}

      {error && (
        <Card className="p-8 text-center border-destructive/30 bg-destructive/5">
          <XCircle className="mx-auto h-10 w-10 text-destructive/50 mb-3" />
          <p className="font-medium text-foreground mb-1">Failed to load analyses</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" onClick={() => fetchAnalyses()}>Try Again</Button>
        </Card>
      )}

      {!loading && !error && filtered.length === 0 && (
        <Card className="border-dashed p-12 text-center">
          <div className="h-16 w-16 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {analyses.length === 0 ? 'No analyses yet' : 'No matches'}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto text-sm">
            {analyses.length === 0
              ? 'Run your first analysis to discover apps you can build from your existing code.'
              : 'Try adjusting your search or filter.'}
=======
      {filtered.length === 0 ? (
        <Card className="border-dashed p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10">
            <Heart className="h-8 w-8 text-rose-500/70" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            {likedApps.length === 0 ? 'No liked apps yet' : 'No liked apps match'}
          </h3>
          <p className="mx-auto mb-6 max-w-sm text-sm text-muted-foreground">
            {likedApps.length === 0
              ? 'Open VibeCoding Chat, ask what to build, then heart the app cards you want RepoFuse to assemble.'
              : 'Try adjusting your search or difficulty filter.'}
>>>>>>> origin/main
          </p>
          {likedApps.length === 0 && (
            <Button asChild>
<<<<<<< HEAD
              <Link href="/dashboard/analyses">
                <Sparkles className="h-4 w-4 mr-2" />
                Start an Analysis
=======
              <Link href="/dashboard/pattern-analyzer">
                <MessageSquare className="mr-2 h-4 w-4" />
                Find Apps to Like
>>>>>>> origin/main
              </Link>
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((app) => (
            <LikedAppCard key={app.id} app={app} onRemove={handleRemove} />
          ))}
        </div>
      )}
    </div>
  )
}
