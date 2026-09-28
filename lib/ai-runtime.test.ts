import { afterEach, describe, expect, it } from 'vitest'
import { getActiveAiProvider, mapClaudeModel } from '@/lib/ai-runtime'

const ENV_KEYS = ['AI_GATEWAY_API_KEY', 'VERCEL_OIDC_TOKEN', 'ANTHROPIC_API_KEY'] as const

const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]))

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = originalEnv[key]
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
})

function setEnv(values: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>>) {
  for (const key of ENV_KEYS) delete process.env[key]
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) process.env[key] = value
  }
}

describe('AI provider selection', () => {
  it('prefers the gateway when a gateway API key is set alongside a direct Anthropic key', () => {
    setEnv({
      AI_GATEWAY_API_KEY: 'gateway-key',
      ANTHROPIC_API_KEY: 'sk-ant-direct',
    })
    expect(getActiveAiProvider()).toBe('gateway')
  })

  it('uses the gateway when only the Vercel OIDC token is present', () => {
    setEnv({ VERCEL_OIDC_TOKEN: 'oidc-token' })
    expect(getActiveAiProvider()).toBe('gateway')
  })

  it('falls back to direct Anthropic when gateway credentials are absent', () => {
    setEnv({ ANTHROPIC_API_KEY: 'sk-ant-direct' })
    expect(getActiveAiProvider()).toBe('anthropic')
  })

  it('reports none when no AI credentials are configured', () => {
    setEnv({})
    expect(getActiveAiProvider()).toBe('none')
  })

  it('ignores blank credential values', () => {
    setEnv({ AI_GATEWAY_API_KEY: '   ', VERCEL_OIDC_TOKEN: '', ANTHROPIC_API_KEY: '  ' })
    expect(getActiveAiProvider()).toBe('none')
  })
})

describe('Claude model id mapping', () => {
  it('maps the current direct Anthropic ids onto verified gateway ids', () => {
    expect(mapClaudeModel('claude-opus-4-6')).toEqual({
      gateway: 'anthropic/claude-opus-4.6',
      anthropic: 'claude-opus-4-6',
    })
    expect(mapClaudeModel('claude-sonnet-4-6')).toEqual({
      gateway: 'anthropic/claude-sonnet-4.6',
      anthropic: 'claude-sonnet-4-6',
    })
    expect(mapClaudeModel('claude-sonnet-4-5')).toEqual({
      gateway: 'anthropic/claude-sonnet-4.5',
      anthropic: 'claude-sonnet-4-5',
    })
    expect(mapClaudeModel('claude-opus-4-5')).toEqual({
      gateway: 'anthropic/claude-opus-4.5',
      anthropic: 'claude-opus-4-5',
    })
    expect(mapClaudeModel('claude-haiku-4-5')).toEqual({
      gateway: 'anthropic/claude-haiku-4.5',
      anthropic: 'claude-haiku-4-5',
    })
    expect(mapClaudeModel('claude-opus-4-8-fast')).toEqual({
      gateway: 'anthropic/claude-opus-4.8-fast',
      anthropic: 'claude-opus-4-8-fast',
    })
  })

  it('keeps dotted gateway ids and derives the direct Anthropic id', () => {
    expect(mapClaudeModel('anthropic/claude-opus-4.6')).toEqual({
      gateway: 'anthropic/claude-opus-4.6',
      anthropic: 'claude-opus-4-6',
    })
    expect(mapClaudeModel('anthropic/claude-sonnet-4.6')).toEqual({
      gateway: 'anthropic/claude-sonnet-4.6',
      anthropic: 'claude-sonnet-4-6',
    })
  })

  it('defaults to Claude Opus 4.6', () => {
    expect(mapClaudeModel(undefined)).toEqual({
      gateway: 'anthropic/claude-opus-4.6',
      anthropic: 'claude-opus-4-6',
    })
  })

  it('passes non-Anthropic gateway models through', () => {
    expect(mapClaudeModel('openai/gpt-4o-mini')).toEqual({
      gateway: 'openai/gpt-4o-mini',
      anthropic: 'claude-opus-4-6',
    })
  })
})
