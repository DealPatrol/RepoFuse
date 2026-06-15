'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { Project } from '@/lib/queries'
import {
  FolderOpen, Plus, Github, Globe, ArrowRight, Loader2,
  Rocket, CheckCircle2, Clock, Pause, Archive, X,
} from 'lucide-react'

// ── helpers ───────────────────────────────────────────────────────────────────

const STATUS_META: Record<Project['status'], { label: string; dot: string; badge: string }> = {
  planning:  { label: 'Planning',  dot: 'bg-amber-400',  badge: 'text-amber-400  bg-amber-950/60  border-amber-500/30'  },
  building:  { label: 'Building',  dot: 'bg-cyan-400',   badge: 'text-cyan-400   bg-cyan-950/60   border-cyan-500/30'   },
  deployed:  { label: 'Deployed',  dot: 'bg-emerald-400', badge: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30' },
  paused:    { label: 'Paused',    dot: 'bg-zinc-500',   badge: 'text-zinc-400   bg-zinc-900      border-zinc-700'      },
  archived:  { label: 'Archived',  dot: 'bg-zinc-600',   badge: 'text-zinc-500   bg-zinc-900/50   border-zinc-800'      },
}

const SUBSTATUS_META = {
  not_started: { label: 'Not started', cls: 'text-zinc-500' },
  in_progress: { label: 'In progress', cls: 'text-cyan-400' },
  complete:    { label: 'Complete',    cls: 'text-emerald-400' },
}

function progress(p: Project) {
  if (!p.milestone_total) return 0
  return Math.round(((p.milestone_done ?? 0) / p.milestone_total) * 100)
}

// ── new project dialog ────────────────────────────────────────────────────────

function NewProjectDialog({ onCreated }: { onCreated: (p: Project) => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [techRaw, setTechRaw] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    setError(null)
    try {
      const tech_stack = techRaw.split(',').map((t) => t.trim()).filter(Boolean)
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description, tech_stack }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      onCreated(data.project)
      setOpen(false)
      setName(''); setDescription(''); setTechRaw('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 text-black text-sm font-bold hover:from-cyan-400 hover:to-violet-400 transition-all"
      >
        <Plus className="h-4 w-4" />
        New Project
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <form
        onSubmit={submit}
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 space-y-4 shadow-2xl"
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div>
          <h2 className="text-lg font-bold text-white">New Project</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Start tracking your app from concept to deployment</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-mono uppercase tracking-widest text-zinc-400">Project Name *</label>
            <input
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My SaaS App"
              className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <div>
            <label className="text-xs font-mono uppercase tracking-widest text-zinc-400">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this project do?"
              rows={2}
              className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50 resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-mono uppercase tracking-widest text-zinc-400">Tech Stack</label>
            <input
              value={techRaw}
              onChange={(e) => setTechRaw(e.target.value)}
              placeholder="Next.js, Postgres, Stripe"
              className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50"
            />
            <p className="text-[11px] text-zinc-600 mt-1">Comma-separated</p>
          </div>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-white border border-white/10 hover:border-white/20 transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 text-black text-sm font-bold hover:bg-cyan-400 disabled:opacity-50 transition-colors"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
            Create Project
          </button>
        </div>
      </form>
    </div>
  )
}

// ── project card ──────────────────────────────────────────────────────────────

function ProjectCard({ project }: { project: Project }) {
  const { label, dot, badge } = STATUS_META[project.status]
  const pct = progress(project)
  const barColor = project.status === 'deployed' ? 'bg-emerald-500' : project.status === 'building' ? 'bg-cyan-400' : 'bg-violet-500'

  return (
    <Link
      href={`/dashboard/projects/${project.id}`}
      className="group relative flex flex-col gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-5 hover:border-cyan-500/20 hover:bg-white/[0.04] transition-all duration-200"
    >
      {/* header */}
      <div className="flex items-start justify-between gap-2">
        <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border', badge)}>
          <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />
          {label}
        </span>
        <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-cyan-400 transition-colors flex-shrink-0 mt-0.5" />
      </div>

      {/* name + description */}
      <div>
        <h3 className="text-base font-bold text-white leading-tight">{project.name}</h3>
        {project.description && (
          <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{project.description}</p>
        )}
      </div>

      {/* tech stack */}
      {project.tech_stack?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {project.tech_stack.slice(0, 4).map((t) => (
            <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/5 border border-white/10 text-zinc-400">
              {t}
            </span>
          ))}
          {project.tech_stack.length > 4 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/5 border border-white/10 text-zinc-500">
              +{project.tech_stack.length - 4}
            </span>
          )}
        </div>
      )}

      {/* progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">Progress</span>
          <span className="text-[10px] font-mono text-zinc-400">{pct}%</span>
        </div>
        <div className="h-1 rounded-full bg-white/5 overflow-hidden">
          <div className={cn('h-full rounded-full transition-all', barColor)} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* front/back status */}
      <div className="flex gap-4 text-[11px] font-mono">
        <span className="text-zinc-600">FE: <span className={SUBSTATUS_META[project.frontend_status].cls}>{SUBSTATUS_META[project.frontend_status].label}</span></span>
        <span className="text-zinc-600">BE: <span className={SUBSTATUS_META[project.backend_status].cls}>{SUBSTATUS_META[project.backend_status].label}</span></span>
      </div>

      {/* links */}
      {(project.repo_url || project.deployment_url) && (
        <div className="flex gap-2 pt-1 border-t border-white/5">
          {project.repo_url && (
            <a
              href={project.repo_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-white transition-colors"
            >
              <Github className="h-3 w-3" /> Repo
            </a>
          )}
          {project.deployment_url && (
            <a
              href={project.deployment_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-white transition-colors"
            >
              <Globe className="h-3 w-3" /> Live
            </a>
          )}
        </div>
      )}
    </Link>
  )
}

// ── page ──────────────────────────────────────────────────────────────────────

const FILTERS = ['All', 'Planning', 'Building', 'Deployed', 'Paused', 'Archived'] as const
type Filter = (typeof FILTERS)[number]

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('All')

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      setProjects(data.projects ?? [])
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreated = (p: Project) => {
    router.push(`/dashboard/projects/${p.id}`)
  }

  const visible = filter === 'All'
    ? projects
    : projects.filter((p) => p.status === filter.toLowerCase())

  const counts = FILTERS.reduce((acc, f) => {
    acc[f] = f === 'All' ? projects.length : projects.filter((p) => p.status === f.toLowerCase()).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-8">
      {/* page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FolderOpen className="h-5 w-5 text-cyan-400" />
            <h1 className="text-2xl font-bold text-white">Projects</h1>
          </div>
          <p className="text-sm text-zinc-500">Build and manage your apps A→Z — planning, code, and deployment in one place.</p>
        </div>
        <NewProjectDialog onCreated={handleCreated} />
      </div>

      {/* filter tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all',
              filter === f
                ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/30'
                : 'text-zinc-500 hover:text-zinc-300 border border-transparent hover:border-white/10',
            )}
          >
            {f}
            {counts[f] > 0 && (
              <span className={cn('ml-1.5 text-[10px]', filter === f ? 'text-cyan-400' : 'text-zinc-600')}>
                {counts[f]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-400/50" />
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center">
            <FolderOpen className="h-7 w-7 text-zinc-600" />
          </div>
          <div>
            <p className="text-white font-medium">
              {filter === 'All' ? 'No projects yet' : `No ${filter.toLowerCase()} projects`}
            </p>
            <p className="text-sm text-zinc-600 mt-1">
              {filter === 'All'
                ? 'Create a project to start building your app from A to Z.'
                : 'Try a different filter above.'}
            </p>
          </div>
          {filter === 'All' && (
            <div className="flex gap-3 flex-wrap justify-center">
              <NewProjectDialog onCreated={handleCreated} />
              <Link
                href="/dashboard/analyses"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-sm text-zinc-400 hover:text-white hover:border-white/20 transition-all"
              >
                <Rocket className="h-4 w-4" />
                Start from an analysis
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
          {/* add card */}
          <button
            onClick={() => {
              const dialog = document.getElementById('new-project-trigger') as HTMLButtonElement | null
              dialog?.click()
            }}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 bg-transparent p-5 text-zinc-600 hover:text-zinc-400 hover:border-white/20 transition-all min-h-[180px]"
          >
            <Plus className="h-6 w-6" />
            <span className="text-xs font-mono uppercase tracking-wider">New Project</span>
          </button>
        </div>
      )}
    </div>
  )
}
