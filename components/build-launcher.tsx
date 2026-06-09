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
  FileCode2,
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
  return name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/, '')
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
  // Live in-app build view: the file tree fills up and the code preview streams as files land.
  const [files, setFiles] = useState<string[]>([])
  const [pushedFiles, setPushedFiles] = useState<string[]>([])
  const [preview, setPreview] = useState<{ path: string; code: string } | null>(null)

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
    setFiles([])
    setPushedFiles([])
    setPreview(null)
  }

  const startBuild = async (bp: AppBlueprint) => {
    setStep({ id: 'generating' })
    setFiles([])
    setPushedFiles([])
    setPreview(null)
    // Track repoUrl locally to avoid stale closure in async loop
    let latestRepoUrl = ''
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
              files?: string[]; path?: string; preview?: string
            }
            if (data.step === 'generating') {
              setStep({ id: 'generating' })
              // New flow: file list is sent immediately in the generating event
              if (data.files) setFiles(data.files)
            }
            else if (data.step === 'generated') {
              setStep({ id: 'generated', fileCount: data.fileCount ?? 0 })
              // Legacy flow fallback: file list in generated event
              if (data.files) setFiles(data.files)
            }
            else if (data.step === 'repo_created') {
              latestRepoUrl = data.repoUrl ?? ''
              setStep({ id: 'repo_created', repoUrl: latestRepoUrl })
            }
            else if (data.step === 'pushing') {
              const url = data.repoUrl ?? latestRepoUrl
              setStep({ id: 'pushing', current: data.current ?? 0, total: data.total ?? 0, repoUrl: url })
              if (data.path) {
                setPushedFiles((prev) => prev.includes(data.path!) ? prev : [...prev, data.path!])
                if (data.preview !== undefined) setPreview({ path: data.path!, code: data.preview })
              }
            }
            else if (data.step === 'done') {
              setStep({ id: 'done', repoUrl: data.repoUrl ?? latestRepoUrl, filesCreated: data.filesCreated ?? 0 })
            }
            else if (data.step === 'error') {
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
              isActive ? 'border-cyan-500/40 ring-1 ring-cyan-500/20 md:col-span-2' : 'border-white/5 hover:border-white/15'
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

              {bp.description && !isActive && (
                <p className="text-sm text-zinc-400 line-clamp-2">{bp.description}</p>
              )}

              {!isActive && (
                <div className="flex items-center gap-4 text-[11px] text-zinc-500 font-mono">
                  <span className="flex items-center gap-1"><Layers className="h-3 w-3" /> {missingCount} files to build</span>
                  {bp.estimated_effort && (
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {bp.estimated_effort}</span>
                  )}
                </div>
              )}

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
                  <p className="text-sm font-semibold text-white">Built! {step.filesCreated} files pushed to your repo.</p>
                  {files.length > 0 && (
                    <p className="text-[11px] text-zinc-500 font-mono">{files.length} files generated inside RepoFuse</p>
                  )}
                  <div className="flex gap-2 justify-center">
                    <Button asChild className="flex-1 max-w-xs">
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
                <div className="space-y-4 pt-1">
                  {/* Stage tracker */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    {PROGRESS_STEPS.map((s, idx) => {
                      const isDone = currentStepIdx > idx
                      const isActiveStep = currentStepIdx === idx
                      const Icon = s.icon
                      return (
                        <div key={s.key} className="flex items-center gap-2">
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                            isDone ? 'bg-emerald-500/10' : isActiveStep ? 'bg-cyan-500/10' : 'bg-white/5'
                          }`}>
                            {isDone ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                              : isActiveStep ? <Loader2 className="h-3.5 w-3.5 text-cyan-400 animate-spin" />
                              : <Icon className="h-3.5 w-3.5 text-zinc-600" />}
                          </div>
                          <p className={`text-xs font-medium ${isDone ? 'text-emerald-400' : isActiveStep ? 'text-white' : 'text-zinc-600'}`}>{s.label}</p>
                        </div>
                      )
                    })}
                  </div>

                  {/* Live build workspace: file tree + code preview */}
                  <div className="grid gap-3 md:grid-cols-5 rounded-xl border border-white/10 bg-black/50 overflow-hidden">
                    {/* File explorer */}
                    <div className="md:col-span-2 border-b md:border-b-0 md:border-r border-white/10 max-h-72 overflow-y-auto">
                      <div className="sticky top-0 bg-black/80 backdrop-blur px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                        <FolderGit2 className="h-3 w-3" /> {repoName || 'project'}
                      </div>
                      {files.length === 0 && (
                        <div className="px-3 py-4 text-xs text-zinc-600 flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin" /> Generating files…
                        </div>
                      )}
                      <ul className="py-1">
                        {files.map((f) => {
                          const pushed = pushedFiles.includes(f)
                          const active = preview?.path === f
                          return (
                            <li
                              key={f}
                              className={`flex items-center gap-2 px-3 py-1 text-xs font-mono ${active ? 'bg-cyan-500/10 text-cyan-200' : 'text-zinc-400'}`}
                            >
                              {pushed
                                ? <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                                : <FileCode2 className="h-3 w-3 text-zinc-600 shrink-0" />}
                              <span className="truncate">{f}</span>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                    {/* Code preview */}
                    <div className="md:col-span-3 max-h-72 overflow-hidden flex flex-col">
                      <div className="bg-black/80 px-3 py-2 text-[10px] font-mono text-zinc-500 truncate border-b border-white/5">
                        {preview?.path ?? 'Waiting for first file…'}
                      </div>
                      <pre className="flex-1 overflow-auto px-3 py-2 text-[11px] leading-relaxed text-zinc-300 font-mono whitespace-pre-wrap">
                        {preview?.code ?? ''}
                      </pre>
                    </div>
                  </div>

                  {step.id === 'pushing' && (
                    <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cyan-400 to-violet-400 transition-all" style={{ width: `${step.total ? Math.round((step.current / step.total) * 100) : 0}%` }} />
                    </div>
                  )}
                  <p className="text-[11px] text-center text-zinc-600">Building your app inside RepoFuse — keep this page open.</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
