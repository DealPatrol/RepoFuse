'use client'

import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { MissingFileCard } from '@/components/missing-file-card'
import type { MissingFileGap } from '@/lib/queries'
import { groupGapsByPriority, calculateTotalEffort } from '@/lib/gap-priorities'

interface GapsPriorityGroupsProps {
  gaps: MissingFileGap[]
  completedGapIds: string[]
}

export function GapsPriorityGroups({ gaps, completedGapIds }: GapsPriorityGroupsProps) {
  const router = useRouter()
  const gapsByPriority = groupGapsByPriority(gaps)
  const priorityCounts = {
    critical: gapsByPriority.critical.length,
    high: gapsByPriority.high.length,
    medium: gapsByPriority.medium.length,
    low: gapsByPriority.low.length,
  }

  const handleMarkComplete = async (gapId: string) => {
    const gap = gaps.find((g) => g.id === gapId)
    if (!gap) return

    const res = await fetch('/api/gaps/mark-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gapId, blueprintId: gap.blueprint_id }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'Failed to mark gap complete')
    }

    router.refresh()
  }

  return (
    <div className="space-y-6">
      {Object.entries(priorityCounts)
        .filter((entry) => entry[1] > 0)
        .map(([priority, count]) => (
          <div key={priority} className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {priority} Priority
              </Badge>
              <span className="text-sm text-muted-foreground">
                {count} gap{count !== 1 ? 's' : ''} •{' '}
                {Math.round(
                  calculateTotalEffort(
                    gapsByPriority[priority as keyof typeof gapsByPriority],
                  ),
                )}
                h effort
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {gapsByPriority[priority as keyof typeof gapsByPriority].map((gap) => (
                <MissingFileCard
                  key={gap.id}
                  gap={gap}
                  allGaps={gaps}
                  onMarkComplete={handleMarkComplete}
                  isCompleted={completedGapIds.includes(gap.id)}
                />
              ))}
            </div>
          </div>
        ))}
    </div>
  )
}
