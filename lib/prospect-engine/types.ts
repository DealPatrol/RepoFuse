export type ProspectStatus = 'new' | 'reviewed' | 'approved' | 'contacted' | 'replied' | 'rejected'

export type OutreachStatus = 'draft' | 'approved' | 'sent' | 'rejected'

export type OutreachChannel = 'email' | 'x' | 'linkedin' | 'manual'

export interface ProspectRepo {
  id: string
  name: string
  url: string
  description: string | null
  stars: number
  forks: number
  language: string | null
  pushedAt: string | null
  matchedKeywords: string[]
}

export interface Prospect {
  id: string
  name: string
  githubUsername: string
  githubUrl: string
  email: string | null
  website: string | null
  location: string | null
  bio: string | null
  repoCount: number
  followers: number
  following: number
  recentActivityScore: number
  keywordScore: number
  productHuntScore: number
  buildInPublicScore: number
  publicEmailScore: number
  totalScore: number
  status: ProspectStatus
  notes: string | null
  repos: ProspectRepo[]
  scoreReasons: string[]
  createdAt: string
  updatedAt: string
}

export interface OutreachMessage {
  channel: OutreachChannel
  subject: string
  body: string
  status: OutreachStatus
}

export interface GithubDiscoveryInput {
  minimumRepos: number
  keywords: string[]
  language?: string
  location?: string
  minimumFollowers?: number
  limit?: number
}

export interface DiscoveryResult {
  prospects: Prospect[]
  mode: 'live' | 'mock'
  message: string
  query: string
  rateLimitRemaining: string | null
}

export interface LeadScoreBreakdown {
  repoCountScore: number
  recentActivityScore: number
  keywordScore: number
  publicEmailScore: number
  followersScore: number
  productHuntScore: number
  buildInPublicScore: number
  totalScore: number
  reasons: string[]
}
