'use client'

import { useEffect, useRef } from 'react'
import { Brain } from 'lucide-react'

interface ThoughtStreamProps {
  thoughts: string[]
  isActive: boolean
}

export function ThoughtStream({ thoughts, isActive }: ThoughtStreamProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [thoughts])

  if (thoughts.length === 0 && !isActive) return null

  return (
    <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/10 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-cyan-500/10 bg-cyan-950/20">
        <Brain className={`h-4 w-4 text-cyan-400 ${isActive ? 'animate-pulse' : ''}`} />
        <span className="text-xs font-mono font-semibold text-cyan-400 uppercase tracking-wider">
          AI Thought Stream
        </span>
        {isActive && (
          <span className="ml-auto flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] text-cyan-400/70 font-mono">LIVE</span>
          </span>
        )}
      </div>
      <div ref={scrollRef} className="max-h-40 overflow-y-auto px-4 py-3 space-y-1.5">
        {thoughts.map((thought, i) => {
          const isLatest = i === thoughts.length - 1
          return (
            <div
              key={i}
              className={`flex items-start gap-2 text-sm font-mono transition-opacity duration-500 ${
                isLatest && isActive
                  ? 'text-cyan-300'
                  : 'text-muted-foreground/60'
              }`}
            >
              <span className="text-cyan-500/40 select-none shrink-0">&gt;</span>
              <span className={isLatest && isActive ? 'animate-pulse' : ''}>
                {thought}
              </span>
            </div>
          )
        })}
        {isActive && (
          <div className="flex items-center gap-2 text-sm font-mono text-cyan-400/40">
            <span className="select-none">&gt;</span>
            <span className="flex gap-0.5">
              <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
