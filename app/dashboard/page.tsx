import { getAllRepositories, getAllAnalyses, getGapSummary, type Analysis, type Repository } from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { FolderGit2, Sparkles, Plus, ArrowRight, Zap, AlertCircle, Lightbulb, CheckCircle2, Clock, Activity, BarChart3, GitBranch, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Rocket } from 'lucide-react'

export const dynamic = 'force-dynamic'

// ── helpers ───────────────────────────────────────────────────────────────────

function statusDot(status: Analysis['status']) {
  switch (status) {
    case 'complete':  return 'bg-emerald-500'
    case 'analyzing': return 'bg-cyan-400'
    case 'scanning':  return 'bg-blue-500'
    case 'pending':   return 'bg-amber-400'
    case 'failed':    return 'bg-red-500'
    default:          return 'bg-zinc-600'
  }
}

function statusBar(status: Analysis['status']) {
  switch (status) {
    case 'complete':  return 'bg-emerald-500'
    case 'analyzing': return 'bg-cyan-400'
    case 'scanning':  return 'bg-blue-500'
    case 'pending':   return 'bg-amber-400'
    case 'failed':    return 'bg-red-500'
    default:          return 'bg-zinc-600'
  }
}

function StatusBadge({ status }: { status: Analysis['status'] }) {
  const map: Record<Analysis['status'], { label: string; cls: string }> = {
    complete:  { label: 'Complete',  cls: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30' },
    analyzing: { label: 'Analyzing', cls: 'text-cyan-400   bg-cyan-950/60   border-cyan-500/30'     },
    scanning:  { label: 'Scanning',  cls: 'text-blue-400   bg-blue-950/60   border-blue-500/30'     },
    pending:   { label: 'Pending',   cls: 'text-amber-400  bg-amber-950/60  border-amber-500/30'    },
    failed:    { label: 'Failed',    cls: 'text-red-400    bg-red-950/60    border-red-500/30'      },
  }
  const { label, cls } = map[status] ?? { label: status, cls: 'text-zinc-400 bg-zinc-900 border-zinc-700' }
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border', cls)}>
      {label}
    </span>
  )
}

function relativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  return `${Math.floor(hr / 24)}d ago`
}

// ── sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, accentCls, icon: Icon,
}: {
  label: string
  value: number | string
  sub?: string
  accentCls: string
  icon: LucideIcon
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.03] px-6 py-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">{label}</span>
        <div className={cn('h-7 w-7 rounded-lg flex items-center justify-center', accentCls)}>
          <Icon className="h-3.5 w-3.5 text-white" />
        </div>
      </div>
      <div>
        <p className="text-4xl font-black tabular-nums text-white leading-none">{value}</p>
        {sub && <p className="mt-1.5 text-[11px] text-zinc-500">{sub}</p>}
      </div>
    </div>
  )
}

function AnalysisRow({ analysis }: { analysis: Analysis & { updated_at?: string } }) {
  const pct = analysis.total_files > 0
    ? Math.round((analysis.analyzed_files / analysis.total_files) * 100)
    : (analysis.status === 'complete' ? 100 : 0)

  return (
    <Link
      href={`/dashboard/analyses/${analysis.id}`}
      className="group flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-white/[0.04] transition-colors border border-transparent hover:border-white/5"
    >
      <span className={cn('h-2 w-2 rounded-full flex-shrink-0', statusDot(analysis.status))} />
      <span className="flex-1 min-w-0 text-sm font-medium text-zinc-200 truncate">{analysis.name}</span>
      <span className="hidden sm:block text-[11px] text-zinc-600 tabular-nums w-24 text-right">
        {analysis.total_files > 0 ? `${analysis.analyzed_files}/${analysis.total_files} files` : '—'}
      </span>
      <div className="hidden md:block w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden flex-shrink-0">
        <div
          className={cn('h-full rounded-full transition-all', statusBar(analysis.status))}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex-shrink-0"><StatusBadge status={analysis.status} /></div>
      <span className="text-[11px] text-zinc-600 w-16 text-right tabular-nums flex-shrink-0">
        {relativeTime(analysis.completed_at ?? analysis.started_at ?? analysis.created_at)}
      </span>
    </Link>
  )
}

function RepoCard({ repo }: { repo: Repository }) {
  return (
    <Link
      href="/dashboard/repositories"
      className="group flex items-center gap-3 px-4 py-3 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/10 transition-all"
    >
      <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-700 transition-colors">
        <FolderGit2 className="h-4 w-4 text-zinc-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-200 truncate">{repo.name}</p>
        <p className="text-[11px] text-zinc-600 truncate">{repo.full_name}</p>
      </div>
      <div className="flex-shrink-0 flex flex-col items-end gap-1">
        {repo.language && (
          <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
            {repo.language}
          </span>
        )}
        <span className={cn('h-1.5 w-1.5 rounded-full', repo.last_synced_at ? 'bg-emerald-500' : 'bg-zinc-600')} />
      </div>
    </Link>
  )
}

// ── page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  let repositories: Repository[] = []
  let analyses: Analysis[] = []
  let gapSummary = {
    total_gaps: 0,
    blocking_gaps: 0,
    total_hours: 0,
    completed_count: 0,
    by_category: {} as Record<string, number>,
  }

  try {
    ;[repositories, analyses, gapSummary] = await Promise.all([
      getAllRepositories(),
      getAllAnalyses(),
      getGapSummary(),
    ])
    const user = await getCurrentUser()
    if (user) {
      repositories = await getAllRepositories(user.id)
      analyses = await getAllAnalyses(user.id)
      gapSummary = await getGapSummary(user.id)
    }
  } catch {
    // database not yet available
  }

  const completedAnalyses  = analyses.filter(a => a.status === 'complete')
  const inProgressAnalyses = analyses.filter(a => a.status === 'scanning' || a.status === 'analyzing')
  const failedAnalyses     = analyses.filter(a => a.status === 'failed')

  const recentAnalyses = [...analyses]
    .sort((a, b) => {
      const ta = new Date((a as Analysis & { updated_at?: string }).updated_at ?? a.created_at).getTime()
      const tb = new Date((b as Analysis & { updated_at?: string }).updated_at ?? b.created_at).getTime()
      return tb - ta
    })
    .slice(0, 8) as (Analysis & { updated_at?: string })[]

  const systemHealthPct = analyses.length === 0
    ? 100
    : Math.round((completedAnalyses.length / analyses.length) * 100)

  const categoryEntries = Object.entries(gapSummary.by_category)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  return (
    <div className="space-y-8">

      {/* title row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 mb-1">RepoFuse</p>
          <h1 className="text-2xl font-black tracking-tight text-white">Overview</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-mono text-zinc-500">Live</span>
        </div>
      </div>

      {/* Flagship CTA — Build It For Me */}
      <Link
        href="/dashboard/build"
        className="group relative block overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/50 via-black to-violet-950/40 px-6 py-5 sm:px-8 sm:py-6 transition-all hover:border-cyan-400/50"
      >
        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl group-hover:bg-cyan-500/20 transition-colors" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center flex-shrink-0">
              <Rocket className="h-6 w-6 text-black" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-cyan-400/70 mb-0.5">The flagship feature</p>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">Click here and I&apos;ll build it.</h2>
              <p className="text-sm text-zinc-400 mt-0.5">Turn the apps hidden in your code into real, deployed repositories &mdash; automatically.</p>
            </div>
          </div>
          <span className="flex-shrink-0 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-3 text-sm font-bold text-black group-hover:from-cyan-400 group-hover:to-violet-400 transition-all">
            Build an app <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </Link>


      {/* stat strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Repositories"
          value={repositories.length}
          sub={`${repositories.filter(r => r.last_synced_at).length} synced`}
          accentCls="bg-cyan-700"
          icon={FolderGit2}
        />
        <StatCard
          label="Analyses"
          value={analyses.length}
          sub={inProgressAnalyses.length > 0 ? `${inProgressAnalyses.length} in progress` : 'None active'}
          accentCls="bg-violet-700"
          icon={Sparkles}
        />
        <StatCard
          label="Complete"
          value={completedAnalyses.length}
          sub={`${systemHealthPct}% success rate`}
          accentCls="bg-emerald-800"
          icon={CheckCircle2}
        />
        <StatCard
          label="Missing Files"
          value={gapSummary.total_gaps}
          sub={
            gapSummary.total_gaps > 0
              ? `${gapSummary.blocking_gaps} blocking · ${Math.round(gapSummary.total_hours)}h`
              : 'No open gaps'
          }
          accentCls="bg-amber-800"
          icon={AlertCircle}
        />
      </div>

      {/* two-column area */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* analysis pipeline */}
        <div className="lg:col-span-2 rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <Activity className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Analysis Pipeline</span>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-mono">
              <span className="text-emerald-400">{completedAnalyses.length} done</span>
              {inProgressAnalyses.length > 0 && (
                <span className="text-cyan-400">{inProgressAnalyses.length} running</span>
              )}
              {failedAnalyses.length > 0 && (
                <span className="text-red-400">{failedAnalyses.length} failed</span>
              )}
            </div>
          </div>

          {analyses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="h-14 w-14 rounded-2xl bg-zinc-800/80 flex items-center justify-center mb-4">
                <Sparkles className="h-7 w-7 text-zinc-600" />
              </div>
              <p className="text-sm text-zinc-400 mb-1 font-medium">No analyses yet</p>
              <p className="text-xs text-zinc-600 mb-5 max-w-xs">
                Run your first analysis to discover what applications you can build from your code.
              </p>
              <Button size="sm" asChild>
                <Link href="/dashboard/analyses">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />Start Analysis
                </Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.03] py-1">
              {recentAnalyses.map(a => <AnalysisRow key={a.id} analysis={a} />)}
            </div>
          )}

          {analyses.length > 0 && (
            <div className="px-5 py-3 border-t border-white/5">
              <Link
                href="/dashboard/analyses"
                className="text-[11px] font-mono text-cyan-400/70 hover:text-cyan-300 transition-colors flex items-center gap-1.5"
              >
                View all analyses <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>

        {/* right column */}
        <div className="flex flex-col gap-4">

          {/* system status */}
          <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-white/5">
              <BarChart3 className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">System Status</span>
            </div>
            <div className="p-4 space-y-2.5">
              {([
                { label: 'Analysis Engine', ok: true },
                { label: 'AI Processing',   ok: true },
                { label: 'GitHub Sync',     ok: repositories.some(r => r.last_synced_at) },
                { label: 'Gap Tracker',     ok: gapSummary.completed_count >= 0 },
              ] as { label: string; ok: boolean }[]).map(({ label, ok }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">{label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={cn('h-2 w-2 rounded-full', ok ? 'bg-emerald-500' : 'bg-zinc-600')} />
                    <span className={cn('text-[10px] font-mono', ok ? 'text-emerald-400' : 'text-zinc-500')}>
                      {ok ? 'Ready' : 'Idle'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 pb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono text-zinc-600">Success Rate</span>
                <span className="text-[10px] font-mono text-zinc-400">{systemHealthPct}%</span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    systemHealthPct >= 80 ? 'bg-emerald-500'
                      : systemHealthPct >= 50 ? 'bg-amber-500'
                      : 'bg-red-500'
                  )}
                  style={{ width: `${systemHealthPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* quick actions */}
          <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-white/5">
              <Zap className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Quick Actions</span>
            </div>
            <div className="p-3 space-y-1.5">
              {([
                { href: '/dashboard/repositories', icon: Plus,        label: 'Add Repository', desc: 'Connect a GitHub repo'  },
                { href: '/dashboard/analyses',     icon: Sparkles,    label: 'New Analysis',    desc: 'Discover blueprints'   },
                { href: '/dashboard/idea-board',   icon: Lightbulb,   label: 'Idea Board',      desc: 'Browse app ideas'      },
                ...(gapSummary.total_gaps > 0
                  ? [{ href: '/dashboard/gaps', icon: AlertCircle, label: 'View Gaps', desc: `${gapSummary.total_gaps} open` }]
                  : []),
              ] as { href: string; icon: LucideIcon; label: string; desc: string }[]).map(({ href, icon: Icon, label, desc }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.05] border border-transparent hover:border-white/5 transition-all group"
                >
                  <div className="h-7 w-7 rounded-lg bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-700 transition-colors flex-shrink-0">
                    <Icon className="h-3.5 w-3.5 text-zinc-400 group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-zinc-300">{label}</p>
                    <p className="text-[10px] text-zinc-600">{desc}</p>
                  </div>
                  <ArrowRight className="h-3 w-3 text-zinc-700 group-hover:text-zinc-400 transition-colors flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* repositories grid */}
      {repositories.length > 0 && (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <GitBranch className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Repositories</span>
              <span className="text-[10px] font-mono text-zinc-600 ml-1">({repositories.length})</span>
            </div>
            <Link
              href="/dashboard/repositories"
              className="text-[11px] font-mono text-cyan-400/70 hover:text-cyan-300 transition-colors flex items-center gap-1"
            >
              Manage <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 p-3">
            {repositories.slice(0, 9).map(repo => (
              <RepoCard key={repo.id} repo={repo} />
            ))}
          </div>
        </div>
      )}

      {/* empty state */}
      {repositories.length === 0 && (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.01] p-12 text-center">
          <div className="h-16 w-16 rounded-2xl bg-zinc-800/80 flex items-center justify-center mx-auto mb-5">
            <FolderGit2 className="h-8 w-8 text-zinc-600" />
          </div>
          <h3 className="text-base font-semibold text-zinc-300 mb-2">Connect your first repository</h3>
          <p className="text-sm text-zinc-600 mb-6 max-w-sm mx-auto">
            Add a GitHub repository to start scanning your code and discovering app blueprints.
          </p>
          <Button asChild>
            <Link href="/dashboard/repositories"><Plus className="h-4 w-4 mr-2" />Add Repository</Link>
          </Button>
        </div>
      )}

      {/* gap category breakdown */}
      {categoryEntries.length > 0 && (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">Missing Code by Category</span>
            </div>
            <Link
              href="/dashboard/gaps"
              className="text-[11px] font-mono text-amber-400/70 hover:text-amber-300 transition-colors flex items-center gap-1"
            >
              All gaps <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-5 space-y-3">
            {categoryEntries.map(([cat, count]) => {
              const pct = gapSummary.total_gaps > 0
                ? Math.round((count / gapSummary.total_gaps) * 100)
                : 0
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-zinc-400 capitalize">{cat}</span>
                    <span className="text-[11px] font-mono text-zinc-500">{count} gap{count !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500/70 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
