import { NextRequest, NextResponse } from 'next/server'
import {
  getAnalysisById,
  getRepositoriesForAnalysis,
  getBlueprintsByAnalysis,
  getFilesByRepository,
} from '@/lib/queries'
import { getCurrentUser } from '@/lib/auth'
import { deductCredits, refundCredits, CREDITS } from '@/lib/credits'
import type { AppIdeaChatResponse, ChatMessage } from '@/lib/app-idea-chat-types'
import { aiConfigErrorMessage, generateWithGateway, isAiConfigured } from '@/lib/ai-gateway'

export type { AppIdeaSuggestion, AppIdeaChatResponse, ChatMessage } from '@/lib/app-idea-chat-types'

function normalizeAnalysisId(analysisId?: string): string | undefined {
  if (!analysisId || analysisId === 'none') return undefined
  return analysisId
}

/** Anthropic requires alternating user/assistant turns. */
function normalizeConversationHistory(history: ChatMessage[]): ChatMessage[] {
  const trimmed = history
    .map((m) => ({
      role: m.role,
      content: m.content?.trim() ?? '',
    }))
    .filter((m) => m.content.length > 0)
    .slice(-12)

  const normalized: ChatMessage[] = []
  for (const entry of trimmed) {
    const last = normalized[normalized.length - 1]
    if (last?.role === entry.role) {
      last.content = `${last.content}\n\n${entry.content}`
      continue
    }
    normalized.push({ ...entry })
  }

  if (normalized[0]?.role === 'assistant') {
    normalized.shift()
  }

  return normalized
}

function parseAppIdeaChatResponse(raw: string): AppIdeaChatResponse {
  const jsonText = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
  try {
    return JSON.parse(jsonText) as AppIdeaChatResponse
  } catch {
    const start = jsonText.indexOf('{')
    const end = jsonText.lastIndexOf('}')
    if (start >= 0 && end > start) {
      return JSON.parse(jsonText.slice(start, end + 1)) as AppIdeaChatResponse
    }
    throw new Error('Failed to parse AI response')
  }
}

export async function POST(request: NextRequest) {
  let chargedUserId: string | null = null
  let chargedAnalysisId: string | undefined
  try {
    if (!isAiConfigured()) {
      return NextResponse.json({ error: aiConfigErrorMessage() }, { status: 503 })
    }

    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { message, analysisId: rawAnalysisId, history = [] } = (await request.json()) as {
      message: string
      analysisId?: string
      history?: ChatMessage[]
    }
    const analysisId = normalizeAnalysisId(rawAnalysisId)

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'App Idea Chat is not configured. Missing ANTHROPIC_API_KEY.' },
        { status: 503 },
      )
    }

    const creditResult = await deductCredits(
      user.id,
      CREDITS.PATTERN_ANALYZER_COST,
      'pattern_analyzer',
      { analysisId },
    )
    if (!creditResult.success) {
      return NextResponse.json({ error: creditResult.error || 'Insufficient credits' }, { status: 402 })
    }
    chargedUserId = user.id
    chargedAnalysisId = analysisId

    let codebaseContext = ''
    if (analysisId) {
      try {
        const analysis = await getAnalysisById(analysisId, user.id)
        if (analysis && analysis.status === 'complete') {
          const [repositories, blueprints] = await Promise.all([
            getRepositoriesForAnalysis(analysisId, user.id),
            getBlueprintsByAnalysis(analysisId, user.id),
          ])

          const allFiles = (
            await Promise.all(repositories.map((r) => getFilesByRepository(r.id)))
          ).flat()

          const techCount: Record<string, number> = {}
          for (const file of allFiles) {
            for (const tech of file.technologies) {
              techCount[tech] = (techCount[tech] || 0) + 1
            }
          }
          const topTech = Object.entries(techCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([t]) => t)
          const reusableFiles = allFiles
            .sort((a, b) => b.reusability_score - a.reusability_score)
            .slice(0, 16)
            .map((file) => {
              const repo = repositories.find((r) => r.id === file.repository_id)
              const purpose = file.purpose?.trim()
              return `${repo?.full_name ?? 'repo'}/${file.path}${purpose ? ` - ${purpose}` : ''}`
            })

          codebaseContext = `
## Developer's codebase context
Repositories: ${repositories.map((r) => r.name).join(', ')}
Top technologies: ${topTech.join(', ')}
Total files: ${allFiles.length}
Existing blueprints: ${blueprints.slice(0, 5).map((b) => b.name).join(', ') || 'none yet'}
Reusable source files:
${reusableFiles.length > 0 ? reusableFiles.map((file) => `- ${file}`).join('\n') : '- No analyzed file summaries yet'}
`
        }
      } catch {
        // Codebase context optional — continue without it
      }
    }

    const conversationHistory = normalizeConversationHistory(history).slice(-6)

    const systemPrompt = `You are RepoFuse's VibeCoding app assembler. Help developers describe what they want to build, then turn their connected GitHub/GitLab repository knowledge into buildable app plans that reuse as much existing code, file structure, and patterns as possible.

${codebaseContext}

When responding:
- Keep your reply conversational and under 100 words
- Suggest 2-4 concrete app builds tailored to their request${codebaseContext ? ' and their codebase' : ''}
- For each suggestion, explain how RepoFuse should stitch together existing files/patterns and which new files are needed
- Prefer specific source file paths from the codebase context when available
- Ask a relevant follow-up question to refine suggestions
- Be enthusiastic and actionable

Always respond with valid JSON only (no markdown fences):
{
  "reply": "conversational response under 100 words",
  "suggestions": [
    {
      "name": "Project Name",
      "tagline": "One punchy sentence",
      "description": "2-3 sentences",
      "type": "SaaS | CLI Tool | API | Dashboard | etc",
      "difficulty": "easy | medium | hard",
      "estimatedEffort": "e.g. Small MVP | Medium build | Larger build",
      "suggestedStack": ["tech1", "tech2"],
      "monetizationAngle": "How to charge",
      "whyNow": "Why this is timely",
      "reusePlan": "How RepoFuse should combine existing repo code and patterns",
      "sourceFiles": ["repo/path/to/reuse.ts"],
      "filesToCreate": ["app/new-feature/page.tsx"]
    }
  ],
  "followUpQuestions": ["Question 1?", "Question 2?"]
}`

    const messages = normalizeConversationHistory([
      ...conversationHistory,
      { role: 'user', content: message.trim() },
    ])

    const raw = await generateWithGateway({
      system: systemPrompt,
      messages,
      maxOutputTokens: 2048,
      userId: user.id,
      feature: 'app-idea-chat',
    })

    let parsed: AppIdeaChatResponse
    try {
      parsed = parseAppIdeaChatResponse(raw)
    } catch {
      throw new Error('Failed to parse AI response')
    }

    if (!parsed.reply?.trim()) {
      throw new Error('Empty AI response')
    }

    return NextResponse.json({
      reply: parsed.reply,
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      followUpQuestions: Array.isArray(parsed.followUpQuestions) ? parsed.followUpQuestions : [],
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('[v0] app-idea-chat error:', errorMsg)
    if (error instanceof Error) {
      console.error('[v0] Stack:', error.stack)
    }
    if (chargedUserId) {
      await refundCredits(chargedUserId, CREDITS.PATTERN_ANALYZER_COST, 'App Idea Chat failed', {
        idempotency_key: `app-idea-chat-refund:${chargedUserId}:${chargedAnalysisId ?? 'none'}:${Date.now()}`,
        analysisId: chargedAnalysisId,
      }).catch((refundError) => console.error('[v0] app-idea-chat refund error:', refundError))
    }
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
