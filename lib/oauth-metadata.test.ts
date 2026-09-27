import { describe, expect, it } from 'vitest'
import { mirrorClerkAuthorizationServerMetadata } from '@/lib/oauth-metadata'

describe('mirrorClerkAuthorizationServerMetadata', () => {
  it('returns Clerk metadata unchanged when CIMD is omitted', () => {
    const metadata = {
      issuer: 'https://clerk.repofuse.com',
      registration_endpoint: 'https://clerk.repofuse.com/oauth/register',
      code_challenge_methods_supported: ['S256'],
    }

    expect(mirrorClerkAuthorizationServerMetadata(metadata)).toEqual(metadata)
  })

  it('keeps an explicit false CIMD flag', () => {
    const metadata = {
      issuer: 'https://clerk.repofuse.com',
      client_id_metadata_document_supported: false,
    }

    expect(mirrorClerkAuthorizationServerMetadata(metadata)).toEqual(metadata)
  })

  it('does not advertise client_id_metadata_document_supported when the live document sets it true', () => {
    const metadata = {
      issuer: 'https://clerk.repofuse.com',
      registration_endpoint: 'https://clerk.repofuse.com/oauth/register',
      client_id_metadata_document_supported: true,
    }

    const mirrored = mirrorClerkAuthorizationServerMetadata(metadata)

    expect(mirrored.client_id_metadata_document_supported).toBeUndefined()
    expect(mirrored.issuer).toBe(metadata.issuer)
    expect(mirrored.registration_endpoint).toBe(metadata.registration_endpoint)
    expect(metadata.client_id_metadata_document_supported).toBe(true)
  })
})
