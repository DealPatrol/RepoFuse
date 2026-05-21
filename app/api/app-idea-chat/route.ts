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

export interface StarterFile {
  path: string
  purpose: string
  technologies: string[]
  repoName: string
  relevance: string
}

export interface AppIdeaChatResponse {
  reply: string
  suggestions: AppIdeaSuggestion[]
  followUpQuestions: string[]
  starterFiles?: StarterFile[]
  templateSummary?: string
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

    // Load codebase context and raw file list when an analysis is selected
    let codebaseContext = ''
    let repoFiles: Array<{ path: string; purpose: string; technologies: string[]; repoName: string }> = []

    if (analysisId) {
      try {
        const analysis = await getAnalysisById(analysisId)
        if (analysis && analysis.status === 'complete') {
          const [repositories, blueprints] = await Promise.all([
            getRepositoriesForAnalysis(analysisId),
            getBlueprintsByAnalysis(analysisId),
          ])

          const allFiles = (
            await Promise.all(
              repositories.map(async (r) => {
                const files = await getFilesByRepository(r.id)
                return files.map((f) => ({ ...f, repoName: r.name }))
              }),
            )
          ).flat()

          repoFiles = allFiles.map((f) => ({
            path: f.path,
            purpose: f.purpose ?? '',
            technologies: f.technologies ?? [],
            repoName: f.repoName,
          }))

          const techCount: Record<string, number> = {}
          for (const file of allFiles) {
            for (const tech of file.technologies) {
              techCount[tech] = (techCount[tech] || 0) + 1
            }
          }
          const topTech = Object.entries(techCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 12)
            .map(([t]) => t)

          codebaseContext = `
## Developer's existing codebase
Repositories: ${repositories.map((r) => r.name).join(', ')}
Top technologies: ${topTech.join(', ')}
Total files: ${allFiles.length}
Existing blueprints: ${blueprints.slice(0, 5).map((b) => b.name).join(', ') || 'none yet'}

Files sample (first 60):
${allFiles
  .slice(0, 60)
  .map((f) => `  [${f.repoName}] ${f.path} — ${f.purpose ?? ''}`)
  .join('\n')}
`
        }
      } catch {
        // Codebase context optional — continue without it
      }
    }

    const hasCodebase = repoFiles.length > 0
    const conversationHistory = history.slice(-6).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    const systemPrompt = `You are an expert product strategist helping developers figure out what to build next. You give concise, actionable advice.

${codebaseContext}

When the user describes something they want to build:
${hasCodebase ? `- Identify up to 6 files from their EXISTING codebase (listed above) that are most relevant as starter code for this project. Pick files that could be reused or adapted directly.` : '- They have no connected codebase yet; suggest ideas and tech stacks only.'}
- Suggest 2-3 concrete project ideas aligned with their request
- Ask one follow-up question to refine suggestions

Respond with valid JSON only (no markdown fences):
{
  "reply": "conversational response, max 80 words",
  "suggestions": [
    {
      "name": "Project Name",
      "tagline": "One punchy sentence",
      "description": "2-3 sentences",
      "type": "SaaS | CLI | API | Dashboard | Mobile | etc",
      "difficulty": "easy | medium | hard",
      "estimatedEffort": "e.g. 1–2 weeks",
      "suggestedStack": ["tech1", "tech2"],
      "monetizationAngle": "How to monetize",
      "whyNow": "Why this is timely"
    }
  ],
  "followUpQuestions": ["Question 1?", "Question 2?"],
  ${hasCodebase ? `"starterFiles": [
    {
      "path": "exact/path/from/codebase",
      "purpose": "what this file does",
      "technologies": ["tech"],
      "repoName": "repo-name",
      "relevance": "one sentence: why this file helps for what they want to build"
    }
  ],
  "templateSummary": "One sentence describing what these files collectively give them as a starting point"` : `"starterFiles": [], "templateSummary": null`}
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

    // Validate starterFiles against actual repo files to avoid hallucinations
    if (parsed.starterFiles?.length && repoFiles.length > 0) {
      const pathSet = new Set(repoFiles.map((f) => f.path))
      const validFiles = parsed.starterFiles.filter((sf) => pathSet.has(sf.path))
      // Enrich with actual data from DB
      parsed.starterFiles = validFiles.map((sf) => {
        const actual = repoFiles.find((f) => f.path === sf.path)
        return actual
          ? { ...sf, purpose: actual.purpose || sf.purpose, technologies: actual.technologies }
          : sf
      })
    }

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('[app-idea-chat] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
