import { afterEach, describe, expect, it, vi } from 'vitest'
import { GET } from './route'

vi.mock('@/lib/db', () => ({
  getDb: () => () => Promise.resolve([{ ping: 1 }]),
}))

vi.mock('@/lib/clerk-auth', () => ({
  isClerkConfigured: () => false,
}))

const ENV_KEYS = ['AI_GATEWAY_API_KEY', 'VERCEL_OIDC_TOKEN', 'ANTHROPIC_API_KEY'] as const
const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]))

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = originalEnv[key]
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
})

describe('GET /api/health', () => {
  it('reports the active AI provider without returning secrets', async () => {
    process.env.AI_GATEWAY_API_KEY = 'super-secret-gateway-key'
    process.env.VERCEL_OIDC_TOKEN = 'super-secret-oidc-token'
    process.env.ANTHROPIC_API_KEY = 'sk-ant-super-secret'

    const response = await GET()
    const body = await response.json()
    const serialized = JSON.stringify(body)

    expect(response.status).toBe(200)
    expect(body.aiProvider).toBe('gateway')
    expect(body.env.AI_GATEWAY_API_KEY).toBe(true)
    expect(body.env.VERCEL_OIDC_TOKEN).toBe(true)
    expect(body.env.ANTHROPIC_API_KEY).toBe(true)
    expect(serialized).not.toContain('super-secret-gateway-key')
    expect(serialized).not.toContain('super-secret-oidc-token')
    expect(serialized).not.toContain('sk-ant-super-secret')
  })

  it('reports anthropic when only a direct key is configured', async () => {
    delete process.env.AI_GATEWAY_API_KEY
    delete process.env.VERCEL_OIDC_TOKEN
    process.env.ANTHROPIC_API_KEY = 'sk-ant-local'

    const response = await GET()
    const body = await response.json()

    expect(body.aiProvider).toBe('anthropic')
    expect(JSON.stringify(body)).not.toContain('sk-ant-local')
  })

  it('reports none when AI credentials are missing', async () => {
    delete process.env.AI_GATEWAY_API_KEY
    delete process.env.VERCEL_OIDC_TOKEN
    delete process.env.ANTHROPIC_API_KEY

    const response = await GET()
    const body = await response.json()

    expect(body.aiProvider).toBe('none')
  })
})
