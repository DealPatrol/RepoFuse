import Link from 'next/link'
import { ArrowRight, Github, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getMockProspects } from '@/lib/prospect-engine/prospect-repository'
import { ProspectTable } from './prospect-table'

const workflowSteps = [
  {
    title: 'Discover',
    copy: 'Search public GitHub signals for developers with SaaS, AI, Next.js, Stripe, automation, and maker intent.',
  },
  {
    title: 'Score',
    copy: 'Rank prospects using repo count, recent activity, keywords, public contact info, followers, and launch signals.',
  },
  {
    title: 'Review',
    copy: 'Generate a short personalized message, then require a human to approve, reject, copy, or mark contacted.',
  },
]

export default function ProspectsPage() {
  const prospects = getMockProspects()

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.18),transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,1))] text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
          <Badge variant="outline" className="border-cyan-400/30 bg-cyan-400/10 text-cyan-200">
            Safe prototype - not wired into sending or database writes
          </Badge>

          <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <h1 className="max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                RepoFuse Prospect Engine
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
                Find developers who are likely to value RepoFuse, score their public signals, and draft personalized
                outreach that must be manually approved before anything is sent.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/prospects/discover">
                    Run discovery
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
                  <Link href="#sample-leads">View sample leads</Link>
                </Button>
              </div>
            </div>

            <Card className="border-white/10 bg-white/5 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-300" />
                  Compliance guardrails
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Built as a lead finder and human-approved review queue, not a spam bot.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-slate-200">
                  <li>No auto-DMs or automated blasting.</li>
                  <li>Only uses public profile and repo data.</li>
                  <li>Draft copy includes permission-based wording.</li>
                  <li>Live GitHub mode only runs when GITHUB_TOKEN is configured.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {workflowSteps.map((step, index) => (
            <Card key={step.title}>
              <CardHeader>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-500">
                  {index === 0 ? <Github className="h-5 w-5" /> : index === 1 ? <Sparkles className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                </div>
                <CardTitle>{step.title}</CardTitle>
                <CardDescription>{step.copy}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section id="sample-leads" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Sample prospect queue</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              These mock records demonstrate the first version without touching production data.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/prospects/discover">Open discovery filters</Link>
          </Button>
        </div>

        <ProspectTable prospects={prospects} />
      </section>
    </main>
  )
}
