import Link from 'next/link'
import { ArrowLeft, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { discoverGithubProspects } from '@/lib/prospect-engine/github-discovery-service'
import { getMockProspects } from '@/lib/prospect-engine/prospect-repository'
import type { DiscoveryResult, GithubDiscoveryInput } from '@/lib/prospect-engine/types'
import { ProspectTable } from '../prospect-table'

export const dynamic = 'force-dynamic'

interface DiscoverPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function parseNumber(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function parseInput(params: Record<string, string | string[] | undefined>): GithubDiscoveryInput {
  const keywords = (firstParam(params.keywords) ?? 'saas, ai, nextjs, stripe, supabase')
    .split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean)

  return {
    minimumRepos: parseNumber(firstParam(params.minimumRepos), 10),
    keywords,
    language: firstParam(params.language)?.trim() || undefined,
    location: firstParam(params.location)?.trim() || undefined,
    minimumFollowers: parseNumber(firstParam(params.minimumFollowers), 0),
    limit: parseNumber(firstParam(params.limit), 10),
  }
}

function initialResult(input: GithubDiscoveryInput): DiscoveryResult {
  return {
    prospects: getMockProspects(input.limit),
    mode: 'mock',
    message: 'Sample mode: adjust filters and run GitHub discovery when you are ready.',
    query: 'Discovery has not run yet.',
    rateLimitRemaining: null,
  }
}

export default async function ProspectDiscoverPage({ searchParams }: DiscoverPageProps) {
  const params = await searchParams
  const input = parseInput(params)
  const shouldRun = firstParam(params.run) === '1'
  const result = shouldRun ? await discoverGithubProspects(input) : initialResult(input)

  return (
    <main className="min-h-screen bg-background">
      <div className="border-b">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 sm:px-6">
          <Button asChild variant="ghost" size="icon">
            <Link href="/prospects" aria-label="Back to Prospect Engine">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">GitHub prospect discovery</h1>
            <p className="text-sm text-muted-foreground">Search public developer signals and score potential RepoFuse users.</p>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[360px_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Discovery filters</CardTitle>
            <CardDescription>
              Live discovery requires GITHUB_TOKEN. Without it, this route uses mock prospects.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" method="GET">
              <input type="hidden" name="run" value="1" />

              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">Minimum repos</span>
                <input
                  name="minimumRepos"
                  type="number"
                  min="0"
                  defaultValue={input.minimumRepos}
                  className="w-full rounded-md border bg-background px-3 py-2"
                />
              </label>

              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">Keywords</span>
                <input
                  name="keywords"
                  defaultValue={input.keywords.join(', ')}
                  className="w-full rounded-md border bg-background px-3 py-2"
                />
                <span className="block text-xs text-muted-foreground">Comma-separated public profile/repo signals.</span>
              </label>

              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">Language</span>
                <input
                  name="language"
                  defaultValue={input.language ?? 'TypeScript'}
                  placeholder="TypeScript"
                  className="w-full rounded-md border bg-background px-3 py-2"
                />
              </label>

              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">Location</span>
                <input
                  name="location"
                  defaultValue={input.location ?? ''}
                  placeholder="Optional"
                  className="w-full rounded-md border bg-background px-3 py-2"
                />
              </label>

              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">Minimum followers</span>
                <input
                  name="minimumFollowers"
                  type="number"
                  min="0"
                  defaultValue={input.minimumFollowers ?? 0}
                  className="w-full rounded-md border bg-background px-3 py-2"
                />
              </label>

              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">Result limit</span>
                <input
                  name="limit"
                  type="number"
                  min="1"
                  max="20"
                  defaultValue={input.limit ?? 10}
                  className="w-full rounded-md border bg-background px-3 py-2"
                />
              </label>

              <Button type="submit" className="w-full">
                <Search className="h-4 w-4" />
                Run GitHub discovery
              </Button>
            </form>
          </CardContent>
        </Card>

        <section className="space-y-5">
          <Card>
            <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Discovery results</CardTitle>
                <CardDescription>{result.message}</CardDescription>
              </div>
              <Badge variant={result.mode === 'live' ? 'default' : 'secondary'}>{result.mode === 'live' ? 'Live GitHub' : 'Mock mode'}</Badge>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="font-medium">Query: </span>
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{result.query}</code>
              </div>
              {result.rateLimitRemaining && (
                <p className="text-muted-foreground">GitHub rate limit remaining: {result.rateLimitRemaining}</p>
              )}
              <p className="text-muted-foreground">
                This prototype does not persist records. Add database tables only after you approve the workflow.
              </p>
            </CardContent>
          </Card>

          <ProspectTable prospects={result.prospects} />
        </section>
      </div>
    </main>
  )
}
