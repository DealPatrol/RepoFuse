import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import * as z from 'zod/v4'
import {
  analyzeGitHubRepositories,
  createGitHubRepositoryFromBlueprint,
  generateScaffold,
  listGitHubRepositories,
} from './repofuse-core.js'

export function createRepoFuseMcpServer({
  githubToken,
  analysisPromptRunner,
  scaffoldPromptRunner,
  allowCreateRepo = true,
  maxFilesPerRepo = 120,
  maxBlueprints = 5,
}) {
  const server = new McpServer({
    name: 'repofuse-mcp',
    version: '0.2.0',
  })

  server.registerTool(
    'list_github_repositories',
    {
      title: 'List GitHub repositories',
      description: 'Lists the repositories accessible through the current RepoFuse GitHub token.',
      inputSchema: {
        limit: z.number().int().min(1).max(200).default(50).describe('Maximum repositories to return.'),
        visibility: z.enum(['all', 'public', 'private']).default('all').describe('Which repository visibility to include.'),
        sort: z.enum(['updated', 'pushed', 'full_name']).default('updated').describe('GitHub sort field.'),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ limit = 50, visibility = 'all', sort = 'updated' }) => {
      ensureGithubToken(githubToken)
      const repositories = await listGitHubRepositories(githubToken, { limit, visibility, sort })

      return toolResult(`Found ${repositories.length} repositories.`, { repositories })
    },
  )

  server.registerTool(
    'analyze_repositories',
    {
      title: 'Analyze repositories with RepoFuse',
      description: 'Scans one or more GitHub repositories and returns RepoFuse-style app blueprints.',
      inputSchema: {
        repositories: z.array(z.string().min(3)).min(1).max(20).describe('GitHub repositories in owner/name format.'),
        maxFilesPerRepo: z.number().int().min(10).max(300).default(maxFilesPerRepo).describe('Maximum code files to inspect per repository.'),
        maxBlueprints: z.number().int().min(1).max(12).default(maxBlueprints).describe('Maximum number of blueprints to generate.'),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ repositories, maxFilesPerRepo: fileLimit = maxFilesPerRepo, maxBlueprints: blueprintLimit = maxBlueprints }) => {
      ensureGithubToken(githubToken)
      ensurePromptRunner(analysisPromptRunner, 'analysis')

      const result = await analyzeGitHubRepositories({
        accessToken: githubToken,
        repositories,
        maxFilesPerRepo: fileLimit,
        maxBlueprints: blueprintLimit,
        runPrompt: analysisPromptRunner,
      })

      return toolResult(
        `Analyzed ${repositories.length} repositories and found ${result.blueprints.length} blueprint${result.blueprints.length === 1 ? '' : 's'}.`,
        result,
      )
    },
  )

  server.registerTool(
    'generate_scaffold',
    {
      title: 'Generate scaffold',
      description: 'Creates a RepoFuse-style scaffold plan and starter files for a selected blueprint.',
      inputSchema: {
        appName: z.string().min(1).max(120).describe('Name of the app to scaffold.'),
        description: z.string().min(1).max(4000).describe('Short description of the app.'),
        technologies: z.array(z.string().min(1).max(120)).min(1).max(50).describe('Technologies to use.'),
        existingFiles: z.array(z.string().min(1).max(260)).max(500).default([]).describe('Files that already exist and can be reused.'),
        missingFiles: z.array(z.string().min(1).max(260)).max(500).default([]).describe('Files that still need to be created.'),
      },
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ appName, description, technologies, existingFiles = [], missingFiles = [] }) => {
      ensurePromptRunner(scaffoldPromptRunner, 'scaffold')

      const scaffold = await generateScaffold({
        appName,
        description,
        technologies,
        existingFiles,
        missingFiles,
        runPrompt: scaffoldPromptRunner,
      })

      return toolResult(`Generated scaffold for ${appName}.`, { appName, scaffold })
    },
  )

  server.registerTool(
    'create_repo_from_blueprint',
    {
      title: 'Create repository from blueprint',
      description: 'Creates a GitHub repository and seeds it with RepoFuse starter files for the selected blueprint.',
      inputSchema: {
        repoName: z.string().min(1).max(100).regex(/^[A-Za-z0-9._-]+$/, {
          message: 'Repository names may only contain letters, numbers, dots, underscores, and hyphens',
        }),
        private: z.boolean().default(false).describe('Whether the new repository should be private.'),
        app: z.object({
          app_name: z.string().min(1).max(120),
          app_type: z.string().min(1).max(120),
          description: z.string().min(1).max(4000),
          technologies: z.array(z.string().min(1).max(120)).max(50),
          difficulty_level: z.string().min(1).max(120),
          ai_explanation: z.string().max(10000).default(''),
          missing_files: z.array(z.string().min(1).max(260)).max(200).default([]),
        }),
      },
      annotations: { readOnlyHint: false, openWorldHint: true },
    },
    async ({ repoName, private: privateRepo = false, app }) => {
      ensureGithubToken(githubToken)

      if (!allowCreateRepo) {
        throw new Error('Repository creation is not enabled in this RepoFuse MCP context.')
      }

      const result = await createGitHubRepositoryFromBlueprint({
        accessToken: githubToken,
        repoName,
        app,
        privateRepo,
      })

      return toolResult(`Created ${result.repository.full_name}.`, result)
    },
  )

  return server
}

function toolResult(summary, data) {
  return {
    content: [
      {
        type: 'text',
        text: `${summary}\n\n${JSON.stringify(data, null, 2)}`,
      },
    ],
    structuredContent: data,
  }
}

function ensureGithubToken(githubToken) {
  if (!githubToken) {
    throw new Error('A GitHub token is required for this RepoFuse MCP server.')
  }
}

function ensurePromptRunner(promptRunner, label) {
  if (typeof promptRunner !== 'function') {
    throw new Error(`A ${label} model runner is required for this RepoFuse MCP server.`)
  }
}
