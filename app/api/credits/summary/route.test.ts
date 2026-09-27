import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from './route'
import { getCurrentUser } from '@/lib/auth'
import { getCreditUsageSummary, getOrCreateUserCredits } from '@/lib/credits'

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock('@/lib/credits', () => ({
  getCreditUsageSummary: vi.fn(),
  getOrCreateUserCredits: vi.fn(),
}))

const currentUser = vi.mocked(getCurrentUser)
const creditSummary = vi.mocked(getCreditUsageSummary)
const userCredits = vi.mocked(getOrCreateUserCredits)

describe('GET /api/credits/summary', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('rejects unauthenticated requests', async () => {
    currentUser.mockResolvedValue(null)

    const response = await GET(new NextRequest('http://localhost/api/credits/summary'))

    expect(response.status).toBe(401)
    expect(userCredits).not.toHaveBeenCalled()
    expect(creditSummary).not.toHaveBeenCalled()
  })

  it('rejects attempts to read another user credit balance', async () => {
    currentUser.mockResolvedValue({ id: 'user-1' } as never)

    const response = await GET(
      new NextRequest('http://localhost/api/credits/summary?userId=user-2'),
    )

    expect(response.status).toBe(403)
    expect(userCredits).not.toHaveBeenCalled()
    expect(creditSummary).not.toHaveBeenCalled()
  })

  it('loads credits for the authenticated user only', async () => {
    currentUser.mockResolvedValue({ id: 'user-1' } as never)
    userCredits.mockResolvedValue({ current_balance: 500 } as never)
    creditSummary.mockResolvedValue({ current_balance: 500 } as never)

    const response = await GET(new NextRequest('http://localhost/api/credits/summary'))

    expect(response.status).toBe(200)
    expect(userCredits).toHaveBeenCalledWith('user-1')
    expect(creditSummary).toHaveBeenCalledWith('user-1')
  })
})
