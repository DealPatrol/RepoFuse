import { generateText } from 'ai'
import Anthropic from '@anthropic-ai/sdk'

export type AIProvider = 'anthropic' | 'openai' | 'grok' | 'deepinfra' | 'builtin'

export interface AIProviderConfig {
  provider: AIProvider
  apiKey?: string
}

/**
 * Get the appropriate model string for the provider
 */
export function getProviderModel(provider: AIProvider): string {
  switch (provider) {
    case 'anthropic':
      return 'anthropic/claude-sonnet-4.6'
    case 'openai':
      return 'gpt-4o'
    case 'grok':
      return 'grok-2'
    case 'deepinfra':
      return 'deepseek-ai/deepseek-coder-33b-instruct'
    case 'builtin':
      return 'claude-opus-4.1' // Default to Anthropic for builtin
    default:
      return 'claude-opus-4.1'
  }
}

/**
 * Get the AI SDK model identifier for the provider
 */
export function getAISDKModel(provider: AIProvider, apiKey?: string): string {
  switch (provider) {
    case 'anthropic':
      return apiKey ? `anthropic/claude-sonnet-4.6?apiKey=${apiKey}` : 'anthropic/claude-sonnet-4.6'
    case 'openai':
      return apiKey ? `openai/gpt-4o?apiKey=${apiKey}` : 'openai/gpt-4o'
    case 'grok':
      return apiKey ? `xai/grok-2?apiKey=${apiKey}` : 'xai/grok-2'
    case 'deepinfra':
      return apiKey ? `deepinfra/deepseek-ai/deepseek-coder-33b-instruct?apiKey=${apiKey}` : 'deepinfra/deepseek-ai/deepseek-coder-33b-instruct'
    case 'builtin':
      // Builtin uses Vercel AI Gateway (no API key needed)
      return 'anthropic/claude-sonnet-4.6'
    default:
      return 'anthropic/claude-sonnet-4.6'
  }
}

/**
 * Validate that an API key is valid for the given provider
 */
export async function validateAPIKey(provider: AIProvider, apiKey: string): Promise<boolean> {
  try {
    // Make a simple request to validate the API key
    switch (provider) {
      case 'anthropic':
        // Test Anthropic key by checking if it's the right format
        return apiKey.startsWith('sk-ant-') && apiKey.length > 20
      case 'openai':
        // Test OpenAI key format
        return (apiKey.startsWith('sk-') || apiKey.startsWith('sk-proj-')) && apiKey.length > 20
      case 'grok':
        // Test Grok/xAI key format
        return apiKey.startsWith('xai-') && apiKey.length > 20
      case 'deepinfra':
        // Test DeepInfra key format
        return apiKey.length > 20
      case 'builtin':
        // Builtin doesn't need validation
        return true
      default:
        return false
    }
  } catch (error) {
    console.error(`[v0] API key validation error for ${provider}:`, error)
    return false
  }
}

/**
 * Generate text using the specified provider
 */
export async function generateTextWithProvider(
  provider: AIProvider,
  prompt: string,
  apiKey?: string,
  options?: { maxTokens?: number }
): Promise<string> {
  const model = getAISDKModel(provider, apiKey)

  const response = await generateText({
    model,
    prompt,
    maxOutputTokens: options?.maxTokens || 4096,
  })

  return response.text
}



/**
 * Get provider display name
 */
export function getProviderName(provider: AIProvider): string {
  const names: Record<AIProvider, string> = {
    anthropic: 'Claude (Anthropic)',
    openai: 'GPT-4 (OpenAI)',
    grok: 'Grok (xAI)',
    deepinfra: 'DeepSeek (DeepInfra)',
    builtin: 'RepoFuse Default',
  }
  return names[provider]
}

/**
 * Get estimated cost per 1M tokens for the provider
 */
export function getEstimatedCost(provider: AIProvider): {
  inputCost: number
  outputCost: number
} {
  const costs: Record<AIProvider, { inputCost: number; outputCost: number }> = {
    anthropic: { inputCost: 3, outputCost: 15 }, // Claude Opus
    openai: { inputCost: 2.5, outputCost: 10 }, // GPT-4o
    grok: { inputCost: 0.5, outputCost: 1.5 }, // Grok (cheaper)
    deepinfra: { inputCost: 0.14, outputCost: 0.28 }, // DeepSeek (very cheap)
    builtin: { inputCost: 0, outputCost: 0 }, // We pay for it
  }
  return costs[provider] || costs.builtin
}
