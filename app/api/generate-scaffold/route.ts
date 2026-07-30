import { NextRequest, NextResponse } from 'next/server'
import { aiConfigErrorMessage, generateWithGateway, isAiConfigured } from '@/lib/ai-gateway'
import { deductCredits, refundCredits, CREDITS } from '@/lib/credits'
import { getCurrentUser } from '@/lib/auth'
import { getSubscriptionByGithubId, upsertSubscription } from '@/lib/queries'
import { hasProAccess } from '@/lib/pro-access'

export async function POST(request: NextRequest) {
  let chargedUserId = ''
  let charged = false
  let chargeMetadata: Record<string, unknown> = {}

  try {
    if (!isAiConfigured()) {
      return NextResponse.json({ error: aiConfigErrorMessage() }, { status: 503 })
    }

    const { appName, description, technologies, existingFiles, missingFiles } = await request.json()
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Sign in with GitHub to generate scaffolds.' }, { status: 401 })
    }

    let sub = await getSubscriptionByGithubId(user.github_id).catch(() => null)
    if (!sub) {
      sub = await upsertSubscription({ github_id: user.github_id }).catch(() => null)
    }
    if (!hasProAccess(user, sub)) {
      return NextResponse.json(
        { error: 'Scaffold generation is a Pro feature. Upgrade your plan to use it.' },
        { status: 403 },
      )
    }

    if (!appName || !description || !technologies) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const deductResult = await deductCredits(user.id, CREDITS.SCAFFOLD_COST, 'scaffold', {
      appName,
      technologies,
    })
    if (!deductResult.success) {
      return NextResponse.json(
        {
          error: deductResult.error ?? 'Insufficient credits',
          required: CREDITS.SCAFFOLD_COST,
          message: 'Upgrade to Pro to get unlimited scaffold generation with 3,000 monthly credits.',
        },
        { status: 402 },
      )
    }
    charged = true
    chargedUserId = user.id
    chargeMetadata = { appName, technologies }

    const raw = await generateWithGateway({
      feature: 'scaffold',
      userId: user.id,
      maxOutputTokens: 8192,
      messages: [
        {
          role: 'user',
          content: `Generate a complete project scaffold for "${appName}".

Description: ${description}
Technologies: ${(technologies ?? []).join(', ')}
Existing files available: ${(existingFiles ?? []).join(', ')}
Missing files to generate: ${(missingFiles ?? []).join(', ')}

Create a JSON object with:
1. "structure": Object mapping folder/file paths to descriptions
2. "files": Object with file paths as keys and content objects/strings as values
   - "package.json": Object with package.json content
   - "README.md": String with markdown content
   - ".env.example": String with env vars
   - Other files: String with COMPLETE, working implementation code

IMPORTANT:
- Return ONLY valid JSON, no markdown, no extra text
- All strings must use proper JSON escaping
- No trailing commas
- All quoted keys and values
- Write REAL, functional code — never use TODO placeholders or stub implementations

Example structure:
{
  "structure": {
    "src": "Source files",
    "src/index.ts": "Entry point"
  },
  "files": {
    "package.json": {"name": "app", "version": "1.0.0", "main": "src/index.ts"},
    "README.md": "# App\\n\\nDescription here",
    "src/index.ts": "import express from 'express'\\nconst app = express()\\napp.get('/', (req, res) => res.json({ status: 'ok' }))\\napp.listen(3000)"
  }
}`,
        },
      ],
    })

    let scaffold
    try {
      let jsonStr = raw.trim()

      if (jsonStr.includes('```')) {
        const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
        if (match?.[1]) {
          jsonStr = match[1].trim()
        }
      }

      if (!jsonStr.startsWith('{')) {
        const objMatch = jsonStr.match(/\{[\s\S]*\}/)
        if (objMatch) {
          jsonStr = objMatch[0]
        }
      }

      scaffold = JSON.parse(jsonStr)

      if (!scaffold.structure && !scaffold.files) {
        throw new Error('Invalid scaffold structure - missing required fields')
      }
    } catch (e) {
      console.error('[scaffold] Failed to parse AI response:', raw.slice(0, 500))
      throw new Error(`Failed to parse scaffold: ${e instanceof Error ? e.message : 'Invalid JSON'}`)
    }

    return NextResponse.json({
      success: true,
      scaffold,
      appName,
      creditsUsed: CREDITS.SCAFFOLD_COST,
      creditsRemaining: deductResult.transaction?.balance_after ?? 0,
    })
  } catch (error) {
    console.error('[scaffold] Generation error:', error)
    if (charged) {
      await refundCredits(chargedUserId, CREDITS.SCAFFOLD_COST, 'Scaffold generation failed', {
        ...chargeMetadata,
        error: error instanceof Error ? error.message : String(error),
      }).catch((refundError) => {
        console.error('[scaffold] Failed to refund credits:', refundError)
      })
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate scaffold' },
      { status: 500 },
    )
  }
}
