'use client'

import { useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { MessageSquareQuote, TrendingUp, AlertTriangle, Repeat2 } from 'lucide-react'
import type { AppBlueprint } from '@/lib/queries'

interface InsightRailProps {
  blueprints: AppBlueprint[]
  isAnalyzing?: boolean
}

interface Insight {
  icon: typeof TrendingUp
  text: string
  type: 'opportunity' | 'warning' | 'info'
}

function generateInsights(blueprints: AppBlueprint[]): Insight[] {
  if (blueprints.length === 0) return []

  const insights: Insight[] = []

  const avgReuse = Math.round(
    blueprints.reduce((sum, bp) => sum + bp.reuse_percentage, 0) / blueprints.length
  )
  insights.push({
    icon: Repeat2,
    text: `Average ${avgReuse}% code reuse across ${blueprints.length} blueprints`,
    type: 'info',
  })

  const shipReady = blueprints.filter(bp => bp.missing_files.length === 0)
  if (shipReady.length > 0) {
    insights.push({
      icon: TrendingUp,
      text: `${shipReady.length} blueprint${shipReady.length > 1 ? 's' : ''} can ship with zero new files`,
      type: 'opportunity',
    })
  }

  const highReuse = blueprints.filter(bp => bp.reuse_percentage >= 75)
  if (highReuse.length > 0) {
    insights.push({
      icon: TrendingUp,
      text: `You can build a ${highReuse[0].app_type || 'app'} using ${highReuse[0].reuse_percentage}% existing components`,
      type: 'opportunity',
    })
  }

  const allTechs = blueprints.flatMap(bp => bp.technologies)
  const techCounts = allTechs.reduce<Record<string, number>>((acc, t) => {
    acc[t] = (acc[t] || 0) + 1
    return acc
  }, {})
  const topTech = Object.entries(techCounts).sort((a, b) => b[1] - a[1])[0]
  if (topTech && topTech[1] > 1) {
    insights.push({
      icon: Repeat2,
      text: `${topTech[0]} appears in ${topTech[1]} blueprints — strong foundation`,
      type: 'info',
    })
  }

  const complex = blueprints.filter(bp => bp.complexity === 'complex')
  if (complex.length > 0) {
    insights.push({
      icon: AlertTriangle,
      text: `${complex.length} complex build${complex.length > 1 ? 's' : ''} detected — consider starting with simpler wins first`,
      type: 'warning',
    })
  }

  const duplicated = new Map<string, number>()
  blueprints.forEach(bp => {
    bp.existing_files.forEach(f => {
      duplicated.set(f.path, (duplicated.get(f.path) || 0) + 1)
    })
  })
  const sharedFiles = [...duplicated.entries()].filter(([, count]) => count > 2)
  if (sharedFiles.length > 0) {
    insights.push({
      icon: Repeat2,
      text: `${sharedFiles.length} module${sharedFiles.length > 1 ? 's are' : ' is'} duplicated across ${sharedFiles[0][1]}+ blueprints`,
      type: 'info',
    })
  }

  const totalMissing = blueprints.reduce((s, bp) => s + bp.missing_files.length, 0)
  const totalExisting = blueprints.reduce((s, bp) => s + bp.existing_files.length, 0)
  if (totalExisting > 0) {
    insights.push({
      icon: TrendingUp,
      text: `${totalExisting} existing files power all blueprints, only ${totalMissing} new files needed`,
      type: 'opportunity',
    })
  }

  const simpleBlueprints = blueprints.filter(bp => bp.complexity === 'simple' && bp.reuse_percentage >= 70)
  if (simpleBlueprints.length > 0) {
    insights.push({
      icon: TrendingUp,
      text: 'Refactor recommended before scaling — consolidate shared utilities first',
      type: 'warning',
    })
  }

  return insights
}

const typeStyles = {
  opportunity: 'border-l-emerald-400/50 text-emerald-300/80',
  warning: 'border-l-amber-400/50 text-amber-300/80',
  info: 'border-l-cyan-400/50 text-cyan-300/80',
}

export function InsightRail({ blueprints, isAnalyzing }: InsightRailProps) {
  const insights = useMemo(() => generateInsights(blueprints), [blueprints])

  if (insights.length === 0 && !isAnalyzing) return null

  return (
    <Card className="border-border/50 bg-card/40 backdrop-blur overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 bg-muted/20">
        <MessageSquareQuote className="h-4 w-4 text-cyan-400" />
        <span className="text-xs font-mono font-semibold text-cyan-400 uppercase tracking-wider">
          CTO Whisper
        </span>
        {isAnalyzing && (
          <span className="ml-auto flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] text-cyan-400/70 font-mono">ANALYZING</span>
          </span>
        )}
      </div>
      <div className="p-3 space-y-2">
        {isAnalyzing && insights.length === 0 && (
          <p className="text-xs text-muted-foreground/60 font-mono px-2 py-3 text-center italic">
            Gathering intelligence...
          </p>
        )}
        {insights.map((insight, i) => {
          const Icon = insight.icon
          return (
            <div
              key={i}
              className={`
                flex items-start gap-2.5 px-3 py-2.5 rounded-lg border-l-2 bg-muted/20
                text-sm ${typeStyles[insight.type]}
              `}
            >
              <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0 opacity-70" />
              <span className="text-xs leading-relaxed">{insight.text}</span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
