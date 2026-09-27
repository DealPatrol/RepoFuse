import { afterEach, describe, expect, it } from 'vitest'
import { isLegacyGitHubOAuthConfigured } from '@/lib/github-oauth'

const ORIGINAL_CLIENT_ID = process.env.GITHUB_CLIENT_ID
const ORIGINAL_PUBLIC_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID
const ORIGINAL_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET

afterEach(() => {
  if (ORIGINAL_CLIENT_ID === undefined) delete process.env.GITHUB_CLIENT_ID
  else process.env.GITHUB_CLIENT_ID = ORIGINAL_CLIENT_ID
  if (ORIGINAL_PUBLIC_CLIENT_ID === undefined) delete process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID
  else process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID = ORIGINAL_PUBLIC_CLIENT_ID
  if (ORIGINAL_CLIENT_SECRET === undefined) delete process.env.GITHUB_CLIENT_SECRET
  else process.env.GITHUB_CLIENT_SECRET = ORIGINAL_CLIENT_SECRET
})

describe('isLegacyGitHubOAuthConfigured', () => {
  it('requires both the client id and secret', () => {
    delete process.env.GITHUB_CLIENT_ID
    delete process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID
    delete process.env.GITHUB_CLIENT_SECRET
    expect(isLegacyGitHubOAuthConfigured()).toBe(false)

    process.env.GITHUB_CLIENT_ID = 'client'
    expect(isLegacyGitHubOAuthConfigured()).toBe(false)

    process.env.GITHUB_CLIENT_SECRET = 'secret'
    expect(isLegacyGitHubOAuthConfigured()).toBe(true)
  })
})
