import { cookies } from 'next/headers'
import { getDb } from '@/lib/db'

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
  plan_tier: 'free' | 'pro' | null
  subscription_status: string | null
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

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const userIdCookie = cookieStore.get('github_user_id')?.value
  const tokenCookie = cookieStore.get(GITHUB_ACCESS_TOKEN_COOKIE)?.value

  if (!userIdCookie) {
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
             stripe_customer_id, stripe_subscription_id, stripe_price_id, plan_tier, subscription_status
      FROM user_auth
      WHERE github_id = ${githubId}
      LIMIT 1
    `
    const row = users[0] as AuthUser | undefined
    if (row?.access_token && tokenCookie === row.access_token) {
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
      }
    }
  }

  return null
}

export async function getCurrentAccessToken(): Promise<string | null> {
  const user = await getCurrentUser()
  return user?.access_token ?? null
}
