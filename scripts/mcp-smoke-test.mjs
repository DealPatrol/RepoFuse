#!/usr/bin/env node

import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

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
  const missing = ['GITHUB_TOKEN', 'ANTHROPIC_API_KEY'].filter((name) => !process.env[name])
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
  const toolNames = tools.map((tool) => tool.name).sort()
  const missingTools = expectedTools.filter((name) => !toolNames.includes(name))

  if (missingTools.length > 0) {
    throw new Error(`RepoFuse MCP started, but missing tools: ${missingTools.join(', ')}`)
  }

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
