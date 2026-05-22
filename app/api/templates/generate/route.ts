import { NextRequest, NextResponse } from 'next/server'
import { createTemplate, getMissingGapsByBlueprint } from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'
import { deductCredits, CREDITS } from '@/lib/credits'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Sign in to create templates.' }, { status: 401 })
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

    const creditResult = await deductCredits(
      user.id,
      CREDITS.PATTERN_ANALYZER_COST,
      'pattern_analyzer',
      { action: 'create_template' },
    )
    if (!creditResult.success) {
      return NextResponse.json(
        { error: creditResult.error ?? 'Insufficient credits.' },
        { status: 402 }
      )
    }

    // Calculate aggregate metrics — best-effort, missing_file_gaps table may not exist yet
    let totalMissingFiles = 0
    let totalEstimatedHours = 0
    const totalReuse = blueprintIds.length * 60

    try {
      for (const blueprintId of blueprintIds) {
        const gaps = await getMissingGapsByBlueprint(blueprintId)
        totalMissingFiles += gaps.length
        totalEstimatedHours += gaps.reduce((sum, g) => sum + g.estimated_hours, 0)
      }
    } catch {
      // missing_file_gaps table not yet created — metrics default to 0
    }

    const reusePercentage = totalReuse / blueprintIds.length

    const template = await createTemplate({
      name,
      description: description || null,
      blueprint_ids: blueprintIds,
      tech_stack: techStack || [],
      estimated_hours: Math.round(totalEstimatedHours),
      reuse_percentage: Math.round(reusePercentage),
      total_files: totalMissingFiles,
      missing_files: totalMissingFiles,
      tier: tier as 'quick_start' | 'standard' | 'comprehensive',
      featured: false,
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('[templates/generate] error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    // If templates table doesn't exist, prompt the user to run setup
    if (msg.includes('does not exist') || msg.includes('relation')) {
      return NextResponse.json(
        { error: 'Database tables missing — visit /api/setup/init-db once to initialize, then retry.' },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    )
  }
}
