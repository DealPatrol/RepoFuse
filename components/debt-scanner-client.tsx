'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ShieldAlert,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Copy,
  Wrench,
  Files,
  Trash2,
  Lock,
  Zap,
  Package,
  Lightbulb,
  CheckCircle2,
} from 'lucide-react'
import type { Analysis } from '@/lib/queries'
import type { DebtIssue, DebtScanResult } from '@/app/api/debt-scan/route'
import { DebtFixModal } from '@/components/debt-fix-modal'
import { CREDITS } from '@/lib/credits'

type ScanState = 'idle' | 'scanning' | 'results' | 'error'

type Category = 'all' | DebtIssue['category']

const CATEGORY_META: Record<
  DebtIssue['category'],
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  duplicate: { label: 'Duplicates', icon: Files },
  unused: { label: 'Unused', icon: Trash2 },
  security: { label: 'Security', icon: Lock },
  slow_query: { label: 'Slow Queries', icon: Zap },
  outdated_dep: { label: 'Outdated Deps', icon: Package },
  quick_win: { label: 'Quick Wins', icon: Lightbulb },
}

const SEVERITY_META: Record<
  DebtIssue['severity'],
  { label: string; badgeClass: string; dotClass: string }
> = {
  critical: {
    label: 'Critical',
    badgeClass: 'bg-red-500/10 text-red-400 border-red-500/20',
    dotClass: 'bg-red-500',
  },
  high: {
    label: 'High',
    badgeClass: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    dotClass: 'bg-orange-500',
  },
  medium: {
    label: 'Medium',
    badgeClass: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    dotClass: 'bg-yellow-500',
  },
  low: {
    label: 'Low',
    badgeClass: 'bg-muted text-muted-foreground border-border',
    dotClass: 'bg-muted-foreground',
  },
}

const TABS: { key: Category; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'security', label: 'Security' },
  { key: 'duplicate', label: 'Duplicates' },
  { key: 'unused', label: 'Unused' },
  { key: 'slow_query', label: 'Slow Queries' },
  { key: 'outdated_dep', label: 'Outdated Deps' },
  { key: 'quick_win', label: 'Quick Wins' },
]

interface IssueCardProps {
  issue: DebtIssue
  analysisId: string
  repoOwner: string
  repoName: string
}

function IssueCard({ issue, analysisId, repoOwner, repoName }: IssueCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [fixOpen, setFixOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const severity = SEVERITY_META[issue.severity] ?? SEVERITY_META.low
  const category = CATEGORY_META[issue.category]
  const CategoryIcon = category?.icon ?? ShieldAlert

  const handleCopy = async () => {
    await navigator.clipboard.writeText(issue.suggestion)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <Card className="p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
            <CategoryIcon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${severity.badgeClass}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${severity.dotClass}`} />
                {severity.label}
              </span>
              <span className="text-xs text-muted-foreground">{category?.label}</span>
            </div>
            <h3 className="text-sm font-semibold text-foreground leading-snug">{issue.title}</h3>
            <p className="text-xs font-mono text-muted-foreground mt-0.5 truncate">{issue.file}</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">{issue.description}</p>

        {issue.fix && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            {expanded ? 'Hide' : 'Show'} before/after
          </button>
        )}

        {expanded && issue.fix && (
          <div className="space-y-2">
            <div>
              <p className="text-xs font-medium text-red-400 mb-1">Before</p>
              <pre className="text-xs bg-muted rounded-md p-3 overflow-x-auto text-muted-foreground font-mono whitespace-pre-wrap">
                {issue.fix.before}
              </pre>
            </div>
            <div>
              <p className="text-xs font-medium text-chart-1 mb-1">After</p>
              <pre className="text-xs bg-muted rounded-md p-3 overflow-x-auto text-foreground font-mono whitespace-pre-wrap">
                {issue.fix.after}
              </pre>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">{issue.suggestion}</p>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            {issue.autoFixable ? (
              <Button size="sm" variant="outline" onClick={() => setFixOpen(true)}>
                <Wrench className="h-3 w-3 mr-1.5" />
                Auto-fix
              </Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={handleCopy}>
                {copied ? (
                  <CheckCircle2 className="h-3 w-3 mr-1.5 text-chart-1" />
                ) : (
                  <Copy className="h-3 w-3 mr-1.5" />
                )}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {issue.autoFixable && (
        <DebtFixModal
          issue={issue}
          analysisId={analysisId}
          repoOwner={repoOwner}
          repoName={repoName}
          open={fixOpen}
          onOpenChange={setFixOpen}
        />
      )}
    </>
  )
}

interface SummaryBarProps {
  issues: DebtIssue[]
}

function SummaryBar({ issues }: SummaryBarProps) {
  const counts = {
    critical: issues.filter((i) => i.severity === 'critical').length,
    high: issues.filter((i) => i.severity === 'high').length,
    medium: issues.filter((i) => i.severity === 'medium').length,
    low: issues.filter((i) => i.severity === 'low').length,
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {(Object.entries(counts) as [DebtIssue['severity'], number][]).map(([severity, count]) => {
        const meta = SEVERITY_META[severity]
        return (
          <div key={severity} className="rounded-lg border border-border bg-muted/30 p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{count}</p>
            <p className={`text-xs font-medium mt-0.5 ${meta.badgeClass.split(' ').find((c) => c.startsWith('text-'))}`}>
              {meta.label}
            </p>
          </div>
        )
      })}
    </div>
  )
}

interface DebtScannerClientProps {
  completedAnalyses: Analysis[]
}

export function DebtScannerClient({ completedAnalyses }: DebtScannerClientProps) {
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string>('')
  const [repoOwner, setRepoOwner] = useState('')
  const [repoName, setRepoName] = useState('')
  const [scanState, setScanState] = useState<ScanState>('idle')
  const [issues, setIssues] = useState<DebtIssue[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [activeTab, setActiveTab] = useState<Category>('all')

  const selectedAnalysis = completedAnalyses.find((a) => a.id === selectedAnalysisId)

  const handleAnalysisChange = (id: string) => {
    setSelectedAnalysisId(id)
    // Pre-fill repo owner/name from first repo if available
    setRepoOwner('')
    setRepoName('')
    setIssues([])
    setScanState('idle')
    setActiveTab('all')
  }

  const handleScan = async () => {
    if (!selectedAnalysisId) return
    setScanState('scanning')
    setIssues([])
    setErrorMessage('')

    try {
      const res = await fetch('/api/debt-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysisId: selectedAnalysisId }),
      })

      const data = (await res.json()) as DebtScanResult & { error?: string }

      if (!res.ok || data.error) {
        setErrorMessage(data.error ?? 'Scan failed')
        setScanState('error')
        return
      }

      setIssues(data.issues ?? [])
      setScanState('results')
      setActiveTab('all')
    } catch {
      setErrorMessage('Network error — please try again.')
      setScanState('error')
    }
  }

  const filteredIssues =
    activeTab === 'all' ? issues : issues.filter((i) => i.category === activeTab)

  const tabCounts = TABS.reduce<Record<Category, number>>(
    (acc, t) => {
      acc[t.key] =
        t.key === 'all' ? issues.length : issues.filter((i) => i.category === t.key).length
      return acc
    },
    {} as Record<Category, number>,
  )

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-xl bg-chart-2/10 flex items-center justify-center">
            <ShieldAlert className="h-5 w-5 text-chart-2" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Debt Scanner</h1>
            <p className="text-sm text-muted-foreground">
              AI-powered technical debt analysis with one-click fixes
            </p>
          </div>
        </div>
      </div>

      {/* Config panel */}
      {(scanState === 'idle' || scanState === 'error') && (
        <Card className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Analysis</label>
            <Select value={selectedAnalysisId} onValueChange={handleAnalysisChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a completed analysis…" />
              </SelectTrigger>
              <SelectContent>
                {completedAnalyses.length === 0 ? (
                  <SelectItem value="__none__" disabled>
                    No completed analyses found
                  </SelectItem>
                ) : (
                  completedAnalyses.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name ?? a.id}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                GitHub owner <span className="text-muted-foreground font-normal">(for auto-fix)</span>
              </label>
              <input
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="e.g. octocat"
                value={repoOwner}
                onChange={(e) => setRepoOwner(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Repository name <span className="text-muted-foreground font-normal">(for auto-fix)</span>
              </label>
              <input
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="e.g. my-app"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
              />
            </div>
          </div>

          {scanState === 'error' && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{errorMessage}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Costs {CREDITS.DEBT_SCAN_COST} credits per scan
            </p>
            <Button
              onClick={handleScan}
              disabled={!selectedAnalysisId}
            >
              <ShieldAlert className="h-4 w-4 mr-2" />
              Scan for Issues
            </Button>
          </div>
        </Card>
      )}

      {/* Scanning state */}
      {scanState === 'scanning' && (
        <Card className="p-8 flex flex-col items-center justify-center gap-4 text-center">
          <div className="h-14 w-14 rounded-full bg-chart-2/10 flex items-center justify-center">
            <Loader2 className="h-7 w-7 text-chart-2 animate-spin" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Analyzing your codebase…</p>
            <p className="text-sm text-muted-foreground mt-1">
              Claude is scanning for technical debt across all your repositories.
            </p>
          </div>
        </Card>
      )}

      {/* Results */}
      {scanState === 'results' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                {issues.length} issue{issues.length !== 1 ? 's' : ''} found
                {selectedAnalysis ? ` in ${selectedAnalysis.name ?? 'analysis'}` : ''}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Click Auto-fix on any fixable issue to generate a GitHub PR
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setScanState('idle')
                setIssues([])
                setActiveTab('all')
              }}
            >
              New Scan
            </Button>
          </div>

          <SummaryBar issues={issues} />

          {/* Category tabs */}
          <div className="flex flex-wrap gap-1.5">
            {TABS.filter((t) => t.key === 'all' || tabCounts[t.key] > 0).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                }`}
              >
                {tab.label}
                {tabCounts[tab.key] > 0 && (
                  <span className="ml-1.5 opacity-70">{tabCounts[tab.key]}</span>
                )}
              </button>
            ))}
          </div>

          {/* Issue cards */}
          {filteredIssues.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No {activeTab === 'all' ? '' : activeTab.replace('_', ' ')} issues found.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredIssues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  analysisId={selectedAnalysisId}
                  repoOwner={repoOwner}
                  repoName={repoName}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
