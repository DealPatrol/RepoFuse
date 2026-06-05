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

export function getPriceIdForPlan(plan: 'pro' | 'scale'): string {
  const mode = getConfiguredMode()
  if (plan === 'scale') {
    return mode === 'live'
      ? (process.env.STRIPE_SCALE_PRICE_ID_LIVE || process.env.STRIPE_SCALE_PRICE_ID || '')
      : (process.env.STRIPE_SCALE_PRICE_ID_TEST || process.env.STRIPE_SCALE_PRICE_ID || '')
  }
  return getPriceId()
}

export function getStripe(): Stripe {
  const mode = getConfiguredMode()
  const secretKey = getSecretKeyForMode(mode)

  if (!secretKey) {
    throw new Error(
      `Stripe secret key not set for ${mode} mode. Set STRIPE_SECRET_KEY_${mode.toUpperCase()} or STRIPE_SECRET_KEY.`,
    )
  }
  const keyMode = detectModeFromKey(secretKey)
  if (keyMode !== mode) {
    throw new Error(
      `Stripe mode mismatch: STRIPE_MODE=${mode} but key appears to be ${keyMode}. Update keys to match selected mode.`,
    )
  }
  if (!stripeInstance) {
    stripeInstance = new Stripe(secretKey, { typescript: true })
  }
  return stripeInstance
}

export const PLANS = {
  free: {
    name: 'Free',
    analyses_per_month: 1,
    blueprints_viewable: 1,
    repos_limit: 1,
    price_monthly: 0,
    credits_per_month: 200,
    ai_provider: 'builtin' as const,
    description: 'Explore the basics, no card needed',
  },
  pro: {
    name: 'Pro',
    analyses_per_month: -1,
    blueprints_viewable: -1,
    repos_limit: -1,
    price_monthly: 19,
    credits_per_month: 3000,
    trial_days: 7,
    ai_provider: 'builtin' as const,
    description: '7-day free trial, then $19/mo',
  },
  scale: {
    name: 'Scale',
    analyses_per_month: -1,
    blueprints_viewable: -1,
    repos_limit: -1,
    price_monthly: 49,
    credits_per_month: 12000,
    ai_provider: 'builtin' as const,
    description: 'For power users and teams',
  },
  byok: {
    name: 'BYOK',
    analyses_per_month: -1,
    blueprints_viewable: -1,
    repos_limit: -1,
    price_monthly: 9,
    credits_per_month: -1,
    ai_provider: 'user' as const,
    description: 'Unlimited with your own API key',
  },
} as const

export type PlanId = keyof typeof PLANS

export function isPaidPlan(plan: string | null | undefined): plan is Exclude<PlanId, 'free'> {
  return plan === 'pro' || plan === 'scale' || plan === 'byok'
}

export function getPriceId(): string {
  const mode = getConfiguredMode()
  if (mode === 'live') {
    return process.env.STRIPE_PRO_PRICE_ID_LIVE || process.env.STRIPE_PRO_PRICE_ID || ''
  }
  return process.env.STRIPE_PRO_PRICE_ID_TEST || process.env.STRIPE_PRO_PRICE_ID || ''
}

export function getProPriceId(): string {
  const priceId = getPriceId()
  if (!priceId) {
    throw new Error('Pro price ID is not configured. Set STRIPE_PRO_PRICE_ID or STRIPE_PRO_PRICE_ID_LIVE/TEST.')
  }
  return priceId
}

export function getAppUrl(origin?: string): string {
  return process.env.NEXT_PUBLIC_APP_URL || origin || 'http://localhost:3000'
}
