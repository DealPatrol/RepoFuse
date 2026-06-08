import Anthropic from '@anthropic-ai/sdk'
import { generateText, type ModelMessage } from 'ai'

/** Default gateway model (provider/model). See https://ai-gateway.vercel.sh/v1/models */
export const DEFAULT_GATEWAY_MODEL = 'anthropic/claude-sonnet-4.6'
export const DEFAULT_GATEWAY_FALLBACK_MODELS = [
  'openai/gpt-5.4',
  'anthropic/claude-haiku-4.5',
  'google/gemini-3-flash',
]
export const DEFAULT_DIRECT_ANTHROPIC_MODEL = 'claude-sonnet-4-5-20250929'

export type AiGatewayFeature =
  | 'analysis-run'
  | 'app-idea-chat'
  | 'scaffold'
  | 'build-app'
  | 'pattern-analyzer'
  | 'mcp'
  | 'legacy'

const ANTHROPIC_KEY_ENV = 'ANTHROPIC_' + 'API_KEY'

function usesGatewayAuth(): boolean {
  return Boolean(process.env.AI_GATEWAY_API_KEY?.trim() || process.env.VERCEL_OIDC_TOKEN?.trim())
}

function directAnthropicKey(): string | undefined {
  return process.env[ANTHROPIC_KEY_ENV]?.trim()
}

function parseModelList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean)
}

function uniqueModels(models: string[]): string[] {
  return Array.from(new Set(models))
}

/** True when AI Gateway or a direct Anthropic key is available. */
export function isAiConfigured(): boolean {
  return usesGatewayAuth() || Boolean(directAnthropicKey())
}

/**
 * Model slug for AI SDK `generateText` / `streamText` (routes through AI Gateway when using provider/model strings).
 */
export function getGatewayModel(): string {
  const configured = process.env.ANTHROPIC_ANALYSIS_MODEL?.trim()
  if (!configured) return DEFAULT_GATEWAY_MODEL
  if (configured.includes('/')) return configured
  return `anthropic/${configured}`
}

export function getGatewayFallbackModels(): string[] {
  const configured = parseModelList(process.env.AI_GATEWAY_FALLBACK_MODELS)
  const primaryModel = getGatewayModel()
  const fallbackModels = configured.length > 0 ? configured : DEFAULT_GATEWAY_FALLBACK_MODELS

  return uniqueModels(fallbackModels).filter((model) => model !== primaryModel)
}

function getDirectAnthropicModel(): string {
  return process.env.ANTHROPIC_DIRECT_MODEL?.trim() || DEFAULT_DIRECT_ANTHROPIC_MODEL
}

/**
 * Model id for Anthropic Messages API (gateway-compatible endpoint or direct Anthropic).
 */
export function getAnthropicMessagesModel(): string {
  const configured = process.env.ANTHROPIC_ANALYSIS_MODEL?.trim()
  if (configured) {
    if (usesGatewayAuth() && !configured.includes('/')) {
      return `anthropic/${configured}`
    }
    return configured
  }
  return usesGatewayAuth() ? DEFAULT_GATEWAY_MODEL : 'claude-sonnet-4-5-20250929'
}

export function gatewayProviderOptions(userId?: string, feature?: AiGatewayFeature) {
  const tags = feature ? [`feature:${feature}`] : []
  const fallbackModels = getGatewayFallbackModels()
  if (process.env.VERCEL_ENV) {
    tags.push(`env:${process.env.VERCEL_ENV}`)
  }

  return {
    providerOptions: {
      gateway: {
        ...(userId ? { user: userId } : {}),
        ...(tags.length > 0 ? { tags } : {}),
        ...(usesGatewayAuth() && fallbackModels.length > 0 ? { models: fallbackModels } : {}),
      },
    },
  } as const
}

export function getAnthropicClient(): Anthropic {
  const gatewayKey = process.env.AI_GATEWAY_API_KEY?.trim()
  const oidc = process.env.VERCEL_OIDC_TOKEN?.trim()

  if (gatewayKey || oidc) {
    return new Anthropic({
      apiKey: gatewayKey || oidc || 'gateway',
      baseURL: 'https://ai-gateway.vercel.sh',
    })
  }

  const directKey = directAnthropicKey()
  if (!directKey) {
    throw new Error('AI is not configured. Set AI_GATEWAY_API_KEY, VERCEL_OIDC_TOKEN, or your Anthropic API key env var.')
  }

  return new Anthropic({ apiKey: directKey })
}

function isGatewayAccessError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  const lower = message.toLowerCase()

  return (
    lower.includes('free tier users do not have access') ||
    lower.includes('upgrade to paid credits') ||
    lower.includes('top-up') ||
    lower.includes('payment required') ||
    lower.includes('insufficient credits') ||
    lower.includes('gateway credits') ||
    lower.includes('status code: 402') ||
    lower.includes('status code: 403')
  )
}

async function generateWithDirectAnthropic(params: {
  system?: string
  messages: ModelMessage[]
  maxOutputTokens?: number
  temperature?: number
}): Promise<string> {
  const directKey = directAnthropicKey()
  if (!directKey) {
    throw new Error('Direct Anthropic fallback is not configured.')
  }

  const client = new Anthropic({ apiKey: directKey })
  const response = await client.messages.create({
    model: getDirectAnthropicModel(),
    max_tokens: params.maxOutputTokens ?? 4096,
    ...(params.temperature !== undefined ? { temperature: params.temperature } : {}),
    ...(params.system ? { system: params.system } : {}),
    messages: params.messages.map((message) => ({
      role: message.role,
      content: typeof message.content === 'string' ? message.content : JSON.stringify(message.content),
    })),
  })

  return response.content
    .map((block) => (block.type === 'text' ? block.text : ''))
    .join('')
    .trim()
}

function gatewayAccessErrorMessage(): string {
  return 'AI generation is temporarily unavailable because the configured Vercel AI Gateway account is blocked by model credits. Your Pro app access is active; please contact support or try again shortly.'
}

export async function generateWithGateway(params: {
  system?: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  maxOutputTokens?: number
  temperature?: number
  userId?: string
  feature: AiGatewayFeature
}): Promise<string> {
  const modelMessages: ModelMessage[] = params.messages.map((message) => ({
    role: message.role,
    content: message.content,
  }))

  if (!usesGatewayAuth() && directAnthropicKey()) {
    return generateWithDirectAnthropic({
      system: params.system,
      messages: modelMessages,
      maxOutputTokens: params.maxOutputTokens,
      temperature: params.temperature,
    })
  }

  try {
    const result = await generateText({
      model: getGatewayModel(),
      system: params.system,
      messages: modelMessages,
      maxOutputTokens: params.maxOutputTokens ?? 4096,
      temperature: params.temperature,
      ...gatewayProviderOptions(params.userId, params.feature),
    })

    return result.text
  } catch (error) {
    if (usesGatewayAuth() && isGatewayAccessError(error)) {
      const directKey = directAnthropicKey()
      if (directKey) {
        console.warn('[ai] Vercel AI Gateway access failed; retrying with direct Anthropic fallback.')
        return generateWithDirectAnthropic({
          system: params.system,
          messages: modelMessages,
          maxOutputTokens: params.maxOutputTokens,
          temperature: params.temperature,
        })
      }

      throw new Error(gatewayAccessErrorMessage())
    }

    throw error
  }
}

export function aiConfigErrorMessage(): string {
  return 'AI is not configured. Enable Vercel AI Gateway (OIDC or AI_GATEWAY_API_KEY) or configure a direct provider API key.'
}
