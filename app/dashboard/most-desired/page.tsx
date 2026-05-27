import { getCurrentUser } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star, Lock, Crown, ArrowRight, TrendingUp, Zap, Target } from 'lucide-react'
import Link from 'next/link'
import { getSubscriptionByGithubId } from '@/lib/queries'
import { isPaidPlan } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

// This is a PRO feature - shows saved and prioritized project ideas
interface DesiredProject {
  id: string
  name: string
  priority: 'high' | 'medium' | 'low'
  marketDemand: number
  estimatedRevenue: string
  buildTime: string
  savedAt: string
  tags: string[]
}

// Mock data - would come from user's saved preferences
const MOCK_DESIRED_PROJECTS: DesiredProject[] = [
  {
    id: '1',
    name: 'AI Code Review SaaS',
    priority: 'high',
    marketDemand: 92,
    estimatedRevenue: '$5k-15k MRR',
    buildTime: '2-3 weeks',
    savedAt: '2 days ago',
    tags: ['AI', 'SaaS', 'Developer Tools'],
  },
  {
    id: '2',
    name: 'Repo Health Dashboard',
    priority: 'high',
    marketDemand: 85,
    estimatedRevenue: '$2k-8k MRR',
    buildTime: '1-2 weeks',
    savedAt: '1 week ago',
    tags: ['Analytics', 'GitHub', 'Monitoring'],
  },
  {
    id: '3',
    name: 'Webhook Automation Kit',
    priority: 'medium',
    marketDemand: 78,
    estimatedRevenue: '$1k-5k MRR',
    buildTime: '1 week',
    savedAt: '2 weeks ago',
    tags: ['Automation', 'API', 'Integration'],
  },
]

const priorityColors = {
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-green-500/20 text-green-400 border-green-500/30',
}

export default async function MostDesiredPage() {
  const user = await getCurrentUser()
  
  const subscription = user ? await getSubscriptionByGithubId(user.github_id).catch(() => null) : null
  const isPro = isPaidPlan(subscription?.plan)

  if (!isPro) {
    return (
      <div className="space-y-8">
        {/* Header */}
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

        {/* Pro Upgrade Card */}
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

        {/* Blurred Preview */}
        <div className="relative">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 flex items-center justify-center">
            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-lg px-4 py-2">
              <Lock className="h-4 w-4 mr-2" />
              Pro Feature Preview
            </Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 opacity-50">
            {MOCK_DESIRED_PROJECTS.map((project) => (
              <Card key={project.id} className="bg-card/50 border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <Badge variant="outline" className={priorityColors[project.priority]}>
                      {project.priority}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Market Demand</span>
                    <span className="font-medium">{project.marketDemand}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Est. Revenue</span>
                    <span className="font-medium text-green-400">{project.estimatedRevenue}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Pro user view
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <Star className="h-6 w-6 text-yellow-400" />
            My Most Desired
          </h1>
          <p className="text-muted-foreground mt-1">
            Your saved and prioritized project ideas
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {MOCK_DESIRED_PROJECTS.map((project) => (
          <Card key={project.id} className="bg-card/50 border-border/50 hover:border-yellow-500/30 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <Badge variant="outline" className={priorityColors[project.priority]}>
                  {project.priority}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Market Demand</span>
                <span className="font-medium">{project.marketDemand}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Est. Revenue</span>
                <span className="font-medium text-green-400">{project.estimatedRevenue}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Build Time</span>
                <span className="font-medium">{project.buildTime}</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-2">
                {project.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
