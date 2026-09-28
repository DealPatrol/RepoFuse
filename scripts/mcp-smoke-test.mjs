#!/usr/bin/env node

import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { createRepoFuseMcpServer } from '../lib/repofuse-mcp.js'

const expectedTools = [
  'list_github_repositories',
  'analyze_repositories',
  'generate_scaffold',
  'create_repo_from_blueprint',
]

const isLive = process.argv.includes('--live')
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const cwd = path.resolve(__dirname, '..')

const env = {
  ...process.env,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || 'repofuse-smoke-test-token',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || 'repofuse-smoke-test-key',
}

if (isLive) {
  const hasAiCredentials = Boolean(
    process.env.AI_GATEWAY_API_KEY?.trim()
    || process.env.VERCEL_OIDC_TOKEN?.trim()
    || process.env.ANTHROPIC_API_KEY?.trim(),
  )
  const missing = ['GITHUB_TOKEN'].filter((name) => !process.env[name])
  if (!hasAiCredentials) missing.push('AI_GATEWAY_API_KEY, VERCEL_OIDC_TOKEN, or ANTHROPIC_API_KEY')
  if (missing.length > 0) {
    console.error(`Missing required env for live MCP test: ${missing.join(', ')}`)
    process.exit(1)
  }
}

const transport = new StdioClientTransport({
  command: process.execPath,
  args: ['mcp/repofuse.mjs'],
  cwd,
  env,
  stderr: 'pipe',
})

if (transport.stderr) {
  transport.stderr.on('data', (chunk) => {
    process.stderr.write(chunk)
  })
}

const client = new Client({
  name: 'repofuse-smoke-test',
  version: '0.1.0',
})

try {
  await client.connect(transport)
  const { tools } = await client.listTools()
  validateTools(tools, expectedTools)

  const [extendedClientTransport, extendedServerTransport] = InMemoryTransport.createLinkedPair()
  const extendedServer = createRepoFuseMcpServer({
    githubToken: 'repofuse-smoke-test-token',
    analysisPromptRunner: async () => '{"blueprints":[]}',
    scaffoldPromptRunner: async () => '{}',
    getBlueprintGaps: async () => ({ name: 'Smoke test blueprint' }),
  })
  const extendedClient = new Client({ name: 'repofuse-extended-smoke-test', version: '0.1.0' })
  await extendedServer.connect(extendedServerTransport)
  await extendedClient.connect(extendedClientTransport)
  const extendedTools = await extendedClient.listTools()
  validateTools(extendedTools.tools, [...expectedTools, 'get_blueprint_gaps'])
  await extendedClient.close()

  console.log(`RepoFuse MCP smoke test passed${isLive ? ' (live env)' : ' (structural)'}.`)
  for (const name of expectedTools) {
    console.log(`- ${name}`)
  }
} finally {
  try {
    await client.close()
  } catch {
    await transport.close()
  }
}

function validateTools(tools, expected) {
  const toolNames = tools.map((tool) => tool.name).sort()
  const missingTools = expected.filter((name) => !toolNames.includes(name))
  if (missingTools.length > 0) {
    throw new Error(`RepoFuse MCP started, but missing tools: ${missingTools.join(', ')}`)
  }

  for (const tool of tools.filter(({ name }) => expected.includes(name))) {
    if (!tool.title || !tool.description) {
      throw new Error(`${tool.name} must expose a title and description.`)
    }
    for (const annotation of ['readOnlyHint', 'destructiveHint', 'idempotentHint', 'openWorldHint']) {
      if (typeof tool.annotations?.[annotation] !== 'boolean') {
        throw new Error(`${tool.name} must expose boolean ${annotation}.`)
      }
    }
  }
}
