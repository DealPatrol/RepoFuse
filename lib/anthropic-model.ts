import { DEFAULT_ANTHROPIC_MODEL, getAnthropicMessagesModel, getGatewayModel } from '@/lib/ai-gateway'

export { DEFAULT_ANTHROPIC_MODEL, getGatewayModel }

/** Active model id: gateway slug when AI Gateway auth is configured, otherwise the direct Anthropic id. */
export function getAnthropicModel(): string {
  return getAnthropicMessagesModel()
}
