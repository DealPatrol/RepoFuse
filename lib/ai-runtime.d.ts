import type { LanguageModel } from 'ai'

export type AiProviderId = 'gateway' | 'anthropic' | 'none'
export type ModelKind = 'analysis' | 'repofuse'

export const DEFAULT_GATEWAY_MODEL: string
export const DEFAULT_ANTHROPIC_MODEL: string

export function aiConfigErrorMessage(): string
export function getActiveAiProvider(): AiProviderId
export function isAiConfigured(): boolean
export function mapClaudeModel(
  raw?: string | null,
  fallbackGateway?: string,
): { gateway: string; anthropic: string }
export function resolvedModelIds(
  kind?: ModelKind,
  rawModel?: string,
): { gateway: string; anthropic: string }
export function getLanguageModel(kind?: ModelKind, rawModel?: string): LanguageModel
export function gatewayProviderOptions(
  userId?: string,
  feature?: string,
): {
  providerOptions: {
    gateway: {
      user?: string
      tags?: string[]
    }
  }
}
export function createPromptRunner(options?: {
  model?: string
  maxTokens?: number
  temperature?: number
  feature?: string
  userId?: string
  kind?: ModelKind
}): (prompt: string, options?: { maxTokens?: number }) => Promise<string>
