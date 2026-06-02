import { NextRequest, NextResponse } from 'next/server'
<<<<<<< HEAD
import { Anthropic } from '@anthropic-ai/sdk'
=======
>>>>>>> origin/main
import {
  getAnalysisById,
  getRepositoriesForAnalysis,
  getBlueprintsByAnalysis,
  getFilesByRepository,
} from '@/lib/queries'
<<<<<<< HEAD
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
=======
import { getCurrentUser } from '@/lib/auth'
import { deductCredits, CREDITS } from '@/lib/credits'
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
>>>>>>> origin/main
}

export async function POST(request: NextRequest) {
  try {
<<<<<<< HEAD
=======
    if (!isAiConfigured()) {
      return NextResponse.json({ error: aiConfigErrorMessage() }, { status: 503 })
    }

>>>>>>> origin/main
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

<<<<<<< HEAD
    const { message, analysisId, history = [] } = (await request.json()) as {
=======
    const { message, analysisId: rawAnalysisId, history = [] } = (await request.json()) as {
>>>>>>> origin/main
      message: string
      analysisId?: string
      history?: ChatMessage[]
    }
<<<<<<< HEAD
=======
    const analysisId = normalizeAnalysisId(rawAnalysisId)
>>>>>>> origin/main

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

<<<<<<< HEAD
=======
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'App Idea Chat is not configured. Missing ANTHROPIC_API_KEY.' },
        { status: 503 },
      )
    }

>>>>>>> origin/main
    const creditResult = await deductCredits(
      user.id,
      CREDITS.PATTERN_ANALYZER_COST,
      'pattern_analyzer',
      { analysisId },
    )
    if (!creditResult.success) {
      return NextResponse.json({ error: creditResult.error || 'Insufficient credits' }, { status: 402 })
    }

<<<<<<< HEAD
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

=======
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

>>>>>>> origin/main
          const techCount: Record<string, number> = {}
          for (const file of allFiles) {
            for (const tech of file.technologies) {
              techCount[tech] = (techCount[tech] || 0) + 1
            }
          }
          const topTech = Object.entries(techCount)
            .sort((a, b) => b[1] - a[1])
<<<<<<< HEAD
            .slice(0, 12)
            .map(([t]) => t)

          codebaseContext = `
## Developer's existing codebase
=======
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
>>>>>>> origin/main
Repositories: ${repositories.map((r) => r.name).join(', ')}
Top technologies: ${topTech.join(', ')}
Total files: ${allFiles.length}
Existing blueprints: ${blueprints.slice(0, 5).map((b) => b.name).join(', ') || 'none yet'}
<<<<<<< HEAD

Files sample (first 60):
${allFiles
  .slice(0, 60)
  .map((f) => `  [${f.repoName}] ${f.path} — ${f.purpose ?? ''}`)
  .join('\n')}
=======
Reusable source files:
${reusableFiles.length > 0 ? reusableFiles.map((file) => `- ${file}`).join('\n') : '- No analyzed file summaries yet'}
>>>>>>> origin/main
`
        }
      } catch {
        // Codebase context optional — continue without it
      }
    }

<<<<<<< HEAD
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
=======
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
>>>>>>> origin/main
  "suggestions": [
    {
      "name": "Project Name",
      "tagline": "One punchy sentence",
      "description": "2-3 sentences",
<<<<<<< HEAD
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
=======
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
>>>>>>> origin/main
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

<<<<<<< HEAD
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
=======
    if (!parsed.reply?.trim()) {
      return NextResponse.json({ error: 'Empty AI response' }, { status: 500 })
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
    return NextResponse.json({ error: errorMsg }, { status: 500 })
>>>>>>> origin/main
  }
}
