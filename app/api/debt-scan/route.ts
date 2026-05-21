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

export const dynamic = 'force-dynamic'

const anthropic = new Anthropic()

export interface DebtIssue {
  id: string
  category: 'duplicate' | 'unused' | 'security' | 'slow_query' | 'outdated_dep' | 'quick_win'
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  file: string
  suggestion: string
  autoFixable: boolean
  fix?: { before: string; after: string }
}

export interface DebtScanResult {
  issues: DebtIssue[]
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

    const creditResult = await deductCredits(
      user.id,
      CREDITS.DEBT_SCAN_COST,
      'debt_scan',
      { analysisId },
    )
    if (!creditResult.success) {
      return NextResponse.json({ error: creditResult.error || 'Insufficient credits' }, { status: 402 })
    }

    const analysis = await getAnalysisById(analysisId)
    if (!analysis || analysis.status !== 'complete') {
      return NextResponse.json({ error: 'Analysis not found or not complete' }, { status: 404 })
    }

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
      .slice(0, 15)
      .map(([t]) => t)

    const fileList = allFiles
      .slice(0, 150)
      .map((f) => `  ${f.path}${f.purpose ? ` — ${f.purpose}` : ''}`)
      .join('\n')

    const systemPrompt = `You are an expert code reviewer and technical debt analyst. Analyze this repository's file structure and metadata to identify technical debt and code quality issues.

Repositories: ${repositories.map((r) => r.name).join(', ')}
Technologies: ${topTech.join(', ')}
Total files: ${allFiles.length}
Existing blueprints: ${blueprints.slice(0, 5).map((b) => b.name).join(', ') || 'none'}

Files (path — purpose):
${fileList}
${allFiles.length > 150 ? `\n  ... and ${allFiles.length - 150} more files` : ''}

Return ONLY valid JSON (no markdown fences):
{
  "issues": [
    {
      "id": "unique-kebab-slug",
      "category": "duplicate|unused|security|slow_query|outdated_dep|quick_win",
      "severity": "critical|high|medium|low",
      "title": "Short descriptive title",
      "description": "What the problem is and why it matters",
      "file": "path/to/file.ts",
      "suggestion": "Specific actionable recommendation",
      "autoFixable": true,
      "fix": { "before": "problematic code snippet", "after": "fixed code snippet" }
    }
  ]
}

Rules:
- Limit to 20 most impactful issues
- Only include "fix" when autoFixable is true and you can provide a concrete before/after snippet
- For security: flag .env files committed, plaintext tokens/passwords, missing auth checks, SQL injection risks
- For duplicates: flag files with very similar names or purposes across repos that should be merged
- For unused: flag files that appear orphaned based on naming patterns (e.g. old/deprecated/backup files)
- For slow_query: flag files with database access patterns that suggest N+1 queries or missing indexes
- For outdated_dep: flag very old technology patterns or deprecated APIs visible from file names/purposes
- For quick_win: flag simple high-impact improvements (missing error handling, missing .gitignore entries, etc.)
- Infer issues from file names and purposes — you don't have actual file content, so focus on structural and naming patterns`

    const response = await anthropic.messages.create({
      model: getAnthropicModel(),
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Scan this codebase for technical debt and return the JSON result.' }],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
    const jsonText = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()

    let parsed: DebtScanResult
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    return NextResponse.json(parsed)
  } catch (error) {
    console.error('[debt-scan] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
