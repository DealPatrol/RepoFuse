import { beforeEach, describe, expect, it, vi } from 'vitest'
import { applyBlueprintAccess } from './blueprint-access'
import { getUserViewedBlueprintIds } from '@/lib/queries'
import { resolveProAccess } from '@/lib/pro-access'

vi.mock('@/lib/queries', () => ({
  getUserViewedBlueprintIds: vi.fn(),
}))

vi.mock('@/lib/pro-access', () => ({
  resolveProAccess: vi.fn(),
}))

vi.mock('@/lib/stripe', () => ({
  PLANS: {
    free: { blueprints_viewable: 1 },
    pro: { blueprints_viewable: -1 },
  },
}))

const viewedBlueprints = vi.mocked(getUserViewedBlueprintIds)
const proAccess = vi.mocked(resolveProAccess)
const user = { id: 'user-1' } as never
const blueprints = [
  {
    id: 'blueprint-1',
    existing_files: [{ path: 'one.ts', purpose: 'one' }],
    missing_files: [{ name: 'two.ts', purpose: 'two' }],
    estimated_effort: '1 day',
    technologies: ['TypeScript'],
    ai_explanation: 'details',
  },
  {
    id: 'blueprint-2',
    existing_files: [{ path: 'secret.ts', purpose: 'secret' }],
    missing_files: [{ name: 'private.ts', purpose: 'private' }],
    estimated_effort: '2 days',
    technologies: ['Postgres'],
    ai_explanation: 'locked details',
  },
] as never

describe('applyBlueprintAccess', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    viewedBlueprints.mockResolvedValue([])
  })

  it('masks locked blueprint internals for free users', async () => {
    proAccess.mockResolvedValue({
      canAccessPro: false,
      subscription: null,
      plan: 'free',
    })

    const result = await applyBlueprintAccess(user, blueprints)

    expect(result.blueprints[0].existing_files).toHaveLength(1)
    expect(result.blueprints[1]).toEqual(
      expect.objectContaining({
        existing_files: [],
        missing_files: [],
        estimated_effort: null,
        technologies: [],
        ai_explanation: null,
      }),
    )
  })

  it('returns complete blueprints for paid users', async () => {
    proAccess.mockResolvedValue({
      canAccessPro: true,
      subscription: null,
      plan: 'pro',
    })

    const result = await applyBlueprintAccess(user, blueprints)

    expect(result.blueprints).toBe(blueprints)
    expect(result.blueprintLimit).toBe(-1)
  })
})
