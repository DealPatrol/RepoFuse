import { getAnthropicMessagesModel, getGatewayModel } from '@/lib/ai-gateway'

/** @deprecated Prefer getGatewayModel() for AI SDK or getAnthropicMessagesModel() for Messages API */
export const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-4-5-20250929'

/** Anthropic Messages API model (gateway slug when AI Gateway auth is configured). */
export function getAnthropicModel(): string {
  return getAnthropicMessagesModel()
}

export { getGatewayModel }
