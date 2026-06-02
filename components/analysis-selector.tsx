'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, ArrowRight, Calendar } from 'lucide-react'
import { type Analysis } from '@/lib/queries'

interface AnalysisSelectorProps {
  analyses: Analysis[]
  templateCounts?: Record<string, number>
}

export function AnalysisSelector({ analyses, templateCounts = {} }: AnalysisSelectorProps) {
  const completedAnalyses = analyses.filter(a => a.status === 'complete')

  if (completedAnalyses.length === 0) {
    return (
      <Card className="p-12 text-center border-2 border-dashed">
        <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">No analyses yet</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Run an analysis on your repositories to discover templates and see what you can build.
        </p>
        <Button asChild>
          <Link href="/dashboard/analyses">
            Run Your First Analysis
          </Link>
        </Button>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {completedAnalyses.map(analysis => {
        const templateCount = templateCounts[analysis.id] || 0
        const completedAt = analysis.completed_at ? new Date(analysis.completed_at) : null

        return (
          <Link key={analysis.id} href={`/dashboard/templates/${analysis.id}`}>
            <Card className="group p-6 hover:shadow-lg hover:shadow-black/5 transition-all duration-300 hover:border-primary cursor-pointer h-full flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <Badge variant="secondary" className="text-xs">
                  {templateCount} template{templateCount !== 1 ? 's' : ''}
                </Badge>
              </div>

              <h3 className="font-semibold text-lg text-foreground mb-1 line-clamp-2">{analysis.name}</h3>
              
              <div className="text-sm text-muted-foreground mb-4 flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>{analysis.analyzed_files} files analyzed</span>
                </div>
              </div>

              {completedAt && (
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  {completedAt.toLocaleDateString()}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2 text-sm text-primary font-medium">
                  View Templates
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
