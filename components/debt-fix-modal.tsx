'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Download,
  Wrench,
  GitPullRequest,
} from 'lucide-react'
import type { DebtIssue } from '@/app/api/debt-scan/route'

type FixStep =
  | { id: 'idle' }
  | { id: 'fetching' }
  | { id: 'generating' }
  | { id: 'pr_creating' }
  | { id: 'done'; prUrl: string }
  | { id: 'error'; message: string }

interface DebtFixModalProps {
  issue: DebtIssue
  analysisId: string
  repoOwner: string
  repoName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const STEPS = [
  { key: 'fetching', label: 'Fetching file from GitHub', icon: Download },
  { key: 'generating', label: 'Generating fix with Claude', icon: Wrench },
  { key: 'pr_creating', label: 'Creating pull request', icon: GitPullRequest },
  { key: 'done', label: 'Complete', icon: CheckCircle2 },
]

function stepIndex(step: FixStep): number {
  if (step.id === 'idle') return -1
  if (step.id === 'fetching') return 0
  if (step.id === 'generating') return 1
  if (step.id === 'pr_creating') return 2
  if (step.id === 'done') return 3
  return -1
}

export function DebtFixModal({
  issue,
  analysisId,
  repoOwner,
  repoName,
  open,
  onOpenChange,
}: DebtFixModalProps) {
  const [step, setStep] = useState<FixStep>({ id: 'idle' })
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null)

  const isFixing =
    step.id !== 'idle' && step.id !== 'done' && step.id !== 'error'

  const handleFix = async () => {
    setStep({ id: 'fetching' })

    try {
      const res = await fetch('/api/debt-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issue, analysisId, repoOwner, repoName }),
      })

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}))
        setStep({ id: 'error', message: (data as { error?: string }).error ?? 'Request failed' })
        return
      }

      const reader = res.body.getReader()
      readerRef.current = reader
      const decoder = new TextDecoder()
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (value) buf += decoder.decode(value, { stream: true })
        if (done) { buf += decoder.decode(undefined, { stream: false }) }

        const lines = buf.split('\n')
        buf = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue
          try {
            const data = JSON.parse(trimmed.slice(6)) as {
              step: string
              message?: string
              prUrl?: string
            }

            if (data.step === 'fetching') {
              setStep({ id: 'fetching' })
            } else if (data.step === 'generating') {
              setStep({ id: 'generating' })
            } else if (data.step === 'pr_creating') {
              setStep({ id: 'pr_creating' })
            } else if (data.step === 'done') {
              setStep({ id: 'done', prUrl: data.prUrl! })
            } else if (data.step === 'error') {
              setStep({ id: 'error', message: data.message ?? 'Fix failed' })
            }
          } catch {
            // incomplete chunk
          }
        }

        if (done) break
      }

      setStep((prev: FixStep) =>
        prev.id !== 'done' && prev.id !== 'error'
          ? { id: 'error', message: 'Operation timed out — please try again.' }
          : prev,
      )
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Fix failed'
      setStep({
        id: 'error',
        message: msg === 'Load failed' || msg === 'Failed to fetch'
          ? 'Connection timed out — please try again.'
          : msg,
      })
    }
  }

  const handleClose = (open: boolean) => {
    if (isFixing) return
    setStep({ id: 'idle' })
    onOpenChange(open)
  }

  const currentStepIdx = stepIndex(step)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-chart-2" />
            <DialogTitle>Auto-fix: {issue.title}</DialogTitle>
          </div>
          <DialogDescription>
            Claude will generate a fix for <span className="font-mono text-xs">{issue.file}</span> and open a GitHub PR.
          </DialogDescription>
        </DialogHeader>

        {step.id === 'idle' || step.id === 'error' ? (
          <div className="space-y-5 pt-1">
            <div className="rounded-lg bg-muted/50 p-3 space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider w-20 shrink-0">File</span>
                <span className="text-xs font-mono text-foreground break-all">{issue.file}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider w-20 shrink-0">Problem</span>
                <span className="text-xs text-foreground">{issue.description}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider w-20 shrink-0">Fix</span>
                <span className="text-xs text-foreground">{issue.suggestion}</span>
              </div>
            </div>

            {step.id === 'error' && (
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{step.message}</p>
              </div>
            )}

            <Button className="w-full" onClick={handleFix}>
              <Wrench className="h-4 w-4 mr-2" />
              Generate Fix &amp; Open PR
            </Button>
          </div>
        ) : step.id === 'done' ? (
          <div className="space-y-5 pt-1">
            <div className="flex flex-col items-center text-center gap-3 py-4">
              <div className="h-14 w-14 rounded-full bg-chart-1/10 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-chart-1" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Pull request created!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Review and merge the PR to apply the fix.
                </p>
              </div>
            </div>
            <Button className="w-full" asChild>
              <a href={step.prUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Pull Request
              </a>
            </Button>
            <Button variant="outline" className="w-full" onClick={() => handleClose(false)}>
              Done
            </Button>
          </div>
        ) : (
          <div className="py-4 space-y-5">
            <div className="space-y-3">
              {STEPS.map((s, idx) => {
                const isDone = currentStepIdx > idx
                const isActive = currentStepIdx === idx
                const Icon = s.icon
                return (
                  <div key={s.key} className="flex items-center gap-3">
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        isDone
                          ? 'bg-chart-1/10'
                          : isActive
                          ? 'bg-chart-2/10'
                          : 'bg-muted'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4 text-chart-1" />
                      ) : isActive ? (
                        <Loader2 className="h-4 w-4 text-chart-2 animate-spin" />
                      ) : (
                        <Icon className="h-4 w-4 text-muted-foreground/40" />
                      )}
                    </div>
                    <p
                      className={`text-sm font-medium ${
                        isDone
                          ? 'text-chart-1'
                          : isActive
                          ? 'text-foreground'
                          : 'text-muted-foreground/40'
                      }`}
                    >
                      {s.label}
                    </p>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-center text-muted-foreground">
              This may take up to 30 seconds — please keep this window open.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
