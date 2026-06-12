import { Anthropic } from '@anthropic-ai/sdk'
import { getAnthropicModel } from '@/lib/anthropic-model'

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

/**
 * Represents a code snippet with semantic metadata
 */
export interface CodeSnippet {
  id: string
  name: string
  code: string
  language: string
  path: string
  methodSignature?: string
  classSignature?: string
  packageSignature?: string
  reusabilityScore: number
}

/**
 * Represents semantic context extracted from code
 */
export interface SemanticContext {
  methodSignature?: string
  classSignature?: string
  packageSignature?: string
  imports: string[]
  language: string
  patterns: string[]
}

/**
 * Represents a retrieved snippet with its relevance score
 */
export interface RankedSnippet extends CodeSnippet {
  relevanceScore: number
  matchedPatterns: string[]
}

/**
 * Step 1: Analyzer - Extracts semantic context from incomplete code
 */
export async function analyzeIncompleteCode(
  incompleteCode: string,
  language: string = 'python'
): Promise<SemanticContext> {
  const prompt = `Analyze this ${language} code snippet and extract semantic context:

\`\`\`${language}
${incompleteCode}
\`\`\`

Extract and return JSON with:
1. methodSignature: The method/function signature if present
2. classSignature: The class signature if present
3. packageSignature: The package/module name if present
4. imports: Array of imported modules
5. patterns: Array of coding patterns detected (e.g., "async-await", "error-handling", "data-processing")
6. language: The programming language

Return ONLY valid JSON, no markdown formatting.`

  try {
    const response = await getAnthropic().messages.create({
      model: getAnthropicModel(),
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    // Parse JSON response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const parsed = JSON.parse(jsonMatch[0])
    return {
      methodSignature: parsed.methodSignature,
      classSignature: parsed.classSignature,
      packageSignature: parsed.packageSignature,
      imports: parsed.imports || [],
      language: parsed.language || language,
      patterns: parsed.patterns || [],
    }
  } catch (error) {
    console.error('[v0] Error analyzing code:', error)
    return {
      imports: [],
      language,
      patterns: [],
    }
  }
}

/**
 * Step 2: Retriever - Searches for similar functions from codebase
 * In production, this would query a vector database
 */
export async function retrieveSimilarFunctions(
  context: SemanticContext,
  codebaseSnippets: CodeSnippet[],
  limit: number = 10
): Promise<CodeSnippet[]> {
  // For demo purposes, we'll return snippets that match patterns
  // In production, use embeddings/vector similarity

  if (codebaseSnippets.length === 0) {
    return []
  }

  // Filter and sort by relevance indicators
  return codebaseSnippets
    .filter((snippet) => {
      // Match by language
      if (snippet.language !== context.language) return false

      // Match by patterns
      const hasMatchingPattern = context.patterns.some((pattern) =>
        snippet.code.toLowerCase().includes(pattern.toLowerCase())
      )

      // Match by signature similarity
      const hasSignatureMatch =
        (context.methodSignature &&
          snippet.methodSignature?.includes(context.methodSignature.split('(')[0])) ||
        (context.classSignature &&
          snippet.classSignature?.includes(context.classSignature.split('(')[0]))

      return hasMatchingPattern || hasSignatureMatch || codebaseSnippets.length <= limit
    })
    .slice(0, limit)
}

/**
 * Step 3: Scoring Strategy - Evaluates relevance of each retrieved snippet
 */
export function scoreRelevance(
  snippet: CodeSnippet,
  context: SemanticContext,
  incompleteCode: string
): number {
  let score = 0

  // Pattern matching (40%)
  const patternMatches = context.patterns.filter((pattern) =>
    snippet.code.toLowerCase().includes(pattern.toLowerCase())
  ).length
  score += (patternMatches / Math.max(context.patterns.length, 1)) * 40

  // Signature similarity (30%)
  if (
    context.methodSignature &&
    snippet.methodSignature?.includes(context.methodSignature.split('(')[0])
  ) {
    score += 30
  }

  // Reusability score (20%)
  score += (snippet.reusabilityScore / 100) * 20

  // Code length similarity (10%)
  const lengthRatio = snippet.code.length / Math.max(incompleteCode.length, 1)
  if (lengthRatio > 0.5 && lengthRatio < 2) {
    score += 10
  }

  return Math.min(score, 100)
}

/**
 * Step 4: Relevance-Guided Context Selection
 * Filters and ranks retrieved snippets
 */
export function selectRelevantContext(
  retrievedSnippets: CodeSnippet[],
  context: SemanticContext,
  incompleteCode: string,
  threshold: number = 30
): RankedSnippet[] {
  // Score all snippets
  const scored = retrievedSnippets.map((snippet) => {
    const relevanceScore = scoreRelevance(snippet, context, incompleteCode)
    const matchedPatterns = context.patterns.filter((pattern) =>
      snippet.code.toLowerCase().includes(pattern.toLowerCase())
    )

    return {
      ...snippet,
      relevanceScore,
      matchedPatterns,
    }
  })

  // Filter by threshold and sort by relevance
  return scored
    .filter((snippet) => snippet.relevanceScore >= threshold)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 5) // Top 5 most relevant
}

/**
 * Step 5: LLM Processing with Selected Context
 * Generates code completion using the selected context
 */
export async function generateCodeCompletion(
  incompleteCode: string,
  selectedContext: RankedSnippet[],
  semanticContext: SemanticContext,
  language: string = 'python'
): Promise<string> {
  // Build context examples
  const contextExamples = selectedContext
    .map(
      (snippet, idx) => `
Example ${idx + 1} (Relevance: ${snippet.relevanceScore.toFixed(1)}%):
\`\`\`${language}
${snippet.code}
\`\`\`
From: ${snippet.path}
Patterns: ${snippet.matchedPatterns.join(', ')}
`
    )
    .join('\n')

  const semanticInfo = [
    semanticContext.methodSignature && `Method: ${semanticContext.methodSignature}`,
    semanticContext.classSignature && `Class: ${semanticContext.classSignature}`,
    semanticContext.packageSignature && `Package: ${semanticContext.packageSignature}`,
    semanticContext.patterns.length > 0 &&
      `Patterns Detected: ${semanticContext.patterns.join(', ')}`,
  ]
    .filter(Boolean)
    .join('\n')

  const prompt = `You are an AI code completion assistant. Using the following similar examples and semantic context, complete the ${language} code.

Semantic Context:
${semanticInfo || 'None detected'}

Similar Code Examples:
${contextExamples}

Incomplete Code to Complete:
\`\`\`${language}
${incompleteCode}
\`\`\`

Rules:
1. Complete the code in the same style and patterns as the examples
2. Match the semantic context (method/class signatures)
3. Ensure the completion is syntactically correct
4. Add comments for complex logic
5. Return ONLY the completed code within triple backticks, no explanation

Complete the code:
\`\`\`${language}`

  try {
    const response = await getAnthropic().messages.create({
      model: getAnthropicModel(),
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    // Extract code from response
    const codeMatch = content.text.match(/```[\s\S]*?```/)
    if (codeMatch) {
      // Remove triple backticks and language identifier
      return codeMatch[0].replace(/^```.*?\n/, '').replace(/\n?```$/, '')
    }

    return content.text
  } catch (error) {
    console.error('[v0] Error generating completion:', error)
    throw error
  }
}

/**
 * Full Workflow: Relevance-Guided Code Completion Pipeline
 */
export async function generateRelevanceGuidedCompletion(
  incompleteCode: string,
  codebaseSnippets: CodeSnippet[],
  language: string = 'python'
): Promise<{
  completion: string
  context: SemanticContext
  selectedSnippets: RankedSnippet[]
  steps: string[]
}> {
  const steps: string[] = []

  try {
    // Step 1: Analyze incomplete code for semantic context
    steps.push('Analyzing incomplete code for semantic context...')
    const semanticContext = await analyzeIncompleteCode(incompleteCode, language)
    steps.push(`✓ Extracted context: ${semanticContext.patterns.length} patterns detected`)

    // Step 2: Retrieve similar functions from codebase
    steps.push('Retrieving similar functions from codebase...')
    const retrievedSnippets = await retrieveSimilarFunctions(semanticContext, codebaseSnippets)
    steps.push(`✓ Retrieved ${retrievedSnippets.length} similar functions`)

    // Step 3 & 4: Score and select relevant context
    steps.push('Scoring relevance and selecting best context...')
    const selectedSnippets = selectRelevantContext(
      retrievedSnippets,
      semanticContext,
      incompleteCode
    )
    steps.push(`✓ Selected ${selectedSnippets.length} most relevant snippets`)

    // Step 5: Generate completion with selected context
    steps.push('Generating code completion with LLM...')
    const completion = await generateCodeCompletion(
      incompleteCode,
      selectedSnippets,
      semanticContext,
      language
    )
    steps.push('✓ Code completion generated successfully')

    return {
      completion,
      context: semanticContext,
      selectedSnippets,
      steps,
    }
  } catch (error) {
    steps.push(`✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    throw error
  }
}

/**
 * Batch processing for multiple code snippets
 */
export async function batchGenerateCompletions(
  incompleteCodeList: string[],
  codebaseSnippets: CodeSnippet[],
  language: string = 'python'
): Promise<
  Array<{
    code: string
    completion: string
    success: boolean
    error?: string
  }>
> {
  return Promise.all(
    incompleteCodeList.map(async (code) => {
      try {
        const result = await generateRelevanceGuidedCompletion(code, codebaseSnippets, language)
        return {
          code,
          completion: result.completion,
          success: true,
        }
      } catch (error) {
        return {
          code,
          completion: '',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    })
  )
}
