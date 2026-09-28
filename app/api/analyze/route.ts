import { NextResponse } from 'next/server'
import { aiConfigErrorMessage, createPromptRunner, isAiConfigured } from '@/lib/ai-gateway'
import { scanCrossPlatformCode } from '@/lib/cross-platform-scanner'
import { analyzeScannedFiles } from '@/lib/repofuse-core.js'
import { getCurrentUser } from '@/lib/auth'

export async function POST() {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isAiConfigured()) {
      return NextResponse.json({ error: aiConfigErrorMessage() }, { status: 503 })
    }

    const scannedFiles = await scanCrossPlatformCode()

    if (scannedFiles.length === 0) {
      return NextResponse.json({ error: 'No code files found to analyze' }, { status: 400 })
    }

    const result = await analyzeScannedFiles({
      scannedFiles,
      maxBlueprints: 8,
      runPrompt: createPromptRunner({ feature: 'legacy', kind: 'repofuse', temperature: 0.2 }),
    })

    return NextResponse.json({
      success: true,
      filesScanned: scannedFiles.length,
      appsDiscovered: result.blueprints.length,
      apps: result.blueprints,
      files: scannedFiles,
    })
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 },
    )
  }
}
