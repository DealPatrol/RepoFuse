import { NextRequest } from 'next/server'
import { aiConfigErrorMessage, getAnthropicClient, isAiConfigured } from '@/lib/ai-gateway'
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
  deleteBlueprintsByAnalysisExcept,
  deleteBlueprintsByIds,
  getBlueprintsByAnalysis,
  getSubscriptionByGithubId,
  upsertSubscription,
  incrementAnalysisUsage,
} from '@/lib/queries'
import { getAnthropicModel } from '@/lib/anthropic-model'
import { isOnFreeTier } from '@/lib/pro-access'
import { PLANS } from '@/lib/stripe'
import { generateGapsFromBlueprint, generateTemplatesFromBlueprints } from '@/lib/gap-generation'

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
      const replacementBlueprintIds: string[] = []

      try {
        const accessToken = await getCurrentAccessToken()
        if (!accessToken) {
          send({ error: 'Sign in with GitHub before running an analysis.' })
          controller.close()
          return
        }
        if (!isAiConfigured()) {
          send({ error: aiConfigErrorMessage() })
          controller.close()
          return
        }

        const user = await getCurrentUser()
        if (!user) {
          send({ error: 'Sign in with GitHub before running an analysis.' })
          controller.close()
          return
        }

        let sub = await getSubscriptionByGithubId(user.github_id).catch(() => null)
        if (!sub) {
          sub = await upsertSubscription({ github_id: user.github_id }).catch(() => null)
        }
        if (!sub) {
          send({ error: 'Unable to initialize billing usage. Please try again.', status: 'failed' })
          controller.close()
          return
        }
        if (isOnFreeTier(user, sub)) {
          const limit = PLANS.free.analyses_per_month
          if (sub.analyses_used_this_month >= limit) {
            send({ error: `You've reached your free plan limit of ${limit} analyses per month. Upgrade to Pro for unlimited analyses.`, status: 'failed' })
            controller.close()
            return
          }
        }

        // Get analysis and repositories
        const analysis = await getAnalysisById(id, user.id)
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

        const repositories = await getRepositoriesForAnalysis(id, user.id)
        if (repositories.length === 0) {
          send({ error: 'No repositories linked to this analysis' })
          controller.close()
          return
        }

        // Update status to scanning
        await updateAnalysisStatus(id, 'scanning')
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

        // Repo-level summary so the model knows what the user has ALREADY built
        const repoSummary = repositories
          .map(r => `- ${r.full_name}${r.language ? ` (${r.language})` : ''}: ${r.description ?? 'no description'}`)
          .join('\n')

        // Use Claude to analyze and discover app blueprints (structured tool output)
        const client = getAnthropicClient()

        const userPrompt = `You are acting as an expert software architect and product strategist.
The developer below has already shipped the products listed under EXISTING PRODUCTS. Your job is to find NEW products they could build by recombining the capabilities buried in their code — not to describe what they already have.

EXISTING PRODUCTS (already built — NEVER re-suggest these or close variants of them):
${repoSummary}

FILES AVAILABLE FOR REUSE:
${fileSummary}

First, privately inventory the transferable CAPABILITIES in these files — things like: authentication flows, payment/billing integration, file upload, data scraping, scheduling, email/notification systems, dashboards/charting, API clients, search, real-time features, AI/LLM integration. Capabilities transfer across domains even when the product doesn't.

Then propose 4-6 NEW applications that recombine those capabilities into different product categories.

HARD RULES — every suggestion must pass all of these:
1. NOT A REBUILD: if removing one or two features would turn the suggestion into one of the EXISTING PRODUCTS above, reject it and think of something else.
2. DIFFERENT MARKET: each suggestion must target a different audience, use case, or business model than the repo(s) it borrows code from. (Example: auth + Stripe billing from a developer SaaS could power a gym membership portal, a paywalled newsletter, or a booking system — same capabilities, completely different products.)
3. CROSS-REPO: prefer suggestions that combine files from at least two different repositories.
4. DIVERSE SET: no two suggestions may be in the same product category. Spread across e.g. B2B SaaS, consumer app, internal tool, marketplace, API-as-product, automation service.
5. HONEST REUSE: existing_files must reference real paths from the list, and reuse_percentage must be realistic. A genuinely new product with 40-60% reuse is far more valuable than a "95% reuse" suggestion that is the old app renamed. Do NOT inflate reuse by picking near-clones.

Distribution: at most ONE quick win (high reuse, few missing files); at least TWO ambitious cross-domain products where the missing files represent real new value.

For each app blueprint:
- Give it a clear, descriptive name
- Describe what the app does and WHO it is for
- Estimate complexity (simple/moderate/complex)
- Calculate reuse percentage realistically
- List existing files that can be reused (with their purpose); prefer highest-value files
- List missing files needed (with their purpose)
- For missing_files.name, provide concrete file paths (e.g. "app/api/billing/route.ts")
- List technologies detected
- In the explanation, name the capabilities being transferred and which repos they come from, plus a suggested first build step`

        const aiResponse = await client.messages.create({
          model: getAnthropicModel(),
          max_tokens: 16384,
          system: [
            {
              type: 'text',
              text: 'You are an expert software architect and product strategist. Your job is to analyze GitHub repository file structures and identify genuinely NEW applications that can be built by recombining existing code capabilities into different product categories. Never suggest rebuilds or minor variations of products the developer has already shipped — the value you provide is showing them markets and use cases their code unlocks that they have not thought of. Stay grounded: reuse claims must reference real files.',
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
          const msg = 'AI response was cut short (output too large). Try running with fewer repositories selected.'
          console.warn('[analysis] AI response truncated (max_tokens). Tool output may be incomplete.')
          send({ status: 'failed', error: msg })
          await updateAnalysisStatus(id, 'failed', { error_message: msg })
          controller.close()
          return
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
            const created = await createBlueprint({
              analysis_id: id,
              user_id: user.id,
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
            replacementBlueprintIds.push(created.id)
          }
        }

        await incrementAnalysisUsage(user.github_id)
        await deleteBlueprintsByAnalysisExcept(id, replacementBlueprintIds)

        // Update to complete
        await updateAnalysisStatus(id, 'complete', { analyzed_files: allFiles.length })

        // Get final blueprints and hydrate recurring-value surfaces from them.
        const finalBlueprints = await getBlueprintsByAnalysis(id, user.id)
        for (const blueprint of finalBlueprints) {
          await generateGapsFromBlueprint(blueprint)
        }
        await generateTemplatesFromBlueprints(finalBlueprints)

        send({ status: 'complete', progress: 100, blueprints: finalBlueprints })
        controller.close()

      } catch (error) {
        console.error('Analysis error:', error)
        const errorDetail = error instanceof Error ? error.message : 'Unknown error'
        try {
          await deleteBlueprintsByIds(replacementBlueprintIds)
        } catch (dbErr) {
          console.error('Failed to clean up partial replacement blueprints:', dbErr)
        }
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
