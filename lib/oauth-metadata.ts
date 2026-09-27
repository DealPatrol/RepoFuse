/**
 * Return Clerk's live authorization-server metadata.
 * Production has Client ID Metadata Documents turned off, so this document must
 * not advertise `client_id_metadata_document_supported: true`. Clients register
 * with dynamic client registration instead.
 */
export function mirrorClerkAuthorizationServerMetadata(
  metadata: Record<string, unknown>,
): Record<string, unknown> {
  if (metadata.client_id_metadata_document_supported !== true) {
    return metadata
  }

  const mirrored = { ...metadata }
  delete mirrored.client_id_metadata_document_supported
  return mirrored
}
