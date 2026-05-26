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
  MessageSquare,
  Search,
  Sparkles,
  Trash2,
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

const DIFFICULTY_META: Record<LikedAppDifficulty, { label: string; badgeClass: string; icon: LucideIcon }> = {
  easy: { label: 'Easy', badgeClass: 'bg-chart-1/10 text-chart-1 border-0', icon: Sparkles },
  medium: { label: 'Medium', badgeClass: 'bg-chart-2/10 text-chart-2 border-0', icon: LayoutGrid },
  hard: { label: 'Hard', badgeClass: 'bg-destructive/10 text-destructive border-0', icon: Code2 },
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
    <Card className="group flex flex-col gap-4 p-5 transition-all duration-200 hover:border-rose-500/30 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-rose-500/10">
            <Heart className="h-5 w-5 fill-current text-rose-500" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-foreground">{app.name}</h3>
            <p className="mt-0.5 text-xs font-medium text-chart-2">{app.tagline}</p>
          </div>
        </div>
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
          </div>
          {app.reusePlan}
        </div>
      )}

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

  const handleRemove = (id: string) => {
    setLikedApps(removeLikedApp(id))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
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
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

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
          </p>
          {likedApps.length === 0 && (
            <Button asChild>
              <Link href="/dashboard/pattern-analyzer">
                <MessageSquare className="mr-2 h-4 w-4" />
                Find Apps to Like
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
