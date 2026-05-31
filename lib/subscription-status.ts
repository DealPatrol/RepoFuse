export const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing'])

export function isActiveSubscriptionStatus(status: string | null | undefined): boolean {
  return !!status && ACTIVE_SUBSCRIPTION_STATUSES.has(status)
}
