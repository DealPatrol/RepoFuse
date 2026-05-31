'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, Heart, LayoutGrid, MessageSquare, Star } from 'lucide-react'
import { getLikedApps, subscribeToLikedApps, type LikedApp } from '@/lib/liked-apps'

const priorityFromDifficulty = (difficulty: LikedApp['difficulty']) => {
  if (difficulty === 'hard') return 'high' as const
  if (difficulty === 'medium') return 'medium' as const
  return 'low' as const
}

const priorityColors = {
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-green-500/20 text-green-400 border-green-500/30',
}

function formatSavedAt(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Recently'
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return date.toLocaleDateString()
}

export function MostDesiredPro() {
  const [apps, setApps] = useState<LikedApp[]>([])

  useEffect(() => {
    setApps(getLikedApps())
    return subscribeToLikedApps(() => setApps(getLikedApps()))
  }, [])

  if (apps.length === 0) {
    return (
      <Card className="border-dashed border-yellow-500/30 bg-card/50">
        <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="rounded-full bg-yellow-500/10 p-4">
            <Heart className="h-10 w-10 text-yellow-400" />
          </div>
          <h2 className="text-xl font-semibold">No saved ideas yet</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Like app ideas from your analyses or App Idea Chat — they appear here and on your Idea Board.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild variant="default">
              <Link href="/dashboard/idea-board">
                <LayoutGrid className="mr-2 h-4 w-4" />
                Open Idea Board
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/pattern-analyzer">
                <MessageSquare className="mr-2 h-4 w-4" />
                App Idea Chat
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {apps.map((app) => {
        const priority = priorityFromDifficulty(app.difficulty)
        return (
          <Card
            key={app.id}
            className="border-border/50 bg-card/50 transition-colors hover:border-yellow-500/30"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg leading-tight">{app.name}</CardTitle>
                <Badge variant="outline" className={priorityColors[priority]}>
                  {priority}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{app.tagline}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="line-clamp-3 text-sm text-muted-foreground">{app.description}</p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Effort</span>
                <span className="font-medium">{app.estimatedEffort}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Saved</span>
                <span className="font-medium">{formatSavedAt(app.selectedAt)}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <Badge variant="outline" className="text-xs">
                  {app.type}
                </Badge>
                {app.suggestedStack.slice(0, 3).map((tech) => (
                  <Badge key={tech} variant="secondary" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>
              <Button asChild size="sm" className="mt-2 w-full">
                <Link href={`/dashboard/pattern-analyzer?idea=${encodeURIComponent(app.name)}`}>
                  Refine in chat
                  <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export function MostDesiredProHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
          <Star className="h-6 w-6 text-yellow-400" />
          My Most Desired
        </h1>
        <p className="mt-1 text-muted-foreground">
          Ideas you liked — synced from Idea Board and analysis results
        </p>
      </div>
      <Button asChild variant="outline" size="sm">
        <Link href="/dashboard/idea-board">
          <LayoutGrid className="mr-2 h-4 w-4" />
          Idea Board
        </Link>
      </Button>
    </div>
  )
}
