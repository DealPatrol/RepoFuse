import {
  authServerMetadataHandlerClerk,
  metadataCorsOptionsRequestHandler,
} from '@clerk/mcp-tools/next'

export const dynamic = 'force-dynamic'

export const GET = authServerMetadataHandlerClerk()
export const OPTIONS = metadataCorsOptionsRequestHandler()
