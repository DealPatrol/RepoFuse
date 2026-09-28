#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { aiConfigErrorMessage, createPromptRunner, getActiveAiProvider } from '../lib/ai-runtime.js'
import { createRepoFuseMcpServer } from '../lib/repofuse-mcp.js'

const githubToken = requireEnv('GITHUB_TOKEN')
if (getActiveAiProvider() === 'none') {
  throw new Error(aiConfigErrorMessage())
}
const maxFilesPerRepo = numberFromEnv('REPOFUSE_MAX_FILES_PER_REPO', 120)
const maxBlueprints = numberFromEnv('REPOFUSE_MAX_BLUEPRINTS', 5)

const promptRunner = createPromptRunner({
  feature: 'mcp',
  kind: 'repofuse',
  model: process.env.REPOFUSE_MODEL || process.env.ANTHROPIC_MODEL,
  temperature: 0.2,
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
