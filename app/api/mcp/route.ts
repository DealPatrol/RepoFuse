import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { generateText } from 'ai'
import { gatewayProviderOptions, getGatewayModel, isAiConfigured } from '@/lib/ai-gateway'
import { getCurrentUser } from '@/lib/auth'
import { resolveProAccess } from '@/lib/pro-access'
import { createAnthropicPromptRunner } from '@/lib/repofuse-core.js'
import { createRepoFuseMcpServer } from '@/lib/repofuse-mcp.js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function handleMcpRequest(request: Request) {
  const user = await getCurrentUser()

  if (!user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { canAccessPro } = await resolveProAccess(user)
  const model = process.env.REPOFUSE_MODEL || process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929'
  const anthropicRunner = process.env['ANTHROPIC_' + 'API_KEY']
    ? createAnthropicPromptRunner({ apiKey: process.env['ANTHROPIC_' + 'API_KEY'], model })
    : undefined

  const analysisRunner =
    anthropicRunner ??
    (async (prompt: string) => {
      const result = await generateText({
        model: isAiConfigured() ? getGatewayModel() : 'openai/gpt-4o-mini',
        prompt,
        temperature: 0.2,
        maxOutputTokens: 4000,
        ...gatewayProviderOptions(user.id, 'mcp'),
      })

      return result.text
    })

  const scaffoldRunner = anthropicRunner

  const server = createRepoFuseMcpServer({
    githubToken: user.access_token,
    analysisPromptRunner: analysisRunner,
    scaffoldPromptRunner: scaffoldRunner,
    allowCreateRepo: canAccessPro,
    maxFilesPerRepo: 120,
    maxBlueprints: 5,
  })

  const transport = new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
  })

  await server.connect(transport)
  return transport.handleRequest(request)
}

export async function GET(request: Request) {
  return handleMcpRequest(request)
}

export async function POST(request: Request) {
  return handleMcpRequest(request)
}

export async function DELETE(request: Request) {
  return handleMcpRequest(request)
}
