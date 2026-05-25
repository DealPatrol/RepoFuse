import { NextRequest, NextResponse } from 'next/server'
import { getBlueprintsByAnalysis } from '@/lib/queries'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const blueprints = await getBlueprintsByAnalysis(id)
    return NextResponse.json(blueprints)
  } catch (error) {
    console.error('Error fetching blueprints:', error)
    return NextResponse.json({ error: 'Failed to fetch blueprints' }, { status: 500 })
  }
}
