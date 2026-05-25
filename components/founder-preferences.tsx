'use client'

import { useState, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserCog, X, Check, Sparkles } from 'lucide-react'

export interface FounderPrefs {
  architecture: 'serverless' | 'monolith' | 'microservices' | null
  priority: 'speed' | 'scalability' | 'cost' | null
  stack: string[]
}

const STORAGE_KEY = 'repofuse_founder_prefs'

const defaultPrefs: FounderPrefs = {
  architecture: null,
  priority: null,
  stack: [],
}

export function useFounderPreferences() {
  const [prefs, setPrefs] = useState<FounderPrefs>(() => {
    if (typeof window === 'undefined') return defaultPrefs
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : defaultPrefs
    } catch {
      return defaultPrefs
    }
  })

  const save = useCallback((next: FounderPrefs) => {
    setPrefs(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [])

  return { prefs, save }
}

export function getFounderInsights(prefs: FounderPrefs, blueprint: {
  technologies: string[]
  complexity: string
  missing_files: { name: string; purpose: string }[]
}): string[] {
  const insights: string[] = []

  if (prefs.architecture === 'serverless') {
    const hasServerless = blueprint.technologies.some(t =>
      /vercel|lambda|edge|serverless|neon/i.test(t)
    )
    if (hasServerless) {
      insights.push('Aligns with your serverless preference — recommending edge-first deployment')
    } else {
      insights.push('Consider adapting to serverless architecture to match your preferences')
    }
  } else if (prefs.architecture === 'microservices') {
    insights.push('Can be structured as independent microservices for your architecture style')
  }

  if (prefs.priority === 'speed') {
    if (blueprint.complexity === 'simple') {
      insights.push('Quick win — prioritizing speed-to-ship as you prefer')
    } else {
      insights.push('Skipping optional refactors to match your speed priority')
    }
  } else if (prefs.priority === 'scalability') {
    insights.push('Including scalability considerations in the build plan')
  } else if (prefs.priority === 'cost') {
    insights.push('Optimized for cost efficiency with maximum code reuse')
  }

  if (prefs.stack.length > 0) {
    const matching = blueprint.technologies.filter(t =>
      prefs.stack.some(s => t.toLowerCase().includes(s.toLowerCase()))
    )
    if (matching.length > 0) {
      insights.push(`Uses ${matching.join(', ')} from your preferred stack`)
    }
  }

  return insights
}

interface FounderPreferencesEditorProps {
  onClose?: () => void
}

const archOptions = [
  { value: 'serverless' as const, label: 'Serverless', desc: 'Vercel, Lambda, Edge' },
  { value: 'monolith' as const, label: 'Monolith', desc: 'Single deployable unit' },
  { value: 'microservices' as const, label: 'Microservices', desc: 'Distributed services' },
]

const priorityOptions = [
  { value: 'speed' as const, label: 'Speed', desc: 'Ship fast, iterate later' },
  { value: 'scalability' as const, label: 'Scalability', desc: 'Built to grow' },
  { value: 'cost' as const, label: 'Cost', desc: 'Minimize spend' },
]

const stackOptions = ['React', 'Next.js', 'Node.js', 'Python', 'TypeScript', 'Tailwind', 'PostgreSQL', 'Redis', 'Docker', 'Vercel']

export function FounderPreferencesEditor({ onClose }: FounderPreferencesEditorProps) {
  const { prefs, save } = useFounderPreferences()
  const [local, setLocal] = useState(prefs)

  const toggleStack = (tech: string) => {
    setLocal(prev => ({
      ...prev,
      stack: prev.stack.includes(tech)
        ? prev.stack.filter(t => t !== tech)
        : [...prev.stack, tech],
    }))
  }

  const handleSave = () => {
    save(local)
    onClose?.()
  }

  return (
    <Card className="border-cyan-500/20 bg-card/80 backdrop-blur">
      <div className="p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCog className="h-5 w-5 text-cyan-400" />
            <h3 className="font-semibold text-foreground">Your Preferences</h3>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          The AI tailors recommendations based on how you build. This is your moat.
        </p>

        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">Architecture style</label>
          <div className="grid grid-cols-3 gap-2">
            {archOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setLocal(p => ({ ...p, architecture: p.architecture === opt.value ? null : opt.value }))}
                className={`
                  p-2.5 rounded-lg border text-left text-sm transition-all
                  ${local.architecture === opt.value
                    ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
                    : 'border-border hover:border-border/80 text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                <div className="font-medium">{opt.label}</div>
                <div className="text-[10px] mt-0.5 opacity-70">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">Top priority</label>
          <div className="grid grid-cols-3 gap-2">
            {priorityOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setLocal(p => ({ ...p, priority: p.priority === opt.value ? null : opt.value }))}
                className={`
                  p-2.5 rounded-lg border text-left text-sm transition-all
                  ${local.priority === opt.value
                    ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
                    : 'border-border hover:border-border/80 text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                <div className="font-medium">{opt.label}</div>
                <div className="text-[10px] mt-0.5 opacity-70">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">Preferred stack</label>
          <div className="flex flex-wrap gap-1.5">
            {stackOptions.map(tech => (
              <Badge
                key={tech}
                variant={local.stack.includes(tech) ? 'default' : 'outline'}
                className={`cursor-pointer transition-all ${
                  local.stack.includes(tech)
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/30'
                    : 'hover:border-border/80'
                }`}
                onClick={() => toggleStack(tech)}
              >
                {tech}
              </Badge>
            ))}
          </div>
        </div>

        <Button onClick={handleSave} className="w-full" size="sm">
          <Check className="h-4 w-4 mr-2" />
          Save Preferences
        </Button>
      </div>
    </Card>
  )
}

export function FounderReasoningBadges({ insights }: { insights: string[] }) {
  if (insights.length === 0) return null

  return (
    <div className="space-y-1.5 mt-3 pt-3 border-t border-cyan-500/10">
      <div className="flex items-center gap-1.5">
        <Sparkles className="h-3 w-3 text-cyan-400" />
        <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400/70">
          Founder-aligned reasoning
        </span>
      </div>
      {insights.map((insight, i) => (
        <p key={i} className="text-xs text-cyan-300/60 pl-4">
          {insight}
        </p>
      ))}
    </div>
  )
}
