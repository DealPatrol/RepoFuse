import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAnthropicModel } from '@/lib/anthropic-model'
import { getCreditBalance, deductCredits, CREDITS } from '@/lib/credits'

// Scaffold generation endpoint - v1.1
import { getCurrentUser } from '@/lib/auth'
import { getSubscriptionByGithubId, upsertSubscription } from '@/lib/queries'
import { hasProAccess } from '@/lib/pro-access'

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Scaffold generation is not configured. Missing ANTHROPIC_API_KEY.' },
        { status: 503 },
      )
    }

    const { appName, description, technologies, existingFiles, missingFiles, userId } = await request.json()
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

    // Check credit balance before proceeding
    if (userId) {
      const currentBalance = await getCreditBalance(userId)
      if (currentBalance < CREDITS.SCAFFOLD_COST) {
        return NextResponse.json(
          {
            error: 'Insufficient credits',
            required: CREDITS.SCAFFOLD_COST,
            available: currentBalance,
            message: 'Upgrade to Pro to get unlimited scaffold generation with 5,000 monthly credits.',
          },
          { status: 402 }
        )
      }
    }

    console.log('[v0] Generating scaffold for app:', appName)
    console.log('[v0] Calling Claude with model:', getAnthropicModel())
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await client.messages.create({
      model: getAnthropicModel(),
      max_tokens: 8192,
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
   - Other files: String with complete code

IMPORTANT: 
- Return ONLY valid JSON, no markdown, no extra text
- All strings must use proper JSON escaping
- No trailing commas
- All quoted keys and values

Example structure:
{
  "structure": {
    "src": "Source files",
    "src/index.ts": "Entry point"
  },
  "files": {
    "package.json": {"name": "app", "version": "1.0.0"},
    "README.md": "# App\\n\\nDescription here",
    "src/index.ts": "// TODO: implement main logic\\nconsole.log('Hello')"
  }
}`,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    let scaffold
    try {
      const raw = content.text.trim()
      let jsonStr = raw

      if (jsonStr.includes('```')) {
        const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
        if (match && match[1]) {
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
      console.error('[scaffold] Failed to parse Claude response:', content.text.slice(0, 500))
      throw new Error(`Failed to parse scaffold: ${e instanceof Error ? e.message : 'Invalid JSON'}`)
    }

    console.log('[v0] Scaffold generated successfully')

    // Deduct credits after successful generation
    let creditsUsed = 0
    if (userId) {
      const deductResult = await deductCredits(userId, CREDITS.SCAFFOLD_COST, 'scaffold', {
        appName,
        technologies,
      })
      
      if (deductResult.success) {
        creditsUsed = CREDITS.SCAFFOLD_COST
        console.log(`[v0] Deducted ${CREDITS.SCAFFOLD_COST} credits from user ${userId}`)
      }
    }

    return NextResponse.json({
      success: true,
      scaffold,
      appName,
      creditsUsed,
    })
  } catch (error) {
    console.error('[scaffold] Generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate scaffold' },
      { status: 500 }
    )
  }
}
