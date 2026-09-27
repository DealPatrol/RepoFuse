import {
  corsHeaders,
  generateClerkProtectedResourceMetadata,
} from '@clerk/mcp-tools/server'
import { metadataCorsOptionsRequestHandler } from '@clerk/mcp-tools/next'

export const dynamic = 'force-dynamic'

export function GET(request: Request) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  if (!publishableKey) {
    return Response.json(
      { error: 'MCP OAuth is not configured.' },
      { status: 503, headers: corsHeaders },
    )
  }

  const resourceUrl = new URL('/api/mcp', request.url).toString()
  const metadata = generateClerkProtectedResourceMetadata({
    publishableKey,
    resourceUrl,
    properties: {
      scopes_supported: ['openid', 'profile', 'email'],
      resource_name: 'RepoFuse MCP',
    },
  })

  return Response.json(metadata, {
    headers: {
      ...corsHeaders,
      'Cache-Control': 'public, max-age=3600',
    },
  })
}

export const OPTIONS = metadataCorsOptionsRequestHandler()
