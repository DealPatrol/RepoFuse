#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createAnthropicPromptRunner } from '../lib/repofuse-core.js'
import { createRepoFuseMcpServer } from '../lib/repofuse-mcp.js'

const githubToken = requireEnv('GITHUB_TOKEN')
const anthropicApiKey = requireEnv('ANTHROPIC_API_KEY')
const model = process.env.REPOFUSE_MODEL || process.env.ANTHROPIC_MODEL || 'claude-opus-4-6'
const maxFilesPerRepo = numberFromEnv('REPOFUSE_MAX_FILES_PER_REPO', 120)
const maxBlueprints = numberFromEnv('REPOFUSE_MAX_BLUEPRINTS', 5)

const promptRunner = createAnthropicPromptRunner({
  apiKey: anthropicApiKey,
  model,
})

const server = createRepoFuseMcpServer({
  githubToken,
  analysisPromptRunner: promptRunner,
  scaffoldPromptRunner: promptRunner,
  allowCreateRepo: true,
  maxFilesPerRepo,
  maxBlueprints,
})

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
}

function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is required for RepoFuse MCP.`)
  }
  return value
}

function numberFromEnv(name, fallback) {
  const value = process.env[name]
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

main().catch((error) => {
  console.error('[repofuse-mcp] fatal error:', error)
  process.exit(1)
})
