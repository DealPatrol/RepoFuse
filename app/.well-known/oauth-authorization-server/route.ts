import {
  corsHeaders,
  fetchClerkAuthorizationServerMetadata,
} from '@clerk/mcp-tools/server'
import { metadataCorsOptionsRequestHandler } from '@clerk/mcp-tools/next'

export const dynamic = 'force-dynamic'

export async function GET() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  if (!publishableKey) {
    return Response.json(
      { error: 'MCP OAuth is not configured.' },
      { status: 503, headers: corsHeaders },
    )
  }

  try {
    const metadata = await fetchClerkAuthorizationServerMetadata({ publishableKey })
    return Response.json(metadata, {
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('[mcp] Failed to load Clerk authorization server metadata:', error)
    return Response.json(
      { error: 'OAuth authorization server metadata is temporarily unavailable.' },
      { status: 502, headers: corsHeaders },
    )
  }
}

export const OPTIONS = metadataCorsOptionsRequestHandler()
