import { verifyClerkToken } from '@clerk/mcp-tools/next'
import { auth } from '@clerk/nextjs/server'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { generateText } from 'ai'
import { withMcpAuth } from 'mcp-handler'
import { gatewayProviderOptions, getGatewayModel, isAiConfigured } from '@/lib/ai-gateway'
import { getAuthUserFromClerkUserId, getCurrentUser, type AuthUser } from '@/lib/auth'
import { CREDITS, deductCredits, refundCredits } from '@/lib/credits'
import { consumeMcpRateLimit } from '@/lib/mcp-rate-limit'
import { hasProAccess, isOnFreeTier } from '@/lib/pro-access'
import {
  getBlueprintByIdForUser,
  getSubscriptionByGithubId,
  releaseAnalysisUsage,
  reserveAnalysisUsage,
  upsertSubscription,
} from '@/lib/queries'
import { createAnthropicPromptRunner } from '@/lib/repofuse-core.js'
import { createRepoFuseMcpServer } from '@/lib/repofuse-mcp.js'
import { PLANS } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

async function handleMcpRequest(request: Request) {
  const user = await resolveMcpUser(request)

  if (!user?.id) {
    return oauthUnauthorized(request)
  }

  const rateLimit = await consumeMcpRateLimit(user.id)
  if (!rateLimit.allowed) {
    return Response.json(
      { error: 'rate_limit_exceeded', message: 'Too many MCP requests. Try again shortly.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.retryAfterSeconds),
          'X-RateLimit-Limit': String(rateLimit.limit),
        },
      },
    )
  }

  let subscription = await getSubscriptionByGithubId(user.github_id)
  if (!subscription) {
    subscription = await upsertSubscription({ github_id: user.github_id })
  }
  const canAccessPro = hasProAccess(user, subscription)
  const model = process.env.REPOFUSE_MODEL || process.env.ANTHROPIC_MODEL || 'claude-opus-4-6'
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

  const server = createRepoFuseMcpServer({
    githubToken: user.access_token,
    analysisPromptRunner: analysisRunner,
    scaffoldPromptRunner: analysisRunner,
    allowCreateRepo: canAccessPro,
    maxFilesPerRepo: 120,
    maxBlueprints: 5,
    beforeAnalyze: async () => {
      if (!subscription || !isOnFreeTier(user, subscription)) {
        return { reserved: false }
      }

      const limit = PLANS.free.analyses_per_month
      const reserved = await reserveAnalysisUsage(user.github_id, limit)
      if (!reserved) {
        throw new Error(`Free plan limit reached (${limit} analyses per month).`)
      }
      return { reserved: true, githubId: user.github_id }
    },
    onAnalyzeError: async (usage: { reserved?: boolean; githubId?: number } | undefined) => {
      if (usage?.reserved && usage.githubId) {
        await releaseAnalysisUsage(usage.githubId)
      }
    },
    beforeScaffold: async ({ appName, technologies }: { appName: string; technologies: string[] }) => {
      if (!canAccessPro) {
        throw new Error('Scaffold generation is a Pro feature. Upgrade your RepoFuse plan to use it.')
      }
      const charge = await deductCredits(user.id, CREDITS.SCAFFOLD_COST, 'scaffold', {
        appName,
        technologies,
        source: 'mcp',
      })
      if (!charge.success) {
        throw new Error(charge.error ?? 'Insufficient credits for scaffold generation.')
      }
      return { charged: true, appName }
    },
    onScaffoldError: async (usage: { charged?: boolean; appName?: string } | undefined) => {
      if (usage?.charged) {
        await refundCredits(user.id, CREDITS.SCAFFOLD_COST, 'MCP scaffold generation failed', {
          appName: usage.appName,
          source: 'mcp',
        })
      }
    },
    getBlueprintGaps: async (blueprintId: string) => {
      const blueprint = await getBlueprintByIdForUser(blueprintId, user.id)
      if (!blueprint) {
        throw new Error('Blueprint not found.')
      }
      return {
        id: blueprint.id,
        name: blueprint.name,
        existingFiles: blueprint.existing_files,
        missingFiles: blueprint.missing_files,
        technologies: blueprint.technologies,
        reusePercentage: blueprint.reuse_percentage,
      }
    },
  })

  const transport = new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
  })

  await server.connect(transport)
  return withCors(await transport.handleRequest(request))
}

async function resolveMcpUser(request: Request): Promise<AuthUser | null> {
  const clerkUserId = request.auth?.extra?.userId
  if (typeof clerkUserId === 'string') {
    return getAuthUserFromClerkUserId(clerkUserId)
  }
  return getCurrentUser()
}

function oauthUnauthorized(request: Request): Response {
  const metadataUrl = new URL('/.well-known/oauth-protected-resource', request.url)
  return Response.json(
    { error: 'invalid_token', error_description: 'OAuth authorization or a RepoFuse web session is required.' },
    {
      status: 401,
      headers: {
        'WWW-Authenticate': `Bearer error="invalid_token", resource_metadata="${metadataUrl}"`,
      },
    },
  )
}

function withCors(response: Response): Response {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Expose-Headers', 'Mcp-Session-Id, WWW-Authenticate, Retry-After')
  return response
}

const oauthHandler = withMcpAuth(
  handleMcpRequest,
  async (_, token) => {
    if (!token) {
      return undefined
    }
    const clerkAuth = await auth({ acceptsToken: 'oauth_token' })
    return verifyClerkToken(clerkAuth, token)
  },
  {
    required: false,
    resourceMetadataPath: '/.well-known/oauth-protected-resource',
  },
)

async function publicMcpHandler(request: Request) {
  return withCors(await oauthHandler(request))
}

export const GET = publicMcpHandler
export const POST = publicMcpHandler
export const DELETE = publicMcpHandler

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type, Mcp-Protocol-Version, Mcp-Session-Id',
      'Access-Control-Max-Age': '86400',
    },
  })
}
