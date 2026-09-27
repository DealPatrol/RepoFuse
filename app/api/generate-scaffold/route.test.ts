import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'
import { getCurrentUser } from '@/lib/auth'
import { deductCredits } from '@/lib/credits'
import { generateWithGateway, isAiConfigured } from '@/lib/ai-gateway'
import { getSubscriptionByGithubId } from '@/lib/queries'
import { hasProAccess } from '@/lib/pro-access'

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock('@/lib/credits', () => ({
  CREDITS: { SCAFFOLD_COST: 150 },
  deductCredits: vi.fn(),
  refundCredits: vi.fn(),
}))

vi.mock('@/lib/ai-gateway', () => ({
  aiConfigErrorMessage: vi.fn(() => 'AI not configured'),
  generateWithGateway: vi.fn(),
  isAiConfigured: vi.fn(),
}))

vi.mock('@/lib/queries', () => ({
  getSubscriptionByGithubId: vi.fn(),
  upsertSubscription: vi.fn(),
}))

vi.mock('@/lib/pro-access', () => ({
  hasProAccess: vi.fn(),
}))

const currentUser = vi.mocked(getCurrentUser)
const chargeCredits = vi.mocked(deductCredits)
const aiConfigured = vi.mocked(isAiConfigured)
const generate = vi.mocked(generateWithGateway)
const subscription = vi.mocked(getSubscriptionByGithubId)
const proAccess = vi.mocked(hasProAccess)

function scaffoldRequest(userId = 'attacker-selected-user') {
  return new NextRequest('http://localhost/api/generate-scaffold', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      appName: 'Example',
      description: 'Example app',
      technologies: ['TypeScript'],
      existingFiles: [],
      missingFiles: ['src/index.ts'],
    }),
  })
}

describe('POST /api/generate-scaffold', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    aiConfigured.mockReturnValue(true)
  })

  it('rejects unauthenticated requests before billing or generation', async () => {
    currentUser.mockResolvedValue(null)

    const response = await POST(scaffoldRequest())

    expect(response.status).toBe(401)
    expect(chargeCredits).not.toHaveBeenCalled()
    expect(generate).not.toHaveBeenCalled()
  })

  it('charges the authenticated user instead of a client-supplied user id', async () => {
    currentUser.mockResolvedValue({ id: 'user-1', github_id: 1 } as never)
    subscription.mockResolvedValue({ plan: 'pro' } as never)
    proAccess.mockReturnValue(true)
    chargeCredits.mockResolvedValue({ success: false, error: 'Insufficient credits' })

    const response = await POST(scaffoldRequest('user-2'))

    expect(response.status).toBe(402)
    expect(chargeCredits).toHaveBeenCalledWith(
      'user-1',
      150,
      'scaffold',
      expect.objectContaining({ appName: 'Example' }),
    )
    expect(generate).not.toHaveBeenCalled()
  })
})
