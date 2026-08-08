import { DEFAULT_PROSPECT_KEYWORDS, findMatchedKeywords, normalizeKeywords, scoreLead } from './lead-scoring-service'
import { getMockProspectById, getMockProspects } from './prospect-repository'
import type { DiscoveryResult, GithubDiscoveryInput, Prospect, ProspectRepo } from './types'

interface GitHubSearchUser {
  login: string
}

interface GitHubSearchResponse {
  items: GitHubSearchUser[]
}

interface GitHubProfile {
  login: string
  name: string | null
  html_url: string
  email: string | null
  blog: string | null
  location: string | null
  bio: string | null
  public_repos: number
  followers: number
  following: number
}

interface GitHubRepo {
  id: number
  name: string
  html_url: string
  description: string | null
  stargazers_count: number
  forks_count: number
  language: string | null
  pushed_at: string | null
  topics?: string[]
}

const GITHUB_API_BASE = 'https://api.github.com'

function getGitHubToken() {
  return process.env.GITHUB_TOKEN?.trim()
}

function buildSearchQuery(input: GithubDiscoveryInput) {
  const keywords = normalizeKeywords(input.keywords).slice(0, 4)
  const parts = [
    'type:user',
    `repos:>=${Math.max(input.minimumRepos, 0)}`,
    input.minimumFollowers ? `followers:>=${Math.max(input.minimumFollowers, 0)}` : null,
    input.language ? `language:${input.language.trim()}` : null,
    input.location ? `location:${input.location.trim()}` : null,
    keywords.length > 0 ? `${keywords.join(' ')} in:bio` : null,
  ].filter(Boolean)

  return parts.join(' ')
}

async function githubFetch<T>(path: string, token: string) {
  const response = await fetch(`${GITHUB_API_BASE}${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'RepoFuse-Prospect-Engine',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`GitHub request failed (${response.status}) for ${path}`)
  }

  return {
    data: (await response.json()) as T,
    rateLimitRemaining: response.headers.get('x-ratelimit-remaining'),
  }
}

function mapRepo(repo: GitHubRepo, keywords: string[]): ProspectRepo {
  const baseRepo = {
    id: String(repo.id),
    name: repo.name,
    url: repo.html_url,
    description: repo.description,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    language: repo.language,
    pushedAt: repo.pushed_at,
  }
  const topicMatches = (repo.topics ?? []).filter((topic) => keywords.includes(topic.toLowerCase()))

  return {
    ...baseRepo,
    matchedKeywords: Array.from(new Set([...findMatchedKeywords(baseRepo, keywords), ...topicMatches])),
  }
}

function mapProfile(profile: GitHubProfile, repos: GitHubRepo[], keywords: string[]): Prospect {
  const prospectRepos = repos.map((repo) => mapRepo(repo, keywords))
  const score = scoreLead(
    {
      bio: profile.bio,
      website: profile.blog,
      email: profile.email,
      repoCount: profile.public_repos,
      followers: profile.followers,
    },
    prospectRepos,
    keywords,
  )

  return {
    id: profile.login.toLowerCase(),
    name: profile.name || profile.login,
    githubUsername: profile.login,
    githubUrl: profile.html_url,
    email: profile.email,
    website: profile.blog || null,
    location: profile.location,
    bio: profile.bio,
    repoCount: profile.public_repos,
    followers: profile.followers,
    following: profile.following,
    recentActivityScore: score.recentActivityScore,
    keywordScore: score.keywordScore,
    productHuntScore: score.productHuntScore,
    buildInPublicScore: score.buildInPublicScore,
    publicEmailScore: score.publicEmailScore,
    totalScore: score.totalScore,
    status: 'new',
    notes: score.reasons.join(' '),
    repos: prospectRepos,
    scoreReasons: score.reasons,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function mockDiscoveryResult(input: GithubDiscoveryInput, message: string): DiscoveryResult {
  return {
    prospects: getMockProspects(input.limit ?? 10),
    mode: 'mock',
    message,
    query: buildSearchQuery(input),
    rateLimitRemaining: null,
  }
}

export async function discoverGithubProspects(input: GithubDiscoveryInput): Promise<DiscoveryResult> {
  const token = getGitHubToken()
  const query = buildSearchQuery(input)

  if (!token) {
    return mockDiscoveryResult(input, 'Mock mode: set GITHUB_TOKEN to run live GitHub discovery.')
  }

  try {
    const limit = Math.min(Math.max(Math.floor(input.limit ?? 10), 1), 20)
    const perPage = 100
    const keywords = normalizeKeywords(input.keywords.length > 0 ? input.keywords : DEFAULT_PROSPECT_KEYWORDS)
    const prospects: Prospect[] = []
    let rateLimitRemaining: string | null = null
    let page = 1
    let hadErrors = false

    while (prospects.length < limit) {
      let search
      try {
        search = await githubFetch<GitHubSearchResponse>(
          `/search/users?q=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}`,
          token,
        )
        rateLimitRemaining = search.rateLimitRemaining ?? rateLimitRemaining
      } catch (error) {
        if (page === 1) {
          throw error
        }
        console.error('[Prospect Engine] GitHub discovery page failed:', error)
        hadErrors = true
        break
      }

      for (const item of search.data.items) {
        try {
          const profileResult = await githubFetch<GitHubProfile>(`/users/${encodeURIComponent(item.login)}`, token)
          const profile = profileResult.data
          rateLimitRemaining = profileResult.rateLimitRemaining ?? rateLimitRemaining

          if (profile.public_repos < input.minimumRepos) {
            continue
          }
          if (input.minimumFollowers && profile.followers < input.minimumFollowers) {
            continue
          }

          const repoResult = await githubFetch<GitHubRepo[]>(
            `/users/${encodeURIComponent(item.login)}/repos?sort=pushed&per_page=12`,
            token,
          )
          rateLimitRemaining = repoResult.rateLimitRemaining ?? rateLimitRemaining
          prospects.push(mapProfile(profile, repoResult.data, keywords))
        } catch (error) {
          console.error(`[Prospect Engine] GitHub discovery failed for ${item.login}:`, error)
          hadErrors = true
        }

        if (prospects.length >= limit) {
          break
        }
      }

      if (search.data.items.length < perPage) {
        break
      }
      page += 1
    }

    return {
      prospects: prospects.sort((a, b) => b.totalScore - a.totalScore),
      mode: 'live',
      message: hadErrors
        ? 'Live GitHub discovery completed with partial results because some GitHub requests failed.'
        : prospects.length === 0
          ? 'Live GitHub discovery completed, but no prospects matched the filters.'
          : 'Live GitHub discovery completed.',
      query,
      rateLimitRemaining,
    }
  } catch (error) {
    console.error('[Prospect Engine] GitHub discovery failed:', error)
    return mockDiscoveryResult(input, 'GitHub discovery failed, so the prototype is showing mock prospects instead.')
  }
}

export async function getProspectByIdOrUsername(id: string) {
  const mockProspect = getMockProspectById(id)
  if (mockProspect) {
    return {
      prospect: mockProspect,
      mode: 'mock' as const,
      message: 'Showing a built-in sample prospect.',
    }
  }

  const token = getGitHubToken()
  if (!token) {
    return {
      prospect: null,
      mode: 'mock' as const,
      message: 'Set GITHUB_TOKEN to load live GitHub prospect details.',
    }
  }

  try {
    const keywords = DEFAULT_PROSPECT_KEYWORDS
    const profileResult = await githubFetch<GitHubProfile>(`/users/${encodeURIComponent(id)}`, token)
    const repoResult = await githubFetch<GitHubRepo[]>(
      `/users/${encodeURIComponent(id)}/repos?sort=pushed&per_page=12`,
      token,
    )

    return {
      prospect: mapProfile(profileResult.data, repoResult.data, keywords),
      mode: 'live' as const,
      message: 'Loaded live GitHub prospect details.',
    }
  } catch (error) {
    console.error('[Prospect Engine] GitHub prospect lookup failed:', error)
    return {
      prospect: null,
      mode: 'mock' as const,
      message: 'Could not load that GitHub prospect.',
    }
  }
}
