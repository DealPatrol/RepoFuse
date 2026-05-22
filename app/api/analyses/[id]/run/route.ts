import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { getCurrentAccessToken, getCurrentUser } from '@/lib/auth'
import {
  getGitHubRepositoryTree,
  getGitHubRepositoryTreeFromBranch,
  shouldSkipRepoPath,
} from '@/lib/github'
import {
  getAnalysisById,
  getRepositoriesForAnalysis,
  updateAnalysisStatus,
  createRepoFile,
  createBlueprint,
  deleteBlueprintsByAnalysis,
  getBlueprintsByAnalysis,
  getSubscriptionByGithubId,
  upsertSubscription,
  incrementAnalysisUsage,
} from '@/lib/queries'
import { getAnthropicModel } from '@/lib/anthropic-model'
import { isPaidPlan, PLANS } from '@/lib/stripe'

// Schema for AI-generated app blueprints
const complexityEnum = z.preprocess((val) => {
  if (typeof val !== 'string') return 'moderate'
  const v = val.trim().toLowerCase()
  if (v === 'easy' || v === 'low' || v === 'trivial' || v === 'basic' || v === 'simple') return 'simple'
  if (v === 'medium' || v === 'intermediate' || v === 'average' || v === 'moderate') return 'moderate'
  if (v === 'hard' || v === 'high' || v === 'advanced' || v === 'difficult' || v === 'complex') return 'complex'
  return 'moderate'
}, z.enum(['simple', 'moderate', 'complex']))

const existingFileSchema = z.union([
  z.object({ path: z.string(), purpose: z.string().default('') }).passthrough(),
  z.string().transform((s) => ({ path: s, purpose: '' })),
])

const missingFileSchema = z.union([
  z.object({ name: z.string(), purpose: z.string().default('') }).passthrough(),
  z.string().transform((s) => ({ name: s, purpose: '' })),
])

const BlueprintSchema = z.object({
  name: z.string(),
  description: z.string().default(''),
  app_type: z.string().default('web app'),
  complexity: complexityEnum.default('moderate'),
  reuse_percentage: z.coerce.number().min(0).max(100).default(50),
  existing_files: z.array(existingFileSchema).default([]),
  missing_files: z.array(missingFileSchema).default([]),
  technologies: z.array(z.string()).default([]),
  explanation: z.string().default(''),
}).passthrough()

function parseBlueprints(rawInput: unknown): z.infer<typeof BlueprintSchema>[] {
  if (!rawInput || typeof rawInput !== 'object') return []

  const input = rawInput as Record<string, unknown>
  let rawBlueprints: unknown[] = []

  if (Array.isArray(input.blueprints)) {
    rawBlueprints = input.blueprints
  } else if (Array.isArray(input)) {
    rawBlueprints = input
  } else if (Array.isArray(input.apps)) {
    rawBlueprints = input.apps
  } else if (Array.isArray(input.results)) {
    rawBlueprints = input.results
  }

  if (rawBlueprints.length === 0) return []

  const valid: z.infer<typeof BlueprintSchema>[] = []
  for (const item of rawBlueprints) {
    if (!item || typeof item !== 'object') continue
    const bp = item as Record<string, unknown>
    const name = bp.name ?? bp.app_name ?? bp.title
    if (typeof name !== 'string' || !name.trim()) continue

    const rawExisting = bp.existing_files ?? bp.reusable_files ?? bp.files_to_reuse ?? []
    const rawMissing = bp.missing_files ?? bp.files_needed ?? bp.new_files ?? bp.files_to_create ?? []

    const existingFiles = Array.isArray(rawExisting) ? rawExisting.map((f: unknown) => {
      if (typeof f === 'string') return f
      if (f && typeof f === 'object') {
        const fo = f as Record<string, unknown>
        return { path: fo.path ?? fo.file ?? fo.filename ?? fo.name ?? '', purpose: fo.purpose ?? fo.description ?? fo.reason ?? '' }
      }
      return null
    }).filter(Boolean) : []

    const missingFiles = Array.isArray(rawMissing) ? rawMissing.map((f: unknown) => {
      if (typeof f === 'string') return f
      if (f && typeof f === 'object') {
        const fo = f as Record<string, unknown>
        return { name: fo.name ?? fo.file ?? fo.filename ?? fo.path ?? '', purpose: fo.purpose ?? fo.description ?? fo.reason ?? '' }
      }
      return null
    }).filter(Boolean) : []

    const normalized = {
      ...bp,
      name,
      description: bp.description ?? bp.summary ?? bp.overview ?? '',
      app_type: bp.app_type ?? bp.type ?? bp.category ?? 'web app',
      explanation: bp.explanation ?? bp.ai_explanation ?? bp.rationale ?? bp.reasoning ?? '',
      reuse_percentage: bp.reuse_percentage ?? bp.reuse ?? bp.reusability ?? 50,
      existing_files: existingFiles,
      missing_files: missingFiles,
      technologies: bp.technologies ?? bp.tech_stack ?? bp.stack ?? [],
    }

    const result = BlueprintSchema.safeParse(normalized)
    if (result.success) {
      valid.push(result.data)
    } else {
      console.warn('[analysis] Skipping invalid blueprint:', name, result.error.flatten().fieldErrors)
    }
  }

  return valid
}

const CODE_EXTENSIONS = new Set([
  'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs',
  'py', 'go', 'rs', 'java', 'rb', 'php', 'vue', 'svelte',
  'css', 'scss', 'html', 'json', 'md', 'yml', 'yaml',
])

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Create a stream for progress updates
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        const accessToken = await getCurrentAccessToken()
        if (!accessToken) {
          send({ error: 'Sign in with GitHub before running an analysis.' })
          controller.close()
          return
        }
        if (!process.env.ANTHROPIC_API_KEY) {
          send({ error: 'AI analysis is not configured. Missing ANTHROPIC_API_KEY.' })
          controller.close()
          return
        }

        const user = await getCurrentUser()
        if (user) {
          let sub = await getSubscriptionByGithubId(user.github_id).catch(() => null)
          if (!sub) {
            sub = await upsertSubscription({ github_id: user.github_id }).catch(() => null)
          }
          if (sub && !isPaidPlan(sub.plan)) {
            const limit = PLANS.free.analyses_per_month
            if (sub.analyses_used_this_month >= limit) {
              send({ error: `You've reached your free plan limit of ${limit} analyses per month. Upgrade to Pro for unlimited analyses.`, status: 'failed' })
              controller.close()
              return
            }
          }
        }

        // Get analysis and repositories
        const analysis = await getAnalysisById(id)
        if (!analysis) {
          send({ error: 'Analysis not found' })
          controller.close()
          return
        }
        if (analysis.status === 'scanning' || analysis.status === 'analyzing') {
          send({ error: 'Analysis is already running. Please wait for it to finish.' })
          controller.close()
          return
        }

        const repositories = await getRepositoriesForAnalysis(id)
        if (repositories.length === 0) {
          send({ error: 'No repositories linked to this analysis' })
          controller.close()
          return
        }

        // Update status to scanning
        await updateAnalysisStatus(id, 'scanning')
        await deleteBlueprintsByAnalysis(id)
        send({ status: 'scanning', progress: 10 })

        // Fetch file trees from GitHub for each repository
        const allFiles: { repo: string; path: string; type: string }[] = []
        const repoErrors: string[] = []

        for (const repo of repositories) {
          try {
            let treeData: Awaited<ReturnType<typeof getGitHubRepositoryTreeFromBranch>>
            try {
              treeData = await getGitHubRepositoryTreeFromBranch(
                repo.full_name,
                repo.default_branch,
                accessToken,
              )
            } catch {
              treeData = await getGitHubRepositoryTree(repo.full_name, repo.default_branch, accessToken)
            }

            if (treeData.truncated) {
              console.warn(`[analysis] Git tree truncated for ${repo.full_name}; sampling first matching files only`)
            }

            const files = treeData.tree
              ?.filter((item) => item.type === 'blob')
              ?.filter((item) => !shouldSkipRepoPath(item.path))
              ?.filter((item) => {
                const ext = item.path.split('.').pop()?.toLowerCase()
                return ext ? CODE_EXTENSIONS.has(ext) : false
              })
              ?.slice(0, 200) || []

            for (const file of files) {
              allFiles.push({
                repo: repo.full_name,
                path: file.path,
                type: file.path.split('.').pop() || 'unknown',
              })

              await createRepoFile({
                repository_id: repo.id,
                path: file.path,
                name: file.path.split('/').pop() || file.path,
                extension: file.path.split('.').pop() || null,
                size_bytes: file.size || null,
                file_type: getFileType(file.path),
              })
            }
          } catch (e) {
            const errMsg = e instanceof Error ? e.message : String(e)
            console.error(`Error fetching tree for ${repo.full_name}:`, e)
            repoErrors.push(`${repo.full_name}: ${errMsg}`)
          }
        }

        if (allFiles.length === 0) {
          const details = repoErrors.length > 0
            ? `Repository errors: ${repoErrors.join('; ')}`
            : 'After skipping dependencies/build folders, no qualifying source files remain.'
          const msg = `No source files found to analyze. ${details} Add repos with application code or check your GitHub access token.`
          send({ status: 'failed', error: msg })
          await updateAnalysisStatus(id, 'failed', { error_message: msg })
          controller.close()
          return
        }

        send({ status: 'scanning', progress: 40 })

        // Update to analyzing
        await updateAnalysisStatus(id, 'analyzing', { total_files: allFiles.length })
        send({ status: 'analyzing', progress: 50 })

        // Build file summary for AI (cap at 400 files to keep prompt reasonable)
        const filesToSend = allFiles.slice(0, 400)
        const fileSummary = filesToSend.map(f => `- ${f.repo}: ${f.path}`).join('\n')

        // Use Claude to analyze and discover app blueprints (structured tool output)
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

        const userPrompt = `You are acting as an expert software architect and product strategist.
Analyze these files from GitHub repositories and discover what applications can be built by combining and reusing the existing code.

REPOSITORIES AND FILES:
${fileSummary}

Identify 3-6 practical applications that match these buckets:
1) Quick wins (ship-ready or very close),
2) Missing only a few files,
3) Larger but still feasible foundations.

For each app blueprint:
- Give it a clear, descriptive name
- Describe what the app does
- Estimate complexity (simple/moderate/complex)
- Calculate reuse percentage (how much existing code can be reused) and be realistic
- List existing files that can be reused (with their purpose); prefer highest-value files
- List missing files needed (with their purpose)
- For missing_files.name, provide concrete file paths (e.g. "app/api/billing/route.ts")
- List technologies detected
- Provide a brief explanation of why this app is possible, including a suggested first build step

Constraints:
- Use ONLY evidence from the provided files; do not invent major subsystems.
- Prefer opportunities that combine code across multiple repositories where possible.
- Keep missing_files concise and implementation-oriented.
- Avoid duplicate ideas that differ only by naming.
- Focus on practical, buildable applications based on the actual code patterns you see.`

        const aiResponse = await client.messages.create({
          model: getAnthropicModel(),
          max_tokens: 16384,
          system: [
            {
              type: 'text',
              text: 'You are an expert software architect. Your job is to analyze GitHub repository file structures and identify what new applications can be built by combining and reusing the existing code. Focus on practical, buildable applications based on actual code patterns.',
              cache_control: { type: 'ephemeral' },
            },
          ],
          tools: [
            {
              name: 'report_blueprints',
              description: 'Report the discovered app blueprints based on repository file analysis',
              input_schema: {
                type: 'object' as const,
                properties: {
                  blueprints: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string', description: 'Clear, descriptive name for the app' },
                        description: { type: 'string', description: 'What the app does' },
                        app_type: { type: 'string', description: 'Type of application (e.g. web app, CLI tool, API service)' },
                        complexity: { type: 'string', enum: ['simple', 'moderate', 'complex'] },
                        reuse_percentage: { type: 'number', minimum: 0, maximum: 100, description: 'Percentage of existing code that can be reused' },
                        existing_files: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              path: { type: 'string' },
                              purpose: { type: 'string' },
                            },
                            required: ['path', 'purpose'],
                          },
                          description: 'Existing files that can be reused',
                        },
                        missing_files: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              name: { type: 'string' },
                              purpose: { type: 'string' },
                            },
                            required: ['name', 'purpose'],
                          },
                          description: 'New files that need to be created',
                        },
                        technologies: { type: 'array', items: { type: 'string' }, description: 'Technologies detected' },
                        explanation: { type: 'string', description: 'Brief explanation of why this app is feasible' },
                      },
                      required: ['name', 'description', 'app_type', 'complexity', 'reuse_percentage', 'existing_files', 'missing_files', 'technologies', 'explanation'],
                    },
                  },
                },
                required: ['blueprints'],
              },
            },
          ],
          tool_choice: { type: 'tool', name: 'report_blueprints' },
          messages: [
            {
              role: 'user',
              content: userPrompt,
            },
          ],
        })

        send({ status: 'analyzing', progress: 80 })

        // Check if response was truncated (hit max_tokens)
        if (aiResponse.stop_reason === 'max_tokens') {
          console.warn('[analysis] AI response truncated (max_tokens). Tool output may be incomplete.')
        }

        // Extract structured output from tool use response
        let toolUseBlock = aiResponse.content.find(
          (block) =>
            block.type === 'tool_use' &&
            'name' in block &&
            (block as { name: string }).name === 'report_blueprints',
        )
        if (!toolUseBlock) {
          toolUseBlock = aiResponse.content.find((block) => block.type === 'tool_use')
        }
        const rawInput = toolUseBlock?.type === 'tool_use' ? toolUseBlock.input : null

        const blueprintsFromAI = parseBlueprints(rawInput)

        if (blueprintsFromAI.length === 0) {
          const wasMaxTokens = aiResponse.stop_reason === 'max_tokens'
          const msg = wasMaxTokens
            ? 'AI response was cut short (output too large). Try running with fewer repositories selected.'
            : rawInput
              ? 'AI returned empty results. Try running the analysis again — this can happen intermittently.'
              : 'Model did not return usable blueprints (missing tool output). Check ANTHROPIC_API_KEY and model availability.'
          console.error('[analysis] No valid blueprints.', { stop_reason: aiResponse.stop_reason, rawInput: JSON.stringify(rawInput).slice(0, 500) })
          send({ status: 'failed', error: msg })
          await updateAnalysisStatus(id, 'failed', { error_message: msg })
          controller.close()
          return
        }

        // Save blueprints to database
        {
          const rankedBlueprints = blueprintsFromAI
            .map((bp) => normalizeBlueprint(bp))
            .sort((a, b) => getOpportunityScore(b) - getOpportunityScore(a))

          for (const bp of rankedBlueprints) {
            await createBlueprint({
              analysis_id: id,
              name: bp.name.slice(0, 255),
              description: bp.description,
              app_type: bp.app_type?.slice(0, 100) ?? null,
              complexity: bp.complexity,
              reuse_percentage: bp.reuse_percentage,
              existing_files: bp.existing_files,
              missing_files: bp.missing_files,
              estimated_effort: getEffortEstimate(bp.complexity, bp.missing_files.length),
              technologies: bp.technologies,
              ai_explanation: bp.explanation,
            })
          }
        }

        // Update to complete
        await updateAnalysisStatus(id, 'complete', { analyzed_files: allFiles.length })

        if (user) {
          await incrementAnalysisUsage(user.github_id).catch((e) =>
            console.error('[analysis] Failed to increment usage:', e)
          )
        }

        // Get final blueprints
        const finalBlueprints = await getBlueprintsByAnalysis(id)

        send({ status: 'complete', progress: 100, blueprints: finalBlueprints })
        controller.close()

      } catch (error) {
        console.error('Analysis error:', error)
        const errorDetail = error instanceof Error ? error.message : 'Unknown error'
        try {
          await updateAnalysisStatus(id, 'failed', { error_message: errorDetail })
        } catch (dbErr) {
          console.error('Failed to update analysis status after error:', dbErr)
        }
        send({ status: 'failed', error: `Analysis failed: ${errorDetail}` })
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

function getFileType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase()
  const name = path.split('/').pop()?.toLowerCase() || ''

  if (name.includes('component') || path.includes('/components/')) return 'component'
  if (name.includes('hook') || name.startsWith('use')) return 'hook'
  if (name.includes('util') || path.includes('/utils/') || path.includes('/lib/')) return 'utility'
  if (name.includes('api') || path.includes('/api/')) return 'api'
  if (name.includes('page') || path.includes('/pages/') || path.includes('/app/')) return 'page'
  if (name.includes('layout')) return 'layout'
  if (name.includes('test') || name.includes('spec')) return 'test'
  if (name.includes('config')) return 'config'
  if (ext === 'css' || ext === 'scss') return 'style'

  return 'source'
}

function getEffortEstimate(complexity: string, missingFiles: number): string {
  if (complexity === 'simple' && missingFiles <= 2) return '1-2 hours'
  if (complexity === 'simple') return '2-4 hours'
  if (complexity === 'moderate' && missingFiles <= 5) return '1-2 days'
  if (complexity === 'moderate') return '2-3 days'
  if (complexity === 'complex' && missingFiles <= 10) return '3-5 days'
  return '1-2 weeks'
}

function getOpportunityScore(bp: {
  reuse_percentage: number
  missing_files: { name: string; purpose: string }[]
  complexity: 'simple' | 'moderate' | 'complex'
}): number {
  const missing = bp.missing_files.length
  const complexityPenalty = bp.complexity === 'simple' ? 0 : bp.complexity === 'moderate' ? 8 : 16
  return bp.reuse_percentage - (missing * 6) - complexityPenalty
}

function normalizeBlueprint(bp: {
  name: string
  description: string
  app_type: string
  complexity: 'simple' | 'moderate' | 'complex'
  reuse_percentage: number
  existing_files: { path: string; purpose: string }[]
  missing_files: { name: string; purpose: string }[]
  technologies: string[]
  explanation: string
}) {
  return {
    ...bp,
    reuse_percentage: Math.max(5, Math.min(95, Math.round(bp.reuse_percentage))),
    existing_files: bp.existing_files.slice(0, 8),
    missing_files: bp.missing_files.slice(0, 8),
    technologies: bp.technologies.slice(0, 8),
  }
}
