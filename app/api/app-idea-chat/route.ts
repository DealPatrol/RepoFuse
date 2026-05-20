import { NextRequest, NextResponse } from 'next/server'
import { Anthropic } from '@anthropic-ai/sdk'
import {
  getAnalysisById,
  getRepositoriesForAnalysis,
  getBlueprintsByAnalysis,
  getFilesByRepository,
} from '@/lib/queries'
import { getAnthropicModel } from '@/lib/anthropic-model'
import { getCurrentUser } from '@/lib/auth'
import { deductCredits, CREDITS } from '@/lib/credits'

const anthropic = new Anthropic()

export interface AppIdeaSuggestion {
  name: string
  tagline: string
  description: string
  type: string
  difficulty: 'easy' | 'medium' | 'hard'
  estimatedEffort: string
  suggestedStack: string[]
  monetizationAngle: string
  whyNow: string
}

export interface AppIdeaChatResponse {
  reply: string
  suggestions: AppIdeaSuggestion[]
  followUpQuestions: string[]
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { message, analysisId, history = [] } = (await request.json()) as {
      message: string
      analysisId?: string
      history?: ChatMessage[]
    }

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
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

    // Optionally load codebase context
    let codebaseContext = ''
    if (analysisId) {
      try {
        const analysis = await getAnalysisById(analysisId)
        if (analysis && analysis.status === 'complete') {
          const [repositories, blueprints] = await Promise.all([
            getRepositoriesForAnalysis(analysisId),
            getBlueprintsByAnalysis(analysisId),
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

          codebaseContext = `
## Developer's codebase context
Repositories: ${repositories.map((r) => r.name).join(', ')}
Top technologies: ${topTech.join(', ')}
Total files: ${allFiles.length}
Existing blueprints: ${blueprints.slice(0, 5).map((b) => b.name).join(', ') || 'none yet'}
`
        }
      } catch {
        // Codebase context optional — continue without it
      }
    }

    // Build conversation history for context
    const conversationHistory = history.slice(-6).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    const systemPrompt = `You are an expert product strategist and startup advisor helping developers discover what apps to build. You're having a friendly, concise conversation to help them find the perfect project idea.

${codebaseContext}

When responding:
- Keep your reply conversational and under 100 words
- Suggest 2-4 concrete project ideas tailored to their request${codebaseContext ? ' and their codebase' : ''}
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
      "estimatedEffort": "e.g. 1–2 weeks",
      "suggestedStack": ["tech1", "tech2"],
      "monetizationAngle": "How to charge",
      "whyNow": "Why this is timely"
    }
  ],
  "followUpQuestions": ["Question 1?", "Question 2?"]
}`

    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...conversationHistory,
      { role: 'user', content: message },
    ]

    const response = await anthropic.messages.create({
      model: getAnthropicModel(),
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
    const jsonText = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()

    let parsed: AppIdeaChatResponse
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('[app-idea-chat] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
