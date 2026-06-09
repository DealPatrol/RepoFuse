'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Zap, TrendingDown, Loader2, AlertCircle } from 'lucide-react'
import type { UserCredit } from '@/lib/credits'
import { CREDITS } from '@/lib/credits'

interface CreditsDisplayProps {
  userId: string
  plan?: 'free' | 'pro' | 'scale' | 'byok'
  monthlyCredits?: number
  isTrialing?: boolean
}

interface CreditSummary {
  analyses_used: number
  scaffolds_used: number
}

export function CreditsDisplay({ userId, plan = 'free', monthlyCredits = 0, isTrialing = false }: CreditsDisplayProps) {
  const [credits, setCredits] = useState<UserCredit | null>(null)
  const [summary, setSummary] = useState<CreditSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/credits/summary?userId=${userId}`)
        if (!response.ok) throw new Error('Failed to fetch credits')
        const data = await response.json()
        setCredits(data.credits)
        setSummary(data.summary)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load credits')
      } finally {
        setLoading(false)
      }
    }

    fetchCredits()
  }, [userId])

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-muted-foreground">Loading credits...</span>
        </div>
      </Card>
    )
  }

  if (error || !credits) {
    return (
      <Card className="p-6 border-destructive/30 bg-destructive/5">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div>
            <h3 className="font-semibold text-destructive">Unable to Load Credits</h3>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        </div>
      </Card>
    )
  }

  const usagePercent = credits.total_granted > 0 
    ? Math.round((credits.total_used / credits.total_granted) * 100)
    : 0
  const renewalMessage =
    plan === 'byok'
      ? 'BYOK uses your own provider key, so RepoFuse does not add built-in credits.'
      : monthlyCredits > 0
        ? isTrialing
          ? `${monthlyCredits.toLocaleString()} credits/month begin on paid subscription renewal.`
          : `You receive ${monthlyCredits.toLocaleString()} credits on each paid subscription renewal.`
        : 'Credits are limited to the balance shown above.'

  return (
    <div className="space-y-6">
      {/* Main Balance Card */}
      <Card className="p-6 bg-gradient-to-br from-chart-1/5 to-transparent border-chart-1/20">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Available Credits</h3>
            <div className="flex items-baseline gap-2">
              <div className="text-4xl font-bold text-foreground">{credits.current_balance.toLocaleString()}</div>
              <Zap className="h-6 w-6 text-chart-1" />
            </div>
          </div>
          {credits.current_balance < CREDITS.ANALYSIS_COST && (
            <Badge variant="destructive" className="text-xs">
              Low Balance
            </Badge>
          )}
        </div>

        {/* Usage Breakdown */}
        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Analyses</p>
            <p className="text-lg font-semibold">{summary?.analyses_used || 0}</p>
            <p className="text-xs text-muted-foreground">
              {(summary?.analyses_used || 0) * CREDITS.ANALYSIS_COST} credits used
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Scaffolds</p>
            <p className="text-lg font-semibold">{summary?.scaffolds_used || 0}</p>
            <p className="text-xs text-muted-foreground">
              {(summary?.scaffolds_used || 0) * CREDITS.SCAFFOLD_COST} credits used
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Usage</p>
            <p className="text-lg font-semibold">{usagePercent}%</p>
            <p className="text-xs text-muted-foreground">
              {credits.total_used} / {credits.total_granted}
            </p>
          </div>
        </div>
      </Card>

      {/* Credit Info Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">Total Granted</h4>
          <p className="text-2xl font-bold">{credits.total_granted.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">Total Used</h4>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold">{credits.total_used.toLocaleString()}</p>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </div>
        </Card>
      </div>

      {/* Renewal Info */}
      {credits.last_renewal_date && (
        <Card className="p-4 bg-muted/50">
          <p className="text-xs text-muted-foreground">
            Last renewal: {new Date(credits.last_renewal_date).toLocaleDateString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {renewalMessage}
          </p>
        </Card>
      )}

      {/* Credit Costs */}
      <Card className="p-4 border-dashed">
        <h4 className="text-sm font-semibold mb-3">Credit Costs</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Per Analysis</span>
            <Badge variant="outline">{CREDITS.ANALYSIS_COST} credits</Badge>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Per Scaffold Generation</span>
            <Badge variant="outline">{CREDITS.SCAFFOLD_COST} credits</Badge>
          </div>
        </div>
      </Card>
    </div>
  )
}
