'use client'

import { useState } from 'react'
import Link from 'next/link'
import { X, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function FeatureEducationBanner() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="relative overflow-hidden rounded-lg border border-chart-3/30 bg-gradient-to-r from-chart-3/5 to-chart-1/5 p-4 mb-6">
      <div className="flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-chart-3 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1">New: Templates & Gap Tracking</h3>
          <p className="text-xs text-foreground/70 mb-2">
            Stop asking "what's missing?" — start asking "what can I build today?" 
            Discover template combinations from your code, prioritize high-impact gaps, and track progress.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="ghost" asChild className="h-7">
              <Link href="/dashboard/templates">
                Explore Templates
              </Link>
            </Button>
            <Button size="sm" variant="ghost" asChild className="h-7">
              <Link href="/dashboard/gaps">
                View Gaps
              </Link>
            </Button>
            <Button size="sm" variant="ghost" asChild className="h-7">
              <Link href="/legal/documentation">Learn More</Link>
            </Button>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
