import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { scanCrossPlatformCode } from '@/lib/cross-platform-scanner'
import { analyzeScannedFiles, createAnthropicPromptRunner } from '@/lib/repofuse-core.js'

export async function POST() {
  try {
    const scannedFiles = await scanCrossPlatformCode()

    if (scannedFiles.length === 0) {
      return NextResponse.json({ error: 'No code files found to analyze' }, { status: 400 })
    }

    const anthropicRunner = process.env.ANTHROPIC_API_KEY
      ? createAnthropicPromptRunner({
          apiKey: process.env.ANTHROPIC_API_KEY,
          model: process.env.ANTHROPIC_MODEL || process.env.REPOFUSE_MODEL || 'claude-opus-4-6',
        })
      : undefined

    const result = await analyzeScannedFiles({
      scannedFiles,
      maxBlueprints: 8,
      runPrompt: anthropicRunner ?? (async (prompt: string) => {
        const response = await generateText({
          model: 'openai/gpt-4o-mini',
          prompt,
          temperature: 0.2,
          maxOutputTokens: 4000,
        })

        return response.text
      }),
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
