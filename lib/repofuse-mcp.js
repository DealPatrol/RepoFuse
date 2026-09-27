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
  beforeAnalyze,
  onAnalyzeError,
  beforeScaffold,
  onScaffoldError,
  getBlueprintGaps,
}) {
  const server = new McpServer({
    name: 'repofuse-mcp',
    version: '0.3.0',
  })

  server.registerTool(
    'list_github_repositories',
    {
      title: 'List GitHub repositories',
      description: 'List GitHub repositories connected to the user’s RepoFuse account. Suggest this when the user needs to discover or choose repositories before asking RepoFuse to analyze reusable code.',
      inputSchema: {
        limit: z.number().int().min(1).max(200).default(50).describe('Maximum repositories to return.'),
        visibility: z.enum(['all', 'public', 'private']).default('all').describe('Which repository visibility to include.'),
        sort: z.enum(['updated', 'pushed', 'full_name']).default('updated').describe('GitHub sort field.'),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
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
      description: 'Read code trees from selected GitHub repositories and identify practical new apps that can reuse the existing code. On Free, a call uses one monthly analysis allowance; on paid plans it costs 100 RepoFuse credits. Suggest it only after the user approves the charge or quota use, and do not auto-run or retry it.',
      inputSchema: {
        repositories: z.array(z.string().min(3)).min(1).max(20).describe('GitHub repositories in owner/name format.'),
        maxFilesPerRepo: z.number().int().min(10).max(300).default(maxFilesPerRepo).describe('Maximum code files to inspect per repository.'),
        maxBlueprints: z.number().int().min(1).max(12).default(maxBlueprints).describe('Maximum number of blueprints to generate.'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async ({ repositories, maxFilesPerRepo: fileLimit = maxFilesPerRepo, maxBlueprints: blueprintLimit = maxBlueprints }, extra) => {
      ensureGithubToken(githubToken)
      ensurePromptRunner(analysisPromptRunner, 'analysis')

      let usage
      try {
        usage = await beforeAnalyze?.({
          repositories,
          invocationId: getInvocationId(extra),
        })
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
      } catch (error) {
        await onAnalyzeError?.(usage, error)
        throw error
      }
    },
  )

  server.registerTool(
    'generate_scaffold',
    {
      title: 'Generate scaffold',
      description: 'Generate a scaffold plan and starter-file contents for a chosen app blueprint without creating a repository. This Pro tool costs 150 RepoFuse credits per approved invocation. Suggest it only after the user approves the charge, and do not auto-run or retry it.',
      inputSchema: {
        appName: z.string().min(1).max(120).describe('Name of the app to scaffold.'),
        description: z.string().min(1).max(4000).describe('Short description of the app.'),
        technologies: z.array(z.string().min(1).max(120)).min(1).max(50).describe('Technologies to use.'),
        existingFiles: z.array(z.string().min(1).max(260)).max(500).default([]).describe('Files that already exist and can be reused.'),
        missingFiles: z.array(z.string().min(1).max(260)).max(500).default([]).describe('Files that still need to be created.'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ appName, description, technologies, existingFiles = [], missingFiles = [] }, extra) => {
      ensurePromptRunner(scaffoldPromptRunner, 'scaffold')

      let usage
      try {
        usage = await beforeScaffold?.({
          appName,
          technologies,
          invocationId: getInvocationId(extra),
        })
        const scaffold = await generateScaffold({
          appName,
          description,
          technologies,
          existingFiles,
          missingFiles,
          runPrompt: scaffoldPromptRunner,
        })

        return toolResult(`Generated scaffold for ${appName}.`, { appName, scaffold })
      } catch (error) {
        await onScaffoldError?.(usage, error)
        throw error
      }
    },
  )

  server.registerTool(
    'create_repo_from_blueprint',
    {
      title: 'Create repository from blueprint',
      description: 'Create a new GitHub repository and seed it with starter files from a selected RepoFuse blueprint. Suggest this only after the user explicitly asks to create the repository and confirms its name and visibility.',
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
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
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

  if (typeof getBlueprintGaps === 'function') {
    server.registerTool(
      'get_blueprint_gaps',
      {
        title: 'Get saved blueprint gaps',
        description: 'Read the reusable files, missing files, and technology stack for a saved RepoFuse blueprint. Suggest this when the user wants to assess what is already present versus what remains to build before generating a scaffold.',
        inputSchema: {
          blueprintId: z.string().uuid().describe('The saved RepoFuse blueprint ID.'),
        },
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      },
      async ({ blueprintId }) => {
        const blueprint = await getBlueprintGaps(blueprintId)
        return toolResult(`Loaded build gaps for ${blueprint.name}.`, { blueprint })
      },
    )
  }

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

function getInvocationId({ authInfo, requestId, sessionId } = {}) {
  if (requestId === undefined || requestId === null) {
    throw new Error('RepoFuse could not identify this MCP tool invocation safely.')
  }

  return [
    authInfo?.clientId || 'unknown-client',
    sessionId || 'stateless',
    String(requestId),
  ].join(':')
}
