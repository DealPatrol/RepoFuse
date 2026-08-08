import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink, Github, Mail, MapPin, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getProspectByIdOrUsername } from '@/lib/prospect-engine/github-discovery-service'
import { generateOutreachMessage } from '@/lib/prospect-engine/outreach-generator'
import { ReviewPanel } from './review-panel'

export const dynamic = 'force-dynamic'

interface ProspectDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ProspectDetailPage({ params }: ProspectDetailPageProps) {
  const { id } = await params
  const result = await getProspectByIdOrUsername(id)

  if (!result.prospect) {
    notFound()
  }

  const prospect = result.prospect
  const outreach = generateOutreachMessage(prospect)

  return (
    <main className="min-h-screen bg-background">
      <div className="border-b">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 sm:px-6">
          <Button asChild variant="ghost" size="icon">
            <Link href="/prospects" aria-label="Back to prospects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold">{prospect.name}</h1>
            <p className="text-sm text-muted-foreground">{result.message}</p>
          </div>
          <Badge className="ml-auto" variant={result.mode === 'live' ? 'default' : 'secondary'}>
            {result.mode === 'live' ? 'Live GitHub' : 'Sample'}
          </Badge>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_380px]">
        <section className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Github className="h-5 w-5" />
                Prospect profile
              </CardTitle>
              <CardDescription>{prospect.bio || 'No public bio available.'}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Total score</p>
                <p className="mt-1 text-3xl font-black">{prospect.totalScore}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Repos</p>
                <p className="mt-1 text-3xl font-black">{prospect.repoCount}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Followers</p>
                <p className="mt-1 text-3xl font-black">{prospect.followers.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                <p className="mt-1 text-lg font-semibold capitalize">{prospect.status}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Why this developer fits</CardTitle>
                <CardDescription>Explainable signals used by the first scoring model.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  {prospect.scoreReasons.length > 0 ? (
                    prospect.scoreReasons.map((reason) => (
                      <li key={reason} className="flex gap-2">
                        <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                        <span>{reason}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-muted-foreground">No strong scoring reasons were detected yet.</li>
                  )}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact context</CardTitle>
                <CardDescription>Use only public contact information and manual approval.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <a
                  href={prospect.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <Github className="h-4 w-4" />
                  @{prospect.githubUsername}
                  <ExternalLink className="h-3 w-3" />
                </a>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {prospect.email || 'No public email found'}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {prospect.location || 'No public location'}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Best matching repos</CardTitle>
              <CardDescription>Repos are ranked by recent activity and keyword fit from public metadata.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {prospect.repos.map((repo) => (
                <div key={repo.id} className="rounded-lg border p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <a
                        href={repo.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-semibold hover:underline"
                      >
                        {repo.name}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <p className="mt-1 text-sm text-muted-foreground">{repo.description || 'No description available.'}</p>
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>{repo.stars.toLocaleString()} stars</span>
                      <span>{repo.forks.toLocaleString()} forks</span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {repo.language && <Badge variant="outline">{repo.language}</Badge>}
                    {repo.matchedKeywords.map((keyword) => (
                      <Badge key={keyword} variant="secondary">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Outreach draft</CardTitle>
              <CardDescription>Generated for review. It is not sent by the app.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Subject</p>
                <p className="mt-1 font-medium">{outreach.subject}</p>
              </div>
              <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm leading-6 text-muted-foreground">
                {outreach.body}
              </pre>
            </CardContent>
          </Card>

          <ReviewPanel initialStatus={prospect.status} subject={outreach.subject} body={outreach.body} />
        </aside>
      </div>
    </main>
  )
}
