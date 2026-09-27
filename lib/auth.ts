import { auth, clerkClient } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'
import { GITHUB_ACCOUNT_NOT_LINKED_MESSAGE } from '@/lib/github-account'
import { isClerkConfigured } from '@/lib/clerk-auth'
import { getDb } from '@/lib/db'
import { upsertSubscription } from '@/lib/queries'

/** Clerk Backend API provider slug. Do not pass the deprecated `oauth_github` prefix. */
const CLERK_GITHUB_OAUTH_PROVIDER = 'github' as const

export const GITHUB_ACCESS_TOKEN_COOKIE = 'github_access_token'

export interface AuthUser {
  id: string
  github_id: number
  github_username: string
  github_avatar_url: string | null
  access_token: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  stripe_price_id: string | null
  plan_tier: 'free' | 'pro' | 'scale' | 'byok' | null
  subscription_status: string | null
  vercel_access_token: string | null
  vercel_team_id: string | null
}

export function sanitizeReturnTo(
  returnTo: string | null | undefined,
  fallback = '/dashboard/repositories?connected=github',
) {
  if (!returnTo) {
    return fallback
  }

  const trimmed = returnTo.trim()

  if (trimmed.includes('\\') || !trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return fallback
  }

  try {
    const base = 'http://repofuse.local'
    const parsed = new URL(trimmed, base)
    if (parsed.origin !== base) {
      return fallback
    }

    const normalized = `${parsed.pathname}${parsed.search}${parsed.hash}`
    if (!normalized.startsWith('/') || normalized.startsWith('//')) {
      return fallback
    }

    return normalized
  } catch {
    return fallback
  }
}

function isGitHubExternalAccount(account: { provider: string }): boolean {
  const provider = account.provider.toLowerCase()
  return provider === 'github' || provider === 'oauth_github'
}

async function fetchGitHubUserFromToken(accessToken: string): Promise<{
  id: number
  login: string
  avatar_url: string | null
} | null> {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'RepoFuse',
    },
    cache: 'no-store',
  })
  if (!res.ok) return null
  const u = (await res.json()) as { id: number; login: string; avatar_url: string | null }
  return { id: u.id, login: u.login, avatar_url: u.avatar_url }
}

export async function getAuthUserFromClerkUserId(
  userId: string,
  allowCookieFallback = false,
): Promise<AuthUser | null> {
  const client = await clerkClient()
  const clerkUser = await client.users.getUser(userId)

  const githubAccount =
    clerkUser.externalAccounts?.find((account) => isGitHubExternalAccount(account)) ?? null

  let accessToken: string | null = null
  try {
    const tokens = await client.users.getUserOauthAccessToken(userId, CLERK_GITHUB_OAUTH_PROVIDER)
    accessToken = tokens.data[0]?.token ?? null
  } catch {
    accessToken = null
  }

  if (!accessToken && allowCookieFallback) {
    const cookieStore = await cookies()
    accessToken = cookieStore.get(GITHUB_ACCESS_TOKEN_COOKIE)?.value ?? null
  }

  if (!accessToken) return null

  let githubId = githubAccount ? Number.parseInt(githubAccount.providerUserId, 10) : Number.NaN
  let githubUsername = githubAccount?.username || clerkUser.username || ''
  let avatarUrl = clerkUser.imageUrl ?? githubAccount?.imageUrl ?? null

  if (Number.isNaN(githubId)) {
    const githubProfile = await fetchGitHubUserFromToken(accessToken)
    if (!githubProfile) return null
    githubId = githubProfile.id
    githubUsername = githubProfile.login
    avatarUrl = githubProfile.avatar_url ?? avatarUrl
  }

  if (!githubUsername) {
    githubUsername = `user-${githubId}`
  }

  try {
    const sql = getDb()
    await sql`
      INSERT INTO user_auth (github_id, github_username, github_avatar_url, access_token)
      VALUES (${githubId}, ${githubUsername}, ${avatarUrl}, ${accessToken})
      ON CONFLICT (github_id)
      DO UPDATE SET
        access_token = ${accessToken},
        github_username = ${githubUsername},
        github_avatar_url = ${avatarUrl},
        updated_at = CURRENT_TIMESTAMP
    `
    await upsertSubscription({ github_id: githubId })

    const users = await sql`
      SELECT id, github_id, github_username, github_avatar_url, access_token,
             stripe_customer_id, stripe_subscription_id, stripe_price_id,
             plan_tier, subscription_status,
             vercel_access_token, vercel_team_id
      FROM user_auth
      WHERE github_id = ${githubId}
      LIMIT 1
    `
    const row = users[0] as AuthUser | undefined
    if (row) return row
  } catch {
    // DB unavailable — return session from Clerk + token
  }

  return {
    id: '',
    github_id: githubId,
    github_username: githubUsername,
    github_avatar_url: avatarUrl,
    access_token: accessToken,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    stripe_price_id: null,
    plan_tier: null,
    subscription_status: null,
    vercel_access_token: null,
    vercel_team_id: null,
  }
}

async function getCurrentUserFromClerk(): Promise<AuthUser | null> {
  const { userId } = await auth()
  if (!userId) return null

  return getAuthUserFromClerkUserId(userId, true)
}

async function getCurrentUserFromCookies(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const userIdCookie = cookieStore.get('github_user_id')?.value
  const tokenCookie = cookieStore.get(GITHUB_ACCESS_TOKEN_COOKIE)?.value

  if (!userIdCookie || !tokenCookie) {
    return null
  }

  const githubId = Number.parseInt(userIdCookie, 10)
  if (Number.isNaN(githubId)) {
    return null
  }

  try {
    const sql = getDb()
    const users = await sql`
      SELECT id, github_id, github_username, github_avatar_url, access_token,
             stripe_customer_id, stripe_subscription_id, stripe_price_id,
             plan_tier, subscription_status,
             vercel_access_token, vercel_team_id
      FROM user_auth
      WHERE github_id = ${githubId}
      LIMIT 1
    `
    const row = users[0] as AuthUser | undefined
    if (row?.access_token === tokenCookie) {
      return row
    }
    if (row && tokenCookie) {
      const gh = await fetchGitHubUserFromToken(tokenCookie)
      if (gh && gh.id === githubId) {
        return {
          ...row,
          access_token: tokenCookie,
          github_username: gh.login,
          github_avatar_url: gh.avatar_url,
          stripe_customer_id: row.stripe_customer_id ?? null,
          stripe_subscription_id: row.stripe_subscription_id ?? null,
          stripe_price_id: row.stripe_price_id ?? null,
          plan_tier: row.plan_tier ?? null,
          subscription_status: row.subscription_status ?? null,
          vercel_access_token: row.vercel_access_token ?? null,
          vercel_team_id: row.vercel_team_id ?? null,
        }
      }
    }
  } catch {
    // DATABASE_URL missing or DB unreachable — fall back to cookies + GitHub API
  }

  if (tokenCookie) {
    const gh = await fetchGitHubUserFromToken(tokenCookie)
    if (gh && gh.id === githubId) {
      return {
        id: '',
        github_id: gh.id,
        github_username: gh.login,
        github_avatar_url: gh.avatar_url,
        access_token: tokenCookie,
        stripe_customer_id: null,
        stripe_subscription_id: null,
        stripe_price_id: null,
        plan_tier: null,
        subscription_status: null,
        vercel_access_token: null,
        vercel_team_id: null,
      }
    }
  }

  return null
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (isClerkConfigured()) {
    const clerkUser = await getCurrentUserFromClerk()
    if (clerkUser) return clerkUser
  }

  return getCurrentUserFromCookies()
}

export async function getCurrentAccessToken(): Promise<string | null> {
  const user = await getCurrentUser()
  return user?.access_token ?? null
}

/**
 * Clerk session exists, but RepoFuse has no GitHub token for listing repos or
 * reading file contents. Null when the caller is signed out or already has a token.
 */
export async function getGitHubNotLinkedMessage(): Promise<string | null> {
  if (!isClerkConfigured()) return null

  const { userId } = await auth()
  if (!userId) return null

  const linkedUser = await getAuthUserFromClerkUserId(userId, true)
  if (linkedUser?.access_token) return null

  return GITHUB_ACCOUNT_NOT_LINKED_MESSAGE
}
