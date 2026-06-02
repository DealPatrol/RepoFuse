import { z } from 'zod'

export const BuildPlanContentSchema = z.object({
  product_requirements: z.object({
    overview: z.string(),
    target_users: z.array(z.string()),
    goals: z.array(z.string()),
    features: z.array(
      z.object({
        name: z.string(),
        description: z.string(),
        priority: z.enum(['must', 'should', 'could']),
      }),
    ),
    non_functional: z.array(z.string()),
  }),
  tech_stack: z.object({
    frontend: z.array(z.object({ name: z.string(), reason: z.string() })),
    backend: z.array(z.object({ name: z.string(), reason: z.string() })),
    database: z.array(z.object({ name: z.string(), reason: z.string() })),
    infrastructure: z.array(z.object({ name: z.string(), reason: z.string() })),
    existing_reuse: z.array(z.string()),
  }),
  database_schema: z.object({
    tables: z.array(
      z.object({
        name: z.string(),
        description: z.string(),
        columns: z.array(
          z.object({
            name: z.string(),
            type: z.string(),
            constraints: z.string().optional(),
            description: z.string().optional(),
          }),
        ),
        relationships: z.array(z.string()).optional(),
      }),
    ),
  }),
  api_routes: z.array(
    z.object({
      method: z.string(),
      path: z.string(),
      description: z.string(),
      auth_required: z.boolean(),
    }),
  ),
  frontend_pages: z.array(
    z.object({
      path: z.string(),
      name: z.string(),
      description: z.string(),
      components: z.array(z.string()),
    }),
  ),
  components: z.array(
    z.object({
      name: z.string(),
      path: z.string(),
      description: z.string(),
      props: z.array(z.string()).optional(),
    }),
  ),
  deployment_plan: z.object({
    stages: z.array(
      z.object({
        name: z.string(),
        description: z.string(),
        tasks: z.array(z.string()),
      }),
    ),
    hosting_recommendation: z.string(),
    ci_cd: z.array(z.string()),
    environment_variables: z.array(z.string()),
  }),
  monetization: z.object({
    model: z.string(),
    suggestions: z.array(
      z.object({
        strategy: z.string(),
        description: z.string(),
        pricing_hint: z.string().optional(),
      }),
    ),
  }),
  mvp_timeline: z.object({
    total_weeks: z.number(),
    phases: z.array(
      z.object({
        name: z.string(),
        duration: z.string(),
        deliverables: z.array(z.string()),
        dependencies: z.array(z.string()).optional(),
      }),
    ),
  }),
})

export type BuildPlanContent = z.infer<typeof BuildPlanContentSchema>

export interface BuildPlan {
  id: string
  blueprint_id: string
  content: BuildPlanContent
  version: number
  created_at: string
  updated_at: string
}

export const BUILD_PLAN_SECTIONS = [
  { key: 'product_requirements', title: 'Product Requirements', shortTitle: 'PRD' },
  { key: 'tech_stack', title: 'Recommended Tech Stack', shortTitle: 'Stack' },
  { key: 'database_schema', title: 'Database Schema', shortTitle: 'Schema' },
  { key: 'api_routes', title: 'API Routes', shortTitle: 'API' },
  { key: 'frontend_pages', title: 'Frontend Pages', shortTitle: 'Pages' },
  { key: 'components', title: 'Component List', shortTitle: 'Components' },
  { key: 'deployment_plan', title: 'Deployment Plan', shortTitle: 'Deploy' },
  { key: 'monetization', title: 'Monetization', shortTitle: 'Revenue' },
  { key: 'mvp_timeline', title: 'MVP Timeline', shortTitle: 'Timeline' },
] as const

export type BuildPlanSectionKey = (typeof BUILD_PLAN_SECTIONS)[number]['key']

export function buildPlanSectionToMarkdown(
  key: BuildPlanSectionKey,
  content: BuildPlanContent,
): string {
  switch (key) {
    case 'product_requirements': {
      const prd = content.product_requirements
      return [
        '# Product Requirements',
        '',
        prd.overview,
        '',
        '## Target Users',
        ...prd.target_users.map((u) => `- ${u}`),
        '',
        '## Goals',
        ...prd.goals.map((g) => `- ${g}`),
        '',
        '## Features',
        ...prd.features.map(
          (f) => `- **[${f.priority.toUpperCase()}]** ${f.name}: ${f.description}`,
        ),
        '',
        '## Non-Functional Requirements',
        ...prd.non_functional.map((n) => `- ${n}`),
      ].join('\n')
    }
    case 'tech_stack': {
      const stack = content.tech_stack
      const formatItems = (label: string, items: { name: string; reason: string }[]) =>
        items.length
          ? [`## ${label}`, ...items.map((i) => `- **${i.name}** — ${i.reason}`), '']
          : []
      return [
        '# Recommended Tech Stack',
        '',
        ...formatItems('Frontend', stack.frontend),
        ...formatItems('Backend', stack.backend),
        ...formatItems('Database', stack.database),
        ...formatItems('Infrastructure', stack.infrastructure),
        '## Existing Code to Reuse',
        ...stack.existing_reuse.map((r) => `- ${r}`),
      ].join('\n')
    }
    case 'database_schema': {
      const schema = content.database_schema
      const tables = schema.tables.map((table) => {
        const cols = table.columns
          .map(
            (c) =>
              `| ${c.name} | ${c.type} | ${c.constraints ?? ''} | ${c.description ?? ''} |`,
          )
          .join('\n')
        const rels = table.relationships?.length
          ? ['', 'Relationships:', ...table.relationships.map((r) => `- ${r}`)]
          : []
        return [
          `## ${table.name}`,
          table.description,
          '',
          '| Column | Type | Constraints | Description |',
          '| --- | --- | --- | --- |',
          cols,
          ...rels,
          '',
        ].join('\n')
      })
      return ['# Database Schema', '', ...tables].join('\n')
    }
    case 'api_routes': {
      return [
        '# API Routes',
        '',
        '| Method | Path | Auth | Description |',
        '| --- | --- | --- | --- |',
        ...content.api_routes.map(
          (r) =>
            `| ${r.method} | ${r.path} | ${r.auth_required ? 'Yes' : 'No'} | ${r.description} |`,
        ),
      ].join('\n')
    }
    case 'frontend_pages': {
      return [
        '# Frontend Pages',
        '',
        ...content.frontend_pages.flatMap((page) => [
          `## ${page.name} (\`${page.path}\`)`,
          page.description,
          '',
          'Components:',
          ...page.components.map((c) => `- ${c}`),
          '',
        ]),
      ].join('\n')
    }
    case 'components': {
      return [
        '# Component List',
        '',
        ...content.components.map((c) => {
          const props = c.props?.length
            ? [`Props: ${c.props.join(', ')}`]
            : []
          return [`## ${c.name}`, `\`${c.path}\``, c.description, ...props, ''].join('\n')
        }),
      ].join('\n')
    }
    case 'deployment_plan': {
      const plan = content.deployment_plan
      return [
        '# Deployment Plan',
        '',
        `**Hosting:** ${plan.hosting_recommendation}`,
        '',
        '## CI/CD',
        ...plan.ci_cd.map((c) => `- ${c}`),
        '',
        '## Environment Variables',
        ...plan.environment_variables.map((v) => `- \`${v}\``),
        '',
        ...plan.stages.flatMap((stage) => [
          `## ${stage.name}`,
          stage.description,
          '',
          ...stage.tasks.map((t) => `- [ ] ${t}`),
          '',
        ]),
      ].join('\n')
    }
    case 'monetization': {
      const m = content.monetization
      return [
        '# Monetization',
        '',
        `**Primary model:** ${m.model}`,
        '',
        ...m.suggestions.map((s) => {
          const price = s.pricing_hint ? ` (${s.pricing_hint})` : ''
          return `- **${s.strategy}**${price}: ${s.description}`
        }),
      ].join('\n')
    }
    case 'mvp_timeline': {
      const timeline = content.mvp_timeline
      return [
        '# MVP Timeline',
        '',
        `**Total duration:** ${timeline.total_weeks} weeks`,
        '',
        ...timeline.phases.flatMap((phase) => [
          `## ${phase.name} (${phase.duration})`,
          ...phase.deliverables.map((d) => `- ${d}`),
          ...(phase.dependencies?.length
            ? ['', 'Dependencies:', ...phase.dependencies.map((d) => `- ${d}`)]
            : []),
          '',
        ]),
      ].join('\n')
    }
    default:
      return ''
  }
}

export function buildPlanToMarkdown(appName: string, content: BuildPlanContent): string {
  const sections = BUILD_PLAN_SECTIONS.map(({ key }) =>
    buildPlanSectionToMarkdown(key, content),
  )
  return [`# Build Plan: ${appName}`, '', ...sections].join('\n\n')
}

const CURSOR_PROMPT_CHAR_LIMIT = 8000

export function buildCursorPrompt(appName: string, content: BuildPlanContent): string {
  const markdown = buildPlanToMarkdown(appName, content)
  const instruction = `Build the "${appName}" application according to this complete build plan. Follow the tech stack, schema, API routes, pages, and components specified below. Start with the MVP timeline phase 1 deliverables.\n\n`
  const full = instruction + markdown
  if (full.length <= CURSOR_PROMPT_CHAR_LIMIT) return full
  return full.slice(0, CURSOR_PROMPT_CHAR_LIMIT - 20) + '\n\n[Truncated]'
}

export function buildCursorDeeplinks(prompt: string): { web: string; app: string } {
  const encoded = encodeURIComponent(prompt)
  return {
    web: `https://cursor.com/link/prompt?text=${encoded}`,
    app: `cursor://anysphere.cursor-deeplink/prompt?text=${encoded}`,
  }
}
