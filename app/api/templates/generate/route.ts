import { NextRequest, NextResponse } from 'next/server'
import { createTemplate, getMissingGapsByBlueprint } from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      blueprintIds,
      techStack,
      tier = 'standard',
    } = body

    if (!name || !blueprintIds || !Array.isArray(blueprintIds) || blueprintIds.length < 2) {
      return NextResponse.json(
        { error: 'Template must combine at least 2 blueprints' },
        { status: 400 }
      )
    }

    // Calculate aggregate metrics from blueprints
    const totalFiles = 0
    let totalMissingFiles = 0
    let totalEstimatedHours = 0
    let totalReuse = 0

    for (const blueprintId of blueprintIds) {
      const gaps = await getMissingGapsByBlueprint(blueprintId, user.id)
      totalMissingFiles += gaps.length
      totalEstimatedHours += gaps.reduce((sum, g) => sum + g.estimated_hours, 0)
      
      // Estimate reuse (would be pulled from blueprint in real system)
      totalReuse += 60 // placeholder
    }

    const reusePercentage = (totalReuse / blueprintIds.length)
    const totalAllFiles = totalFiles + totalMissingFiles

    const template = await createTemplate({
      user_id: user.id,
      name,
      description: description || null,
      blueprint_ids: blueprintIds,
      tech_stack: techStack || [],
      estimated_hours: Math.round(totalEstimatedHours),
      reuse_percentage: Math.round(reusePercentage),
      total_files: totalAllFiles,
      missing_files: totalMissingFiles,
      tier: tier as 'quick_start' | 'standard' | 'comprehensive',
      featured: false,
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('[v0] Error generating template:', error)
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    )
  }
}
