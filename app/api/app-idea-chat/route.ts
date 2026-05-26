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

let __anthropicClient: Anthropic | null = null
function getAnthropic(): Anthropic {
  if (__anthropicClient) return __anthropicClient
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }
  __anthropicClient = new Anthropic({ apiKey: key })
  return __anthropicClient
}

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
  reusePlan?: string
  sourceFiles?: string[]
  filesToCreate?: string[]
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
              return `${repo?.full_name ?? 'repo'}/${file.path}${file.purpose ? ` - ${file.purpose}` : ''}`
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

    // Build conversation history for context
    const conversationHistory = history.slice(-6).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

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

    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...conversationHistory,
      { role: 'user', content: message },
    ]

    const response = await getAnthropic().messages.create({
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
