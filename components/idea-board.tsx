'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  Search,
  RefreshCw,
  LayoutGrid,
  Plus,
  type LucideIcon,
} from 'lucide-react'
import type { Analysis } from '@/lib/queries'

type StatusFilter = 'all' | Analysis['status']

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
}

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'complete', label: 'Complete' },
  { value: 'analyzing', label: 'Analyzing' },
  { value: 'scanning', label: 'Scanning' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
]

function AnalysisCard({ analysis }: { analysis: Analysis }) {
  const meta = STATUS_META[analysis.status]
  const StatusIcon = meta.icon
  const progress =
    analysis.total_files > 0
      ? Math.round((analysis.analyzed_files / analysis.total_files) * 100)
      : 0

  return (
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
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{analysis.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(analysis.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
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
          </div>
        </div>
      )}

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
    </Card>
  )
}

export function IdeaBoard() {
  const [analyses, setAnalyses] = useState<Analysis[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [refreshing, setRefreshing] = useState(false)

  const fetchAnalyses = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/analyses')
      if (!res.ok) throw new Error('Failed to load analyses')
      const data: Analysis[] = await res.json()
      setAnalyses(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analyses')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAnalyses()
  }, [])

  const filtered = analyses.filter((a) => {
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const counts = analyses.reduce(
    (acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const completeCount = counts['complete'] || 0
  const failedCount = counts['failed'] || 0
  const inProgressCount = (counts['scanning'] || 0) + (counts['analyzing'] || 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
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
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search analyses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
              }`}
            >
              {f.label}
              {f.value !== 'all' && counts[f.value] != null && counts[f.value] > 0 && (
                <span className="ml-1.5 opacity-70">{counts[f.value]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

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
          </p>
          {analyses.length === 0 && (
            <Button asChild>
              <Link href="/dashboard/analyses">
                <Sparkles className="h-4 w-4 mr-2" />
                Start an Analysis
              </Link>
            </Button>
          )}
        </Card>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((analysis) => (
            <AnalysisCard key={analysis.id} analysis={analysis} />
          ))}
        </div>
      )}
    </div>
  )
}
