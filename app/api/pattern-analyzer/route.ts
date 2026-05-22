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

export interface ProjectSuggestion {
  name: string
  tagline: string
  description: string
  type: string
  difficulty: 'easy' | 'medium' | 'hard'
  estimatedEffort: string
  detectedPatterns: string[]
  suggestedStack: string[]
  monetizationAngle: string
  whyNow: string
}

export interface PatternAnalyzerResult {
  patterns: string[]
  suggestions: ProjectSuggestion[]
  topTechnologies: string[]
  analysisId: string
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { analysisId } = (await request.json()) as { analysisId: string }

    if (!analysisId) {
      return NextResponse.json({ error: 'analysisId is required' }, { status: 400 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Pattern Analyzer is not configured. Missing ANTHROPIC_API_KEY.' },
        { status: 503 },
      )
    }

    const creditResult = await deductCredits(user.id, CREDITS.PATTERN_ANALYZER_COST, 'pattern_analyzer', { analysisId })
    if (!creditResult.success) {
      return NextResponse.json({ error: creditResult.error || 'Insufficient credits' }, { status: 402 })
    }

    const analysis = await getAnalysisById(analysisId)
    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
    }
    if (analysis.status !== 'complete') {
      return NextResponse.json(
        { error: 'Analysis must be complete before pattern scanning' },
        { status: 422 },
      )
    }

    // Gather repo files and blueprints
    const [repositories, blueprints] = await Promise.all([
      getRepositoriesForAnalysis(analysisId),
      getBlueprintsByAnalysis(analysisId),
    ])

    const allFiles = (
      await Promise.all(repositories.map((r) => getFilesByRepository(r.id)))
    ).flat()

    // Collect technology signals
    const techCount: Record<string, number> = {}
    const purposesByCategory: Record<string, string[]> = {}

    for (const file of allFiles) {
      for (const tech of file.technologies) {
        techCount[tech] = (techCount[tech] || 0) + 1
      }
      if (file.file_type && file.purpose) {
        if (!purposesByCategory[file.file_type]) {
          purposesByCategory[file.file_type] = []
        }
        purposesByCategory[file.file_type].push(file.purpose)
      }
    }

    const topTechnologies = Object.entries(techCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([tech]) => tech)

    const filesSummary = allFiles
      .slice(0, 120)
      .map(
        (f) =>
          `${f.path} [${f.file_type || 'unknown'}] score=${f.reusability_score} tech=[${f.technologies.join(', ')}] purpose="${f.purpose || ''}"`,
      )
      .join('\n')

    const blueprintsSummary =
      blueprints.length > 0
        ? blueprints
            .slice(0, 10)
            .map(
              (b) =>
                `• ${b.name} (${b.app_type}, reuse ${b.reuse_percentage}%, ${b.complexity}) — ${b.description || ''}`,
            )
            .join('\n')
        : 'No blueprints generated yet.'

    const prompt = `You are a senior product strategist and software architect. You have just scanned a developer's codebase and must suggest 5 original NEW project ideas — products or tools they could build — that are grounded in patterns you observe in their code.

## Codebase summary

Top technologies detected: ${topTechnologies.join(', ')}
Total files scanned: ${allFiles.length}
Repositories: ${repositories.map((r) => r.name).join(', ')}

Existing blueprint apps already identified (do NOT repeat these):
${blueprintsSummary}

### File inventory (sample)
${filesSummary}

## Instructions

1. Identify 4-6 recurring architectural patterns or domain signals in the code (e.g. "heavy use of auth/JWT", "multiple payment integrations", "ML/embedding pipelines").
2. Propose 5 NEW project ideas that:
   - Are NOT already in the blueprints list
   - Leverage the detected patterns and tech stack
   - Have real commercial or practical value
   - Range from quick-wins to ambitious plays
3. For each project include a clear monetization angle.

Respond ONLY with a valid JSON object (no markdown fences) matching this exact shape:
{
  "patterns": ["pattern 1", "pattern 2", ...],
  "suggestions": [
    {
      "name": "Project Name",
      "tagline": "One punchy sentence",
      "description": "2-3 sentences describing what it does and who it's for",
      "type": "SaaS | CLI Tool | SDK | API | Dashboard | Mobile App | etc",
      "difficulty": "easy | medium | hard",
      "estimatedEffort": "e.g. 1–2 weeks",
      "detectedPatterns": ["which codebase patterns inspired this"],
      "suggestedStack": ["tech1", "tech2"],
      "monetizationAngle": "How they could charge for this",
      "whyNow": "Why this is timely given their stack"
    }
  ]
}`

    const response = await getAnthropic().messages.create({
      model: getAnthropicModel(),
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : ''

    // Strip accidental markdown fences
    const jsonText = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()

    let parsed: { patterns: string[]; suggestions: ProjectSuggestion[] }
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    const result: PatternAnalyzerResult = {
      patterns: parsed.patterns || [],
      suggestions: parsed.suggestions || [],
      topTechnologies,
      analysisId,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[pattern-analyzer] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
