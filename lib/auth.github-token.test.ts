import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clerkClient } from '@clerk/nextjs/server'
import { getAuthUserFromClerkUserId } from '@/lib/auth'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  clerkClient: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: () => undefined,
  })),
}))

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(() => {
    throw new Error('database unavailable in unit test')
  }),
}))

vi.mock('@/lib/queries', () => ({
  upsertSubscription: vi.fn(),
}))

const getClerkClient = vi.mocked(clerkClient)

describe('getAuthUserFromClerkUserId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads the GitHub token with Clerk provider github', async () => {
    const getUserOauthAccessToken = vi.fn(async () => ({
      data: [{ token: 'gho_from_clerk' }],
    }))
    getClerkClient.mockResolvedValue({
      users: {
        getUser: vi.fn(async () => ({
          username: 'octocat',
          imageUrl: 'https://example.com/avatar.png',
          externalAccounts: [
            {
              provider: 'github',
              providerUserId: '42',
              username: 'octocat',
              imageUrl: 'https://example.com/avatar.png',
            },
          ],
        })),
        getUserOauthAccessToken,
      },
    } as unknown as Awaited<ReturnType<typeof clerkClient>>)

    const user = await getAuthUserFromClerkUserId('user_123')

    expect(getUserOauthAccessToken).toHaveBeenCalledWith('user_123', 'github')
    expect(user?.access_token).toBe('gho_from_clerk')
    expect(user?.github_id).toBe(42)
    expect(user?.github_username).toBe('octocat')
  })

  it('returns null when the Clerk user has no linked GitHub account', async () => {
    const getUserOauthAccessToken = vi.fn(async () => ({ data: [] }))
    getClerkClient.mockResolvedValue({
      users: {
        getUser: vi.fn(async () => ({
          username: 'ada',
          imageUrl: null,
          externalAccounts: [],
        })),
        getUserOauthAccessToken,
      },
    } as unknown as Awaited<ReturnType<typeof clerkClient>>)

    const user = await getAuthUserFromClerkUserId('user_456')

    expect(getUserOauthAccessToken).toHaveBeenCalledWith('user_456', 'github')
    expect(user).toBeNull()
  })
})
