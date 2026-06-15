'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Project, ProjectMilestone } from '@/lib/queries'
import {
  ArrowLeft, Github, Globe, Rocket, CheckCircle2, Circle,
  Plus, Trash2, Loader2, Edit3, Save, X, ExternalLink,
  Layers, Code2, Server, Zap, GitBranch, Monitor, MoreHorizontal,
} from 'lucide-react'

// ── status helpers ────────────────────────────────────────────────────────────

const STATUS_META: Record<Project['status'], { label: string; badge: string; dot: string }> = {
  planning: { label: 'Planning',  dot: 'bg-amber-400',   badge: 'text-amber-400  bg-amber-950/60  border-amber-500/30'  },
  building: { label: 'Building',  dot: 'bg-cyan-400',    badge: 'text-cyan-400   bg-cyan-950/60   border-cyan-500/30'   },
  deployed: { label: 'Deployed',  dot: 'bg-emerald-400', badge: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30' },
  paused:   { label: 'Paused',   dot: 'bg-zinc-500',    badge: 'text-zinc-400   bg-zinc-900      border-zinc-700'      },
  archived: { label: 'Archived', dot: 'bg-zinc-600',    badge: 'text-zinc-500   bg-zinc-900/50   border-zinc-800'      },
}

const SUBSTATUS_OPTIONS = [
  { value: 'not_started', label: 'Not started', cls: 'text-zinc-500' },
  { value: 'in_progress', label: 'In progress', cls: 'text-cyan-400' },
  { value: 'complete',    label: 'Complete',    cls: 'text-emerald-400' },
] as const

const PHASE_META: Record<ProjectMilestone['phase'], { label: string; icon: typeof Layers; color: string }> = {
  planning:    { label: 'Planning',    icon: Layers,    color: 'text-amber-400' },
  backend:     { label: 'Backend',     icon: Server,    color: 'text-violet-400' },
  frontend:    { label: 'Frontend',    icon: Monitor,   color: 'text-cyan-400' },
  integration: { label: 'Integration', icon: GitBranch, color: 'text-blue-400' },
  deployment:  { label: 'Deployment',  icon: Zap,       color: 'text-emerald-400' },
  other:       { label: 'Other',       icon: Code2,     color: 'text-zinc-400' },
}

const PHASE_ORDER: ProjectMilestone['phase'][] = ['planning','backend','frontend','integration','deployment','other']

function pct(project: Project) {
  if (!project.milestone_total) return 0
  return Math.round(((project.milestone_done ?? 0) / project.milestone_total) * 100)
}

// ── milestone row ─────────────────────────────────────────────────────────────

function MilestoneRow({
  milestone,
  onToggle,
  onDelete,
}: {
  milestone: ProjectMilestone
  onToggle: (id: string, completed: boolean) => void
  onDelete: (id: string) => void
}) {
  const [busy, setBusy] = useState(false)

  const toggle = async () => {
    setBusy(true)
    onToggle(milestone.id, !milestone.completed)
    setBusy(false)
  }

  return (
    <div className="flex items-center gap-3 py-2 group">
      <button
        onClick={toggle}
        disabled={busy}
        className={cn(
          'flex-shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all',
          milestone.completed
            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
            : 'border-zinc-700 hover:border-cyan-500/50',
        )}
      >
        {milestone.completed && <CheckCircle2 className="h-3 w-3" />}
      </button>
      <span className={cn('flex-1 text-sm transition-colors', milestone.completed ? 'line-through text-zinc-600' : 'text-zinc-300')}>
        {milestone.title}
      </span>
      <button
        onClick={() => onDelete(milestone.id)}
        className="opacity-0 group-hover:opacity-100 text-zinc-700 hover:text-red-400 transition-all"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// ── add milestone form ────────────────────────────────────────────────────────

function AddMilestoneForm({
  projectId,
  onAdded,
}: {
  projectId: string
  onAdded: (m: ProjectMilestone) => void
}) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [phase, setPhase] = useState<ProjectMilestone['phase']>('other')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setBusy(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), phase }),
      })
      const data = await res.json()
      if (res.ok) {
        onAdded(data.milestone)
        setTitle('')
        setOpen(false)
      }
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-xs font-mono text-zinc-600 hover:text-cyan-400 transition-colors mt-2"
      >
        <Plus className="h-3.5 w-3.5" /> Add milestone
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="mt-3 flex gap-2 items-end flex-wrap">
      <input
        autoFocus
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Milestone title…"
        className="flex-1 min-w-48 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50"
      />
      <select
        value={phase}
        onChange={(e) => setPhase(e.target.value as ProjectMilestone['phase'])}
        className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm text-zinc-300 focus:outline-none"
      >
        {PHASE_ORDER.map((p) => (
          <option key={p} value={p}>{PHASE_META[p].label}</option>
        ))}
      </select>
      <div className="flex gap-1">
        <button type="submit" disabled={busy || !title.trim()} className="px-3 py-1.5 rounded-lg bg-cyan-500 text-black text-xs font-bold hover:bg-cyan-400 disabled:opacity-50 transition-colors">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Add'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-zinc-400 hover:text-white transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </form>
  )
}

// ── build panel ───────────────────────────────────────────────────────────────

function BuildPanel({ project, onRepoCreated }: { project: Project; onRepoCreated: (url: string) => void }) {
  const [repoName, setRepoName] = useState(project.name.toLowerCase().replace(/\s+/g, '-'))
  const [platform, setPlatform] = useState<'github' | 'gitlab'>('github')
  const [building, setBuilding] = useState(false)
  const [messages, setMessages] = useState<string[]>([])
  const [repoUrl, setRepoUrl] = useState<string | null>(project.repo_url)
  const [done, setDone] = useState(false)

  const build = async () => {
    if (!repoName.trim()) return
    setBuilding(true)
    setMessages(['Starting AI file generation…'])
    setDone(false)

    const blueprint = {
      name: project.name,
      description: project.description,
      app_type: 'application',
      technologies: project.tech_stack ?? [],
      existing_files: [],
      missing_files: [],
      complexity: 'moderate' as const,
      estimated_effort: null,
      ai_explanation: project.description,
    }

    try {
      const res = await fetch('/api/build-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, repoName: repoName.trim(), blueprint }),
      })

      if (!res.ok || !res.body) {
        setMessages((m) => [...m, 'Error: failed to start build'])
        setBuilding(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { value, done: streamDone } = await reader.read()
        if (streamDone) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          try {
            const ev = JSON.parse(line.slice(6))
            if (ev.message) setMessages((m) => [...m, ev.message])
            if (ev.repoUrl) {
              setRepoUrl(ev.repoUrl)
              onRepoCreated(ev.repoUrl)
            }
            if (ev.step === 'done' || ev.step === 'error') setDone(true)
          } catch { /* skip */ }
        }
      }
    } finally {
      setBuilding(false)
      setDone(true)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-white mb-1">AI Build</h3>
        <p className="text-xs text-zinc-500">Generate all project files and push to a new GitHub / GitLab repository.</p>
      </div>

      {repoUrl ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-mono text-emerald-400 uppercase tracking-widest">Repository connected</p>
            <a href={repoUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-white hover:underline flex items-center gap-1 mt-0.5">
              {repoUrl.replace('https://', '')} <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <button
            onClick={() => { setRepoUrl(null); setMessages([]); setDone(false) }}
            className="text-xs text-zinc-500 hover:text-white border border-white/10 rounded-lg px-3 py-1.5 transition-colors"
          >
            Rebuild
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => setPlatform('github')}
              className={cn('flex-1 py-2 rounded-lg text-xs font-mono border transition-all', platform === 'github' ? 'bg-white/10 border-white/20 text-white' : 'border-white/5 text-zinc-600 hover:text-zinc-400')}
            >
              GitHub
            </button>
            <button
              onClick={() => setPlatform('gitlab')}
              className={cn('flex-1 py-2 rounded-lg text-xs font-mono border transition-all', platform === 'gitlab' ? 'bg-white/10 border-white/20 text-white' : 'border-white/5 text-zinc-600 hover:text-zinc-400')}
            >
              GitLab
            </button>
          </div>

          <input
            value={repoName}
            onChange={(e) => setRepoName(e.target.value)}
            placeholder="repo-name"
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50"
          />

          <button
            onClick={build}
            disabled={building || !repoName.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 text-black text-sm font-bold hover:from-cyan-400 hover:to-violet-400 disabled:opacity-50 transition-all"
          >
            {building ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
            {building ? 'Building…' : 'Build This App'}
          </button>
        </div>
      )}

      {messages.length > 0 && (
        <div className="rounded-lg bg-black/60 border border-white/5 p-3 max-h-40 overflow-y-auto space-y-1">
          {messages.map((m, i) => (
            <p key={i} className={cn('text-xs font-mono', i === messages.length - 1 && !done ? 'text-cyan-400' : 'text-zinc-500')}>
              {m}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

// ── edit field ────────────────────────────────────────────────────────────────

function EditableField({
  label, value, multiline, onSave,
}: {
  label: string
  value: string | null
  multiline?: boolean
  onSave: (v: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const [busy, setBusy] = useState(false)

  const save = async () => {
    setBusy(true)
    await onSave(draft)
    setBusy(false)
    setEditing(false)
  }

  if (!editing) {
    return (
      <div className="group flex items-start gap-2">
        <div className="flex-1">
          <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 mb-1">{label}</p>
          <p className={cn('text-sm', value ? 'text-zinc-300' : 'text-zinc-600 italic')}>{value || 'Not set'}</p>
        </div>
        <button
          onClick={() => { setDraft(value ?? ''); setEditing(true) }}
          className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-cyan-400 transition-all mt-1"
        >
          <Edit3 className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 mb-1">{label}</p>
      {multiline ? (
        <textarea
          autoFocus
          rows={3}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full rounded-lg bg-white/5 border border-cyan-500/40 px-3 py-2 text-sm text-white focus:outline-none resize-none"
        />
      ) : (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full rounded-lg bg-white/5 border border-cyan-500/40 px-3 py-2 text-sm text-white focus:outline-none"
        />
      )}
      <div className="flex gap-2 mt-2">
        <button onClick={save} disabled={busy} className="flex items-center gap-1 px-3 py-1 rounded bg-cyan-500 text-black text-xs font-bold hover:bg-cyan-400 disabled:opacity-50">
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save
        </button>
        <button onClick={() => setEditing(false)} className="px-3 py-1 rounded border border-white/10 text-xs text-zinc-400 hover:text-white">
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── main page ─────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'progress' | 'settings'

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('overview')
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${id}`)
      if (!res.ok) { router.push('/dashboard/projects'); return }
      const data = await res.json()
      setProject(data.project)
      setMilestones(data.milestones ?? [])
    } finally {
      setLoading(false)
    }
  }, [id, router])

  useEffect(() => { load() }, [load])

  const patch = async (fields: Record<string, unknown>) => {
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    })
    const data = await res.json()
    if (res.ok) setProject((p) => p ? { ...p, ...data.project } : data.project)
  }

  const toggleMilestone = async (milestoneId: string, completed: boolean) => {
    setMilestones((ms) => ms.map((m) => m.id === milestoneId ? { ...m, completed } : m))
    await fetch(`/api/projects/${id}/milestones/${milestoneId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    })
    // refresh project to update milestone counts
    const res = await fetch(`/api/projects/${id}`)
    const data = await res.json()
    if (res.ok) setProject(data.project)
  }

  const deleteMilestone = async (milestoneId: string) => {
    setMilestones((ms) => ms.filter((m) => m.id !== milestoneId))
    await fetch(`/api/projects/${id}/milestones/${milestoneId}`, { method: 'DELETE' })
    const res = await fetch(`/api/projects/${id}`)
    const data = await res.json()
    if (res.ok) setProject(data.project)
  }

  const addMilestone = (m: ProjectMilestone) => {
    setMilestones((ms) => [...ms, m])
    setProject((p) => p ? { ...p, milestone_total: (p.milestone_total ?? 0) + 1 } : p)
  }

  const deleteProject = async () => {
    if (!confirm('Delete this project? This cannot be undone.')) return
    setDeleting(true)
    await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    router.push('/dashboard/projects')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-cyan-400/50" />
      </div>
    )
  }

  if (!project) return null

  const { label, badge, dot } = STATUS_META[project.status]
  const progress = pct(project)
  const barColor = project.status === 'deployed' ? 'bg-emerald-500' : project.status === 'building' ? 'bg-cyan-400' : 'bg-violet-500'

  const byPhase = PHASE_ORDER.reduce((acc, phase) => {
    const ms = milestones.filter((m) => m.phase === phase)
    if (ms.length > 0) acc[phase] = ms
    return acc
  }, {} as Record<string, ProjectMilestone[]>)

  const doneCount = milestones.filter((m) => m.completed).length

  return (
    <div className="space-y-6 max-w-4xl">
      {/* breadcrumb + links */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/projects" className="text-zinc-600 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="text-zinc-700">/</span>
          <span className="text-xs font-mono text-zinc-500">Projects</span>
        </div>
        <div className="flex items-center gap-2">
          {project.repo_url && (
            <a href={project.repo_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-zinc-400 hover:text-white transition-colors">
              <Github className="h-3.5 w-3.5" /> Repo
            </a>
          )}
          {project.deployment_url && (
            <a href={project.deployment_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/20 text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
              <Globe className="h-3.5 w-3.5" /> Live
            </a>
          )}
        </div>
      </div>

      {/* title + status */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold border', badge)}>
              <span className={cn('h-2 w-2 rounded-full', dot)} />
              {label}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-zinc-500 max-w-xl">{project.description}</p>
          )}
        </div>
      </div>

      {/* stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Progress',
            value: `${progress}%`,
            sub: `${doneCount} / ${project.milestone_total ?? 0} milestones`,
            bar: true,
          },
          {
            label: 'Frontend',
            value: project.frontend_status === 'complete' ? 'Complete' : project.frontend_status === 'in_progress' ? 'In Progress' : 'Not Started',
            cls: project.frontend_status === 'complete' ? 'text-emerald-400' : project.frontend_status === 'in_progress' ? 'text-cyan-400' : 'text-zinc-500',
          },
          {
            label: 'Backend',
            value: project.backend_status === 'complete' ? 'Complete' : project.backend_status === 'in_progress' ? 'In Progress' : 'Not Started',
            cls: project.backend_status === 'complete' ? 'text-emerald-400' : project.backend_status === 'in_progress' ? 'text-cyan-400' : 'text-zinc-500',
          },
          {
            label: 'Started',
            value: new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            cls: 'text-zinc-300',
          },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 mb-1">{s.label}</p>
            <p className={cn('text-sm font-bold', (s as { cls?: string }).cls ?? 'text-white')}>{s.value}</p>
            {(s as { sub?: string }).sub && <p className="text-[11px] text-zinc-600 mt-0.5">{(s as { sub?: string }).sub}</p>}
            {(s as { bar?: boolean }).bar && (
              <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
                <div className={cn('h-full rounded-full transition-all', barColor)} style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* tabs */}
      <div>
        <div className="flex items-center gap-1 border-b border-white/5 mb-6">
          {(['overview', 'progress', 'settings'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-4 py-2.5 text-xs font-mono uppercase tracking-wider border-b-2 transition-all -mb-px',
                tab === t
                  ? 'border-cyan-400 text-cyan-300'
                  : 'border-transparent text-zinc-600 hover:text-zinc-300',
              )}
            >
              {t === 'progress' ? 'Progress & Build' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-5">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500">About</h3>
                <EditableField
                  label="Description"
                  value={project.description}
                  multiline
                  onSave={(v) => patch({ description: v })}
                />
                <EditableField
                  label="Notes"
                  value={project.notes}
                  multiline
                  onSave={(v) => patch({ notes: v })}
                />
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500">Tech Stack</h3>
                <div className="flex flex-wrap gap-1.5">
                  {project.tech_stack?.map((t) => (
                    <span key={t} className="px-2.5 py-1 rounded-full text-xs font-mono bg-cyan-950/30 border border-cyan-500/20 text-cyan-300">
                      {t}
                    </span>
                  ))}
                  {!project.tech_stack?.length && <span className="text-xs text-zinc-600">No tech stack defined</span>}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500">Links</h3>
                <EditableField
                  label="Repository URL"
                  value={project.repo_url}
                  onSave={(v) => patch({ repo_url: v })}
                />
                <EditableField
                  label="Deployment URL"
                  value={project.deployment_url}
                  onSave={(v) => patch({ deployment_url: v })}
                />
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 space-y-2">
                <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-3">Quick Actions</h3>
                <button
                  onClick={() => setTab('progress')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-white/[0.03] border border-white/5 hover:border-white/10 text-sm text-zinc-300 hover:text-white transition-all text-left"
                >
                  <CheckCircle2 className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                  <span>View milestone progress</span>
                  <span className="ml-auto text-xs text-zinc-600">{doneCount}/{project.milestone_total ?? 0}</span>
                </button>
                <button
                  onClick={() => setTab('progress')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-white/[0.03] border border-white/5 hover:border-white/10 text-sm text-zinc-300 hover:text-white transition-all text-left"
                >
                  <Rocket className="h-4 w-4 text-violet-400 flex-shrink-0" />
                  <span>Build with AI & push to GitHub</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PROGRESS & BUILD TAB */}
        {tab === 'progress' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* milestones — wider column */}
            <div className="lg:col-span-3 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500">Milestones</h3>
                  <span className="text-xs font-mono text-zinc-600">{doneCount} / {milestones.length} complete</span>
                </div>

                {PHASE_ORDER.map((phase) => {
                  const ms = byPhase[phase]
                  if (!ms) return null
                  const { label: pLabel, icon: PhaseIcon, color } = PHASE_META[phase]
                  const phaseDone = ms.filter((m) => m.completed).length

                  return (
                    <div key={phase} className="mb-5">
                      <div className="flex items-center gap-2 mb-2">
                        <PhaseIcon className={cn('h-3.5 w-3.5', color)} />
                        <span className={cn('text-[11px] font-mono uppercase tracking-widest', color)}>{pLabel}</span>
                        <div className="flex-1 h-px bg-white/5" />
                        <span className="text-[10px] font-mono text-zinc-700">{phaseDone}/{ms.length}</span>
                      </div>
                      <div className="pl-5 divide-y divide-white/[0.03]">
                        {ms.map((m) => (
                          <MilestoneRow
                            key={m.id}
                            milestone={m}
                            onToggle={toggleMilestone}
                            onDelete={deleteMilestone}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}

                {milestones.length === 0 && (
                  <p className="text-sm text-zinc-600 py-4">No milestones yet. Add one below.</p>
                )}

                <AddMilestoneForm projectId={id} onAdded={addMilestone} />
              </div>
            </div>

            {/* build panel — narrower column */}
            <div className="lg:col-span-2">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 sticky top-6">
                <BuildPanel
                  project={project}
                  onRepoCreated={(url) => {
                    patch({ repo_url: url, status: 'building' })
                    setProject((p) => p ? { ...p, repo_url: url, status: 'building' } : p)
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {tab === 'settings' && (
          <div className="max-w-lg space-y-6">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 space-y-5">
              <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500">General</h3>
              <EditableField label="Project Name" value={project.name} onSave={(v) => patch({ name: v })} />
              <EditableField label="Description" value={project.description} multiline onSave={(v) => patch({ description: v })} />

              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 mb-2">Tech Stack</p>
                <input
                  defaultValue={project.tech_stack?.join(', ')}
                  onBlur={(e) => {
                    const tech_stack = e.target.value.split(',').map((t) => t.trim()).filter(Boolean)
                    patch({ tech_stack })
                  }}
                  placeholder="Next.js, Postgres, Stripe"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50"
                />
                <p className="text-[11px] text-zinc-700 mt-1">Comma-separated. Click elsewhere to save.</p>
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 space-y-5">
              <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500">Status</h3>
              <div className="grid grid-cols-1 gap-2">
                {(['planning','building','deployed','paused','archived'] as Project['status'][]).map((s) => (
                  <button
                    key={s}
                    onClick={() => patch({ status: s })}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg border text-sm transition-all text-left',
                      project.status === s
                        ? `${STATUS_META[s].badge} border-current`
                        : 'border-white/5 text-zinc-500 hover:text-zinc-300 hover:border-white/10',
                    )}
                  >
                    <span className={cn('h-2 w-2 rounded-full flex-shrink-0', STATUS_META[s].dot)} />
                    {STATUS_META[s].label}
                    {project.status === s && <span className="ml-auto text-[10px] font-mono">current</span>}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 mb-1.5">Frontend</p>
                  <select
                    value={project.frontend_status}
                    onChange={(e) => patch({ frontend_status: e.target.value })}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-zinc-300 focus:outline-none"
                  >
                    {SUBSTATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 mb-1.5">Backend</p>
                  <select
                    value={project.backend_status}
                    onChange={(e) => patch({ backend_status: e.target.value })}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-zinc-300 focus:outline-none"
                  >
                    {SUBSTATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-red-500/10 bg-red-950/10 p-5 space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-widest text-red-500/60">Danger Zone</h3>
              <p className="text-xs text-zinc-600">This permanently deletes the project and all its milestones.</p>
              <button
                onClick={deleteProject}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/30 text-sm text-red-400 hover:bg-red-950/30 disabled:opacity-50 transition-colors"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete Project
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
