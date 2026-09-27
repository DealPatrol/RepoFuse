import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { GET } from './route'
import { getAuthUserFromClerkUserId } from '@/lib/auth'
import { isClerkConfigured } from '@/lib/clerk-auth'

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  sanitizeReturnTo: (value: string | null | undefined, fallback = '/dashboard/repositories?connected=github') => {
    if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback
    return value
  },
  getAuthUserFromClerkUserId: vi.fn(),
}))

vi.mock('@/lib/clerk-auth', () => ({
  isClerkConfigured: vi.fn(),
}))

vi.mock('@/lib/auth-url', () => ({
  getSignInUrl: (returnTo?: string) =>
    returnTo ? `/sign-in?redirect_url=${encodeURIComponent(returnTo)}` : '/sign-in',
}))

const clerkAuth = vi.mocked(auth)
const clerkConfigured = vi.mocked(isClerkConfigured)
const linkedUser = vi.mocked(getAuthUserFromClerkUserId)

function loginRequest(returnTo?: string) {
  const url = new URL('http://localhost:3000/api/auth/github/login')
  if (returnTo) url.searchParams.set('returnTo', returnTo)
  return new NextRequest(url)
}

describe('GET /api/auth/github/login', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    delete process.env.GITHUB_CLIENT_ID
    delete process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID
    delete process.env.GITHUB_CLIENT_SECRET
    delete process.env.NEXT_PUBLIC_APP_URL
    clerkConfigured.mockReturnValue(true)
  })

  it('keeps the legacy GitHub OAuth redirect when the client id and secret are set', async () => {
    process.env.GITHUB_CLIENT_ID = 'gh-client'
    process.env.GITHUB_CLIENT_SECRET = 'gh-secret'

    const response = await GET(loginRequest('/dashboard/repositories'))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('https://github.com/login/oauth/authorize')
    expect(response.headers.get('location')).toContain('client_id=gh-client')
    expect(clerkAuth).not.toHaveBeenCalled()
  })

  it('redirects home when neither legacy GitHub OAuth nor Clerk is configured', async () => {
    clerkConfigured.mockReturnValue(false)

    const response = await GET(loginRequest())

    expect(response.headers.get('location')).toBe('http://localhost:3000/?error=github_oauth_not_configured')
  })

  it('sends signed-out visitors to Clerk sign-in when legacy GitHub OAuth is unset', async () => {
    clerkAuth.mockResolvedValue({ userId: null } as Awaited<ReturnType<typeof auth>>)

    const response = await GET(loginRequest('/dashboard/repositories'))

    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/sign-in?redirect_url=%2Fdashboard%2Frepositories',
    )
  })

  it('connects repositories from the Clerk GitHub token when legacy OAuth is unset', async () => {
    clerkAuth.mockResolvedValue({ userId: 'user_123' } as Awaited<ReturnType<typeof auth>>)
    linkedUser.mockResolvedValue({ access_token: 'gho_test' } as Awaited<ReturnType<typeof getAuthUserFromClerkUserId>>)

    const response = await GET(loginRequest('/dashboard/repositories'))

    expect(linkedUser).toHaveBeenCalledWith('user_123', true)
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/dashboard/repositories?connected=github',
    )
  })

  it('tells a signed-in user to connect GitHub in account settings when no GitHub account is linked', async () => {
    clerkAuth.mockResolvedValue({ userId: 'user_123' } as Awaited<ReturnType<typeof auth>>)
    linkedUser.mockResolvedValue(null)

    const response = await GET(loginRequest('/dashboard/repositories'))

    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/dashboard/repositories?error=github_not_linked',
    )
  })
})
