'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Copy,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { MissingFileGap } from '@/lib/queries'
import { gapCategories, calculateImpactScore, calculateEffortScore, getPriority } from '@/lib/gap-priorities'

interface MissingFileCardProps {
  gap: MissingFileGap
  allGaps: MissingFileGap[]
  onMarkComplete?: (gapId: string) => void
  isCompleted?: boolean
}

const complexityColors = {
  low: 'bg-green-100 text-green-800 border-green-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  high: 'bg-red-100 text-red-800 border-red-300',
}

const priorityColors = {
  critical: 'bg-red-50 border-red-200 hover:border-red-300',
  high: 'bg-orange-50 border-orange-200 hover:border-orange-300',
  medium: 'bg-blue-50 border-blue-200 hover:border-blue-300',
  low: 'bg-gray-50 border-gray-200 hover:border-gray-300',
}

const priorityBadges = {
  critical: 'bg-red-500 hover:bg-red-600',
  high: 'bg-orange-500 hover:bg-orange-600',
  medium: 'bg-blue-500 hover:bg-blue-600',
  low: 'bg-gray-500 hover:bg-gray-600',
}

export function MissingFileCard({
  gap,
  allGaps,
  onMarkComplete,
  isCompleted = false,
}: MissingFileCardProps) {
  const [copied, setCopied] = useState(false)
  const [marking, setMarking] = useState(false)

  const impact = calculateImpactScore(gap, allGaps)
  const effort = calculateEffortScore(gap)
  const priority = getPriority(impact, effort)
  const category = gapCategories[gap.category] || gapCategories.other
  const projectName = gap.blueprint_name || gap.analysis_name

  const blockedByCount = gap.dependencies.length
  const blockers = gap.dependencies
    .map(name => allGaps.find(g => g.file_name === name))
    .filter(Boolean)

  const dependentGaps = allGaps.filter(g =>
    g.dependencies.includes(gap.file_name)
  ).length

  const handleCopyStub = async () => {
    if (gap.suggested_stub) {
      await navigator.clipboard.writeText(gap.suggested_stub)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleMarkComplete = async () => {
    if (!onMarkComplete) return
    setMarking(true)
    try {
      await onMarkComplete(gap.id)
    } finally {
      setMarking(false)
    }
  }

  return (
    <Card
      className={`transition-all border-2 ${priorityColors[priority]} ${
        isCompleted ? 'opacity-60' : ''
      }`}
    >
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {projectName && (
              <div className="mb-1.5">
                <span
                  className="inline-flex items-center gap-1 rounded-md bg-violet-500/15 text-violet-700 border border-violet-300 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide truncate max-w-full"
                  title={`Project: ${projectName}`}
                >
                  {projectName}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{category.icon}</span>
              <h3 className="font-semibold text-sm truncate">{gap.file_name}</h3>
              {isCompleted && <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground font-mono truncate">{gap.file_path}</p>
          </div>
          <Badge className={priorityBadges[priority]} variant="default">
            {priority}
          </Badge>
        </div>

        {/* Description */}
        <p className="text-sm text-foreground/80 line-clamp-2">{gap.purpose}</p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>Effort</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={complexityColors[gap.complexity]}>
                {gap.complexity}
              </Badge>
              <span className="text-xs font-semibold">{gap.estimated_hours}h</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Zap className="w-3 h-3" />
              <span>Impact</span>
            </div>
            <div className="w-full bg-secondary rounded h-6 relative overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-chart-1 to-chart-2 transition-all"
                style={{ width: `${impact}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-foreground/70">
                {Math.round(impact)}
              </span>
            </div>
          </div>
        </div>

        {/* Dependencies Info */}
        {(blockedByCount > 0 || dependentGaps > 0) && (
          <div className="space-y-2 pt-2 border-t border-border/50">
            {blockedByCount > 0 && (
              <div className="flex items-start gap-2 text-xs">
                <AlertCircle className="w-3 h-3 text-amber-600 mt-0.5 flex-shrink-0" />
                <span className="text-foreground/70">
                  Depends on {blockedByCount} file{blockedByCount !== 1 ? 's' : ''}:
                  {blockers.slice(0, 2).map(b => (
                    <div key={b?.id} className="ml-2 text-muted-foreground font-mono text-xs">
                      • {b?.file_name}
                    </div>
                  ))}
                  {blockers.length > 2 && (
                    <div className="ml-2 text-muted-foreground text-xs">
                      +{blockers.length - 2} more
                    </div>
                  )}
                </span>
              </div>
            )}

            {dependentGaps > 0 && !blockedByCount && (
              <div className="flex items-center gap-2 text-xs bg-green-50 border border-green-200 rounded px-2 py-1">
                <CheckCircle2 className="w-3 h-3 text-green-600" />
                <span className="text-green-700">
                  Enables {dependentGaps} file{dependentGaps !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Suggested Stub Preview */}
        {gap.suggested_stub && (
          <div className="space-y-1 pt-2 border-t border-border/50">
            <p className="text-xs font-semibold text-muted-foreground">Stub Available</p>
            <div className="bg-secondary rounded px-2 py-1.5 font-mono text-xs line-clamp-2 text-foreground/70 border border-border/50">
              {gap.suggested_stub.split('\n').slice(0, 2).join('\n')}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-border/50">
          {gap.suggested_stub && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={handleCopyStub}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 mr-1" />
                  Copy Stub
                </>
              )}
            </Button>
          )}

          {onMarkComplete && (
            <Button
              size="sm"
              variant={isCompleted ? 'secondary' : 'default'}
              className="flex-1"
              onClick={handleMarkComplete}
              disabled={marking}
            >
              {isCompleted ? (
                <>
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Done
                </>
              ) : (
                <>
                  <Zap className="w-3 h-3 mr-1" />
                  Mark Done
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
