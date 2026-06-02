import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { generateBuildPlanContent } from '@/lib/build-plan-generation'
import {
  getBlueprintById,
  getBuildPlanByBlueprintId,
  getRepositoriesForAnalysis,
  upsertBuildPlan,
} from '@/lib/queries'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Sign in with GitHub to view build plans.' }, { status: 401 })
    }

    const { id: blueprintId } = await params
    const blueprint = await getBlueprintById(blueprintId)
    if (!blueprint) {
      return NextResponse.json({ error: 'Blueprint not found' }, { status: 404 })
    }

    const buildPlan = await getBuildPlanByBlueprintId(blueprintId)
    if (!buildPlan) {
      return NextResponse.json({ buildPlan: null })
    }

    return NextResponse.json({
      buildPlan,
      blueprint: { id: blueprint.id, name: blueprint.name },
    })
  } catch (error) {
    console.error('[build-plan] GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch build plan' },
      { status: 500 },
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Sign in with GitHub to generate build plans.' }, { status: 401 })
    }

    const { id: blueprintId } = await params
    const body = await request.json().catch(() => ({}))
    const regenerate = Boolean((body as { regenerate?: boolean }).regenerate)

    const blueprint = await getBlueprintById(blueprintId)
    if (!blueprint) {
      return NextResponse.json({ error: 'Blueprint not found' }, { status: 404 })
    }

    const existing = await getBuildPlanByBlueprintId(blueprintId)
    if (existing && !regenerate) {
      return NextResponse.json({
        buildPlan: existing,
        blueprint: { id: blueprint.id, name: blueprint.name },
        cached: true,
      })
    }

    const repositories = await getRepositoriesForAnalysis(blueprint.analysis_id)
    const content = await generateBuildPlanContent(blueprint, repositories)
    const buildPlan = await upsertBuildPlan({
      blueprint_id: blueprintId,
      content,
      version: existing ? existing.version + 1 : 1,
    })

    return NextResponse.json({
      buildPlan,
      blueprint: { id: blueprint.id, name: blueprint.name },
      cached: false,
    })
  } catch (error) {
    console.error('[build-plan] POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate build plan' },
      { status: 500 },
    )
  }
}
