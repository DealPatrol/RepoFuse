import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { DELETE, PATCH } from './route'
import { getCurrentUser } from '@/lib/auth'
import { deleteMilestone, toggleMilestone } from '@/lib/queries'

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock('@/lib/queries', () => ({
  deleteMilestone: vi.fn(),
  toggleMilestone: vi.fn(),
}))

const currentUser = vi.mocked(getCurrentUser)
const removeMilestone = vi.mocked(deleteMilestone)
const updateMilestone = vi.mocked(toggleMilestone)
const context = {
  params: Promise.resolve({ id: 'project-1', milestoneId: 'milestone-1' }),
}

describe('/api/projects/[id]/milestones/[milestoneId]', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('rejects unauthenticated milestone changes', async () => {
    currentUser.mockResolvedValue(null)
    const request = new NextRequest('http://localhost/api/projects/project-1/milestones/milestone-1', {
      method: 'PATCH',
      body: JSON.stringify({ completed: true }),
    })

    const response = await PATCH(request, context)

    expect(response.status).toBe(401)
    expect(updateMilestone).not.toHaveBeenCalled()
  })

  it('passes project and user ownership to milestone updates', async () => {
    currentUser.mockResolvedValue({ id: 'user-1' } as never)
    updateMilestone.mockResolvedValue({ id: 'milestone-1' } as never)
    const request = new NextRequest('http://localhost/api/projects/project-1/milestones/milestone-1', {
      method: 'PATCH',
      body: JSON.stringify({ completed: true }),
    })

    const response = await PATCH(request, context)

    expect(response.status).toBe(200)
    expect(updateMilestone).toHaveBeenCalledWith(
      'project-1',
      'milestone-1',
      'user-1',
      true,
    )
  })

  it('passes project and user ownership to milestone deletes', async () => {
    currentUser.mockResolvedValue({ id: 'user-1' } as never)
    removeMilestone.mockResolvedValue(true)
    const request = new NextRequest('http://localhost/api/projects/project-1/milestones/milestone-1')

    const response = await DELETE(request, context)

    expect(response.status).toBe(200)
    expect(removeMilestone).toHaveBeenCalledWith('project-1', 'milestone-1', 'user-1')
  })
})
