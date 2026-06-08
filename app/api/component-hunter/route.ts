import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAccessToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

interface GitHubSearchRepo {
  id: number
  full_name: string
  description: string | null
  html_url: string
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  pushed_at: string
  license: { spdx_id: string | null; name: string } | null
  archived: boolean
}

interface ComponentMatch {
  id: string
  category: string
  repo: string
  description: string
  stars: number
  forks: number
  license: string
  lastUpdated: string
  qualityScore: number
  url: string
}

// Permissive open-source licenses score higher because they are safest to import.
const LICENSE_SCORES: Record<string, number> = {
  mit: 100,
  'apache-2.0': 95,
  'bsd-3-clause': 92,
  'bsd-2-clause': 90,
  isc: 90,
  'mpl-2.0': 80,
  'lgpl-3.0': 70,
  'gpl-3.0': 55,
  'agpl-3.0': 40,
}

function monthsSince(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime()
  return diff / (1000 * 60 * 60 * 24 * 30)
}

function relativeDate(dateStr: string): string {
  const months = monthsSince(dateStr)
  if (months < 1) return 'this month'
  if (months < 12) return `${Math.round(months)}mo ago`
  return `${Math.round(months / 12)}y ago`
}

// Score a repository 0-100 on quality, popularity, maintenance and license.
function scoreRepo(repo: GitHubSearchRepo): number {
  // Popularity: log scale so a few huge repos do not dominate everything.
  const starScore = Math.min(40, Math.log10(repo.stargazers_count + 1) * 12)
  const forkScore = Math.min(15, Math.log10(repo.forks_count + 1) * 6)

  // Maintenance: penalise repos that have not been pushed to recently.
  const months = monthsSince(repo.pushed_at)
  let maintenanceScore = 25
  if (months > 36) maintenanceScore = 4
  else if (months > 24) maintenanceScore = 8
  else if (months > 12) maintenanceScore = 14
  else if (months > 6) maintenanceScore = 20
  if (repo.archived) maintenanceScore = 0

  // License: permissive licenses are safer to import.
  const spdx = (repo.license?.spdx_id || '').toLowerCase()
  const licenseScore = (LICENSE_SCORES[spdx] ?? 30) * 0.2 // up to 20

  const total = starScore + forkScore + maintenanceScore + licenseScore
  return Math.round(Math.max(0, Math.min(100, total)))
}

export async function POST(request: NextRequest) {
  let query = ''
  try {
    const body = await request.json()
    query = typeof body?.query === 'string' ? body.query.trim() : ''
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!query) {
    return NextResponse.json({ error: 'A search query is required' }, { status: 400 })
  }

  // Auth is optional for public search but a token raises GitHub rate limits.
  let accessToken: string | null = null
  try {
    accessToken = await getCurrentAccessToken()
  } catch {
    accessToken = null
  }

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'RepoFuse-ComponentHunter',
  }
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  // Search public GitHub for repositories that fill the requested component gap.
  const searchUrl = new URL('https://api.github.com/search/repositories')
  searchUrl.searchParams.set('q', `${query} in:name,description,readme stars:>10`)
  searchUrl.searchParams.set('sort', 'stars')
  searchUrl.searchParams.set('order', 'desc')
  searchUrl.searchParams.set('per_page', '30')

  try {
    const res = await fetch(searchUrl.toString(), { headers, cache: 'no-store' })
    if (!res.ok) {
      return NextResponse.json(
        { error: `GitHub search failed with status ${res.status}` },
        { status: 502 },
      )
    }

    const data = (await res.json()) as { items?: GitHubSearchRepo[] }
    const items = data.items ?? []

    const matches: ComponentMatch[] = items
      .map((repo) => ({
        id: String(repo.id),
        category: query,
        repo: repo.full_name,
        description: repo.description || 'No description provided.',
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        license: repo.license?.spdx_id && repo.license.spdx_id !== 'NOASSERTION'
          ? repo.license.spdx_id
          : 'No license',
        lastUpdated: relativeDate(repo.pushed_at),
        qualityScore: scoreRepo(repo),
        url: repo.html_url,
      }))
      .sort((a, b) => b.qualityScore - a.qualityScore)
      .slice(0, 12)

    return NextResponse.json({ query, matches })
  } catch (error) {
    console.error('Component hunter search failed:', error)
    return NextResponse.json({ error: 'Component hunt failed' }, { status: 500 })
  }
}
