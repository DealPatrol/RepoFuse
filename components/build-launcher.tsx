'use client'

import { useState } from 'react'
import {
  Rocket,
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Sparkles,
  FolderGit2,
  Upload,
  Lock,
  Layers,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

const PROGRESS_STEPS = [
  { key: 'generating', label: 'Writing your code', icon: Sparkles },
  { key: 'repo_created', label: 'Creating repository', icon: FolderGit2 },
  { key: 'pushing', label: 'Pushing files', icon: Upload },
  { key: 'done', label: 'Done', icon: CheckCircle2 },
]

function stepIndex(step: BuildStep): number {
  if (step.id === 'generating' || step.id === 'generated') return 0
  if (step.id === 'repo_created') return 1
  if (step.id === 'pushing') return 2
  if (step.id === 'done') return 3
  return -1
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

export function BuildLauncher({
  blueprints,
  canBuild,
}: {
  blueprints: AppBlueprint[]
  canBuild: boolean
}) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [platform, setPlatform] = useState<Platform>('github')
  const [repoName, setRepoName] = useState('')
  const [step, setStep] = useState<BuildStep>({ id: 'idle' })

  const isBuilding = step.id !== 'idle' && step.id !== 'done' && step.id !== 'error'
  const currentStepIdx = stepIndex(step)
  const repoUrl =
    step.id === 'done' ? step.repoUrl :
    step.id === 'pushing' ? step.repoUrl :
    step.id === 'repo_created' ? step.repoUrl : null

  const openBuild = (bp: AppBlueprint) => {
    if (isBuilding) return
    setActiveId(bp.id)
    setRepoName(slugify(bp.name))
    setStep({ id: 'idle' })
  }

  const startBuild = async (bp: AppBlueprint) => {
    setStep({ id: 'generating' })
    try {
      const res = await fetch('/api/build-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          repoName,
          blueprint: {
            name: bp.name,
            description: bp.description,
            app_type: bp.app_type,
            technologies: bp.technologies,
            existing_files: bp.existing_files,
            missing_files: bp.missing_files,
            complexity: bp.complexity,
            estimated_effort: bp.estimated_effort,
            ai_explanation: bp.ai_explanation,
          },
        }),
      })

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}))
        setStep({ id: 'error', message: (data as { error?: string }).error ?? 'Request failed' })
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      while (true) {
        const { done, value } = await reader.read()
        if (value) buf += decoder.decode(value, { stream: true })
        if (done) buf += decoder.decode(undefined, { stream: false })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue
          try {
            const data = JSON.parse(trimmed.slice(6)) as {
              step: string; message?: string; fileCount?: number; repoUrl?: string
              current?: number; total?: number; filesCreated?: number
            }
            if (data.step === 'generating') setStep({ id: 'generating' })
            else if (data.step === 'generated') setStep({ id: 'generated', fileCount: data.fileCount ?? 0 })
            else if (data.step === 'repo_created') setStep({ id: 'repo_created', repoUrl: data.repoUrl! })
            else if (data.step === 'pushing') setStep({ id: 'pushing', current: data.current ?? 0, total: data.total ?? 0, repoUrl: data.repoUrl ?? repoUrl ?? '' })
            else if (data.step === 'done') setStep({ id: 'done', repoUrl: data.repoUrl!, filesCreated: data.filesCreated ?? 0 })
            else if (data.step === 'error') setStep({ id: 'error', message: data.message ?? 'Build failed' })
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

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {blueprints.map((bp) => {
        const isActive = activeId === bp.id
        const reuse = Math.round(Number(bp.reuse_percentage) || 0)
        const missingCount = bp.missing_files?.length ?? 0
        return (
          <div
            key={bp.id}
            className={`group relative overflow-hidden rounded-2xl border bg-white/[0.02] transition-all ${
              isActive ? 'border-cyan-500/40 ring-1 ring-cyan-500/20' : 'border-white/5 hover:border-white/15'
            }`}
          >
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-white truncate">{bp.name}</h3>
                  {bp.app_type && (
                    <p className="text-[11px] font-mono uppercase tracking-wider text-cyan-400/70 mt-0.5">{bp.app_type}</p>
                  )}
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-2xl font-black text-cyan-300 leading-none">{reuse}%</p>
                  <p className="text-[10px] text-zinc-500 font-mono">reusable</p>
                </div>
              </div>

              {bp.description && (
                <p className="text-sm text-zinc-400 line-clamp-2">{bp.description}</p>
              )}

              <div className="flex items-center gap-4 text-[11px] text-zinc-500 font-mono">
                <span className="flex items-center gap-1"><Layers className="h-3 w-3" /> {missingCount} files to build</span>
                {bp.estimated_effort && (
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {bp.estimated_effort}</span>
                )}
              </div>

              {!isActive && (
                <Button
                  className="w-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-black font-bold"
                  onClick={() => openBuild(bp)}
                  disabled={isBuilding}
                >
                  <Rocket className="h-4 w-4 mr-2" />
                  Click here and I&apos;ll build it
                </Button>
              )}

              {isActive && (step.id === 'idle' || step.id === 'error') && (
                <div className="space-y-3 pt-1">
                  {!canBuild ? (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-950/30 p-3 text-center space-y-2">
                      <p className="text-sm text-amber-200 font-medium">Building is a Pro feature</p>
                      <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-400 text-black font-bold w-full">
                        <a href="/pricing"><Lock className="h-3.5 w-3.5 mr-1.5" /> Upgrade to Pro</a>
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        {(['github', 'gitlab'] as Platform[]).map((p) => (
                          <button
                            key={p}
                            onClick={() => setPlatform(p)}
                            className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                              platform === p
                                ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200'
                                : 'border-white/10 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {p === 'github' ? 'GitHub' : 'GitLab'}
                          </button>
                        ))}
                      </div>
                      <Input
                        value={repoName}
                        onChange={(e) => setRepoName(slugify(e.target.value))}
                        placeholder="my-new-app"
                        className="bg-black/40"
                      />
                      {step.id === 'error' && (
                        <div className="flex items-start gap-2 rounded-lg bg-red-950/40 border border-red-500/30 p-2.5">
                          <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                          <p className="text-xs text-red-300">{step.message}</p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="text-zinc-400" onClick={() => setActiveId(null)}>
                          Cancel
                        </Button>
                        <Button
                          className="flex-1 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-black font-bold"
                          onClick={() => startBuild(bp)}
                          disabled={!repoName.trim()}
                        >
                          <Rocket className="h-4 w-4 mr-2" /> Build &amp; push to {platform === 'github' ? 'GitHub' : 'GitLab'}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {isActive && step.id === 'done' && (
                <div className="space-y-3 pt-1 text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  </div>
                  <p className="text-sm font-semibold text-white">Built! {step.filesCreated} files pushed.</p>
                  <div className="flex gap-2">
                    <Button asChild className="flex-1">
                      <a href={step.repoUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" /> Open repository
                      </a>
                    </Button>
                    <Button variant="ghost" size="sm" className="text-zinc-400" onClick={() => { setActiveId(null); setStep({ id: 'idle' }) }}>
                      Done
                    </Button>
                  </div>
                </div>
              )}

              {isActive && isBuilding && (
                <div className="space-y-2.5 pt-1">
                  {PROGRESS_STEPS.map((s, idx) => {
                    const isDone = currentStepIdx > idx
                    const isActiveStep = currentStepIdx === idx
                    const Icon = s.icon
                    return (
                      <div key={s.key} className="flex items-center gap-3">
                        <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                          isDone ? 'bg-emerald-500/10' : isActiveStep ? 'bg-cyan-500/10' : 'bg-white/5'
                        }`}>
                          {isDone ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            : isActiveStep ? <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />
                            : <Icon className="h-4 w-4 text-zinc-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium ${isDone ? 'text-emerald-400' : isActiveStep ? 'text-white' : 'text-zinc-600'}`}>{s.label}</p>
                          {isActiveStep && step.id === 'pushing' && (
                            <div className="mt-1 h-1 rounded-full bg-white/5 overflow-hidden">
                              <div className="h-full bg-cyan-400 transition-all" style={{ width: `${step.total ? Math.round((step.current / step.total) * 100) : 0}%` }} />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  <p className="text-[11px] text-center text-zinc-600 pt-1">Building your app — keep this page open.</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
