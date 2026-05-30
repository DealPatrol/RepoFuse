import Anthropic from '@anthropic-ai/sdk'
import { generateText, type ModelMessage } from 'ai'

/** Default gateway model (provider/model). See https://ai-gateway.vercel.sh/v1/models */
export const DEFAULT_GATEWAY_MODEL = 'anthropic/claude-sonnet-4.6'

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
  if (process.env.VERCEL_ENV) {
    tags.push(`env:${process.env.VERCEL_ENV}`)
  }

  return {
    providerOptions: {
      gateway: {
        ...(userId ? { user: userId } : {}),
        ...(tags.length > 0 ? { tags } : {}),
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

  const result = await generateText({
    model: getGatewayModel(),
    system: params.system,
    messages: modelMessages,
    maxOutputTokens: params.maxOutputTokens ?? 4096,
    temperature: params.temperature,
    ...gatewayProviderOptions(params.userId, params.feature),
  })

  return result.text
}

export function aiConfigErrorMessage(): string {
  return 'AI is not configured. Enable Vercel AI Gateway (OIDC or AI_GATEWAY_API_KEY) or configure a direct provider API key.'
}
