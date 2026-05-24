'use client'

import { useState, useEffect } from 'react'
import { Lightbulb, ListTodo, Activity } from 'lucide-react'

export type CTOMode = 'strategic' | 'tactical' | 'operational'

interface CTOModeSwitchProps {
  onChange?: (mode: CTOMode) => void
  defaultMode?: CTOMode
}

const modes: {
  id: CTOMode
  label: string
  description: string
  icon: typeof Lightbulb
}[] = [
  {
    id: 'strategic',
    label: 'Strategic',
    description: 'Ideas, opportunities, architecture',
    icon: Lightbulb,
  },
  {
    id: 'tactical',
    label: 'Tactical',
    description: 'Tasks, roadmaps, PRs',
    icon: ListTodo,
  },
  {
    id: 'operational',
    label: 'Operational',
    description: 'Deployments, logs, monitoring',
    icon: Activity,
  },
]

export function CTOModeSwitch({ onChange, defaultMode }: CTOModeSwitchProps) {
  const [active, setActive] = useState<CTOMode>(() => {
    if (defaultMode) return defaultMode
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('repofuse_cto_mode') as CTOMode) || 'strategic'
    }
    return 'strategic'
  })

  useEffect(() => {
    localStorage.setItem('repofuse_cto_mode', active)
    onChange?.(active)
  }, [active, onChange])

  return (
    <div className="inline-flex items-center rounded-xl border border-border bg-muted/30 p-1 gap-0.5">
      {modes.map((mode) => {
        const Icon = mode.icon
        const isActive = active === mode.id
        return (
          <button
            key={mode.id}
            onClick={() => setActive(mode.id)}
            className={`
              group relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
              transition-all duration-200
              ${isActive
                ? 'bg-cyan-500/15 text-cyan-300 shadow-sm shadow-cyan-500/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }
            `}
          >
            <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : ''}`} />
            <span className="hidden sm:inline">{mode.label}</span>
            {isActive && (
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="text-[10px] text-cyan-400/60 font-mono">{mode.description}</span>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
