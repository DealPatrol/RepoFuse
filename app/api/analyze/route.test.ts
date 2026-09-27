import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from './route'
import { getCurrentUser } from '@/lib/auth'
import { scanCrossPlatformCode } from '@/lib/cross-platform-scanner'

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock('@/lib/cross-platform-scanner', () => ({
  scanCrossPlatformCode: vi.fn(),
}))

vi.mock('@/lib/repofuse-core.js', () => ({
  analyzeScannedFiles: vi.fn(),
  createAnthropicPromptRunner: vi.fn(),
}))

vi.mock('ai', () => ({
  generateText: vi.fn(),
}))

const currentUser = vi.mocked(getCurrentUser)
const scanCode = vi.mocked(scanCrossPlatformCode)

describe('POST /api/analyze', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('rejects unauthenticated AI analysis before scanning code', async () => {
    currentUser.mockResolvedValue(null)

    const response = await POST()

    expect(response.status).toBe(401)
    expect(scanCode).not.toHaveBeenCalled()
  })
})
