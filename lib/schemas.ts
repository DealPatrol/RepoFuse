import { z } from 'zod'

const nonEmptyString = z.string().trim().min(1)

export const templateAppSchema = z.object({
  app_name: nonEmptyString.max(120),
  app_type: nonEmptyString.max(120),
  description: nonEmptyString.max(4000),
  technologies: z.array(nonEmptyString.max(100)).max(50),
  difficulty_level: nonEmptyString.max(120),
  ai_explanation: z.string().trim().max(10000),
  missing_files: z.array(nonEmptyString.max(260)).max(200),
})

export const exportAppSchema = templateAppSchema.extend({
  is_complete: z.boolean(),
  reuse_percentage: z.number().min(0).max(100),
  missing_files_count: z.number().int().min(0),
  fast_cash_label: z.string().trim().max(120).optional(),
})

export const exportRequestSchema = z.object({
  app: exportAppSchema,
})

export const githubRepositoryUrlSchema = z.string().trim().url().refine((value) => {
  const parsed = new URL(value)
  return parsed.hostname === 'github.com' || parsed.hostname === 'www.github.com'
}, 'Repository URL must point to github.com')

export function parseGitHubRepositoryUrl(url: string) {
  const parsed = new URL(url)
  const segments = parsed.pathname
    .split('/')
    .filter(Boolean)
    .slice(0, 2)

  if (segments.length < 2) {
    return null
  }

  const [owner, repo] = segments
  const repoName = repo.replace(/\.git$/, '')

  if (!owner || !repoName) {
    return null
  }

  return { owner, repo: repoName }
}

export const createRepositoryRequestSchema = z.object({
  url: githubRepositoryUrlSchema,
})

export const createAnalysisRequestSchema = z.object({
  name: nonEmptyString.max(120),
  repositoryIds: z.array(nonEmptyString).optional(),
  repo_ids: z.array(nonEmptyString).optional(),
}).transform((data) => {
  const repositoryIds = Array.from(new Set(data.repositoryIds ?? data.repo_ids ?? []))

  return {
    name: data.name,
    repositoryIds,
  }
}).refine((data) => data.repositoryIds.length > 0, {
  message: 'At least one repository is required',
  path: ['repositoryIds'],
})

export const generateScaffoldRequestSchema = z.object({
  appName: nonEmptyString.max(120),
  description: nonEmptyString.max(4000),
  technologies: z.array(nonEmptyString.max(100)).min(1).max(50),
  existingFiles: z.array(nonEmptyString.max(260)).max(500).default([]),
  missingFiles: z.array(nonEmptyString.max(260)).max(500).default([]),
})

export const generatedScaffoldSchema = z.object({
  structure: z.record(z.string(), z.any()),
  files: z.record(z.string(), z.union([
    z.string(),
    z.object({
      content: z.string(),
    }).passthrough(),
  ])),
})

export const createGitHubRepositoryRequestSchema = z.object({
  app: templateAppSchema,
  repoName: z.string().trim().min(1).max(100).regex(/^[A-Za-z0-9._-]+$/, {
    message: 'Repository names may only contain letters, numbers, dots, underscores, and hyphens',
  }),
})

