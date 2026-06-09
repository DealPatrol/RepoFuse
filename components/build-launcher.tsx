'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Rocket, Loader2, CheckCircle2, XCircle, ExternalLink, Sparkles,
  FolderGit2, Upload, Lock, Layers, Clock, FileCode2,
  Send, User, Monitor, Tablet, Smartphone, Code2, Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
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
type ChatMessage = { role: 'user' | 'assistant'; content: string }
type PreviewView = 'mockup' | 'code'
type DeviceSize = 'desktop' | 'tablet' | 'mobile'

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

function generateMockupHtml(bp: AppBlueprint): string {
  const primary = '#2563eb'
  const name = bp.name || 'App'
  const desc = bp.description || 'Your app'
  const tech = (bp.technologies as string[] | null) ?? []
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box;margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}body{background:#f6f8fa;color:#24292f}.nav{background:#24292f;padding:12px 20px;display:flex;align-items:center;justify-content:space-between}.nav-brand{font-weight:800;font-size:15px;color:white}.nav-btn{background:${primary};color:white;border:none;padding:6px 14px;border-radius:6px;font-size:12px;cursor:pointer}.hero{background:linear-gradient(135deg,#1a1a2e,#24292f);color:white;padding:48px 20px;text-align:center}.hero h1{font-size:28px;font-weight:800;margin-bottom:10px}.hero p{color:#8b949e;font-size:13px;max-width:440px;margin:0 auto 20px}.search-row{display:flex;max-width:480px;margin:0 auto;border-radius:8px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.4)}.search-input{flex:1;padding:11px 14px;border:none;font-size:13px;outline:none}.search-btn{background:${primary};color:white;border:none;padding:0 18px;font-size:13px;cursor:pointer;font-weight:600}.content{padding:24px 20px;max-width:900px;margin:0 auto}.section-title{font-size:15px;font-weight:700;margin-bottom:12px}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px}.stat{background:white;border-radius:8px;padding:12px;border:1px solid #e1e4e8}.stat-val{font-size:22px;font-weight:800;color:${primary}}.stat-label{font-size:10px;color:#57606a;margin-top:2px;text-transform:uppercase}.cards{display:flex;flex-direction:column;gap:10px}.card{background:white;border-radius:8px;padding:12px 16px;border:1px solid #e1e4e8;display:flex;align-items:center;gap:12px}.card-av{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0}.card-info{flex:1}.card-name{font-weight:700;font-size:13px;margin-bottom:2px}.card-desc{font-size:11px;color:#57606a;margin-bottom:4px}.tags{display:flex;gap:4px;flex-wrap:wrap}.tag{background:#ddf4ff;color:#0969da;border-radius:20px;padding:1px 7px;font-size:10px}.score{text-align:right;flex-shrink:0}.score-val{font-size:18px;font-weight:800;color:${primary}}.score-label{font-size:10px;color:#57606a;text-transform:uppercase}.score-bar{width:52px;height:4px;background:#e1e4e8;border-radius:2px;margin-top:3px}.score-fill{height:100%;border-radius:2px;background:${primary}}</style></head><body><nav class="nav"><div class="nav-brand">${name}</div><button class="nav-btn">Get Started</button></nav><div class="hero"><h1>${name}</h1><p>${desc}</p><div class="search-row"><input class="search-input" placeholder="Enter your repository URL..."><button class="search-btn">Analyze →</button></div></div><div class="content"><p class="section-title">Dashboard Overview</p><div class="stats"><div class="stat"><div class="stat-val">12</div><div class="stat-label">Apps Found</div></div><div class="stat"><div class="stat-val">95%</div><div class="stat-label">Reusability</div></div><div class="stat"><div class="stat-val">340</div><div class="stat-label">Lines to Gen</div></div><div class="stat"><div class="stat-val">2–4h</div><div class="stat-label">Build Time</div></div></div><p class="section-title">Tech Stack</p><div class="cards">${tech.slice(0,3).map((t: string, i: number) => `<div class="card"><div class="card-av" style="background:${['#ddf4ff','#dcfce7','#f3e8ff'][i%3]}">${['⚡','🛠','🎯'][i%3]}</div><div class="card-info"><div class="card-name">${t}</div><div class="card-desc">Core technology in your repo</div><div class="tags"><span class="tag">${t}</span><span class="tag">Reusable</span></div></div><div class="score"><div class="score-val">${[95,88,82][i%3]}%</div><div class="score-label">Match</div><div class="score-bar"><div class="score-fill" style="width:${[95,88,82][i%3]}%"></div></div></div></div>`).join('')}</div></div></body></html>`
}

function MockupChatPanel({ bp, onClose }: { bp: AppBlueprint; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'assistant', content: `Hi! I've generated a live mockup of **${bp.name}**.\n\nDescribe any change and I'll update the preview and generate code.` }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [device, setDevice] = useState<DeviceSize>('desktop')
  const [mockupHtml, setMockupHtml] = useState(() => generateMockupHtml(bp))
  const [changeNotice, setChangeNotice] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => { if (changeNotice) { const t = setTimeout(() => setChangeNotice(''), 4000); return () => clearTimeout(t) } }, [changeNotice])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return
    setMessages(prev => [...prev, { role: 'user', content: trimmed }])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/mockup-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, blueprint: { name: bp.name, description: bp.description, technologies: bp.technologies }, currentHtml: mockupHtml }),
      })
      const data = await res.json()
      if (data.html) setMockupHtml(data.html)
      if (data.changeDescription) setChangeNotice(data.changeDescription)
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'Done! Check the preview.' }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Try again.' }])
    } finally {
      setLoading(false)
    }
  }, [loading, mockupHtml, bp])

  const deviceClass = device === 'tablet' ? 'max-w-[768px]' : device === 'mobile' ? 'max-w-[390px]' : 'w-full'

  return (
    <div className="flex flex-col border-t border-white/10 mt-4">
      <div className="grid md:grid-cols-5 gap-3 min-h-[480px]">
        {/* Preview pane */}
        <div className="md:col-span-3 flex flex-col rounded-xl border border-white/10 overflow-hidden bg-black/60">
          <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900/80 border-b border-white/5 flex-shrink-0">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
            </div>
            <div className="flex-1 bg-black/50 rounded px-2 py-0.5 text-[10px] font-mono text-zinc-500 truncate">https://{slugify(bp.name)}.vercel.app</div>
            <div className="flex gap-0.5">
              {(['desktop','tablet','mobile'] as DeviceSize[]).map(d => {
                const Icon = d === 'desktop' ? Monitor : d === 'tablet' ? Tablet : Smartphone
                return <button key={d} onClick={() => setDevice(d)} className={cn('p-1 rounded border transition-all', device === d ? 'border-cyan-500/40 text-cyan-300 bg-cyan-500/10' : 'border-transparent text-zinc-600 hover:text-zinc-300')}><Icon className="h-3 w-3" /></button>
              })}
            </div>
          </div>
          {changeNotice && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950/40 border-b border-emerald-500/20 text-xs text-emerald-300 flex-shrink-0">
              <CheckCircle2 className="h-3 w-3" /> {changeNotice}
            </div>
          )}
          <div className="flex-1 overflow-auto flex items-start justify-center p-3 bg-zinc-950">
            <div className={cn('bg-white rounded-lg overflow-hidden shadow-2xl transition-all duration-300 w-full', deviceClass)}>
              <iframe srcDoc={mockupHtml} className="w-full border-none block" style={{ height: 420 }} sandbox="allow-same-origin allow-scripts" />
            </div>
          </div>
        </div>
        {/* Chat pane */}
        <div className="md:col-span-2 flex flex-col rounded-xl border border-white/10 overflow-hidden bg-black/60">
          <div className="flex items-center gap-2.5 px-3 py-2.5 bg-zinc-900/80 border-b border-white/5 flex-shrink-0">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center flex-shrink-0 text-[13px]">✦</div>
            <div><p className="text-xs font-semibold text-white">AI Build Assistant</p><p className="text-[10px] text-zinc-500">Connected to your mockup</p></div>
            <div className="ml-auto flex items-center gap-1 text-[10px] text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Live</div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={cn('flex gap-2', msg.role === 'user' && 'flex-row-reverse')}>
                <div className={cn('h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[11px]', msg.role === 'assistant' ? 'bg-gradient-to-br from-cyan-500 to-violet-500' : 'bg-zinc-700 border border-zinc-600')}>
                  {msg.role === 'assistant' ? '✦' : <User className="h-3 w-3 text-zinc-300" />}
                </div>
                <div className={cn('max-w-[83%] rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap', msg.role === 'assistant' ? 'bg-zinc-800/80 border border-white/5 text-zinc-200 rounded-tl-sm' : 'bg-gradient-to-br from-cyan-600 to-blue-600 text-white rounded-tr-sm')}>{msg.content}</div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center shrink-0 text-[11px]">✦</div>
                <div className="bg-zinc-800/80 border border-white/5 rounded-xl rounded-tl-sm px-3 py-2">
                  <div className="flex gap-1 items-center">{[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{animationDelay:`${i*0.15}s`}} />)}</div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="px-3 pt-2 pb-1 border-t border-white/5 flex-shrink-0">
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1.5">Quick actions</p>
            <div className="flex flex-wrap gap-1.5">
              {['Add dark mode','Add pricing','Mobile-first','Auth flow','Loading states'].map(s => (
                <button key={s} onClick={() => setInput(s)} className="text-[10px] px-2 py-1 rounded-full border border-zinc-700 text-zinc-500 hover:border-cyan-500/40 hover:text-cyan-300 transition-all">{s}</button>
              ))}
            </div>
          </div>
          <div className="p-3 border-t border-white/5 flex-shrink-0">
            <div className="flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }} placeholder="Describe a change..." disabled={loading} className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 outline-none focus:border-cyan-500/50 transition-colors" />
              <Button onClick={() => sendMessage(input)} disabled={loading || !input.trim()} size="icon" className="h-8 w-8 bg-gradient-to-br from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 flex-shrink-0">
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              </Button>
            </div>
            <p className="text-[10px] text-zinc-600 mt-1.5 text-center">↵ Enter to send · changes apply to live preview</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function BuildLauncher({ blueprints, canBuild }: { blueprints: AppBlueprint[]; canBuild: boolean }) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [platform, setPlatform] = useState<Platform>('github')
  const [repoName, setRepoName] = useState('')
  const [step, setStep] = useState<BuildStep>({ id: 'idle' })
  const [files, setFiles] = useState<string[]>([])
  const [pushedFiles, setPushedFiles] = useState<string[]>([])
  const [preview, setPreview] = useState<{ path: string; code: string } | null>(null)
  const [innerTab, setInnerTab] = useState<'preview' | 'build'>('preview')

  const isBuilding = step.id !== 'idle' && step.id !== 'done' && step.id !== 'error'
  const currentStepIdx = stepIndex(step)

  const openBuild = (bp: AppBlueprint) => {
    if (isBuilding) return
    setActiveId(bp.id); setRepoName(slugify(bp.name)); setStep({ id: 'idle' })
    setFiles([]); setPushedFiles([]); setPreview(null); setInnerTab('preview')
  }

  const startBuild = async (bp: AppBlueprint) => {
    setStep({ id: 'generating' }); setFiles([]); setPushedFiles([]); setPreview(null)
    let latestRepoUrl = ''
    try {
      const res = await fetch('/api/build-app', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, repoName, blueprint: { name: bp.name, description: bp.description, app_type: bp.app_type, technologies: bp.technologies, existing_files: bp.existing_files, missing_files: bp.missing_files, complexity: bp.complexity, estimated_effort: bp.estimated_effort, ai_explanation: bp.ai_explanation } }),
      })
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}))
        setStep({ id: 'error', message: (data as { error?: string }).error ?? 'Request failed' }); return
      }
      const reader = res.body.getReader(); const decoder = new TextDecoder(); let buf = ''
      while (true) {
        const { done, value } = await reader.read()
        if (value) buf += decoder.decode(value, { stream: true })
        if (done) buf += decoder.decode(undefined, { stream: false })
        const lines = buf.split('\n'); buf = lines.pop() ?? ''
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue
          try {
            const data = JSON.parse(trimmed.slice(6)) as { step: string; message?: string; fileCount?: number; repoUrl?: string; current?: number; total?: number; filesCreated?: number; files?: string[]; path?: string; preview?: string }
            if (data.step === 'generating') { setStep({ id: 'generating' }); if (data.files) setFiles(data.files) }
            else if (data.step === 'generated') { setStep({ id: 'generated', fileCount: data.fileCount ?? 0 }); if (data.files) setFiles(data.files) }
            else if (data.step === 'repo_created') { latestRepoUrl = data.repoUrl ?? ''; setStep({ id: 'repo_created', repoUrl: latestRepoUrl }) }
            else if (data.step === 'pushing') { const url = data.repoUrl ?? latestRepoUrl; setStep({ id: 'pushing', current: data.current ?? 0, total: data.total ?? 0, repoUrl: url }); if (data.path) { setPushedFiles(prev => prev.includes(data.path!) ? prev : [...prev, data.path!]); if (data.preview !== undefined) setPreview({ path: data.path!, code: data.preview }) } }
            else if (data.step === 'done') { setStep({ id: 'done', repoUrl: data.repoUrl ?? latestRepoUrl, filesCreated: data.filesCreated ?? 0 }) }
            else if (data.step === 'error') { setStep({ id: 'error', message: data.message ?? 'Build failed' }) }
          } catch { /* chunk */ }
        }
        if (done) break
      }
    } catch (e) { setStep({ id: 'error', message: e instanceof Error ? e.message : 'Build failed' }) }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {blueprints.map(bp => {
        const isActive = activeId === bp.id
        const reuse = Math.round(Number(bp.reuse_percentage) || 0)
        const missingCount = bp.missing_files?.length ?? 0
        return (
          <div key={bp.id} className={cn('group relative overflow-hidden rounded-2xl border bg-white/[0.02] transition-all', isActive ? 'border-cyan-500/40 ring-1 ring-cyan-500/20 md:col-span-2' : 'border-white/5 hover:border-white/15')}>
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-white truncate">{bp.name}</h3>
                  {bp.app_type && <p className="text-[11px] font-mono uppercase tracking-wider text-cyan-400/70 mt-0.5">{bp.app_type}</p>}
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-2xl font-black text-cyan-300 leading-none">{reuse}%</p>
                  <p className="text-[10px] text-zinc-500 font-mono">reusable</p>
                </div>
              </div>
              {bp.description && !isActive && <p className="text-sm text-zinc-400 line-clamp-2">{bp.description}</p>}
              {!isActive && (
                <div className="flex items-center gap-4 text-[11px] text-zinc-500 font-mono">
                  <span className="flex items-center gap-1"><Layers className="h-3 w-3" /> {missingCount} files to build</span>
                  {bp.estimated_effort && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {bp.estimated_effort}</span>}
                </div>
              )}
              {!isActive && (
                <Button className="w-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-black font-bold" onClick={() => openBuild(bp)} disabled={isBuilding}>
                  <Rocket className="h-4 w-4 mr-2" />Click here and I&apos;ll build it
                </Button>
              )}
              {isActive && (
                <div className="space-y-3">
                  <div className="flex items-center gap-1 border-b border-white/10 pb-2">
                    <button onClick={() => setInnerTab('preview')} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all', innerTab === 'preview' ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30' : 'text-zinc-500 hover:text-zinc-300')}>
                      <Eye className="h-3 w-3" /> Mockup Preview
                    </button>
                    <button onClick={() => setInnerTab('build')} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all', innerTab === 'build' ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30' : 'text-zinc-500 hover:text-zinc-300')}>
                      <Rocket className="h-3 w-3" /> Build &amp; Launch
                    </button>
                    <Button variant="ghost" size="sm" className="ml-auto text-zinc-600 hover:text-zinc-400" onClick={() => { setActiveId(null); setStep({ id: 'idle' }) }}>✕</Button>
                  </div>
                  {innerTab === 'preview' && <MockupChatPanel bp={bp} onClose={() => setInnerTab('build')} />}
                  {innerTab === 'build' && (
                    <div className="space-y-3 pt-1">
                      {!canBuild ? (
                        <div className="rounded-lg border border-amber-500/30 bg-amber-950/30 p-3 text-center space-y-2">
                          <p className="text-sm text-amber-200 font-medium">Building is a Pro feature</p>
                          <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-400 text-black font-bold w-full"><a href="/pricing"><Lock className="h-3.5 w-3.5 mr-1.5" /> Upgrade to Pro</a></Button>
                        </div>
                      ) : step.id === 'idle' || step.id === 'error' ? (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            {(['github','gitlab'] as Platform[]).map(p => (
                              <button key={p} onClick={() => setPlatform(p)} className={cn('px-3 py-2 rounded-lg border text-xs font-medium transition-all', platform === p ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200' : 'border-white/10 text-zinc-400 hover:text-white')}>{p === 'github' ? 'GitHub' : 'GitLab'}</button>
                            ))}
                          </div>
                          <Input value={repoName} onChange={e => setRepoName(slugify(e.target.value))} placeholder="my-new-app" className="bg-black/40" />
                          {step.id === 'error' && <div className="flex items-start gap-2 rounded-lg bg-red-950/40 border border-red-500/30 p-2.5"><XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" /><p className="text-xs text-red-300">{step.message}</p></div>}
                          <Button className="w-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 text-black font-bold" onClick={() => startBuild(bp)} disabled={!repoName.trim()}>
                            <Rocket className="h-4 w-4 mr-2" /> Build &amp; push to {platform === 'github' ? 'GitHub' : 'GitLab'}
                          </Button>
                        </>
                      ) : step.id === 'done' ? (
                        <div className="space-y-3 text-center">
                          <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center"><CheckCircle2 className="h-6 w-6 text-emerald-400" /></div>
                          <p className="text-sm font-semibold text-white">Built! {step.filesCreated} files pushed.</p>
                          <Button asChild className="w-full max-w-xs"><a href={step.repoUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4 mr-2" /> Open repository</a></Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                            {PROGRESS_STEPS.map((s, idx) => {
                              const isDone = currentStepIdx > idx; const isActiveStep = currentStepIdx === idx; const Icon = s.icon
                              return (<div key={s.key} className="flex items-center gap-2"><div className={cn('h-6 w-6 rounded-full flex items-center justify-center shrink-0', isDone ? 'bg-emerald-500/10' : isActiveStep ? 'bg-cyan-500/10' : 'bg-white/5')}>{isDone ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : isActiveStep ? <Loader2 className="h-3.5 w-3.5 text-cyan-400 animate-spin" /> : <Icon className="h-3.5 w-3.5 text-zinc-600" />}</div><p className={cn('text-xs font-medium', isDone ? 'text-emerald-400' : isActiveStep ? 'text-white' : 'text-zinc-600')}>{s.label}</p></div>)
                            })}
                          </div>
                          <div className="grid gap-3 md:grid-cols-5 rounded-xl border border-white/10 bg-black/50 overflow-hidden">
                            <div className="md:col-span-2 border-b md:border-b-0 md:border-r border-white/10 max-h-72 overflow-y-auto">
                              <div className="sticky top-0 bg-black/80 backdrop-blur px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-1.5"><FolderGit2 className="h-3 w-3" /> {repoName || 'project'}</div>
                              {files.length === 0 && <div className="px-3 py-4 text-xs text-zinc-600 flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Generating files…</div>}
                              <ul className="py-1">{files.map(f => { const pushed = pushedFiles.includes(f); const active = preview?.path === f; return (<li key={f} className={cn('flex items-center gap-2 px-3 py-1 text-xs font-mono', active ? 'bg-cyan-500/10 text-cyan-200' : 'text-zinc-400')}>{pushed ? <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" /> : <FileCode2 className="h-3 w-3 text-zinc-600 shrink-0" />}<span className="truncate">{f}</span></li>) })}</ul>
                            </div>
                            <div className="md:col-span-3 max-h-72 overflow-hidden flex flex-col">
                              <div className="bg-black/80 px-3 py-2 text-[10px] font-mono text-zinc-500 truncate border-b border-white/5">{preview?.path ?? 'Waiting for first file…'}</div>
                              <pre className="flex-1 overflow-auto px-3 py-2 text-[11px] leading-relaxed text-zinc-300 font-mono whitespace-pre-wrap">{preview?.code ?? ''}</pre>
                            </div>
                          </div>
                          {step.id === 'pushing' && <div className="h-1 rounded-full bg-white/5 overflow-hidden"><div className="h-full bg-gradient-to-r from-cyan-400 to-violet-400 transition-all" style={{ width: `${step.total ? Math.round((step.current / step.total) * 100) : 0}%` }} /></div>}
                          <p className="text-[11px] text-center text-zinc-600">Building your app — keep this page open.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
