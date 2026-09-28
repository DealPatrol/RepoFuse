import { createAnthropic } from '@ai-sdk/anthropic'
import { gateway, generateText } from 'ai'

/**
 * Default for non-analysis calls. Sonnet 4.6 keeps gateway free-credit use down.
 * Verified against https://ai-gateway.vercel.sh/v1/models
 */
export const DEFAULT_GATEWAY_MODEL = 'anthropic/claude-sonnet-4.6'
/** Analysis stays on Sonnet 4.6. */
export const DEFAULT_ANALYSIS_GATEWAY_MODEL = 'anthropic/claude-sonnet-4.6'
export const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-4-6'

const ANTHROPIC_KEY_ENV = 'ANTHROPIC_' + 'API_KEY'

export function aiConfigErrorMessage() {
  return 'AI is not configured. On Vercel the AI Gateway is used automatically. Otherwise set AI_GATEWAY_API_KEY or ANTHROPIC_API_KEY for local development.'
}

/** Vercel sets VERCEL=1. The OIDC token is not in process.env on Fluid/serverless. */
export function isVercelRuntime() {
  return process.env.VERCEL === '1'
}

/**
 * Gateway auth is available when a static key is set, this process is a Vercel
 * function (OIDC arrives per request via x-vercel-oidc-token), or a local
 * VERCEL_OIDC_TOKEN from `vercel env pull` is present.
 */
export function usesGatewayAuth() {
  return Boolean(
    process.env.AI_GATEWAY_API_KEY?.trim()
    || isVercelRuntime()
    || process.env.VERCEL_OIDC_TOKEN?.trim(),
  )
}

export function getActiveAiProvider() {
  if (usesGatewayAuth()) return 'gateway'
  if (process.env[ANTHROPIC_KEY_ENV]?.trim()) return 'anthropic'
  return 'none'
}

export function isAiConfigured() {
  return getActiveAiProvider() !== 'none'
}

function directAnthropicKey() {
  return process.env[ANTHROPIC_KEY_ENV]?.trim() || undefined
}

function analysisModelOverride() {
  return process.env.ANTHROPIC_ANALYSIS_MODEL?.trim() || ''
}

function repofuseModelOverride() {
  return process.env.REPOFUSE_MODEL?.trim() || process.env.ANTHROPIC_MODEL?.trim() || ''
}

/**
 * Map a configured Claude id to the gateway slug and the direct Anthropic id.
 * Gateway slugs use dots (anthropic/claude-opus-4.6). Direct Anthropic ids use
 * hyphens (claude-opus-4-6). Non-Anthropic provider/model strings pass through
 * on the gateway and fall back to the default Claude model for direct Anthropic.
 */
export function mapClaudeModel(raw, fallbackGateway = DEFAULT_GATEWAY_MODEL) {
  const configured = typeof raw === 'string' ? raw.trim() : ''
  const source = configured || fallbackGateway

  if (source.includes('/') && !source.startsWith('anthropic/')) {
    return { gateway: source, anthropic: DEFAULT_ANTHROPIC_MODEL }
  }

  const slug = source.replace(/^anthropic\//, '')
  const dotted = hyphenatedClaudeToDotted(slug)
  return {
    gateway: `anthropic/${dotted}`,
    anthropic: dottedClaudeToHyphenated(dotted),
  }
}

function hyphenatedClaudeToDotted(slug) {
  return slug.replace(
    /^((?:claude|anthropic)(?:-[a-z]+)*)-(\d+)-(\d+)(-fast)?$/,
    '$1-$2.$3$4',
  )
}

function dottedClaudeToHyphenated(slug) {
  return slug.replace(/(\d+)\.(\d+)/g, '$1-$2')
}

function resolveModelPair(kind, rawModel) {
  const explicit = typeof rawModel === 'string' ? rawModel.trim() : ''
  if (explicit) return mapClaudeModel(explicit)
  if (kind === 'repofuse') {
    return mapClaudeModel(
      repofuseModelOverride() || analysisModelOverride(),
      DEFAULT_GATEWAY_MODEL,
    )
  }
  return mapClaudeModel(analysisModelOverride(), DEFAULT_ANALYSIS_GATEWAY_MODEL)
}

export function resolvedModelIds(kind = 'analysis', rawModel) {
  return resolveModelPair(kind, rawModel)
}

export function getLanguageModel(kind = 'analysis', rawModel) {
  const provider = getActiveAiProvider()
  if (provider === 'none') {
    throw new Error(aiConfigErrorMessage())
  }

  const mapped = resolveModelPair(kind, rawModel)
  if (provider === 'gateway') {
    return gateway(mapped.gateway)
  }

  const apiKey = directAnthropicKey()
  if (!apiKey) {
    throw new Error(aiConfigErrorMessage())
  }
  return createAnthropic({ apiKey })(mapped.anthropic)
}

export function gatewayProviderOptions(userId, feature) {
  const tags = []
  if (feature) tags.push(`feature:${feature}`)
  if (process.env.VERCEL_ENV) tags.push(`env:${process.env.VERCEL_ENV}`)

  return {
    providerOptions: {
      gateway: {
        ...(userId ? { user: userId } : {}),
        ...(tags.length > 0 ? { tags } : {}),
      },
    },
  }
}

export function createPromptRunner({
  model,
  maxTokens = 4000,
  temperature,
  feature,
  userId,
  kind = 'repofuse',
} = {}) {
  return async function runPrompt(prompt, options = {}) {
    const provider = getActiveAiProvider()
    if (provider === 'none') {
      throw new Error(aiConfigErrorMessage())
    }

    const result = await generateText({
      model: getLanguageModel(kind, model),
      prompt,
      maxOutputTokens: options.maxTokens ?? maxTokens,
      ...(temperature === undefined ? {} : { temperature }),
      ...(provider === 'gateway' ? gatewayProviderOptions(userId, feature) : {}),
    })

    const text = result.text?.trim() ?? ''
    if (!text) {
      throw new Error('The model did not return text content.')
    }
    return text
  }
}
