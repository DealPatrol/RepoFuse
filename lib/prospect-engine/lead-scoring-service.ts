import type { LeadScoreBreakdown, ProspectRepo } from './types'

export const DEFAULT_PROSPECT_KEYWORDS = [
  'saas',
  'ai',
  'openai',
  'nextjs',
  'next.js',
  'stripe',
  'supabase',
  'boilerplate',
  'dashboard',
  'crm',
  'automation',
  'startup',
  'product',
]

const BUILD_IN_PUBLIC_TERMS = [
  'building in public',
  'build in public',
  'indie hacker',
  'indiehacker',
  'founder',
  'maker',
  'solo founder',
  'bootstrapped',
]

interface ScoringProfile {
  bio: string | null
  website: string | null
  email: string | null
  repoCount: number
  followers: number
}

export function normalizeKeywords(keywords: string[]) {
  const normalized = keywords
    .flatMap((keyword) => keyword.split(','))
    .map((keyword) => keyword.trim().toLowerCase())
    .filter(Boolean)

  return Array.from(new Set(normalized.length > 0 ? normalized : DEFAULT_PROSPECT_KEYWORDS))
}

export function findMatchedKeywords(repo: Pick<ProspectRepo, 'name' | 'description' | 'language'>, keywords: string[]) {
  const haystack = [repo.name, repo.description, repo.language].filter(Boolean).join(' ').toLowerCase()

  return keywords.filter((keyword) => haystack.includes(keyword.toLowerCase()))
}

function clampScore(score: number, max: number) {
  return Math.max(0, Math.min(max, Math.round(score)))
}

function daysSince(dateValue: string | null) {
  if (!dateValue) {
    return Number.POSITIVE_INFINITY
  }

  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) {
    return Number.POSITIVE_INFINITY
  }

  return (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)
}

export function scoreLead(profile: ScoringProfile, repos: ProspectRepo[], keywords: string[]): LeadScoreBreakdown {
  const repoCountScore = clampScore(profile.repoCount * 1.4, 22)
  const followersScore = clampScore(Math.log10(Math.max(profile.followers, 1)) * 5, 10)
  const publicEmailScore = profile.email ? 8 : 0

  const recentlyTouchedRepos = repos.filter((repo) => daysSince(repo.pushedAt) <= 120).length
  const veryRecentRepos = repos.filter((repo) => daysSince(repo.pushedAt) <= 45).length
  const recentActivityScore = clampScore(recentlyTouchedRepos * 3 + veryRecentRepos * 2, 22)

  const matchedKeywords = new Set<string>()
  for (const repo of repos) {
    for (const keyword of findMatchedKeywords(repo, keywords)) {
      matchedKeywords.add(keyword)
    }
    for (const keyword of repo.matchedKeywords) {
      matchedKeywords.add(keyword.toLowerCase())
    }
  }
  const keywordScore = clampScore(matchedKeywords.size * 4, 24)

  const profileText = [profile.bio, profile.website, ...repos.map((repo) => repo.description)]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  const productHuntScore = profileText.includes('product hunt') || profileText.includes('producthunt') ? 7 : 0
  const buildInPublicScore = BUILD_IN_PUBLIC_TERMS.some((term) => profileText.includes(term)) ? 7 : 0

  const totalScore = clampScore(
    repoCountScore +
      recentActivityScore +
      keywordScore +
      publicEmailScore +
      followersScore +
      productHuntScore +
      buildInPublicScore,
    100,
  )

  const reasons = [
    profile.repoCount >= 10 ? `${profile.repoCount} public repos suggests enough source material to analyze.` : null,
    recentActivityScore >= 10 ? 'Recent pushes indicate the developer is still actively building.' : null,
    keywordScore >= 12 ? `Matched RepoFuse-friendly keywords: ${Array.from(matchedKeywords).slice(0, 5).join(', ')}.` : null,
    profile.email ? 'Public email is available for compliant manual outreach.' : null,
    productHuntScore > 0 ? 'Product Hunt signal suggests launch experience.' : null,
    buildInPublicScore > 0 ? 'Build-in-public or maker language appears in their public profile.' : null,
  ].filter(Boolean) as string[]

  return {
    repoCountScore,
    recentActivityScore,
    keywordScore,
    publicEmailScore,
    followersScore,
    productHuntScore,
    buildInPublicScore,
    totalScore,
    reasons,
  }
}
