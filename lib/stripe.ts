import Stripe from 'stripe'

let stripeInstance: Stripe | null = null

export function isStripeConfigured(): boolean {
  return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRO_PRICE_ID)
}

export function getPriceIdForPlan(plan: 'pro' | 'scale'): string {
  if (plan === 'scale') return process.env.STRIPE_SCALE_PRICE_ID || ''
  return process.env.STRIPE_PRO_PRICE_ID || ''
}

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      typescript: true,
    })
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

export function getPriceId(): string {
  return process.env.STRIPE_PRO_PRICE_ID || ''
}
