import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { toggleMilestone, deleteMilestone } from '@/lib/queries'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> },
) {
  const user = await getCurrentUser()
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, milestoneId } = await params
  try {
    const { completed } = await request.json()
    const milestone = await toggleMilestone(milestoneId, id, user.id, Boolean(completed))
    if (!milestone) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ milestone })
  } catch (err) {
    console.error('[milestones/id] PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update milestone' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> },
) {
  const user = await getCurrentUser()
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, milestoneId } = await params
  try {
    const deleted = await deleteMilestone(milestoneId, id, user.id)
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[milestones/id] DELETE error:', err)
    return NextResponse.json({ error: 'Failed to delete milestone' }, { status: 500 })
  }
}
