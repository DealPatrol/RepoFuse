import { getCurrentUser } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, ExternalLink, Calendar, TrendingUp, Plus, Trophy } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface CompletedProject {
  id: string
  name: string
  description: string
  completedAt: string
  launchUrl?: string
  revenue?: string
  users?: number
  techStack: string[]
}

// Mock data - would come from user's marked projects
const MOCK_COMPLETED: CompletedProject[] = [
  {
    id: '1',
    name: 'Invoice Generator API',
    description: 'REST API for generating PDF invoices with Stripe integration',
    completedAt: '2024-11-15',
    launchUrl: 'https://invoiceapi.example.com',
    revenue: '$1.2k MRR',
    users: 45,
    techStack: ['Node.js', 'Express', 'Stripe', 'PDFKit'],
  },
  {
    id: '2',
    name: 'Team Dashboard',
    description: 'Real-time analytics dashboard for remote teams',
    completedAt: '2024-10-22',
    launchUrl: 'https://teamdash.example.com',
    revenue: '$800 MRR',
    users: 120,
    techStack: ['Next.js', 'Supabase', 'Recharts'],
  },
]

export default async function CompletedProjectsPage() {
  const user = await getCurrentUser()
  const completedProjects = MOCK_COMPLETED

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-400" />
            Completed Projects
          </h1>
          <p className="text-muted-foreground mt-1">
            Projects you've shipped and launched
          </p>
        </div>
        <Button className="bg-green-600 hover:bg-green-500" asChild>
          <Link href="/dashboard/analyses">
            <Plus className="mr-2 h-4 w-4" />
            View Analyses to Ship
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-400">{completedProjects.length}</div>
            <p className="text-sm text-muted-foreground">Projects Shipped</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-cyan-400">
              ${completedProjects.reduce((acc, p) => acc + (p.revenue ? parseFloat(p.revenue.replace(/[^0-9.]/g, '')) : 0), 0).toFixed(1)}k
            </div>
            <p className="text-sm text-muted-foreground">Total MRR</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-purple-400">
              {completedProjects.reduce((acc, p) => acc + (p.users || 0), 0)}
            </div>
            <p className="text-sm text-muted-foreground">Total Users</p>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-400" />
              <span className="text-xl font-bold text-yellow-400">Builder</span>
            </div>
            <p className="text-sm text-muted-foreground">Your Status</p>
          </CardContent>
        </Card>
      </div>

      {/* Projects Grid */}
      {completedProjects.length === 0 ? (
        <Card className="bg-card/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CheckCircle2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Completed Projects Yet</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Mark your first project as complete when you ship it!
            </p>
            <Button asChild>
              <Link href="/dashboard/built-apps">View Your Apps</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {completedProjects.map((project) => (
            <Card key={project.id} className="bg-card/50 border-border/50 hover:border-green-500/30 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                      {project.name}
                    </CardTitle>
                    <CardDescription className="mt-1">{project.description}</CardDescription>
                  </div>
                  {project.launchUrl && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={project.launchUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-1.5">
                  {project.techStack.map((tech) => (
                    <Badge key={tech} variant="secondary" className="text-xs">{tech}</Badge>
                  ))}
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm pt-4 border-t border-border/50">
                  <div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Shipped
                    </div>
                    <p className="font-medium">{new Date(project.completedAt).toLocaleDateString()}</p>
                  </div>
                  {project.revenue && (
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <TrendingUp className="h-3 w-3" />
                        Revenue
                      </div>
                      <p className="font-medium text-green-400">{project.revenue}</p>
                    </div>
                  )}
                  {project.users && (
                    <div>
                      <span className="text-muted-foreground">Users</span>
                      <p className="font-medium">{project.users}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Motivation Card */}
      <Card className="bg-gradient-to-r from-green-950/30 to-cyan-950/30 border-green-500/20">
        <CardContent className="py-8 text-center">
          <h3 className="text-xl font-bold mb-2">Keep Shipping!</h3>
          <p className="text-muted-foreground max-w-lg mx-auto">
            You've got {completedProjects.length} project{completedProjects.length !== 1 ? 's' : ''} shipped. 
            Check your analyses for more ideas waiting to become your next success.
          </p>
          <Button asChild className="mt-6" variant="outline">
            <Link href="/dashboard/analyses">
              Find Your Next Project
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
