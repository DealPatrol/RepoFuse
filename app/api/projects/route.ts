import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import {
  getProjectsByUser,
  createProject,
  seedDefaultMilestones,
} from '@/lib/queries'

export async function GET() {
  const user = await getCurrentUser()
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const projects = await getProjectsByUser(user.id)
    return NextResponse.json({ projects })
  } catch (err) {
    console.error('[projects] GET error:', err)
    return NextResponse.json({ error: 'Failed to load projects' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { name, description, tech_stack, blueprint_id, seed_milestones } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 })
    }

    const project = await createProject({
      user_id: user.id,
      blueprint_id: blueprint_id ?? null,
      name: name.trim(),
      description: description ?? null,
      tech_stack: Array.isArray(tech_stack) ? tech_stack : [],
    })

    if (seed_milestones !== false) {
      await seedDefaultMilestones(project.id).catch(() => {})
    }

    return NextResponse.json({ project }, { status: 201 })
  } catch (err) {
    console.error('[projects] POST error:', err)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
