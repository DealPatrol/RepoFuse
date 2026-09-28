import { generateText, type LanguageModel, type ModelMessage } from 'ai'
import {
  aiConfigErrorMessage,
  createPromptRunner,
  DEFAULT_ANTHROPIC_MODEL,
  DEFAULT_GATEWAY_MODEL,
  gatewayProviderOptions,
  getActiveAiProvider,
  getLanguageModel,
  isAiConfigured,
  mapClaudeModel,
  resolvedModelIds,
  type AiProviderId,
  type ModelKind,
} from '@/lib/ai-runtime'

export type AiGatewayFeature =
  | 'analysis-run'
  | 'app-idea-chat'
  | 'scaffold'
  | 'build-app'
  | 'pattern-analyzer'
  | 'mcp'
  | 'legacy'
  | 'preview'
  | 'code-completion'
  | 'app-discovery'
  | 'cross-platform'

export {
  aiConfigErrorMessage,
  createPromptRunner,
  DEFAULT_ANTHROPIC_MODEL,
  DEFAULT_GATEWAY_MODEL,
  gatewayProviderOptions,
  getActiveAiProvider,
  isAiConfigured,
  mapClaudeModel,
}
export type { AiProviderId }

function modelKindForFeature(feature: AiGatewayFeature): ModelKind {
  switch (feature) {
    case 'mcp':
    case 'legacy':
    case 'preview':
      return 'repofuse'
    case 'analysis-run':
    case 'app-idea-chat':
    case 'scaffold':
    case 'build-app':
    case 'pattern-analyzer':
    case 'code-completion':
    case 'app-discovery':
    case 'cross-platform':
      return 'analysis'
    default: {
      const exhaustive: never = feature
      return exhaustive
    }
  }
}

export function getModelKind(feature: AiGatewayFeature): ModelKind {
  return modelKindForFeature(feature)
}

/** Gateway model id for the active provider selection. */
export function getGatewayModel(feature: AiGatewayFeature = 'analysis-run'): string {
  return resolvedModelIds(modelKindForFeature(feature)).gateway
}

/** Direct Anthropic model id, used only when the gateway is not configured. */
export function getAnthropicMessagesModel(feature: AiGatewayFeature = 'analysis-run'): string {
  const ids = resolvedModelIds(modelKindForFeature(feature))
  return getActiveAiProvider() === 'anthropic' ? ids.anthropic : ids.gateway
}

export function languageModelFor(feature: AiGatewayFeature): LanguageModel {
  return getLanguageModel(modelKindForFeature(feature))
}

export function llmProviderOptions(userId: string | undefined, feature: AiGatewayFeature) {
  if (getActiveAiProvider() !== 'gateway') return {}
  return gatewayProviderOptions(userId, feature)
}

export async function generateWithGateway(params: {
  system?: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  maxOutputTokens?: number
  temperature?: number
  userId?: string
  feature: AiGatewayFeature
}): Promise<string> {
  const provider = getActiveAiProvider()
  if (provider === 'none') {
    throw new Error(aiConfigErrorMessage())
  }

  const modelMessages: ModelMessage[] = params.messages.map((message) => ({
    role: message.role,
    content: message.content,
  }))

  const result = await generateText({
    model: getLanguageModel(modelKindForFeature(params.feature)),
    system: params.system,
    messages: modelMessages,
    maxOutputTokens: params.maxOutputTokens ?? 4096,
    temperature: params.temperature,
    ...(provider === 'gateway' ? gatewayProviderOptions(params.userId, params.feature) : {}),
  })

  return result.text
}
