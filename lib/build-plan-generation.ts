import Anthropic from '@anthropic-ai/sdk'
import { getAnthropicModel } from '@/lib/anthropic-model'
import {
  BuildPlanContentSchema,
  type BuildPlanContent,
} from '@/lib/build-plan'
import type { AppBlueprint, Repository } from '@/lib/queries'

const BUILD_PLAN_TOOL_SCHEMA = {
  type: 'object' as const,
  properties: {
    product_requirements: {
      type: 'object',
      properties: {
        overview: { type: 'string' },
        target_users: { type: 'array', items: { type: 'string' } },
        goals: { type: 'array', items: { type: 'string' } },
        features: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              priority: { type: 'string', enum: ['must', 'should', 'could'] },
            },
            required: ['name', 'description', 'priority'],
          },
        },
        non_functional: { type: 'array', items: { type: 'string' } },
      },
      required: ['overview', 'target_users', 'goals', 'features', 'non_functional'],
    },
    tech_stack: {
      type: 'object',
      properties: {
        frontend: {
          type: 'array',
          items: {
            type: 'object',
            properties: { name: { type: 'string' }, reason: { type: 'string' } },
            required: ['name', 'reason'],
          },
        },
        backend: {
          type: 'array',
          items: {
            type: 'object',
            properties: { name: { type: 'string' }, reason: { type: 'string' } },
            required: ['name', 'reason'],
          },
        },
        database: {
          type: 'array',
          items: {
            type: 'object',
            properties: { name: { type: 'string' }, reason: { type: 'string' } },
            required: ['name', 'reason'],
          },
        },
        infrastructure: {
          type: 'array',
          items: {
            type: 'object',
            properties: { name: { type: 'string' }, reason: { type: 'string' } },
            required: ['name', 'reason'],
          },
        },
        existing_reuse: { type: 'array', items: { type: 'string' } },
      },
      required: ['frontend', 'backend', 'database', 'infrastructure', 'existing_reuse'],
    },
    database_schema: {
      type: 'object',
      properties: {
        tables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              columns: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    type: { type: 'string' },
                    constraints: { type: 'string' },
                    description: { type: 'string' },
                  },
                  required: ['name', 'type'],
                },
              },
              relationships: { type: 'array', items: { type: 'string' } },
            },
            required: ['name', 'description', 'columns'],
          },
        },
      },
      required: ['tables'],
    },
    api_routes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          method: { type: 'string' },
          path: { type: 'string' },
          description: { type: 'string' },
          auth_required: { type: 'boolean' },
        },
        required: ['method', 'path', 'description', 'auth_required'],
      },
    },
    frontend_pages: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          components: { type: 'array', items: { type: 'string' } },
        },
        required: ['path', 'name', 'description', 'components'],
      },
    },
    components: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          path: { type: 'string' },
          description: { type: 'string' },
          props: { type: 'array', items: { type: 'string' } },
        },
        required: ['name', 'path', 'description'],
      },
    },
    deployment_plan: {
      type: 'object',
      properties: {
        stages: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              tasks: { type: 'array', items: { type: 'string' } },
            },
            required: ['name', 'description', 'tasks'],
          },
        },
        hosting_recommendation: { type: 'string' },
        ci_cd: { type: 'array', items: { type: 'string' } },
        environment_variables: { type: 'array', items: { type: 'string' } },
      },
      required: ['stages', 'hosting_recommendation', 'ci_cd', 'environment_variables'],
    },
    monetization: {
      type: 'object',
      properties: {
        model: { type: 'string' },
        suggestions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              strategy: { type: 'string' },
              description: { type: 'string' },
              pricing_hint: { type: 'string' },
            },
            required: ['strategy', 'description'],
          },
        },
      },
      required: ['model', 'suggestions'],
    },
    mvp_timeline: {
      type: 'object',
      properties: {
        total_weeks: { type: 'number' },
        phases: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              duration: { type: 'string' },
              deliverables: { type: 'array', items: { type: 'string' } },
              dependencies: { type: 'array', items: { type: 'string' } },
            },
            required: ['name', 'duration', 'deliverables'],
          },
        },
      },
      required: ['total_weeks', 'phases'],
    },
  },
  required: [
    'product_requirements',
    'tech_stack',
    'database_schema',
    'api_routes',
    'frontend_pages',
    'components',
    'deployment_plan',
    'monetization',
    'mvp_timeline',
  ],
}

function formatBlueprintContext(
  blueprint: AppBlueprint,
  repositories: Repository[],
): string {
  const repoLines = repositories
    .map(
      (r) =>
        `- ${r.full_name} (${r.language ?? 'unknown language'}): ${r.description ?? 'No description'}`,
    )
    .join('\n')

  const existingFiles = blueprint.existing_files
    .map((f) => `- ${f.path}: ${f.purpose}`)
    .join('\n')

  const missingFiles = blueprint.missing_files
    .map((f) => `- ${f.name}: ${f.purpose}`)
    .join('\n')

  return [
    `App name: ${blueprint.name}`,
    `Description: ${blueprint.description ?? 'N/A'}`,
    `App type: ${blueprint.app_type ?? 'web app'}`,
    `Complexity: ${blueprint.complexity}`,
    `Reuse percentage: ${blueprint.reuse_percentage}%`,
    `Estimated effort: ${blueprint.estimated_effort ?? 'TBD'}`,
    `Technologies detected: ${blueprint.technologies.join(', ') || 'none listed'}`,
    '',
    'AI explanation:',
    blueprint.ai_explanation ?? 'N/A',
    '',
    'Source repositories:',
    repoLines || '- No repositories linked',
    '',
    'Existing reusable files:',
    existingFiles || '- None identified',
    '',
    'Missing files to build:',
    missingFiles || '- None identified',
  ].join('\n')
}

export async function generateBuildPlanContent(
  blueprint: AppBlueprint,
  repositories: Repository[],
): Promise<BuildPlanContent> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Build plan generation is not configured. Missing ANTHROPIC_API_KEY.')
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const context = formatBlueprintContext(blueprint, repositories)

  const userPrompt = `You are a senior product architect and full-stack engineer. A user discovered this app opportunity by analyzing their GitHub repositories with RepoFuse.

Generate a complete, actionable build plan for shipping this app as an MVP. Ground every recommendation in the repository analysis context below — reuse existing files where possible, and align the tech stack with detected technologies.

REPOSITORY ANALYSIS CONTEXT:
${context}

Requirements:
- Product requirements should be MVP-focused with clear must/should/could priorities
- Tech stack should prefer technologies already present in the user's repos
- Database schema should be practical for the MVP (3-8 tables max)
- API routes should cover core CRUD and auth flows
- Frontend pages and components should map to the missing files where relevant
- Deployment plan should be realistic for a solo developer or small team
- Monetization should include 2-4 concrete strategies
- MVP timeline should be 2-8 weeks total with phased deliverables

Use the report_build_plan tool to return structured JSON only.`

  const response = await client.messages.create({
    model: getAnthropicModel(),
    max_tokens: 16384,
    system: [
      {
        type: 'text',
        text: 'You are an expert product architect. Generate detailed, implementation-ready build plans grounded in actual repository analysis. Be specific with file paths, API routes, and schema columns.',
        cache_control: { type: 'ephemeral' },
      },
    ],
    tools: [
      {
        name: 'report_build_plan',
        description: 'Report the complete structured build plan for the app opportunity',
        input_schema: BUILD_PLAN_TOOL_SCHEMA,
      },
    ],
    tool_choice: { type: 'tool', name: 'report_build_plan' },
    messages: [{ role: 'user', content: userPrompt }],
  })

  const toolUse = response.content.find((block) => block.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('AI did not return a structured build plan')
  }

  const parsed = BuildPlanContentSchema.safeParse(toolUse.input)
  if (!parsed.success) {
    throw new Error(`Invalid build plan structure: ${parsed.error.message}`)
  }

  return parsed.data
}
