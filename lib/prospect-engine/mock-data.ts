import { DEFAULT_PROSPECT_KEYWORDS, findMatchedKeywords, scoreLead } from './lead-scoring-service'
import type { Prospect, ProspectRepo } from './types'

interface MockProspectInput {
  id: string
  name: string
  githubUsername: string
  email?: string | null
  website?: string | null
  location?: string | null
  bio: string
  repoCount: number
  followers: number
  following: number
  repos: Omit<ProspectRepo, 'matchedKeywords'>[]
  notes: string
}

function withKeywordMatches(repo: Omit<ProspectRepo, 'matchedKeywords'>): ProspectRepo {
  return {
    ...repo,
    matchedKeywords: findMatchedKeywords(repo, DEFAULT_PROSPECT_KEYWORDS),
  }
}

function createMockProspect(input: MockProspectInput): Prospect {
  const repos = input.repos.map(withKeywordMatches)
  const score = scoreLead(
    {
      bio: input.bio,
      website: input.website ?? null,
      email: input.email ?? null,
      repoCount: input.repoCount,
      followers: input.followers,
    },
    repos,
    DEFAULT_PROSPECT_KEYWORDS,
  )

  return {
    id: input.id,
    name: input.name,
    githubUsername: input.githubUsername,
    githubUrl: `https://github.com/${input.githubUsername}`,
    email: input.email ?? null,
    website: input.website ?? null,
    location: input.location ?? null,
    bio: input.bio,
    repoCount: input.repoCount,
    followers: input.followers,
    following: input.following,
    recentActivityScore: score.recentActivityScore,
    keywordScore: score.keywordScore,
    productHuntScore: score.productHuntScore,
    buildInPublicScore: score.buildInPublicScore,
    publicEmailScore: score.publicEmailScore,
    totalScore: score.totalScore,
    status: 'new',
    notes: input.notes,
    repos,
    scoreReasons: score.reasons,
    createdAt: '2026-06-01T12:00:00.000Z',
    updatedAt: '2026-06-01T12:00:00.000Z',
  }
}

export const mockProspects: Prospect[] = [
  createMockProspect({
    id: 'mock-maya-chen',
    name: 'Maya Chen',
    githubUsername: 'maya-builds',
    email: 'maya@example.dev',
    website: 'https://mayabuilds.dev',
    location: 'Austin, TX',
    bio: 'Indie hacker building in public. Shipping AI SaaS tools for small teams.',
    repoCount: 34,
    followers: 2800,
    following: 410,
    notes: 'Strong fit: repeated SaaS and AI repo themes, public email, active maker positioning.',
    repos: [
      {
        id: 'mock-repo-1',
        name: 'ai-support-dashboard',
        url: 'https://github.com/maya-builds/ai-support-dashboard',
        description: 'Next.js dashboard for AI customer support automation with Stripe plans.',
        stars: 184,
        forks: 31,
        language: 'TypeScript',
        pushedAt: '2026-05-28T15:30:00.000Z',
      },
      {
        id: 'mock-repo-2',
        name: 'stripe-saas-kit',
        url: 'https://github.com/maya-builds/stripe-saas-kit',
        description: 'Reusable billing, onboarding, and team settings boilerplate.',
        stars: 96,
        forks: 18,
        language: 'TypeScript',
        pushedAt: '2026-05-17T10:00:00.000Z',
      },
    ],
  }),
  createMockProspect({
    id: 'mock-jon-bell',
    name: 'Jon Bell',
    githubUsername: 'jonbelllabs',
    email: null,
    website: 'https://jonbelllabs.com',
    location: 'London, UK',
    bio: 'Founder and full-stack engineer. Building productivity products with Next.js and Supabase.',
    repoCount: 21,
    followers: 910,
    following: 120,
    notes: 'Good fit: active product builder with repeatable app infrastructure but no public email.',
    repos: [
      {
        id: 'mock-repo-3',
        name: 'founder-crm',
        url: 'https://github.com/jonbelllabs/founder-crm',
        description: 'Lightweight CRM for founder-led sales with automation workflows.',
        stars: 73,
        forks: 9,
        language: 'TypeScript',
        pushedAt: '2026-05-04T08:10:00.000Z',
      },
      {
        id: 'mock-repo-4',
        name: 'supabase-starter',
        url: 'https://github.com/jonbelllabs/supabase-starter',
        description: 'Supabase auth, billing, and dashboard starter template.',
        stars: 55,
        forks: 14,
        language: 'TypeScript',
        pushedAt: '2026-04-11T16:45:00.000Z',
      },
    ],
  }),
  createMockProspect({
    id: 'mock-priya-n',
    name: 'Priya N.',
    githubUsername: 'priyanext',
    email: 'hello@priyan.dev',
    website: null,
    location: 'Toronto, CA',
    bio: 'Open-source maintainer experimenting with automation, templates, and launchable dev tools.',
    repoCount: 47,
    followers: 1250,
    following: 380,
    notes: 'Medium-high fit: strong repo library and public contact info, but weaker founder signal.',
    repos: [
      {
        id: 'mock-repo-5',
        name: 'workflow-automation-lab',
        url: 'https://github.com/priyanext/workflow-automation-lab',
        description: 'Automation recipes for developer teams and internal tooling.',
        stars: 142,
        forks: 22,
        language: 'Python',
        pushedAt: '2026-05-22T12:30:00.000Z',
      },
      {
        id: 'mock-repo-6',
        name: 'nextjs-dashboard-blocks',
        url: 'https://github.com/priyanext/nextjs-dashboard-blocks',
        description: 'Reusable Next.js dashboard components and product templates.',
        stars: 118,
        forks: 26,
        language: 'TypeScript',
        pushedAt: '2026-03-29T19:20:00.000Z',
      },
    ],
  }),
].sort((a, b) => b.totalScore - a.totalScore)
