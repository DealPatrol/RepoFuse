import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'
import { getCurrentUser } from '@/lib/auth'
import { deductCredits, getCreditBalance } from '@/lib/credits'
import { getAnalysisById, getRepositoriesForAnalysis } from '@/lib/queries'

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock('@/lib/credits', () => ({
  CREDITS: { ANALYSIS_COST: 100 },
  deductCredits: vi.fn(),
  getCreditBalance: vi.fn(),
  refundCredits: vi.fn(),
}))

vi.mock('@/lib/queries', () => ({
  getAnalysisById: vi.fn(),
  getRepositoriesForAnalysis: vi.fn(),
}))

vi.mock('ai', () => ({
  generateText: vi.fn(),
}))

const currentUser = vi.mocked(getCurrentUser)
const chargeCredits = vi.mocked(deductCredits)
const creditBalance = vi.mocked(getCreditBalance)
const analysisById = vi.mocked(getAnalysisById)
const analysisRepositories = vi.mocked(getRepositoriesForAnalysis)
const context = { params: Promise.resolve({ id: 'route-analysis' }) }

function request() {
  return new NextRequest('http://localhost/api/analyses/route-analysis/analyze', {
    method: 'POST',
    body: JSON.stringify({
      analysisId: 'other-analysis',
      selectedRepos: [{ name: 'attacker-repo', full_name: 'other/private' }],
    }),
  })
}

describe('POST /api/analyses/[id]/analyze', () => {
  const originalGatewayKey = process.env.AI_GATEWAY_API_KEY

  beforeEach(() => {
    vi.resetAllMocks()
    process.env.AI_GATEWAY_API_KEY = 'test-gateway-key'
  })

  afterEach(() => {
    if (originalGatewayKey === undefined) delete process.env.AI_GATEWAY_API_KEY
    else process.env.AI_GATEWAY_API_KEY = originalGatewayKey
  })

  it('rejects unauthenticated requests before ownership or billing work', async () => {
    currentUser.mockResolvedValue(null)

    const response = await POST(request(), context)

    expect(response.status).toBe(401)
    expect(analysisById).not.toHaveBeenCalled()
    expect(chargeCredits).not.toHaveBeenCalled()
  })

  it('rejects analyses not owned by the authenticated user', async () => {
    currentUser.mockResolvedValue({ id: 'user-1' } as never)
    analysisById.mockResolvedValue(null)

    const response = await POST(request(), context)

    expect(response.status).toBe(404)
    expect(analysisById).toHaveBeenCalledWith('route-analysis', 'user-1')
    expect(chargeCredits).not.toHaveBeenCalled()
  })

  it('uses route-owned repositories and ignores client-selected repositories', async () => {
    currentUser.mockResolvedValue({ id: 'user-1' } as never)
    analysisById.mockResolvedValue({ id: 'route-analysis' } as never)
    analysisRepositories.mockResolvedValue([
      { name: 'owned-repo', full_name: 'owner/repo', default_branch: 'main' },
    ] as never)
    creditBalance.mockResolvedValue(500)
    chargeCredits.mockResolvedValue({ success: false, error: 'declined' })

    const response = await POST(request(), context)

    expect(response.status).toBe(402)
    expect(analysisRepositories).toHaveBeenCalledWith('route-analysis', 'user-1')
    expect(chargeCredits).toHaveBeenCalledWith(
      'user-1',
      100,
      'analysis',
      {
        analysisId: 'route-analysis',
        selectedRepos: ['owned-repo'],
      },
    )
  })
})
