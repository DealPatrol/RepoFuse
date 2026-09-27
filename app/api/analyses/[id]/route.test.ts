import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from './route'
import { getCurrentUser } from '@/lib/auth'
import {
  getAnalysisById,
  getBlueprintsByAnalysis,
  getRepositoriesForAnalysis,
} from '@/lib/queries'
import { applyBlueprintAccess } from '@/lib/blueprint-access'

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock('@/lib/queries', () => ({
  getAnalysisById: vi.fn(),
  getBlueprintsByAnalysis: vi.fn(),
  getRepositoriesForAnalysis: vi.fn(),
}))

vi.mock('@/lib/blueprint-access', () => ({
  applyBlueprintAccess: vi.fn(),
}))

const currentUser = vi.mocked(getCurrentUser)
const analysisById = vi.mocked(getAnalysisById)
const blueprints = vi.mocked(getBlueprintsByAnalysis)
const repositories = vi.mocked(getRepositoriesForAnalysis)
const blueprintAccess = vi.mocked(applyBlueprintAccess)
const request = new NextRequest('http://localhost/api/analyses/analysis-1')
const context = { params: Promise.resolve({ id: 'analysis-1' }) }

describe('GET /api/analyses/[id]', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('rejects unauthenticated requests', async () => {
    currentUser.mockResolvedValue(null)

    const response = await GET(request, context)

    expect(response.status).toBe(401)
    expect(analysisById).not.toHaveBeenCalled()
  })

  it('looks up the analysis through the authenticated owner', async () => {
    currentUser.mockResolvedValue({ id: 'user-1' } as never)
    analysisById.mockResolvedValue(null)

    const response = await GET(request, context)

    expect(response.status).toBe(404)
    expect(analysisById).toHaveBeenCalledWith('analysis-1', 'user-1')
    expect(repositories).not.toHaveBeenCalled()
    expect(blueprints).not.toHaveBeenCalled()
  })

  it('scopes related repositories and blueprints to the owner', async () => {
    currentUser.mockResolvedValue({ id: 'user-1' } as never)
    analysisById.mockResolvedValue({ id: 'analysis-1' } as never)
    repositories.mockResolvedValue([])
    blueprints.mockResolvedValue([])
    blueprintAccess.mockResolvedValue({ blueprints: [] } as never)

    const response = await GET(request, context)

    expect(response.status).toBe(200)
    expect(repositories).toHaveBeenCalledWith('analysis-1', 'user-1')
    expect(blueprints).toHaveBeenCalledWith('analysis-1', 'user-1')
  })
})
