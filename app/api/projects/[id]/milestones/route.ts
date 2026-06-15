import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createMilestone, getProjectById } from '@/lib/queries'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    const project = await getProjectById(id, user.id)
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await request.json()
    const { title, phase } = body
    if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })

    const milestone = await createMilestone({
      project_id: id,
      title: title.trim(),
      phase: phase ?? 'other',
    })
    return NextResponse.json({ milestone }, { status: 201 })
  } catch (err) {
    console.error('[milestones] POST error:', err)
    return NextResponse.json({ error: 'Failed to add milestone' }, { status: 500 })
  }
}
