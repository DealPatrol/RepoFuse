'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Sparkles,
  FolderGit2,
  GitBranch,
  Upload,
  Hammer,
} from 'lucide-react'
import type { AppBlueprint } from '@/lib/queries'

type Platform = 'github' | 'gitlab'

type BuildStep =
  | { id: 'idle' }
  | { id: 'generating' }
  | { id: 'generated'; fileCount: number }
  | { id: 'repo_created'; repoUrl: string }
  | { id: 'pushing'; current: number; total: number; repoUrl: string }
  | { id: 'done'; repoUrl: string; filesCreated: number }
  | { id: 'error'; message: string }

interface BuildAppModalProps {
  blueprint: AppBlueprint
  open: boolean
  onOpenChange: (open: boolean) => void
}

const STEPS = [
  { key: 'generating', label: 'Generating file contents', icon: Sparkles },
  { key: 'repo_created', label: 'Creating repository', icon: FolderGit2 },
  { key: 'pushing', label: 'Pushing files', icon: Upload },
  { key: 'done', label: 'Complete', icon: CheckCircle2 },
]

function stepIndex(step: BuildStep): number {
  if (step.id === 'idle') return -1
  if (step.id === 'generating' || step.id === 'generated') return 0
  if (step.id === 'repo_created') return 1
  if (step.id === 'pushing') return 2
  if (step.id === 'done') return 3
  return -1
}

export function BuildAppModal({ blueprint, open, onOpenChange }: BuildAppModalProps) {
  const [platform, setPlatform] = useState<Platform>('github')
  const [repoName, setRepoName] = useState(
    blueprint.name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'),
  )
  const [step, setStep] = useState<BuildStep>({ id: 'idle' })
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null)

  const isBuilding =
    step.id !== 'idle' && step.id !== 'done' && step.id !== 'error'

  const repoUrl = step.id === 'done' ? step.repoUrl :
    step.id === 'pushing' ? step.repoUrl :
    step.id === 'repo_created' ? step.repoUrl : null

  const handleBuild = async () => {
    setStep({ id: 'generating' })

    try {
      const res = await fetch('/api/build-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, repoName, blueprint }),
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
              fileCount?: number
              repoUrl?: string
              current?: number
              total?: number
              filesCreated?: number
            }

            if (data.step === 'generating') {
              setStep({ id: 'generating' })
            } else if (data.step === 'generated') {
              setStep({ id: 'generated', fileCount: data.fileCount ?? 0 })
            } else if (data.step === 'repo_created') {
              setStep({ id: 'repo_created', repoUrl: data.repoUrl! })
            } else if (data.step === 'pushing') {
              setStep({
                id: 'pushing',
                current: data.current ?? 0,
                total: data.total ?? 0,
                repoUrl: data.repoUrl ?? repoUrl ?? '',
              })
            } else if (data.step === 'done') {
              setStep({ id: 'done', repoUrl: data.repoUrl!, filesCreated: data.filesCreated ?? 0 })
            } else if (data.step === 'error') {
              setStep({ id: 'error', message: data.message ?? 'Build failed' })
            }
          } catch {
            // incomplete chunk
          }
        }

        if (done) break
      }
    } catch (e) {
      setStep({ id: 'error', message: e instanceof Error ? e.message : 'Build failed' })
    }
  }

  const handleClose = (open: boolean) => {
    if (isBuilding) return // prevent closing mid-build
    setStep({ id: 'idle' })
    onOpenChange(open)
  }

  const currentStepIdx = stepIndex(step)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Hammer className="h-5 w-5 text-chart-2" />
            <DialogTitle>Build: {blueprint.name}</DialogTitle>
          </div>
          <DialogDescription>
            Claude will generate all {blueprint.missing_files.length} missing file
            {blueprint.missing_files.length !== 1 ? 's' : ''} and push them to a new repository.
          </DialogDescription>
        </DialogHeader>

        {step.id === 'idle' || step.id === 'error' ? (
          <div className="space-y-5 pt-1">
            {/* Platform selector */}
            <div className="space-y-2">
              <Label>Platform</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['github', 'gitlab'] as Platform[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                      platform === p
                        ? 'border-foreground/40 bg-foreground/5 text-foreground'
                        : 'border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground'
                    }`}
                  >
                    <GitBranch className="h-4 w-4" />
                    {p === 'github' ? 'GitHub' : 'GitLab'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Choose the platform you are signed in with.
              </p>
            </div>

            {/* Repo name */}
            <div className="space-y-2">
              <Label htmlFor="repo-name">Repository name</Label>
              <Input
                id="repo-name"
                value={repoName}
                onChange={(e) =>
                  setRepoName(
                    e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, '-')
                      .replace(/-+/g, '-'),
                  )
                }
                placeholder="my-new-app"
              />
            </div>

            {/* Missing files preview */}
            {blueprint.missing_files.length > 0 && (
              <div className="rounded-lg bg-muted/50 p-3 space-y-1.5">
                <p className="text-xs font-medium text-foreground">Files to be generated:</p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {blueprint.missing_files.slice(0, 6).map((f) => (
                    <li key={f.name} className="flex items-start gap-1.5">
                      <span className="text-chart-1 mt-0.5">+</span>
                      <span>
                        <span className="font-mono">{f.name}</span>
                        {f.purpose ? ` — ${f.purpose}` : ''}
                      </span>
                    </li>
                  ))}
                  {blueprint.missing_files.length > 6 && (
                    <li className="text-muted-foreground/60">
                      + {blueprint.missing_files.length - 6} more, plus README, package.json, .env.example
                    </li>
                  )}
                </ul>
              </div>
            )}

            {step.id === 'error' && (
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{step.message}</p>
              </div>
            )}

            <Button className="w-full" onClick={handleBuild} disabled={!repoName.trim()}>
              <Hammer className="h-4 w-4 mr-2" />
              Build &amp; Deploy to {platform === 'github' ? 'GitHub' : 'GitLab'}
            </Button>
          </div>
        ) : step.id === 'done' ? (
          <div className="space-y-5 pt-1">
            <div className="flex flex-col items-center text-center gap-3 py-4">
              <div className="h-14 w-14 rounded-full bg-chart-1/10 flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-chart-1" />
              </div>
              <div>
                <p className="font-semibold text-foreground">App built successfully!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {step.filesCreated} files pushed to your new repository.
                </p>
              </div>
            </div>

            <Button className="w-full" asChild>
              <a href={step.repoUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Repository
              </a>
            </Button>
            <Button variant="outline" className="w-full" onClick={() => handleClose(false)}>
              Done
            </Button>
          </div>
        ) : (
          /* Building state — step tracker */
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
                    <div className="flex-1 min-w-0">
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
                      {isActive && step.id === 'pushing' && (
                        <div className="mt-1.5 space-y-1">
                          <div className="h-1 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-chart-2 transition-all duration-300"
                              style={{
                                width: `${Math.round((step.current / step.total) * 100)}%`,
                              }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {step.current} / {step.total} files
                          </p>
                        </div>
                      )}
                      {isActive && step.id === 'generated' && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {step.fileCount} files ready
                        </p>
                      )}
                      {isActive && step.id === 'repo_created' && repoUrl && (
                        <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">
                          {repoUrl}
                        </p>
                      )}
                    </div>
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
