import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

type StripeMode = 'live' | 'test'

function normalizeMode(value?: string): StripeMode {
  if (value?.toLowerCase() === 'test') return 'test'
  return 'live'
}

function detectModeFromKey(key: string): StripeMode {
  if (key.startsWith('sk_test_') || key.startsWith('rk_test_')) return 'test'
  return 'live'
}

function getConfiguredMode(): StripeMode {
  return normalizeMode(process.env.STRIPE_MODE)
}

function getSecretKeyForMode(mode: StripeMode): string {
  if (mode === 'live') {
    return process.env.STRIPE_SECRET_KEY_LIVE || process.env.STRIPE_SECRET_KEY || ''
  }
  return process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY || ''
}

export function getWebhookSecret(): string {
  const mode = getConfiguredMode()
  if (mode === 'live') {
    return process.env.STRIPE_WEBHOOK_SECRET_LIVE || process.env.STRIPE_WEBHOOK_SECRET || ''
  }
  return process.env.STRIPE_WEBHOOK_SECRET_TEST || process.env.STRIPE_WEBHOOK_SECRET || ''
}

export function isStripeConfigured(): boolean {
  return !!(getSecretKeyForMode(getConfiguredMode()) && getPriceId())
}

export function getStripe(): Stripe {
  const mode = getConfiguredMode()
  const secretKey = getSecretKeyForMode(mode)

  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  const keyMode = detectModeFromKey(secretKey)
  if (keyMode !== mode) {
    throw new Error(
      `Stripe mode mismatch: STRIPE_MODE=${mode} but key appears to be ${keyMode}. Update keys to match selected mode.`,
    )
  }
  if (!stripeInstance) {
    stripeInstance = new Stripe(secretKey, {
      typescript: true,
    })
  }
  return stripeInstance
}

export const PLANS = {
  free: {
    name: 'Free',
    analyses_per_month: 2,
    blueprints_viewable: 2,
    repos_limit: 5,
    price_monthly: 0,
    ai_provider: 'builtin' as const,
    description: 'View 2 blueprints',
  },
  byok: {
    name: 'BYOK',
    analyses_per_month: -1,
    blueprints_viewable: -1,
    repos_limit: -1,
    price_monthly: 9.99,
    ai_provider: 'user' as const,
    description: 'Bring your own API key',
  },
  pro: {
    name: 'Pro',
    analyses_per_month: -1,
    blueprints_viewable: -1,
    repos_limit: -1,
    price_monthly: 20,
    trial_days: 7,
    ai_provider: 'builtin' as const,
    description: '7 days free, then $20/mo',
  },
} as const

export type PlanId = keyof typeof PLANS

export function getPriceId(): string {
  const mode = getConfiguredMode()
  if (mode === 'live') {
    return process.env.STRIPE_PRO_PRICE_ID_LIVE || process.env.STRIPE_PRO_PRICE_ID || ''
  }
  return process.env.STRIPE_PRO_PRICE_ID_TEST || process.env.STRIPE_PRO_PRICE_ID || ''
}
