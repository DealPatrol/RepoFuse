import { NextRequest, NextResponse } from 'next/server'
import {
  generateRelevanceGuidedCompletion,
  CodeSnippet,
  batchGenerateCompletions,
} from '@/lib/code-completion'
import { getCurrentUser } from '@/lib/auth'
import { getDb } from '@/lib/db'

const LANG_EXTENSIONS: Record<string, string[]> = {
  python: ['.py'],
  javascript: ['.js', '.jsx', '.mjs', '.cjs'],
  typescript: ['.ts', '.tsx'],
  java: ['.java'],
  go: ['.go'],
  rust: ['.rs'],
  ruby: ['.rb'],
  php: ['.php'],
  csharp: ['.cs'],
  cpp: ['.cpp', '.cc', '.cxx', '.h', '.hpp'],
  c: ['.c', '.h'],
  swift: ['.swift'],
  kotlin: ['.kt'],
  scala: ['.scala'],
  shell: ['.sh', '.bash'],
}

async function fetchSnippetsFromDb(language: string, userId: string): Promise<CodeSnippet[]> {
  try {
    const sql = getDb()
    const extensions = LANG_EXTENSIONS[language.toLowerCase()] ?? []
    if (extensions.length === 0) return []

    const rows = await sql`
      SELECT rf.id, rf.path, rf.name, rf.extension, rf.ai_summary, rf.reusability_score, rf.exports, rf.imports
      FROM repo_files rf
      JOIN repositories r ON r.id = rf.repository_id
      WHERE r.user_id = ${userId}
        AND rf.extension = ANY(${extensions}::text[])
        AND rf.ai_summary IS NOT NULL
      ORDER BY rf.reusability_score DESC
      LIMIT 20
    `

    return (rows as Array<{
      id: string
      path: string
      name: string
      extension: string
      ai_summary: string
      reusability_score: number
      exports: string[]
      imports: string[]
    }>).map((row) => ({
      id: row.id,
      name: row.name,
      code: row.ai_summary,
      language,
      path: row.path,
      reusabilityScore: row.reusability_score ?? 0,
    }))
  } catch {
    return []
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { incompleteCode, codebaseSnippets = [], language = 'python' } = body

    if (!incompleteCode || typeof incompleteCode !== 'string') {
      return NextResponse.json(
        { error: 'incompleteCode is required and must be a string' },
        { status: 400 }
      )
    }

    const snippets: CodeSnippet[] = codebaseSnippets.length > 0
      ? codebaseSnippets
      : await fetchSnippetsFromDb(language, user.id)

    const result = await generateRelevanceGuidedCompletion(
      incompleteCode,
      snippets,
      language
    )

    return NextResponse.json({
      success: true,
      completion: result.completion,
      context: result.context,
      selectedSnippets: result.selectedSnippets.map((s) => ({
        name: s.name,
        path: s.path,
        relevanceScore: s.relevanceScore,
        matchedPatterns: s.matchedPatterns,
      })),
      steps: result.steps,
    })
  } catch (error) {
    console.error('[v0] Code completion error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate completion',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/code-completion/batch
 * Generates completions for multiple code snippets in batch
 *
 * Request body:
 * {
 *   codeSnippets: string[] - Array of incomplete code snippets
 *   codebaseSnippets?: CodeSnippet[] - Optional codebase examples
 *   language?: string - Programming language (default: 'python')
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { codeSnippets = [], codebaseSnippets = [], language = 'python' } = body

    if (!Array.isArray(codeSnippets) || codeSnippets.length === 0) {
      return NextResponse.json(
        { error: 'codeSnippets is required and must be a non-empty array' },
        { status: 400 }
      )
    }

    const snippets: CodeSnippet[] = codebaseSnippets.length > 0
      ? codebaseSnippets
      : await fetchSnippetsFromDb(language, user.id)

    const results = await batchGenerateCompletions(
      codeSnippets,
      snippets,
      language
    )

    const successful = results.filter((r) => r.success).length
    const failed = results.length - successful

    return NextResponse.json({
      success: true,
      summary: {
        total: results.length,
        successful,
        failed,
      },
      results,
    })
  } catch (error) {
    console.error('[v0] Batch completion error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process batch',
      },
      { status: 500 }
    )
  }
}
