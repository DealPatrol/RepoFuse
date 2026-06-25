import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getProjectById, getMilestonesByProject, deleteProject } from '@/lib/queries'
import { getDb } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    const [project, milestones] = await Promise.all([
      getProjectById(id, user.id),
      getMilestonesByProject(id, user.id),
    ])
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ project, milestones })
  } catch (err) {
    console.error('[projects/id] GET error:', err)
    return NextResponse.json({ error: 'Failed to load project' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    const body = await request.json()
    const sql = getDb()

    const allowed = ['name','description','repo_url','deployment_url','status','frontend_status','backend_status','notes']
    const updates: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in body) updates[key] = body[key]
    }
    const techStack = body.tech_stack

    const result = await sql`
      UPDATE projects SET
        name            = CASE WHEN ${updates.name !== undefined} THEN ${(updates.name as string | null) ?? null} ELSE name END,
        description     = CASE WHEN ${updates.description !== undefined} THEN ${(updates.description as string | null) ?? null} ELSE description END,
        repo_url        = CASE WHEN ${updates.repo_url !== undefined} THEN ${(updates.repo_url as string | null) ?? null} ELSE repo_url END,
        deployment_url  = CASE WHEN ${updates.deployment_url !== undefined} THEN ${(updates.deployment_url as string | null) ?? null} ELSE deployment_url END,
        status          = CASE WHEN ${updates.status !== undefined} THEN ${(updates.status as string | null) ?? null} ELSE status END,
        frontend_status = CASE WHEN ${updates.frontend_status !== undefined} THEN ${(updates.frontend_status as string | null) ?? null} ELSE frontend_status END,
        backend_status  = CASE WHEN ${updates.backend_status !== undefined} THEN ${(updates.backend_status as string | null) ?? null} ELSE backend_status END,
        notes           = CASE WHEN ${updates.notes !== undefined} THEN ${(updates.notes as string | null) ?? null} ELSE notes END,
        tech_stack      = CASE WHEN ${techStack !== undefined} THEN ${JSON.stringify(techStack ?? [])}::jsonb ELSE tech_stack END,
        updated_at      = NOW()
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING *
    `
    if (!result[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ project: result[0] })
  } catch (err) {
    console.error('[projects/id] PATCH error:', err)
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    await deleteProject(id, user.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[projects/id] DELETE error:', err)
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
}
