import { getCurrentUser } from '@/lib/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star, Lock, Crown, ArrowRight, TrendingUp, Zap, Target } from 'lucide-react'
import Link from 'next/link'
import { resolveProAccess } from '@/lib/pro-access'
import { MostDesiredPro, MostDesiredProHeader } from '@/components/most-desired-pro'

export const dynamic = 'force-dynamic'

const MOCK_PREVIEW = [
  { id: '1', name: 'AI Code Review SaaS', priority: 'high' as const, marketDemand: 92, estimatedRevenue: '$5k-15k MRR' },
  { id: '2', name: 'Repo Health Dashboard', priority: 'high' as const, marketDemand: 85, estimatedRevenue: '$2k-8k MRR' },
  { id: '3', name: 'Webhook Automation Kit', priority: 'medium' as const, marketDemand: 78, estimatedRevenue: '$1k-5k MRR' },
]

const priorityColors = {
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-green-500/20 text-green-400 border-green-500/30',
}

export default async function MostDesiredPage() {
  const user = await getCurrentUser()
  const { canAccessPro: isPro } = user ? await resolveProAccess(user) : { canAccessPro: false }

  if (!isPro) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <Star className="h-6 w-6 text-yellow-400" />
            My Most Desired
            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
              <Lock className="h-3 w-3 mr-1" />
              Pro
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-1">
            Save and prioritize your favorite project ideas
          </p>
        </div>

        <Card className="bg-gradient-to-br from-orange-950/40 via-card to-yellow-950/20 border-orange-500/30">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-orange-500/20 mb-6">
              <Crown className="h-12 w-12 text-orange-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Unlock Your Most Desired Projects</h2>
            <p className="text-muted-foreground text-center max-w-lg mb-8">
              Pro users can save unlimited project ideas, prioritize them by market demand,
              and get AI-powered insights on which to build first for maximum revenue potential.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 w-full max-w-2xl">
              <div className="text-center p-4 rounded-lg bg-card/50 border border-border/50">
                <Target className="h-6 w-6 text-orange-400 mx-auto mb-2" />
                <div className="font-semibold">Priority Scoring</div>
                <div className="text-sm text-muted-foreground">AI ranks by potential</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-card/50 border border-border/50">
                <TrendingUp className="h-6 w-6 text-orange-400 mx-auto mb-2" />
                <div className="font-semibold">Market Demand</div>
                <div className="text-sm text-muted-foreground">Real-time insights</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-card/50 border border-border/50">
                <Zap className="h-6 w-6 text-orange-400 mx-auto mb-2" />
                <div className="font-semibold">Quick Actions</div>
                <div className="text-sm text-muted-foreground">Start building fast</div>
              </div>
            </div>

            <Button asChild size="lg" className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-400 hover:to-yellow-400 text-black font-bold">
              <Link href="/pricing">
                Upgrade to Pro
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="relative">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 flex items-center justify-center">
            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-lg px-4 py-2">
              <Lock className="h-4 w-4 mr-2" />
              Pro Feature Preview
            </Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 opacity-50">
            {MOCK_PREVIEW.map((project) => (
              <Card key={project.id} className="bg-card/50 border-border/50">
                <CardContent className="pt-6 space-y-3">
                  <div className="font-semibold">{project.name}</div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Market Demand</span>
                    <span>{project.marketDemand}%</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <MostDesiredProHeader />
      <MostDesiredPro />
    </div>
  )
}
